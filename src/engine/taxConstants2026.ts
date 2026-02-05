import type { FilingStatus } from './types.ts';

/** Standard deduction by filing status (Tax Year 2026) */
export const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  MFJ: 32_200,
  SINGLE: 16_100,
};

/**
 * Federal income tax brackets.
 * Each entry is [upper_cap, marginal_rate].
 * The last bracket uses Infinity as the cap.
 */
export const FEDERAL_BRACKETS: Record<FilingStatus, [number, number][]> = {
  MFJ: [
    [24_800, 0.10],
    [100_800, 0.12],
    [211_400, 0.22],
    [403_550, 0.24],
    [512_450, 0.32],
    [768_700, 0.35],
    [Infinity, 0.37],
  ],
  SINGLE: [
    [12_400, 0.10],
    [50_400, 0.12],
    [105_700, 0.22],
    [201_775, 0.24],
    [256_225, 0.32],
    [640_600, 0.35],
    [Infinity, 0.37],
  ],
};

/** Social Security employee rate */
export const SS_RATE = 0.062;

/** Social Security wage base (2026) */
export const SS_WAGE_BASE = 184_500;

/** Medicare employee rate */
export const MEDICARE_RATE = 0.0145;

/** Additional Medicare rate */
export const ADDL_MEDICARE_RATE = 0.009;

/** Additional Medicare threshold by filing status */
export const ADDL_MEDICARE_THRESHOLD: Record<FilingStatus, number> = {
  MFJ: 250_000,
  SINGLE: 200_000,
};

/**
 * State effective income tax rates (v1 simplified).
 * Applied to adj_wages_for_state.
 */
export const STATE_EFFECTIVE_RATES: Record<string, number> = {
  WA: 0,
  TX: 0,
  FL: 0,
  NV: 0,
  TN: 0,
  WY: 0,
  SD: 0,
  AK: 0,
  NH: 0,
  CA: 0.093,
  NY: 0.0685,
  NJ: 0.0637,
  OR: 0.09,
  HI: 0.0825,
  MN: 0.0785,
  CT: 0.0699,
  IL: 0.0495,
  MA: 0.05,
  CO: 0.044,
  PA: 0.0307,
};

/** Default rate for unlisted states */
export const STATE_DEFAULT_RATE = 0.05;
