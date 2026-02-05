export type FilingStatus = 'MFJ' | 'SINGLE';

export interface ScenarioInputs {
  // Household / tax
  filing_status: FilingStatus;
  state: string;
  hhi_annual: number;
  pre_tax_retirement_monthly: number;
  after_tax_retirement_monthly: number;
  living_expenses_monthly: number;
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

export interface TaxResult {
  wages_annual: number;
  pre_tax_retirement_annual: number;
  other_pre_tax_deductions_annual: number;
  standard_deduction: number;
  taxable_income_federal: number;
  federal_tax_annual: number;

  ss_tax_annual: number;
  medicare_tax_annual: number;
  addl_medicare_tax_annual: number;
  payroll_tax_annual: number;

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
  front_end_ratio: number;
}

export interface GridCell {
  income: number;
  price: number;
  surplus_monthly: number;
  front_end_ratio: number;
}

export interface GridResult {
  incomes: number[];
  prices: number[];
  cells: GridCell[][];
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
