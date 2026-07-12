import { describe, it, expect } from 'vitest';
import { computeScenario } from '../engine/cashflowEngine.ts';
import type { ScenarioInputs } from '../engine/types.ts';

/** Tolerance: ±$1 for money values */
const MONEY_TOL = 1;

/** Tolerance: ±0.01 for ratios (as decimal) */
const RATIO_TOL = 0.01;

const NO_EXEMPTIONS = {
  earner1_pfml_exempt: false,
  earner2_pfml_exempt: false,
  earner1_wa_cares_exempt: false,
  earner2_wa_cares_exempt: false,
};

// ─── G1 — Base WA: 250k/250k earners, $1.4M home ──────────────────
// Both earners exceed the $184,500 SS wage base, so SS = 2 × 11,439.
// PFML capped per earner: 2 × 184,500 × 0.807159% = 2,978.42.
// WA Cares uncapped: 500,000 × 0.58% = 2,900.

const G1_INPUTS: ScenarioInputs = {
  filing_status: 'MFJ',
  state: 'WA',
  earner1_wages_annual: 250_000,
  earner2_wages_annual: 250_000,
  ...NO_EXEMPTIONS,
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

describe('G1 — Base WA: 250k/250k earners, $1.4M home', () => {
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

  it('payroll taxes (annual) — SS capped per earner', () => {
    // SS 22,878 + Medicare 7,250 + Addl Medicare 2,250
    expect(r.tax.payroll_tax_annual).toBeCloseTo(32_378, MONEY_TOL);
  });

  it('WA PFML (annual)', () => {
    expect(r.tax.pfml_tax_annual).toBeCloseTo(2_978.42, MONEY_TOL);
  });

  it('WA Cares (annual)', () => {
    expect(r.tax.wa_cares_tax_annual).toBeCloseTo(2_900, MONEY_TOL);
  });

  it('state income tax (annual)', () => {
    expect(r.tax.state_tax_annual).toBe(0);
  });

  it('taxes (monthly)', () => {
    // (87,248 + 32,378 + 2,978.42 + 2,900) / 12
    expect(r.tax.taxes_monthly).toBeCloseTo(10_458.70, 0);
  });

  it('net pay (monthly)', () => {
    expect(r.net_pay_monthly).toBeCloseTo(31_207.97, 0);
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

  it('PITIA monthly (excludes maintenance)', () => {
    expect(r.housing.pitia_monthly).toBeCloseTo(7_944.27, 0);
  });

  it('total housing', () => {
    expect(r.housing.housing_total_monthly).toBeCloseTo(9_110.93, 0);
  });

  it('PITIA ratio ~19%', () => {
    expect(Math.round(r.pitia_ratio * 100)).toBeCloseTo(19, RATIO_TOL);
  });

  it('all-in ratio ~22%', () => {
    expect(Math.round(r.all_in_ratio * 100)).toBeCloseTo(22, RATIO_TOL);
  });

  it('monthly surplus', () => {
    expect(r.surplus_monthly).toBeCloseTo(8_597.03, 0);
  });
});

// ─── G2 — Stress WA: 200k/150k earners, $1.4M home ────────────────
// Earner 1 hits the SS/PFML caps; earner 2 does not.

const G2_INPUTS: ScenarioInputs = {
  filing_status: 'MFJ',
  state: 'WA',
  earner1_wages_annual: 200_000,
  earner2_wages_annual: 150_000,
  ...NO_EXEMPTIONS,
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

describe('G2 — Stress WA: 200k/150k earners, $1.4M home', () => {
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
    // SS: 11,439 (capped) + 9,300 = 20,739; Medicare 5,075; Addl Medicare 900
    expect(r.tax.payroll_tax_annual).toBeCloseTo(26_714, MONEY_TOL);
  });

  it('WA PFML (annual)', () => {
    // Earner 1 capped: 1,489.21; earner 2: 150,000 × 0.807159% = 1,210.74
    expect(r.tax.pfml_tax_annual).toBeCloseTo(2_699.95, MONEY_TOL);
  });

  it('WA Cares (annual)', () => {
    expect(r.tax.wa_cares_tax_annual).toBeCloseTo(2_030, MONEY_TOL);
  });

  it('state income tax (annual)', () => {
    expect(r.tax.state_tax_annual).toBe(0);
  });

  it('taxes (monthly)', () => {
    expect(r.tax.taxes_monthly).toBeCloseTo(7_022.66, 0);
  });

  it('net pay (monthly)', () => {
    expect(r.net_pay_monthly).toBeCloseTo(22_144.00, 0);
  });

  it('mortgage P&I', () => {
    expect(r.housing.pi_monthly).toBeCloseTo(6_194.27, 0);
  });

  it('total housing', () => {
    expect(r.housing.housing_total_monthly).toBeCloseTo(9_110.93, 0);
  });

  it('PITIA ratio ~27%', () => {
    expect(Math.round(r.pitia_ratio * 100)).toBeCloseTo(27, RATIO_TOL);
  });

  it('all-in ratio ~31%', () => {
    expect(Math.round(r.all_in_ratio * 100)).toBeCloseTo(31, RATIO_TOL);
  });

  it('monthly surplus', () => {
    expect(r.surplus_monthly).toBeCloseTo(1_533.07, 0);
  });
});

// ─── G3 — Higher price WA: 300k/300k earners, $1.8M home + HOA ────

const G3_INPUTS: ScenarioInputs = {
  filing_status: 'MFJ',
  state: 'WA',
  earner1_wages_annual: 300_000,
  earner2_wages_annual: 300_000,
  ...NO_EXEMPTIONS,
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

describe('G3 — Higher price WA: 300k/300k earners, $1.8M home + HOA', () => {
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
    // SS: 2 × 11,439 = 22,878; Medicare 8,700; Addl Medicare 3,150
    expect(r.tax.payroll_tax_annual).toBeCloseTo(34_728, MONEY_TOL);
  });

  it('WA PFML (annual) — both earners capped', () => {
    expect(r.tax.pfml_tax_annual).toBeCloseTo(2_978.42, MONEY_TOL);
  });

  it('WA Cares (annual)', () => {
    expect(r.tax.wa_cares_tax_annual).toBeCloseTo(3_480, MONEY_TOL);
  });

  it('state income tax (annual)', () => {
    expect(r.tax.state_tax_annual).toBe(0);
  });

  it('taxes (monthly)', () => {
    expect(r.tax.taxes_monthly).toBeCloseTo(13_049.53, 0);
  });

  it('net pay (monthly)', () => {
    expect(r.net_pay_monthly).toBeCloseTo(36_950.47, 0);
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

  it('PITIA monthly (excludes maintenance)', () => {
    expect(r.housing.pitia_monthly).toBeCloseTo(10_514.06, 0);
  });

  it('total housing', () => {
    expect(r.housing.housing_total_monthly).toBeCloseTo(12_014.06, 0);
  });

  it('PITIA ratio ~21%', () => {
    expect(Math.round(r.pitia_ratio * 100)).toBeCloseTo(21, RATIO_TOL);
  });

  it('all-in ratio ~24%', () => {
    expect(Math.round(r.all_in_ratio * 100)).toBeCloseTo(24, RATIO_TOL);
  });

  it('monthly surplus', () => {
    expect(r.surplus_monthly).toBeCloseTo(8_936.41, 0);
  });
});

// ─── G4 — State tax: CA 6%, single 500k earner, $1.4M home ────────
// Regression anchor: single earner outside WA, so payroll matches the
// pre-per-earner model exactly and no WA premiums apply. All values
// unchanged from the original spec.

const G4_INPUTS: ScenarioInputs = {
  filing_status: 'MFJ',
  state: 'CA',
  state_effective_rate_override: 0.06,
  earner1_wages_annual: 500_000,
  earner2_wages_annual: 0,
  ...NO_EXEMPTIONS,
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

describe('G4 — State tax: CA 6%, single 500k earner, $1.4M home', () => {
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

  it('no WA premiums in CA', () => {
    expect(r.tax.pfml_tax_annual).toBe(0);
    expect(r.tax.wa_cares_tax_annual).toBe(0);
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

  it('PITIA monthly (excludes maintenance)', () => {
    expect(r.housing.pitia_monthly).toBeCloseTo(8_294.27, 0);
  });

  it('total housing', () => {
    expect(r.housing.housing_total_monthly).toBeCloseTo(9_460.93, 0);
  });

  it('PITIA ratio ~20%', () => {
    expect(Math.round(r.pitia_ratio * 100)).toBeCloseTo(20, RATIO_TOL);
  });

  it('all-in ratio ~23%', () => {
    expect(Math.round(r.all_in_ratio * 100)).toBeCloseTo(23, RATIO_TOL);
  });

  it('monthly surplus', () => {
    expect(r.surplus_monthly).toBeCloseTo(7_430.15, 0);
  });
});
