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

  // Pre-compute taxes per income level
  const taxByIncome = incomes.map((income) =>
    computeAllTaxes(
      baseInputs.filing_status,
      baseInputs.state,
      income,
      baseInputs.pre_tax_retirement_monthly,
      baseInputs.other_pre_tax_deductions_annual,
      baseInputs.state_effective_rate_override,
    ),
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
      const frontEndRatio =
        grossMonthly > 0 ? housing.housing_total_monthly / grossMonthly : 0;

      return {
        income,
        price,
        surplus_monthly: surplusMonthly,
        front_end_ratio: frontEndRatio,
      };
    });
  });

  return { incomes, prices, cells };
}
