import type { ScenarioInputs, GridCell, GridResult, GridConfig } from './types.ts';
import { computeAllTaxes } from './taxEngine.ts';
import { computeHousingCosts } from './housingEngine.ts';

/** Generate an array of values from min to max (inclusive) by step. */
function range(min: number, max: number, step: number): number[] {
  const result: number[] = [];
  for (let v = min; v <= max + step * 0.01; v += step) {
    result.push(Math.round(v));
  }
  return result;
}

/**
 * Compute grid of surplus values.
 * Optimization: tax depends only on income, housing depends only on price.
 * We compute each dimension once, then combine.
 */
export function computeGrid(
  baseInputs: ScenarioInputs,
  config: GridConfig,
): GridResult {
  const incomes = range(config.income_min, config.income_max, config.income_step);
  const prices = range(config.price_min, config.price_max, config.price_step);

  // Pre-compute taxes per income level.
  // The grid keeps a single household-income axis, so taxes here use a
  // single-earner approximation (one SS/PFML cap). The scenario detail view
  // splits income across earners and may differ slightly.
  const taxByIncome = incomes.map((income) =>
    computeAllTaxes({
      filing_status: baseInputs.filing_status,
      state: baseInputs.state,
      earners: [
        {
          wages: income,
          pfmlExempt: baseInputs.earner1_pfml_exempt,
          waCaresExempt: baseInputs.earner1_wa_cares_exempt,
        },
      ],
      pre_tax_retirement_monthly: baseInputs.pre_tax_retirement_monthly,
      other_pre_tax_deductions_annual: baseInputs.other_pre_tax_deductions_annual,
      state_effective_rate_override: baseInputs.state_effective_rate_override,
    }),
  );

  // Pre-compute housing per price level
  const housingByPrice = prices.map((price) =>
    computeHousingCosts(
      price,
      baseInputs.down_payment_pct,
      baseInputs.apr,
      baseInputs.term_years,
      baseInputs.property_tax_rate_annual,
      baseInputs.insurance_rate_annual,
      baseInputs.maintenance_rate_annual,
      baseInputs.hoa_monthly,
    ),
  );

  // Combine into grid
  const cells: GridCell[][] = incomes.map((income, i) => {
    const tax = taxByIncome[i];
    const grossMonthly = income / 12;
    const netPayMonthly = grossMonthly - tax.taxes_monthly;

    return prices.map((price, j) => {
      const housing = housingByPrice[j];
      const surplusMonthly =
        netPayMonthly -
        baseInputs.pre_tax_retirement_monthly -
        baseInputs.after_tax_retirement_monthly -
        baseInputs.living_expenses_monthly -
        housing.housing_total_monthly;
      const pitiaRatio =
        grossMonthly > 0 ? housing.pitia_monthly / grossMonthly : 0;
      const allInRatio =
        grossMonthly > 0 ? housing.housing_total_monthly / grossMonthly : 0;

      return {
        income,
        price,
        surplus_monthly: surplusMonthly,
        pitia_ratio: pitiaRatio,
        all_in_ratio: allInRatio,
      };
    });
  });

  return { incomes, prices, cells };
}
