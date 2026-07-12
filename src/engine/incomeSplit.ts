/**
 * Split a total income between two earners in the same proportion as the
 * base scenario's earner wages. Falls back to 50/50 when both are zero.
 * Used when a grid cell (single income number) feeds the per-earner
 * scenario detail view.
 */
export function splitIncome(
  total: number,
  earner1Base: number,
  earner2Base: number,
): [number, number] {
  const e1 = Math.max(0, earner1Base);
  const e2 = Math.max(0, earner2Base);
  const baseTotal = e1 + e2;
  if (baseTotal <= 0) return [total / 2, total / 2];
  const share1 = e1 / baseTotal;
  return [total * share1, total * (1 - share1)];
}
