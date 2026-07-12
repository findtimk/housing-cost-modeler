import { describe, it, expect } from 'vitest';
import { computeGrid } from '../engine/gridEngine.ts';
import { computeScenario } from '../engine/cashflowEngine.ts';
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

  it('grid cell matches a single-earner scenario (its documented approximation)', () => {
    // The grid treats each cell's income as ONE earner; a scenario with the
    // same income all on earner 1 must produce the identical surplus.
    const cell = grid.cells[2][2]; // 500k income, 1.4M price
    const singleEarner = computeScenario({
      ...BASE_INPUTS,
      earner1_wages_annual: 500_000,
      earner2_wages_annual: 0,
    });
    expect(cell.surplus_monthly).toBeCloseTo(singleEarner.surplus_monthly, 2);
  });

  it('grid approximation shows MORE surplus than the true two-earner split', () => {
    // One SS/PFML cap on 500k combined vs two caps on 250k/250k:
    // the grid should look slightly rosier than the per-earner detail view.
    const cell = grid.cells[2][2];
    const twoEarners = computeScenario({
      ...BASE_INPUTS,
      earner1_wages_annual: 250_000,
      earner2_wages_annual: 250_000,
    });
    expect(cell.surplus_monthly).toBeGreaterThan(twoEarners.surplus_monthly);
  });

  it('surplus decreases as price rises and increases with income', () => {
    expect(grid.cells[0][2].surplus_monthly).toBeLessThan(
      grid.cells[0][0].surplus_monthly,
    );
    expect(grid.cells[2][0].surplus_monthly).toBeGreaterThan(
      grid.cells[0][0].surplus_monthly,
    );
  });
});
