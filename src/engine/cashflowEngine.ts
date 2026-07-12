import type { ScenarioInputs, ScenarioResult } from './types.ts';
import { computeAllTaxes } from './taxEngine.ts';
import { computeHousingCosts } from './housingEngine.ts';

/** Build the per-earner array from scenario inputs. */
export function earnersFromInputs(inputs: ScenarioInputs) {
  return [
    {
      wages: inputs.earner1_wages_annual,
      pfmlExempt: inputs.earner1_pfml_exempt,
      waCaresExempt: inputs.earner1_wa_cares_exempt,
    },
    {
      wages: inputs.earner2_wages_annual,
      pfmlExempt: inputs.earner2_pfml_exempt,
      waCaresExempt: inputs.earner2_wa_cares_exempt,
    },
  ];
}

/** Compute a full scenario: taxes + housing + cashflow. */
export function computeScenario(inputs: ScenarioInputs): ScenarioResult {
  const tax = computeAllTaxes({
    filing_status: inputs.filing_status,
    state: inputs.state,
    earners: earnersFromInputs(inputs),
    pre_tax_retirement_monthly: inputs.pre_tax_retirement_monthly,
    other_pre_tax_deductions_annual: inputs.other_pre_tax_deductions_annual,
    state_effective_rate_override: inputs.state_effective_rate_override,
  });

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

  const grossMonthly =
    (inputs.earner1_wages_annual + inputs.earner2_wages_annual) / 12;
  const netPayMonthly = grossMonthly - tax.taxes_monthly;
  const surplusMonthly =
    netPayMonthly -
    inputs.pre_tax_retirement_monthly -
    inputs.after_tax_retirement_monthly -
    inputs.living_expenses_monthly -
    housing.housing_total_monthly;
  const pitiaRatio =
    grossMonthly > 0 ? housing.pitia_monthly / grossMonthly : 0;
  const allInRatio =
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
    pitia_ratio: pitiaRatio,
    all_in_ratio: allInRatio,
  };
}
