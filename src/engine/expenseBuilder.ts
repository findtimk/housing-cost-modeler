import type {
  ExpenseBucket,
  ExpenseBuilderState,
  ExpenseLineItem,
  ExpenseMode,
  ExpenseScenario,
  ExpenseScenarioId,
  ScenarioInputs,
} from './types.ts';

export const YTD_MONTHS_ASSUMPTION = 6.4;
export const DEFAULT_MANUAL_LIVING_EXPENSES_MONTHLY = 9_500;

const DEFAULT_ACTIVE_SCENARIO_ID: ExpenseScenarioId = 'with_child';

function item(
  id: string,
  label: string,
  amount_monthly: number,
  isCustom = false,
): ExpenseLineItem {
  return {
    id,
    label,
    amount_monthly,
    enabled: true,
    is_default: !isCustom,
    is_custom: isCustom,
  };
}

function bucket(
  id: string,
  label: string,
  description: string,
  items: ExpenseLineItem[],
  expanded = false,
): ExpenseBucket {
  return { id, label, description, expanded, items };
}

function actualSpendingBuckets(): ExpenseBucket[] {
  return [
    bucket('travel', 'Travel', 'Travel & vacation', [
      item('travel_vacation', 'Travel & Vacation', 1_050),
    ]),
    bucket('food', 'Food', 'Restaurants & bars, groceries', [
      item('restaurants_bars', 'Restaurants & Bars', 675),
      item('groceries', 'Groceries', 550),
    ]),
    bucket('transportation', 'Transportation', 'Auto, insurance, rides', [
      item('auto_payment', 'Auto Payment', 650),
      item('auto_maintenance', 'Auto Maintenance', 200),
      item('insurance', 'Insurance', 150),
      item('taxi_ride_shares', 'Taxi & Ride Shares', 100),
    ]),
    bucket('home_utilities', 'Home & utilities', 'Services and recurring utilities', [
      item('home_cleaning', 'Home Cleaning', 150),
      item('internet_cable', 'Internet & Cable', 100),
    ]),
    bucket('health_personal', 'Health & personal', 'Medical and personal care', [
      item('medical', 'Medical', 100),
      item('hair_cuts', 'Hair cuts', 50),
    ]),
    bucket('lifestyle_gifts', 'Lifestyle & gifts', 'Shopping, gifts, fun', [
      item('gifts', 'Gifts', 325),
      item('shopping', 'Shopping', 250),
      item('entertainment_recreation', 'Entertainment & Recreation', 50),
      item('fun_money', 'Fun Money', 50),
    ]),
    bucket('financial_admin', 'Financial & admin', 'Fees and professional services', [
      item('financial_legal_services', 'Financial & Legal Services', 50),
      item('financial_fees', 'Financial Fees', 50),
    ]),
    bucket('other', 'Other', 'Miscellaneous spending', [
      item('miscellaneous', 'Miscellaneous', 50),
    ]),
  ];
}

function childFamilyBucket(): ExpenseBucket {
  return bucket(
    'child_family',
    'Child / family',
    'One-child care and family costs',
    [
      item('daycare', 'Daycare', 3_500),
      item('child_supplies', 'Child supplies', 250),
      item('backup_care', 'Babysitting / backup care', 300),
      item('child_medical', 'Child medical', 150),
      item('activities_classes', 'Activities / classes', 150),
      item('education_savings', 'Education savings', 250),
    ],
    false,
  );
}

function cloneBuckets(buckets: ExpenseBucket[]): ExpenseBucket[] {
  return buckets.map((b) => ({
    ...b,
    items: b.items.map((i) => ({ ...i })),
  }));
}

function scenario(
  id: ExpenseScenarioId,
  label: string,
  buckets: ExpenseBucket[],
): ExpenseScenario {
  return { id, label, buckets };
}

export function createDefaultExpenseBuilder(
  mode: ExpenseMode = 'categories',
  activeScenarioId: ExpenseScenarioId = DEFAULT_ACTIVE_SCENARIO_ID,
  manualAmount = DEFAULT_MANUAL_LIVING_EXPENSES_MONTHLY,
): ExpenseBuilderState {
  const actual = actualSpendingBuckets();
  const withChild = [...cloneBuckets(actual), childFamilyBucket()];

  return {
    mode,
    active_scenario_id: activeScenarioId,
    scenarios: [
      scenario('current', 'Current', cloneBuckets(actual)),
      scenario('with_child', 'With child', withChild),
      scenario('custom', 'Custom', cloneBuckets(withChild)),
    ],
    last_manual_living_expenses_monthly: manualAmount,
    ytd_months_assumption: YTD_MONTHS_ASSUMPTION,
    source: 'defaults',
  };
}

export function computeExpenseBucketTotal(bucket: ExpenseBucket): number {
  return bucket.items.reduce(
    (sum, expenseItem) => sum + (expenseItem.enabled ? expenseItem.amount_monthly : 0),
    0,
  );
}

export function computeExpenseScenarioTotal(scenario: ExpenseScenario): number {
  return scenario.buckets.reduce((sum, b) => sum + computeExpenseBucketTotal(b), 0);
}

export function getActiveExpenseScenario(
  builder?: ExpenseBuilderState,
): ExpenseScenario | undefined {
  if (!builder) return undefined;
  return (
    builder.scenarios.find((s) => s.id === builder.active_scenario_id) ??
    builder.scenarios[0]
  );
}

export function getExpenseBuilderTotal(builder?: ExpenseBuilderState): number {
  const scenario = getActiveExpenseScenario(builder);
  return scenario ? computeExpenseScenarioTotal(scenario) : 0;
}

export function isCategoryExpenseMode(builder?: ExpenseBuilderState): boolean {
  return builder?.mode === 'categories' && !!getActiveExpenseScenario(builder);
}

export function syncLivingExpensesFromBuilder(inputs: ScenarioInputs): ScenarioInputs {
  if (!isCategoryExpenseMode(inputs.expense_builder)) return inputs;
  return {
    ...inputs,
    living_expenses_monthly: getExpenseBuilderTotal(inputs.expense_builder),
  };
}

export function ensureExpenseBuilder(
  inputs: ScenarioInputs,
  legacySavedWithoutBuilder = false,
): ScenarioInputs {
  if (inputs.expense_builder) return syncLivingExpensesFromBuilder(inputs);

  const mode: ExpenseMode = legacySavedWithoutBuilder ? 'manual' : 'categories';
  const builder = createDefaultExpenseBuilder(
    mode,
    DEFAULT_ACTIVE_SCENARIO_ID,
    inputs.living_expenses_monthly,
  );

  return syncLivingExpensesFromBuilder({
    ...inputs,
    expense_builder: builder,
  });
}

export function getExpenseBuilderSummary(builder?: ExpenseBuilderState): {
  actualTotal: number;
  childTotal: number;
  total: number;
} {
  const scenario = getActiveExpenseScenario(builder);
  if (!scenario) return { actualTotal: 0, childTotal: 0, total: 0 };

  const childTotal = scenario.buckets
    .filter((b) => b.id === 'child_family')
    .reduce((sum, b) => sum + computeExpenseBucketTotal(b), 0);
  const total = computeExpenseScenarioTotal(scenario);

  return {
    actualTotal: total - childTotal,
    childTotal,
    total,
  };
}
