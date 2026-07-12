import type { FilingStatus, TaxResult } from './types.ts';
import {
  STANDARD_DEDUCTION,
  FEDERAL_BRACKETS,
  SS_RATE,
  SS_WAGE_BASE,
  MEDICARE_RATE,
  ADDL_MEDICARE_RATE,
  ADDL_MEDICARE_THRESHOLD,
  WA_PFML_EMPLOYEE_RATE,
  WA_CARES_RATE,
  STATE_EFFECTIVE_RATES,
  STATE_DEFAULT_RATE,
} from './taxConstants2026.ts';

export interface EarnerInput {
  wages: number;
  pfmlExempt?: boolean;
  waCaresExempt?: boolean;
}

export interface TaxInputs {
  filing_status: FilingStatus;
  state: string;
  earners: EarnerInput[];
  pre_tax_retirement_monthly: number;
  other_pre_tax_deductions_annual: number;
  state_effective_rate_override?: number;
}

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

/**
 * Compute payroll taxes (SS + Medicare + Additional Medicare).
 * Social Security is capped at the wage base PER EARNER.
 * Additional Medicare is a per-return tax: combined wages vs. the filing-status threshold.
 */
export function computePayrollTax(
  earnerWages: number[],
  filingStatus: FilingStatus,
): {
  ss: number;
  ssByEarner: number[];
  medicare: number;
  addlMedicare: number;
  total: number;
} {
  const ssByEarner = earnerWages.map(
    (w) => Math.min(Math.max(0, w), SS_WAGE_BASE) * SS_RATE,
  );
  const ss = ssByEarner.reduce((sum, v) => sum + v, 0);
  const combinedWages = earnerWages.reduce((sum, w) => sum + Math.max(0, w), 0);
  const medicare = combinedWages * MEDICARE_RATE;
  const addlMedicare =
    Math.max(0, combinedWages - ADDL_MEDICARE_THRESHOLD[filingStatus]) *
    ADDL_MEDICARE_RATE;
  return { ss, ssByEarner, medicare, addlMedicare, total: ss + medicare + addlMedicare };
}

/**
 * Compute WA payroll premiums (PFML + WA Cares) per earner on gross wages.
 * Returns zeros for any state other than WA.
 * PFML is capped at the Social Security wage base per employee; WA Cares has no cap.
 */
export function computeWaPremiums(
  state: string,
  earners: EarnerInput[],
): { pfml: number; waCares: number; total: number } {
  if (state !== 'WA') return { pfml: 0, waCares: 0, total: 0 };

  let pfml = 0;
  let waCares = 0;
  for (const earner of earners) {
    const wages = Math.max(0, earner.wages);
    if (!earner.pfmlExempt) {
      pfml += Math.min(wages, SS_WAGE_BASE) * WA_PFML_EMPLOYEE_RATE;
    }
    if (!earner.waCaresExempt) {
      waCares += wages * WA_CARES_RATE;
    }
  }
  return { pfml, waCares, total: pfml + waCares };
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
export function computeAllTaxes(inputs: TaxInputs): TaxResult {
  const {
    filing_status: filingStatus,
    state,
    earners,
    pre_tax_retirement_monthly: preTaxRetirementMonthly,
    other_pre_tax_deductions_annual: otherPreTaxDeductionsAnnual,
    state_effective_rate_override: stateEffectiveRateOverride,
  } = inputs;

  const wagesAnnual = earners.reduce((sum, e) => sum + Math.max(0, e.wages), 0);
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
  const payroll = computePayrollTax(
    earners.map((e) => e.wages),
    filingStatus,
  );
  const waPremiums = computeWaPremiums(state, earners);

  const adjWagesForState = Math.max(
    0,
    wagesAnnual - preTaxRetirementAnnual - otherPreTaxDeductionsAnnual,
  );
  const stateEffectiveRate = getStateEffectiveRate(
    state,
    stateEffectiveRateOverride,
  );
  const stateTax = adjWagesForState * stateEffectiveRate;

  const taxesAnnual = federalTax + payroll.total + stateTax + waPremiums.total;
  const taxesMonthly = taxesAnnual / 12;

  return {
    wages_annual: wagesAnnual,
    pre_tax_retirement_annual: preTaxRetirementAnnual,
    other_pre_tax_deductions_annual: otherPreTaxDeductionsAnnual,
    standard_deduction: standardDeduction,
    taxable_income_federal: taxableIncomeFederal,
    federal_tax_annual: federalTax,
    ss_tax_annual: payroll.ss,
    ss_tax_by_earner: payroll.ssByEarner,
    medicare_tax_annual: payroll.medicare,
    addl_medicare_tax_annual: payroll.addlMedicare,
    payroll_tax_annual: payroll.total,
    pfml_tax_annual: waPremiums.pfml,
    wa_cares_tax_annual: waPremiums.waCares,
    adj_wages_for_state: adjWagesForState,
    state_effective_rate: stateEffectiveRate,
    state_tax_annual: stateTax,
    taxes_annual: taxesAnnual,
    taxes_monthly: taxesMonthly,
  };
}
