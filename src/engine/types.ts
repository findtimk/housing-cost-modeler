export type FilingStatus = 'MFJ' | 'SINGLE';

export interface ScenarioInputs {
  // Household / tax
  filing_status: FilingStatus;
  state: string;
  earner1_wages_annual: number;
  earner2_wages_annual: number;
  earner1_pfml_exempt: boolean;
  earner2_pfml_exempt: boolean;
  earner1_wa_cares_exempt: boolean;
  earner2_wa_cares_exempt: boolean;
  pre_tax_retirement_monthly: number;
  after_tax_retirement_monthly: number;
  living_expenses_monthly: number;
  expense_builder?: ExpenseBuilderState;
  other_pre_tax_deductions_annual: number;
  state_effective_rate_override?: number;

  // Home / mortgage
  home_price: number;
  down_payment_pct: number;
  apr: number;
  term_years: number;
  property_tax_rate_annual: number;
  insurance_rate_annual: number;
  maintenance_rate_annual: number;
  hoa_monthly: number;
}

export type ExpenseMode = 'manual' | 'categories';
export type ExpenseScenarioId = 'current' | 'with_child' | 'custom';

export interface ExpenseLineItem {
  id: string;
  label: string;
  amount_monthly: number;
  enabled: boolean;
  is_default: boolean;
  is_custom: boolean;
}

export interface ExpenseBucket {
  id: string;
  label: string;
  description?: string;
  expanded: boolean;
  items: ExpenseLineItem[];
}

export interface ExpenseScenario {
  id: ExpenseScenarioId | string;
  label: string;
  buckets: ExpenseBucket[];
}

export interface ExpenseBuilderState {
  mode: ExpenseMode;
  active_scenario_id: string;
  scenarios: ExpenseScenario[];
  last_manual_living_expenses_monthly: number;
  ytd_months_assumption: number;
  source: 'defaults' | 'user_edited';
}

export interface TaxResult {
  wages_annual: number;
  pre_tax_retirement_annual: number;
  other_pre_tax_deductions_annual: number;
  standard_deduction: number;
  taxable_income_federal: number;
  federal_tax_annual: number;

  ss_tax_annual: number;
  ss_tax_by_earner: number[];
  medicare_tax_annual: number;
  addl_medicare_tax_annual: number;
  payroll_tax_annual: number;

  pfml_tax_annual: number;
  wa_cares_tax_annual: number;

  adj_wages_for_state: number;
  state_effective_rate: number;
  state_tax_annual: number;

  taxes_annual: number;
  taxes_monthly: number;
}

export interface HousingResult {
  loan_amount: number;
  pi_monthly: number;
  property_tax_monthly: number;
  insurance_monthly: number;
  maintenance_monthly: number;
  hoa_monthly: number;
  /** P&I + property tax + insurance + HOA — the lender-style payment, excludes maintenance. */
  pitia_monthly: number;
  housing_total_monthly: number;
}

export interface ScenarioResult {
  inputs: ScenarioInputs;
  tax: TaxResult;
  housing: HousingResult;

  gross_monthly: number;
  net_pay_monthly: number;
  after_tax_retirement_monthly: number;
  living_expenses_monthly: number;
  surplus_monthly: number;
  /** PITIA / gross — comparable to lender front-end guidelines. */
  pitia_ratio: number;
  /** Housing total incl. maintenance / gross — the true cost of ownership. */
  all_in_ratio: number;
}

export interface GridCell {
  income: number;
  price: number;
  surplus_monthly: number;
  pitia_ratio: number;
  all_in_ratio: number;
}

export interface GridResult {
  incomes: number[];
  prices: number[];
  cells: GridCell[][];
  /** Per price column: minimum household income where surplus >= 0 (Infinity if unreachable). */
  break_even_incomes: number[];
}

export interface GridConfig {
  income_min: number;
  income_max: number;
  income_step: number;
  price_min: number;
  price_max: number;
  price_step: number;
  surplus_threshold: number;
}
