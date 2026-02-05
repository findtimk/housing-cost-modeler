import type { HousingResult } from './types.ts';

/** Compute monthly principal + interest using standard amortization formula. */
export function computeMonthlyPI(
  loanAmount: number,
  apr: number,
  termYears: number,
): number {
  if (loanAmount <= 0) return 0;

  const n = termYears * 12;
  const r = apr / 12;

  if (r === 0) return loanAmount / n;

  const factor = Math.pow(1 + r, n);
  return loanAmount * (r * factor) / (factor - 1);
}

/** Compute full housing cost breakdown. */
export function computeHousingCosts(
  homePrice: number,
  downPaymentPct: number,
  apr: number,
  termYears: number,
  propertyTaxRateAnnual: number,
  insuranceRateAnnual: number,
  maintenanceRateAnnual: number,
  hoaMonthly: number,
): HousingResult {
  const loanAmount = homePrice * (1 - downPaymentPct);
  const piMonthly = computeMonthlyPI(loanAmount, apr, termYears);
  const propertyTaxMonthly = (homePrice * propertyTaxRateAnnual) / 12;
  const insuranceMonthly = (homePrice * insuranceRateAnnual) / 12;
  const maintenanceMonthly = (homePrice * maintenanceRateAnnual) / 12;

  const housingTotalMonthly =
    piMonthly +
    propertyTaxMonthly +
    insuranceMonthly +
    maintenanceMonthly +
    hoaMonthly;

  return {
    loan_amount: loanAmount,
    pi_monthly: piMonthly,
    property_tax_monthly: propertyTaxMonthly,
    insurance_monthly: insuranceMonthly,
    maintenance_monthly: maintenanceMonthly,
    hoa_monthly: hoaMonthly,
    housing_total_monthly: housingTotalMonthly,
  };
}
