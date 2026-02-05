import { describe, it, expect } from 'vitest';
import {
  computeMonthlyPI,
  computeHousingCosts,
} from '../engine/housingEngine.ts';

describe('computeMonthlyPI', () => {
  it('returns 0 for zero loan amount', () => {
    expect(computeMonthlyPI(0, 0.065, 30)).toBe(0);
  });

  it('returns 0 for negative loan amount', () => {
    expect(computeMonthlyPI(-100, 0.065, 30)).toBe(0);
  });

  it('handles zero interest rate', () => {
    // $360,000 loan, 0% APR, 30 years = $1,000/month
    expect(computeMonthlyPI(360_000, 0, 30)).toBeCloseTo(1_000, 2);
  });

  it('computes G1 P&I: $980k loan, 6.5%, 30yr', () => {
    const pi = computeMonthlyPI(980_000, 0.065, 30);
    expect(pi).toBeCloseTo(6_194.27, 0);
  });

  it('computes G3 P&I: $1.26M loan, 6.5%, 30yr', () => {
    const pi = computeMonthlyPI(1_260_000, 0.065, 30);
    expect(pi).toBeCloseTo(7_964.06, 0);
  });

  it('computes 15-year term correctly', () => {
    // $200,000 loan, 5% APR, 15 years
    const pi = computeMonthlyPI(200_000, 0.05, 15);
    // Known value: ~$1,581.59
    expect(pi).toBeCloseTo(1_581.59, 0);
  });
});

describe('computeHousingCosts', () => {
  it('computes G1 housing: $1.4M, 30% down, 6.5%, standard rates', () => {
    const result = computeHousingCosts(
      1_400_000, 0.30, 0.065, 30, 0.01, 0.005, 0.01, 0,
    );
    expect(result.loan_amount).toBeCloseTo(980_000, 0);
    expect(result.pi_monthly).toBeCloseTo(6_194.27, 0);
    expect(result.property_tax_monthly).toBeCloseTo(1_166.67, 0);
    expect(result.insurance_monthly).toBeCloseTo(583.33, 0);
    expect(result.maintenance_monthly).toBeCloseTo(1_166.67, 0);
    expect(result.hoa_monthly).toBe(0);
    expect(result.housing_total_monthly).toBeCloseTo(9_110.93, 1);
  });

  it('computes G3 housing: $1.8M, 30% down, $300 HOA', () => {
    const result = computeHousingCosts(
      1_800_000, 0.30, 0.065, 30, 0.01, 0.005, 0.01, 300,
    );
    expect(result.pi_monthly).toBeCloseTo(7_964.06, 0);
    expect(result.property_tax_monthly).toBeCloseTo(1_500, 0);
    expect(result.insurance_monthly).toBeCloseTo(750, 0);
    expect(result.maintenance_monthly).toBeCloseTo(1_500, 0);
    expect(result.hoa_monthly).toBe(300);
    expect(result.housing_total_monthly).toBeCloseTo(12_014.06, 1);
  });

  it('computes G4 housing: $1.4M, different rates', () => {
    const result = computeHousingCosts(
      1_400_000, 0.30, 0.065, 30, 0.012, 0.006, 0.01, 0,
    );
    expect(result.property_tax_monthly).toBeCloseTo(1_400, 0);
    expect(result.insurance_monthly).toBeCloseTo(700, 0);
    expect(result.housing_total_monthly).toBeCloseTo(9_460.93, 1);
  });

  it('returns zero housing for $0 home price', () => {
    const result = computeHousingCosts(0, 0.30, 0.065, 30, 0.01, 0.005, 0.01, 0);
    expect(result.housing_total_monthly).toBe(0);
  });
});
