import { describe, expect, it } from 'vitest';
import type { ScenarioInputs } from '../engine/types.ts';
import {
  computeExpenseScenarioTotal,
  createDefaultExpenseBuilder,
  ensureExpenseBuilder,
  getActiveExpenseScenario,
  syncLivingExpensesFromBuilder,
} from '../engine/expenseBuilder.ts';

function makeInputs(overrides: Partial<ScenarioInputs> = {}): ScenarioInputs {
  return {
    filing_status: 'MFJ',
    state: 'WA',
    earner1_wages_annual: 200_000,
    earner2_wages_annual: 200_000,
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

describe('expense builder defaults', () => {
  it('creates a rounded current-spending default', () => {
    const builder = createDefaultExpenseBuilder('categories', 'current');
    const scenario = getActiveExpenseScenario(builder);

    expect(scenario?.id).toBe('current');
    expect(scenario ? computeExpenseScenarioTotal(scenario) : 0).toBe(4_600);
  });

  it('creates a rounded with-child default', () => {
    const builder = createDefaultExpenseBuilder();
    const scenario = getActiveExpenseScenario(builder);

    expect(scenario?.id).toBe('with_child');
    expect(scenario ? computeExpenseScenarioTotal(scenario) : 0).toBe(9_200);
  });

  it('sums enabled line items only', () => {
    const builder = createDefaultExpenseBuilder('categories', 'current');
    const scenario = getActiveExpenseScenario(builder);
    if (!scenario) throw new Error('missing scenario');

    const modified = {
      ...scenario,
      buckets: scenario.buckets.map((bucket) =>
        bucket.id === 'travel'
          ? {
              ...bucket,
              items: bucket.items.map((item) => ({ ...item, enabled: false })),
            }
          : bucket,
      ),
    };

    expect(computeExpenseScenarioTotal(modified)).toBe(3_550);
  });

  it('includes custom items in totals', () => {
    const builder = createDefaultExpenseBuilder('categories', 'current');
    const scenario = getActiveExpenseScenario(builder);
    if (!scenario) throw new Error('missing scenario');

    const modified = {
      ...scenario,
      buckets: scenario.buckets.map((bucket) =>
        bucket.id === 'other'
          ? {
              ...bucket,
              items: [
                ...bucket.items,
                {
                  id: 'custom_pet_care',
                  label: 'Pet care',
                  amount_monthly: 200,
                  enabled: true,
                  is_default: false,
                  is_custom: true,
                },
              ],
            }
          : bucket,
      ),
    };

    expect(computeExpenseScenarioTotal(modified)).toBe(4_800);
  });
});

describe('expense builder input sync', () => {
  it('derives living expenses from the active category scenario', () => {
    const inputs = makeInputs({
      expense_builder: createDefaultExpenseBuilder('categories', 'with_child'),
    });

    expect(syncLivingExpensesFromBuilder(inputs).living_expenses_monthly).toBe(9_200);
  });

  it('does not overwrite manual living expenses', () => {
    const inputs = makeInputs({
      living_expenses_monthly: 8_888,
      expense_builder: createDefaultExpenseBuilder('manual', 'with_child', 8_888),
    });

    expect(syncLivingExpensesFromBuilder(inputs).living_expenses_monthly).toBe(8_888);
  });

  it('keeps legacy saved inputs in manual mode', () => {
    const inputs = ensureExpenseBuilder(makeInputs({ living_expenses_monthly: 7_777 }), true);

    expect(inputs.expense_builder?.mode).toBe('manual');
    expect(inputs.living_expenses_monthly).toBe(7_777);
  });
});
