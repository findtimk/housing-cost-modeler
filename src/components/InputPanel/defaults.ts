import type { ScenarioInputs } from '../../engine/types.ts';

export const DEFAULT_INPUTS: ScenarioInputs = {
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

export const DEFAULT_GRID_CONFIG = {
  income_min: 300_000,
  income_max: 700_000,
  income_step: 50_000,
  price_min: 1_000_000,
  price_max: 1_900_000,
  price_step: 100_000,
  surplus_threshold: 0,
};
