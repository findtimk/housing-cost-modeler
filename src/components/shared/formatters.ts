/** Format as currency string rounded to nearest dollar. */
export function fmtCurrency(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(value));
}

/** Format as currency with cents. */
export function fmtCurrencyExact(value: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

/** Format as percent (0.2187 → "22%"). */
export function fmtPercent(ratio: number): string {
  return `${Math.round(ratio * 100)}%`;
}

/** Format as percent with 1 decimal (0.2187 → "21.9%"). */
export function fmtPercentExact(ratio: number): string {
  return `${(ratio * 100).toFixed(1)}%`;
}

/** Format a rate input as percent string (0.065 → "6.5%"). */
export function fmtRate(rate: number): string {
  return `${(rate * 100).toFixed(1)}%`;
}

/** Format large number with commas. */
export function fmtNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}
