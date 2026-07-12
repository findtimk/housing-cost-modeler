import { describe, it, expect } from 'vitest';
import {
  computeFederalTax,
  computePayrollTax,
  computeWaPremiums,
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
  it('computes for single earner below SS wage base', () => {
    const result = computePayrollTax([100_000], 'MFJ');
    expect(result.ss).toBeCloseTo(6_200, 0);
    expect(result.medicare).toBeCloseTo(1_450, 0);
    expect(result.addlMedicare).toBe(0); // below $250k threshold
    expect(result.total).toBeCloseTo(7_650, 0);
  });

  it('caps SS at wage base for a single $500k earner (MFJ)', () => {
    const result = computePayrollTax([500_000], 'MFJ');
    expect(result.ss).toBeCloseTo(184_500 * 0.062, 0);
    expect(result.medicare).toBeCloseTo(500_000 * 0.0145, 0);
    expect(result.addlMedicare).toBeCloseTo(250_000 * 0.009, 0);
    expect(result.total).toBeCloseTo(20_939, 0);
  });

  it('applies SS wage base PER EARNER (200k + 300k)', () => {
    const result = computePayrollTax([200_000, 300_000], 'MFJ');
    // Both earners exceed the base, so each is capped independently:
    // 2 * 184,500 * 6.2% = 22,878
    expect(result.ss).toBeCloseTo(22_878, 0);
    expect(result.ssByEarner[0]).toBeCloseTo(11_439, 0);
    expect(result.ssByEarner[1]).toBeCloseTo(11_439, 0);
  });

  it('two earners pay more SS than one earner with the same total', () => {
    const twoEarners = computePayrollTax([250_000, 250_000], 'MFJ');
    const oneEarner = computePayrollTax([500_000], 'MFJ');
    expect(twoEarners.ss).toBeCloseTo(22_878, 0);
    expect(oneEarner.ss).toBeCloseTo(11_439, 0);
  });

  it('Additional Medicare uses COMBINED wages (per return, not per earner)', () => {
    // Neither earner exceeds $200k individually, but combined $300k
    // exceeds the MFJ $250k threshold: (300k - 250k) * 0.9% = 450
    const result = computePayrollTax([150_000, 150_000], 'MFJ');
    expect(result.addlMedicare).toBeCloseTo(450, 0);
  });

  it('uses SINGLE threshold for additional Medicare', () => {
    const result = computePayrollTax([250_000], 'SINGLE');
    // Additional Medicare on (250,000 - 200,000) * 0.009 = 450
    expect(result.addlMedicare).toBeCloseTo(450, 0);
  });

  it('no additional Medicare for income below threshold', () => {
    const result = computePayrollTax([200_000], 'SINGLE');
    expect(result.addlMedicare).toBe(0);
  });
});

describe('computeWaPremiums', () => {
  it('returns zeros for non-WA states', () => {
    const result = computeWaPremiums('CA', [{ wages: 500_000 }]);
    expect(result.pfml).toBe(0);
    expect(result.waCares).toBe(0);
    expect(result.total).toBe(0);
  });

  it('caps PFML at the SS wage base per earner', () => {
    const result = computeWaPremiums('WA', [{ wages: 500_000 }]);
    // min(500k, 184,500) * 1.13% * 71.43% = 1,489.21
    expect(result.pfml).toBeCloseTo(1_489.21, 1);
  });

  it('computes PFML on full wages below the cap', () => {
    const result = computeWaPremiums('WA', [{ wages: 150_000 }]);
    // 150,000 * 0.807159% = 1,210.74
    expect(result.pfml).toBeCloseTo(1_210.74, 1);
  });

  it('WA Cares has NO wage cap', () => {
    const result = computeWaPremiums('WA', [{ wages: 500_000 }]);
    // 500,000 * 0.58% = 2,900
    expect(result.waCares).toBeCloseTo(2_900, 0);
  });

  it('PFML exemption zeroes only that earner', () => {
    const result = computeWaPremiums('WA', [
      { wages: 200_000, pfmlExempt: true },
      { wages: 150_000 },
    ]);
    expect(result.pfml).toBeCloseTo(1_210.74, 1);
    // WA Cares unaffected by the PFML exemption
    expect(result.waCares).toBeCloseTo(350_000 * 0.0058, 0);
  });

  it('WA Cares exemption zeroes only that earner', () => {
    const result = computeWaPremiums('WA', [
      { wages: 200_000, waCaresExempt: true },
      { wages: 150_000 },
    ]);
    expect(result.waCares).toBeCloseTo(150_000 * 0.0058, 0);
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

function taxInputs(overrides: Partial<Parameters<typeof computeAllTaxes>[0]> = {}) {
  return {
    filing_status: 'MFJ' as const,
    state: 'WA',
    earners: [{ wages: 250_000 }, { wages: 250_000 }],
    pre_tax_retirement_monthly: 4_000,
    other_pre_tax_deductions_annual: 0,
    ...overrides,
  };
}

describe('computeAllTaxes', () => {
  it('G1 tax values: 250k/250k MFJ WA, $4k/mo pre-tax', () => {
    const result = computeAllTaxes(taxInputs());
    expect(result.taxable_income_federal).toBeCloseTo(419_800, 0);
    expect(result.federal_tax_annual).toBeCloseTo(87_248, 1);
    // Per-earner SS caps: 22,878 + Medicare 7,250 + Addl Medicare 2,250
    expect(result.payroll_tax_annual).toBeCloseTo(32_378, 1);
    expect(result.pfml_tax_annual).toBeCloseTo(2_978.42, 1);
    expect(result.wa_cares_tax_annual).toBeCloseTo(2_900, 1);
    expect(result.state_tax_annual).toBe(0);
    expect(result.taxes_monthly).toBeCloseTo(10_458.70, 1);
  });

  it('taxes_annual includes WA premiums', () => {
    const result = computeAllTaxes(taxInputs());
    expect(result.taxes_annual).toBeCloseTo(
      result.federal_tax_annual +
        result.payroll_tax_annual +
        result.state_tax_annual +
        result.pfml_tax_annual +
        result.wa_cares_tax_annual,
      2,
    );
  });

  it('no WA premiums outside WA', () => {
    const result = computeAllTaxes(taxInputs({ state: 'CA' }));
    expect(result.pfml_tax_annual).toBe(0);
    expect(result.wa_cares_tax_annual).toBe(0);
  });

  it('pre-tax retirement reduces taxable income but not payroll', () => {
    const withRetirement = computeAllTaxes(taxInputs());
    const without = computeAllTaxes(taxInputs({ pre_tax_retirement_monthly: 0 }));
    expect(withRetirement.taxable_income_federal).toBeLessThan(
      without.taxable_income_federal,
    );
    expect(withRetirement.federal_tax_annual).toBeLessThan(
      without.federal_tax_annual,
    );
    // Payroll tax and WA premiums are on gross wages, unaffected by pre-tax retirement
    expect(withRetirement.payroll_tax_annual).toBeCloseTo(
      without.payroll_tax_annual,
      2,
    );
    expect(withRetirement.pfml_tax_annual).toBeCloseTo(without.pfml_tax_annual, 2);
  });

  it('state tax applies to adj_wages_for_state', () => {
    const result = computeAllTaxes(
      taxInputs({ state_effective_rate_override: 0.06 }),
    );
    // adj_wages = 500,000 - 48,000 - 0 = 452,000
    expect(result.adj_wages_for_state).toBeCloseTo(452_000, 0);
    expect(result.state_tax_annual).toBeCloseTo(27_120, 0);
  });
});
