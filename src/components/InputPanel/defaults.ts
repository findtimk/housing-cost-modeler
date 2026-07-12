import type { ScenarioInputs } from '../../engine/types.ts';

export const DEFAULT_INPUTS: ScenarioInputs = {
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
};

/**
 * Merge saved (possibly legacy) inputs with defaults.
 * Legacy blobs stored a single combined `hhi_annual`; map it to earner 1
 * (with earner 2 at zero) so previous results carry over as closely as possible.
 */
export function migrateInputs(saved: unknown): ScenarioInputs {
  const savedObj =
    saved && typeof saved === 'object' ? (saved as Record<string, unknown>) : {};
  const merged = { ...DEFAULT_INPUTS, ...savedObj } as ScenarioInputs &
    Record<string, unknown>;

  if (
    typeof savedObj.hhi_annual === 'number' &&
    savedObj.earner1_wages_annual === undefined
  ) {
    merged.earner1_wages_annual = savedObj.hhi_annual;
    merged.earner2_wages_annual = 0;
  }
  delete merged.hhi_annual;

  return merged as ScenarioInputs;
}

export const DEFAULT_GRID_CONFIG = {
  income_min: 100_000,
  income_max: 600_000,
  income_step: 50_000,
  price_min: 1_000_000,
  price_max: 1_500_000,
  price_step: 100_000,
  surplus_threshold: 0,
};
