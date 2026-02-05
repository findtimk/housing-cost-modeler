import type { FilingStatus, TaxResult } from './types.ts';
import {
  STANDARD_DEDUCTION,
  FEDERAL_BRACKETS,
  SS_RATE,
  SS_WAGE_BASE,
  MEDICARE_RATE,
  ADDL_MEDICARE_RATE,
  ADDL_MEDICARE_THRESHOLD,
  STATE_EFFECTIVE_RATES,
  STATE_DEFAULT_RATE,
} from './taxConstants2026.ts';

/** Compute progressive federal income tax on taxable income. */
export function computeFederalTax(
  taxableIncome: number,
  filingStatus: FilingStatus,
): number {
  const brackets = FEDERAL_BRACKETS[filingStatus];
  let tax = 0;
  let prevCap = 0;

  for (const [cap, rate] of brackets) {
    if (taxableIncome <= prevCap) break;
    const amountInBracket = Math.min(taxableIncome, cap) - prevCap;
    tax += amountInBracket * rate;
    prevCap = cap;
  }

  return tax;
}

/** Compute payroll taxes (SS + Medicare + Additional Medicare). */
export function computePayrollTax(
  wagesAnnual: number,
  filingStatus: FilingStatus,
): { ss: number; medicare: number; addlMedicare: number; total: number } {
  const ss = Math.min(wagesAnnual, SS_WAGE_BASE) * SS_RATE;
  const medicare = wagesAnnual * MEDICARE_RATE;
  const addlMedicare =
    Math.max(0, wagesAnnual - ADDL_MEDICARE_THRESHOLD[filingStatus]) *
    ADDL_MEDICARE_RATE;
  return { ss, medicare, addlMedicare, total: ss + medicare + addlMedicare };
}

/** Get state effective tax rate. */
export function getStateEffectiveRate(
  state: string,
  override?: number,
): number {
  if (override !== undefined) return override;
  return STATE_EFFECTIVE_RATES[state] ?? STATE_DEFAULT_RATE;
}

/** Compute all taxes for a given income scenario. */
export function computeAllTaxes(
  filingStatus: FilingStatus,
  state: string,
  hhiAnnual: number,
  preTaxRetirementMonthly: number,
  otherPreTaxDeductionsAnnual: number,
  stateEffectiveRateOverride?: number,
): TaxResult {
  const wagesAnnual = hhiAnnual;
  const preTaxRetirementAnnual = preTaxRetirementMonthly * 12;
  const standardDeduction = STANDARD_DEDUCTION[filingStatus];

  const taxableIncomeFederal = Math.max(
    0,
    wagesAnnual -
      preTaxRetirementAnnual -
      otherPreTaxDeductionsAnnual -
      standardDeduction,
  );

  const federalTax = computeFederalTax(taxableIncomeFederal, filingStatus);
  const payroll = computePayrollTax(wagesAnnual, filingStatus);

  const adjWagesForState = Math.max(
    0,
    wagesAnnual - preTaxRetirementAnnual - otherPreTaxDeductionsAnnual,
  );
  const stateEffectiveRate = getStateEffectiveRate(
    state,
    stateEffectiveRateOverride,
  );
  const stateTax = adjWagesForState * stateEffectiveRate;

  const taxesAnnual = federalTax + payroll.total + stateTax;
  const taxesMonthly = taxesAnnual / 12;

  return {
    wages_annual: wagesAnnual,
    pre_tax_retirement_annual: preTaxRetirementAnnual,
    other_pre_tax_deductions_annual: otherPreTaxDeductionsAnnual,
    standard_deduction: standardDeduction,
    taxable_income_federal: taxableIncomeFederal,
    federal_tax_annual: federalTax,
    ss_tax_annual: payroll.ss,
    medicare_tax_annual: payroll.medicare,
    addl_medicare_tax_annual: payroll.addlMedicare,
    payroll_tax_annual: payroll.total,
    adj_wages_for_state: adjWagesForState,
    state_effective_rate: stateEffectiveRate,
    state_tax_annual: stateTax,
    taxes_annual: taxesAnnual,
    taxes_monthly: taxesMonthly,
  };
}
