import { describe, it, expect } from 'vitest';
import { computeScenario } from '../engine/cashflowEngine.ts';
import type { ScenarioInputs } from '../engine/types.ts';

function makeInputs(overrides: Partial<ScenarioInputs> = {}): ScenarioInputs {
  return {
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
    ...overrides,
  };
}

describe('computeScenario', () => {
  it('computes correct gross monthly', () => {
    const result = computeScenario(makeInputs());
    expect(result.gross_monthly).toBeCloseTo(41_666.67, 1);
  });

  it('computes correct net pay', () => {
    const result = computeScenario(makeInputs());
    expect(result.net_pay_monthly).toBeCloseTo(32_651.08, 0);
  });

  it('computes correct front-end ratio', () => {
    const result = computeScenario(makeInputs());
    // 9,110.93 / 41,666.67 ≈ 0.2187
    expect(result.front_end_ratio).toBeCloseTo(0.2187, 2);
  });
});

describe('AC1 — Pre-tax vs after-tax behavior', () => {
  it('increasing pre_tax $1k/mo reduces surplus by LESS than $1k/mo', () => {
    const base = computeScenario(makeInputs());
    const morePretax = computeScenario(
      makeInputs({ pre_tax_retirement_monthly: 5_000 }),
    );

    const surplusDrop = base.surplus_monthly - morePretax.surplus_monthly;
    // Pre-tax saves on taxes, so surplus drop < $1,000
    expect(surplusDrop).toBeGreaterThan(0);
    expect(surplusDrop).toBeLessThan(1_000);
  });

  it('increasing after_tax $1k/mo reduces surplus by EXACTLY $1k/mo', () => {
    const base = computeScenario(makeInputs());
    const moreAftertax = computeScenario(
      makeInputs({ after_tax_retirement_monthly: 1_000 }),
    );

    const surplusDrop = base.surplus_monthly - moreAftertax.surplus_monthly;
    expect(surplusDrop).toBeCloseTo(1_000, 2);
  });

  it('taxes unchanged when after_tax changes', () => {
    const base = computeScenario(makeInputs());
    const moreAftertax = computeScenario(
      makeInputs({ after_tax_retirement_monthly: 2_000 }),
    );

    expect(moreAftertax.tax.taxes_monthly).toBeCloseTo(
      base.tax.taxes_monthly,
      2,
    );
  });

  it('taxes decrease when pre_tax increases', () => {
    const base = computeScenario(makeInputs());
    const morePretax = computeScenario(
      makeInputs({ pre_tax_retirement_monthly: 5_000 }),
    );

    expect(morePretax.tax.taxes_monthly).toBeLessThan(base.tax.taxes_monthly);
  });
});
