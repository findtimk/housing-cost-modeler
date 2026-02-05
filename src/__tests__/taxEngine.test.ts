import { describe, it, expect } from 'vitest';
import {
  computeFederalTax,
  computePayrollTax,
  getStateEffectiveRate,
  computeAllTaxes,
} from '../engine/taxEngine.ts';

describe('computeFederalTax', () => {
  it('computes 10% bracket only (MFJ)', () => {
    // $20,000 taxable income, all in 10% bracket
    expect(computeFederalTax(20_000, 'MFJ')).toBeCloseTo(2_000, 0);
  });

  it('computes across multiple brackets (MFJ, $419,800 taxable)', () => {
    // Golden test G1 taxable income
    const tax = computeFederalTax(419_800, 'MFJ');
    expect(tax).toBeCloseTo(87_248, 0);
  });

  it('computes for SINGLE filer ($100,000 taxable)', () => {
    // 10%: 12,400 * 0.10 = 1,240
    // 12%: (50,400 - 12,400) * 0.12 = 4,560
    // 22%: (100,000 - 50,400) * 0.22 = 10,912
    // Total: 16,712
    expect(computeFederalTax(100_000, 'SINGLE')).toBeCloseTo(16_712, 0);
  });

  it('returns 0 for zero taxable income', () => {
    expect(computeFederalTax(0, 'MFJ')).toBe(0);
  });

  it('computes top bracket (MFJ, $1M taxable)', () => {
    const tax = computeFederalTax(1_000_000, 'MFJ');
    // Sum of all brackets up to $768,700 + 37% on remainder
    // 2,480 + 9,120 + 24,332 + 46,116 + 34,848 + 89,687.50 + (1,000,000 - 768,700) * 0.37
    // = 206,583.50 + 85,581 = 292,164.50
    // Let me compute precisely:
    // 10%: 24,800 * 0.10 = 2,480
    // 12%: 76,000 * 0.12 = 9,120
    // 22%: 110,600 * 0.22 = 24,332
    // 24%: 192,150 * 0.24 = 46,116
    // 32%: 108,900 * 0.32 = 34,848
    // 35%: 256,250 * 0.35 = 89,687.50
    // 37%: 231,300 * 0.37 = 85,581
    // Total = 292,164.50
    expect(tax).toBeCloseTo(292_164.5, 0);
  });
});

describe('computePayrollTax', () => {
  it('computes for income below SS wage base', () => {
    const result = computePayrollTax(100_000, 'MFJ');
    expect(result.ss).toBeCloseTo(6_200, 0);
    expect(result.medicare).toBeCloseTo(1_450, 0);
    expect(result.addlMedicare).toBe(0); // below $250k threshold
    expect(result.total).toBeCloseTo(7_650, 0);
  });

  it('caps SS at wage base ($500k income, MFJ)', () => {
    const result = computePayrollTax(500_000, 'MFJ');
    expect(result.ss).toBeCloseTo(184_500 * 0.062, 0);
    expect(result.medicare).toBeCloseTo(500_000 * 0.0145, 0);
    expect(result.addlMedicare).toBeCloseTo(250_000 * 0.009, 0);
    expect(result.total).toBeCloseTo(20_939, 0);
  });

  it('uses SINGLE threshold for additional Medicare', () => {
    const result = computePayrollTax(250_000, 'SINGLE');
    // Additional Medicare on (250,000 - 200,000) * 0.009 = 450
    expect(result.addlMedicare).toBeCloseTo(450, 0);
  });

  it('no additional Medicare for income below threshold', () => {
    const result = computePayrollTax(200_000, 'SINGLE');
    expect(result.addlMedicare).toBe(0);
  });
});

describe('getStateEffectiveRate', () => {
  it('returns 0 for WA', () => {
    expect(getStateEffectiveRate('WA')).toBe(0);
  });

  it('returns 0.093 for CA', () => {
    expect(getStateEffectiveRate('CA')).toBe(0.093);
  });

  it('uses override when provided', () => {
    expect(getStateEffectiveRate('WA', 0.06)).toBe(0.06);
  });

  it('returns default rate for unknown state', () => {
    expect(getStateEffectiveRate('ZZ')).toBe(0.05);
  });
});

describe('computeAllTaxes', () => {
  it('G1 tax values: $500k MFJ WA, $4k/mo pre-tax', () => {
    const result = computeAllTaxes('MFJ', 'WA', 500_000, 4_000, 0);
    expect(result.taxable_income_federal).toBeCloseTo(419_800, 0);
    expect(result.federal_tax_annual).toBeCloseTo(87_248, 1);
    expect(result.payroll_tax_annual).toBeCloseTo(20_939, 1);
    expect(result.state_tax_annual).toBe(0);
    expect(result.taxes_monthly).toBeCloseTo(9_015.58, 1);
  });

  it('pre-tax retirement reduces taxable income', () => {
    const withRetirement = computeAllTaxes('MFJ', 'WA', 500_000, 4_000, 0);
    const without = computeAllTaxes('MFJ', 'WA', 500_000, 0, 0);
    expect(withRetirement.taxable_income_federal).toBeLessThan(
      without.taxable_income_federal,
    );
    expect(withRetirement.federal_tax_annual).toBeLessThan(
      without.federal_tax_annual,
    );
    // Payroll tax should be the same (not affected by pre-tax retirement)
    expect(withRetirement.payroll_tax_annual).toBeCloseTo(
      without.payroll_tax_annual,
      2,
    );
  });

  it('state tax applies to adj_wages_for_state', () => {
    const result = computeAllTaxes('MFJ', 'WA', 500_000, 4_000, 0, 0.06);
    // adj_wages = 500,000 - 48,000 - 0 = 452,000
    expect(result.adj_wages_for_state).toBeCloseTo(452_000, 0);
    expect(result.state_tax_annual).toBeCloseTo(27_120, 0);
  });
});
