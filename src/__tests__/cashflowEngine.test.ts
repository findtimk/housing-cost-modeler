import { describe, it, expect } from 'vitest';
import {
  computeBreakEvenIncome,
  computeScenario,
} from '../engine/cashflowEngine.ts';
import { splitIncome } from '../engine/incomeSplit.ts';
import { createDefaultExpenseBuilder, syncLivingExpensesFromBuilder } from '../engine/expenseBuilder.ts';
import { migrateInputs, DEFAULT_INPUTS } from '../components/InputPanel/defaults.ts';
import type { ScenarioInputs } from '../engine/types.ts';

function makeInputs(overrides: Partial<ScenarioInputs> = {}): ScenarioInputs {
  return {
    filing_status: 'MFJ',
    state: 'WA',
    earner1_wages_annual: 250_000,
    earner2_wages_annual: 250_000,
    earner1_pfml_exempt: false,
    earner2_pfml_exempt: false,
    earner1_wa_cares_exempt: false,
    earner2_wa_cares_exempt: false,
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

  it('computes correct net pay (per-earner SS + WA premiums)', () => {
    const result = computeScenario(makeInputs());
    expect(result.net_pay_monthly).toBeCloseTo(31_207.97, 0);
  });

  it('PITIA excludes maintenance', () => {
    const result = computeScenario(makeInputs());
    expect(result.housing.pitia_monthly).toBeCloseTo(
      result.housing.housing_total_monthly - result.housing.maintenance_monthly,
      2,
    );
    // P&I 6,194.27 + property tax 1,166.67 + insurance 583.33 + HOA 0
    expect(result.housing.pitia_monthly).toBeCloseTo(7_944.27, 0);
  });

  it('computes both ratios; PITIA < all-in when maintenance > 0', () => {
    const result = computeScenario(makeInputs());
    // 7,944.27 / 41,666.67 ≈ 0.1907; 9,110.93 / 41,666.67 ≈ 0.2187
    expect(result.pitia_ratio).toBeCloseTo(0.1907, 2);
    expect(result.all_in_ratio).toBeCloseTo(0.2187, 2);
    expect(result.pitia_ratio).toBeLessThan(result.all_in_ratio);
  });

  it('ratios are equal when maintenance is zero', () => {
    const result = computeScenario(makeInputs({ maintenance_rate_annual: 0 }));
    expect(result.pitia_ratio).toBeCloseTo(result.all_in_ratio, 6);
  });

  it('treats category-derived living expenses like the same manual amount', () => {
    const categoryInputs = syncLivingExpensesFromBuilder(
      makeInputs({
        expense_builder: createDefaultExpenseBuilder('categories', 'with_child'),
      }),
    );
    const manualInputs = makeInputs({
      living_expenses_monthly: categoryInputs.living_expenses_monthly,
    });

    expect(computeScenario(categoryInputs).surplus_monthly).toBeCloseTo(
      computeScenario(manualInputs).surplus_monthly,
      2,
    );
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

describe('computeBreakEvenIncome', () => {
  /** Recompute a scenario at a given household income (split like the grid). */
  function scenarioAtIncome(inputs: ScenarioInputs, income: number) {
    const [earner1, earner2] = splitIncome(
      income,
      inputs.earner1_wages_annual,
      inputs.earner2_wages_annual,
    );
    return computeScenario({
      ...inputs,
      earner1_wages_annual: earner1,
      earner2_wages_annual: earner2,
    });
  }

  it('surplus is >= 0 and small at the break-even income', () => {
    const inputs = makeInputs();
    const housing = computeScenario(inputs).housing.housing_total_monthly;
    const breakEven = computeBreakEvenIncome(inputs, housing);

    expect(Number.isFinite(breakEven)).toBe(true);
    const surplus = scenarioAtIncome(inputs, breakEven).surplus_monthly;
    expect(surplus).toBeGreaterThanOrEqual(0);
    // $1,000 of annual income rounding is well under $200/mo of surplus
    expect(surplus).toBeLessThan(200);
  });

  it('surplus is negative just below the break-even income', () => {
    const inputs = makeInputs();
    const housing = computeScenario(inputs).housing.housing_total_monthly;
    const breakEven = computeBreakEvenIncome(inputs, housing);

    const surplus = scenarioAtIncome(inputs, breakEven - 2_000).surplus_monthly;
    expect(surplus).toBeLessThan(0);
  });

  it('returns 0 when there are no outflows to cover', () => {
    const inputs = makeInputs({
      pre_tax_retirement_monthly: 0,
      after_tax_retirement_monthly: 0,
      living_expenses_monthly: 0,
    });
    expect(computeBreakEvenIncome(inputs, 0)).toBe(0);
  });

  it('higher housing cost requires higher break-even income', () => {
    const inputs = makeInputs();
    const low = computeBreakEvenIncome(inputs, 5_000);
    const high = computeBreakEvenIncome(inputs, 9_000);
    expect(high).toBeGreaterThan(low);
  });
});

describe('splitIncome', () => {
  it('splits proportionally to base earner wages', () => {
    expect(splitIncome(400_000, 300_000, 100_000)).toEqual([300_000, 100_000]);
    expect(splitIncome(500_000, 300_000, 100_000)).toEqual([375_000, 125_000]);
  });

  it('falls back to 50/50 when both base wages are zero', () => {
    expect(splitIncome(400_000, 0, 0)).toEqual([200_000, 200_000]);
  });

  it('gives everything to earner 1 when earner 2 is zero', () => {
    expect(splitIncome(400_000, 250_000, 0)).toEqual([400_000, 0]);
  });
});

describe('migrateInputs', () => {
  it('maps legacy hhi_annual to earner 1 with earner 2 at zero', () => {
    const migrated = migrateInputs({ hhi_annual: 500_000, state: 'WA' });
    expect(migrated.earner1_wages_annual).toBe(500_000);
    expect(migrated.earner2_wages_annual).toBe(0);
    expect('hhi_annual' in migrated).toBe(false);
  });

  it('keeps explicit earner fields when present', () => {
    const migrated = migrateInputs({
      earner1_wages_annual: 300_000,
      earner2_wages_annual: 100_000,
    });
    expect(migrated.earner1_wages_annual).toBe(300_000);
    expect(migrated.earner2_wages_annual).toBe(100_000);
  });

  it('fills defaults for missing fields and invalid blobs', () => {
    expect(migrateInputs(null)).toEqual(DEFAULT_INPUTS);
    const migrated = migrateInputs({ state: 'CA' });
    expect(migrated.state).toBe('CA');
    expect(migrated.earner1_wages_annual).toBe(
      DEFAULT_INPUTS.earner1_wages_annual,
    );
    expect(migrated.earner1_pfml_exempt).toBe(false);
  });
});
