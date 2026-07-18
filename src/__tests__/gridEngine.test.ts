import { describe, it, expect } from 'vitest';
import { computeGrid } from '../engine/gridEngine.ts';
import { computeScenario } from '../engine/cashflowEngine.ts';
import { computeHousingCosts } from '../engine/housingEngine.ts';
import type { ScenarioInputs, GridConfig } from '../engine/types.ts';

const BASE_INPUTS: ScenarioInputs = {
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

const CONFIG: GridConfig = {
  income_min: 300_000,
  income_max: 500_000,
  income_step: 100_000,
  price_min: 1_200_000,
  price_max: 1_400_000,
  price_step: 100_000,
  surplus_threshold: 0,
};

describe('computeGrid', () => {
  const grid = computeGrid(BASE_INPUTS, CONFIG);

  it('generates the expected axes', () => {
    expect(grid.incomes).toEqual([300_000, 400_000, 500_000]);
    expect(grid.prices).toEqual([1_200_000, 1_300_000, 1_400_000]);
  });

  it('cells carry both ratios and PITIA < all-in', () => {
    const cell = grid.cells[0][0];
    expect(cell.pitia_ratio).toBeGreaterThan(0);
    expect(cell.pitia_ratio).toBeLessThan(cell.all_in_ratio);
  });

  it('grid cell matches scenario detail using the input income split', () => {
    const cell = grid.cells[2][2]; // 500k income, 1.4M price
    const splitScenario = computeScenario({
      ...BASE_INPUTS,
      earner1_wages_annual: 250_000,
      earner2_wages_annual: 250_000,
    });
    expect(cell.surplus_monthly).toBeCloseTo(splitScenario.surplus_monthly, 2);
    expect(cell.pitia_ratio).toBeCloseTo(splitScenario.pitia_ratio, 6);
    expect(cell.all_in_ratio).toBeCloseTo(splitScenario.all_in_ratio, 6);
  });

  it('uses the configured income split proportion for each HHI row', () => {
    const unevenInputs = {
      ...BASE_INPUTS,
      earner1_wages_annual: 300_000,
      earner2_wages_annual: 100_000,
    };
    const unevenGrid = computeGrid(unevenInputs, CONFIG);
    const cell = unevenGrid.cells[2][2]; // 500k income, 1.4M price
    const splitScenario = computeScenario({
      ...unevenInputs,
      earner1_wages_annual: 375_000,
      earner2_wages_annual: 125_000,
    });
    expect(cell.surplus_monthly).toBeCloseTo(splitScenario.surplus_monthly, 2);
  });

  it('surplus decreases as price rises and increases with income', () => {
    expect(grid.cells[0][2].surplus_monthly).toBeLessThan(
      grid.cells[0][0].surplus_monthly,
    );
    expect(grid.cells[2][0].surplus_monthly).toBeGreaterThan(
      grid.cells[0][0].surplus_monthly,
    );
  });

  it('break-even incomes align with prices and rise with price', () => {
    expect(grid.break_even_incomes).toHaveLength(grid.prices.length);
    for (let j = 1; j < grid.break_even_incomes.length; j++) {
      expect(grid.break_even_incomes[j]).toBeGreaterThan(
        grid.break_even_incomes[j - 1],
      );
    }
  });

  it('marginal housing cost per price step is constant (linear in price)', () => {
    const cost = (price: number) =>
      computeHousingCosts(
        price,
        BASE_INPUTS.down_payment_pct,
        BASE_INPUTS.apr,
        BASE_INPUTS.term_years,
        BASE_INPUTS.property_tax_rate_annual,
        BASE_INPUTS.insurance_rate_annual,
        BASE_INPUTS.maintenance_rate_annual,
        BASE_INPUTS.hoa_monthly,
      ).housing_total_monthly;

    const stepLow = cost(1_100_000) - cost(1_000_000);
    const stepHigh = cost(1_500_000) - cost(1_400_000);
    expect(stepLow).toBeCloseTo(stepHigh, 6);
    // The UI computes the same delta directly from a price of one step
    expect(cost(100_000)).toBeCloseTo(stepLow, 6);
  });
});
