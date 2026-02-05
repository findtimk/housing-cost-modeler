import { describe, it, expect } from 'vitest';
import { computeScenario } from '../engine/cashflowEngine.ts';
import type { ScenarioInputs } from '../engine/types.ts';

/** Tolerance: ±$1 for money values */
const MONEY_TOL = 1;

/** Tolerance: ±0.01 for ratios (as decimal) */
const RATIO_TOL = 0.01;

// ─── G1 — Base WA: $500k HHI, $1.4M home ──────────────────────────

const G1_INPUTS: ScenarioInputs = {
  filing_status: 'MFJ',
  state: 'WA',
  hhi_annual: 500_000,
  pre_tax_retirement_monthly: 4_000,
  after_tax_retirement_monthly: 0,
  living_expenses_monthly: 9_500,
  other_pre_tax_deductions_annual: 0,
  home_price: 1_400_000,
  down_payment_pct: 0.30,
  apr: 0.065,
  term_years: 30,
  property_tax_rate_annual: 0.01,
  insurance_rate_annual: 0.005,
  maintenance_rate_annual: 0.01,
  hoa_monthly: 0,
};

describe('G1 — Base WA: $500k HHI, $1.4M home', () => {
  const r = computeScenario(G1_INPUTS);

  it('gross monthly', () => {
    expect(r.gross_monthly).toBeCloseTo(41_666.67, 0);
  });

  it('taxable income (annual)', () => {
    expect(r.tax.taxable_income_federal).toBeCloseTo(419_800, MONEY_TOL);
  });

  it('federal income tax (annual)', () => {
    expect(r.tax.federal_tax_annual).toBeCloseTo(87_248, MONEY_TOL);
  });

  it('payroll taxes (annual)', () => {
    expect(r.tax.payroll_tax_annual).toBeCloseTo(20_939, MONEY_TOL);
  });

  it('state income tax (annual)', () => {
    expect(r.tax.state_tax_annual).toBe(0);
  });

  it('taxes (monthly)', () => {
    expect(r.tax.taxes_monthly).toBeCloseTo(9_015.58, 0);
  });

  it('net pay (monthly)', () => {
    expect(r.net_pay_monthly).toBeCloseTo(32_651.08, 0);
  });

  it('mortgage P&I', () => {
    expect(r.housing.pi_monthly).toBeCloseTo(6_194.27, 0);
  });

  it('property tax monthly', () => {
    expect(r.housing.property_tax_monthly).toBeCloseTo(1_166.67, 0);
  });

  it('insurance monthly', () => {
    expect(r.housing.insurance_monthly).toBeCloseTo(583.33, 0);
  });

  it('maintenance monthly', () => {
    expect(r.housing.maintenance_monthly).toBeCloseTo(1_166.67, 0);
  });

  it('HOA monthly', () => {
    expect(r.housing.hoa_monthly).toBe(0);
  });

  it('total housing', () => {
    expect(r.housing.housing_total_monthly).toBeCloseTo(9_110.93, 0);
  });

  it('front-end ratio ~22%', () => {
    expect(Math.round(r.front_end_ratio * 100)).toBeCloseTo(22, RATIO_TOL);
  });

  it('monthly surplus', () => {
    expect(r.surplus_monthly).toBeCloseTo(10_040.15, 0);
  });
});

// ─── G2 — Stress WA: $350k HHI, $1.4M home ────────────────────────

const G2_INPUTS: ScenarioInputs = {
  filing_status: 'MFJ',
  state: 'WA',
  hhi_annual: 350_000,
  pre_tax_retirement_monthly: 3_000,
  after_tax_retirement_monthly: 0,
  living_expenses_monthly: 8_500,
  other_pre_tax_deductions_annual: 0,
  home_price: 1_400_000,
  down_payment_pct: 0.30,
  apr: 0.065,
  term_years: 30,
  property_tax_rate_annual: 0.01,
  insurance_rate_annual: 0.005,
  maintenance_rate_annual: 0.01,
  hoa_monthly: 0,
};

describe('G2 — Stress WA: $350k HHI, $1.4M home', () => {
  const r = computeScenario(G2_INPUTS);

  it('gross monthly', () => {
    expect(r.gross_monthly).toBeCloseTo(29_166.67, 0);
  });

  it('taxable income (annual)', () => {
    expect(r.tax.taxable_income_federal).toBeCloseTo(281_800, MONEY_TOL);
  });

  it('federal income tax (annual)', () => {
    expect(r.tax.federal_tax_annual).toBeCloseTo(52_828, MONEY_TOL);
  });

  it('payroll taxes (annual)', () => {
    expect(r.tax.payroll_tax_annual).toBeCloseTo(17_414, MONEY_TOL);
  });

  it('state income tax (annual)', () => {
    expect(r.tax.state_tax_annual).toBe(0);
  });

  it('taxes (monthly)', () => {
    expect(r.tax.taxes_monthly).toBeCloseTo(5_853.50, 0);
  });

  it('net pay (monthly)', () => {
    expect(r.net_pay_monthly).toBeCloseTo(23_313.17, 0);
  });

  it('mortgage P&I', () => {
    expect(r.housing.pi_monthly).toBeCloseTo(6_194.27, 0);
  });

  it('total housing', () => {
    expect(r.housing.housing_total_monthly).toBeCloseTo(9_110.93, 0);
  });

  it('front-end ratio ~31%', () => {
    expect(Math.round(r.front_end_ratio * 100)).toBeCloseTo(31, RATIO_TOL);
  });

  it('monthly surplus', () => {
    expect(r.surplus_monthly).toBeCloseTo(2_702.23, 0);
  });
});

// ─── G3 — Higher price WA: $600k HHI, $1.8M home + HOA ────────────

const G3_INPUTS: ScenarioInputs = {
  filing_status: 'MFJ',
  state: 'WA',
  hhi_annual: 600_000,
  pre_tax_retirement_monthly: 5_000,
  after_tax_retirement_monthly: 0,
  living_expenses_monthly: 11_000,
  other_pre_tax_deductions_annual: 0,
  home_price: 1_800_000,
  down_payment_pct: 0.30,
  apr: 0.065,
  term_years: 30,
  property_tax_rate_annual: 0.01,
  insurance_rate_annual: 0.005,
  maintenance_rate_annual: 0.01,
  hoa_monthly: 300,
};

describe('G3 — Higher price WA: $600k HHI, $1.8M home + HOA', () => {
  const r = computeScenario(G3_INPUTS);

  it('gross monthly', () => {
    expect(r.gross_monthly).toBeCloseTo(50_000, 0);
  });

  it('taxable income (annual)', () => {
    expect(r.tax.taxable_income_federal).toBeCloseTo(507_800, MONEY_TOL);
  });

  it('federal income tax (annual)', () => {
    expect(r.tax.federal_tax_annual).toBeCloseTo(115_408, MONEY_TOL);
  });

  it('payroll taxes (annual)', () => {
    expect(r.tax.payroll_tax_annual).toBeCloseTo(23_289, MONEY_TOL);
  });

  it('state income tax (annual)', () => {
    expect(r.tax.state_tax_annual).toBe(0);
  });

  it('taxes (monthly)', () => {
    expect(r.tax.taxes_monthly).toBeCloseTo(11_558.08, 0);
  });

  it('net pay (monthly)', () => {
    expect(r.net_pay_monthly).toBeCloseTo(38_441.92, 0);
  });

  it('mortgage P&I', () => {
    expect(r.housing.pi_monthly).toBeCloseTo(7_964.06, 0);
  });

  it('property tax monthly', () => {
    expect(r.housing.property_tax_monthly).toBeCloseTo(1_500, 0);
  });

  it('insurance monthly', () => {
    expect(r.housing.insurance_monthly).toBeCloseTo(750, 0);
  });

  it('maintenance monthly', () => {
    expect(r.housing.maintenance_monthly).toBeCloseTo(1_500, 0);
  });

  it('HOA monthly', () => {
    expect(r.housing.hoa_monthly).toBe(300);
  });

  it('total housing', () => {
    expect(r.housing.housing_total_monthly).toBeCloseTo(12_014.06, 0);
  });

  it('front-end ratio ~24%', () => {
    expect(Math.round(r.front_end_ratio * 100)).toBeCloseTo(24, RATIO_TOL);
  });

  it('monthly surplus', () => {
    expect(r.surplus_monthly).toBeCloseTo(10_427.86, 0);
  });
});

// ─── G4 — State tax: CA 6%, $500k HHI, $1.4M home ─────────────────

const G4_INPUTS: ScenarioInputs = {
  filing_status: 'MFJ',
  state: 'CA',
  state_effective_rate_override: 0.06,
  hhi_annual: 500_000,
  pre_tax_retirement_monthly: 4_000,
  after_tax_retirement_monthly: 0,
  living_expenses_monthly: 9_500,
  other_pre_tax_deductions_annual: 0,
  home_price: 1_400_000,
  down_payment_pct: 0.30,
  apr: 0.065,
  term_years: 30,
  property_tax_rate_annual: 0.012,
  insurance_rate_annual: 0.006,
  maintenance_rate_annual: 0.01,
  hoa_monthly: 0,
};

describe('G4 — State tax: CA 6%, $500k HHI, $1.4M home', () => {
  const r = computeScenario(G4_INPUTS);

  it('gross monthly', () => {
    expect(r.gross_monthly).toBeCloseTo(41_666.67, 0);
  });

  it('taxable income (annual)', () => {
    expect(r.tax.taxable_income_federal).toBeCloseTo(419_800, MONEY_TOL);
  });

  it('federal income tax (annual)', () => {
    expect(r.tax.federal_tax_annual).toBeCloseTo(87_248, MONEY_TOL);
  });

  it('payroll taxes (annual)', () => {
    expect(r.tax.payroll_tax_annual).toBeCloseTo(20_939, MONEY_TOL);
  });

  it('state income tax (annual)', () => {
    expect(r.tax.state_tax_annual).toBeCloseTo(27_120, MONEY_TOL);
  });

  it('taxes (monthly)', () => {
    expect(r.tax.taxes_monthly).toBeCloseTo(11_275.58, 0);
  });

  it('net pay (monthly)', () => {
    expect(r.net_pay_monthly).toBeCloseTo(30_391.08, 0);
  });

  it('mortgage P&I', () => {
    expect(r.housing.pi_monthly).toBeCloseTo(6_194.27, 0);
  });

  it('property tax monthly', () => {
    expect(r.housing.property_tax_monthly).toBeCloseTo(1_400, 0);
  });

  it('insurance monthly', () => {
    expect(r.housing.insurance_monthly).toBeCloseTo(700, 0);
  });

  it('total housing', () => {
    expect(r.housing.housing_total_monthly).toBeCloseTo(9_460.93, 0);
  });

  it('front-end ratio ~23%', () => {
    expect(Math.round(r.front_end_ratio * 100)).toBeCloseTo(23, RATIO_TOL);
  });

  it('monthly surplus', () => {
    expect(r.surplus_monthly).toBeCloseTo(7_430.15, 0);
  });
});
