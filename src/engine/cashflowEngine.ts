import type { ScenarioInputs, ScenarioResult } from './types.ts';
import { computeAllTaxes } from './taxEngine.ts';
import { computeHousingCosts } from './housingEngine.ts';

/** Compute a full scenario: taxes + housing + cashflow. */
export function computeScenario(inputs: ScenarioInputs): ScenarioResult {
  const tax = computeAllTaxes(
    inputs.filing_status,
    inputs.state,
    inputs.hhi_annual,
    inputs.pre_tax_retirement_monthly,
    inputs.other_pre_tax_deductions_annual,
    inputs.state_effective_rate_override,
  );

  const housing = computeHousingCosts(
    inputs.home_price,
    inputs.down_payment_pct,
    inputs.apr,
    inputs.term_years,
    inputs.property_tax_rate_annual,
    inputs.insurance_rate_annual,
    inputs.maintenance_rate_annual,
    inputs.hoa_monthly,
  );

  const grossMonthly = inputs.hhi_annual / 12;
  const netPayMonthly = grossMonthly - tax.taxes_monthly;
  const surplusMonthly =
    netPayMonthly -
    inputs.pre_tax_retirement_monthly -
    inputs.after_tax_retirement_monthly -
    inputs.living_expenses_monthly -
    housing.housing_total_monthly;
  const frontEndRatio =
    grossMonthly > 0 ? housing.housing_total_monthly / grossMonthly : 0;

  return {
    inputs,
    tax,
    housing,
    gross_monthly: grossMonthly,
    net_pay_monthly: netPayMonthly,
    after_tax_retirement_monthly: inputs.after_tax_retirement_monthly,
    living_expenses_monthly: inputs.living_expenses_monthly,
    surplus_monthly: surplusMonthly,
    front_end_ratio: frontEndRatio,
  };
}
