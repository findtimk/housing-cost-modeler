import type { ScenarioInputs, ScenarioResult } from './types.ts';
import { computeAllTaxes } from './taxEngine.ts';
import { computeHousingCosts } from './housingEngine.ts';
import { splitIncome } from './incomeSplit.ts';

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

/** Search ceiling for break-even income; above this we report "not achievable". */
const BREAK_EVEN_INCOME_CAP = 20_000_000;

/**
 * Find the minimum household income (annual) at which monthly surplus is >= 0
 * for the given housing cost, holding all other inputs fixed.
 *
 * Net pay is monotonically increasing in income, so binary search converges.
 * The income is split between earners in the same proportion as the base
 * inputs (matching how grid rows are computed).
 *
 * Returns the break-even income rounded up to the nearest $1,000,
 * 0 if the outflows are covered even with no income, or Infinity if no
 * income up to the cap covers them.
 */
export function computeBreakEvenIncome(
  inputs: ScenarioInputs,
  housingTotalMonthly: number,
): number {
  const fixedMonthly =
    inputs.pre_tax_retirement_monthly +
    inputs.after_tax_retirement_monthly +
    inputs.living_expenses_monthly +
    housingTotalMonthly;

  const netPayMonthly = (income: number): number => {
    const [earner1, earner2] = splitIncome(
      income,
      inputs.earner1_wages_annual,
      inputs.earner2_wages_annual,
    );
    const tax = computeAllTaxes({
      filing_status: inputs.filing_status,
      state: inputs.state,
      earners: [
        {
          wages: earner1,
          pfmlExempt: inputs.earner1_pfml_exempt,
          waCaresExempt: inputs.earner1_wa_cares_exempt,
        },
        {
          wages: earner2,
          pfmlExempt: inputs.earner2_pfml_exempt,
          waCaresExempt: inputs.earner2_wa_cares_exempt,
        },
      ],
      pre_tax_retirement_monthly: inputs.pre_tax_retirement_monthly,
      other_pre_tax_deductions_annual: inputs.other_pre_tax_deductions_annual,
      state_effective_rate_override: inputs.state_effective_rate_override,
    });
    return income / 12 - tax.taxes_monthly;
  };

  if (netPayMonthly(0) >= fixedMonthly) return 0;
  if (netPayMonthly(BREAK_EVEN_INCOME_CAP) < fixedMonthly) return Infinity;

  let lo = 0;
  let hi = BREAK_EVEN_INCOME_CAP;
  for (let i = 0; i < 50; i++) {
    const mid = (lo + hi) / 2;
    if (netPayMonthly(mid) >= fixedMonthly) {
      hi = mid;
    } else {
      lo = mid;
    }
  }
  return Math.ceil(hi / 1000) * 1000;
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
