import { useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { computeGrid } from '../../engine/gridEngine.ts';
import { computeHousingCosts } from '../../engine/housingEngine.ts';
import type { GridCell } from '../../engine/types.ts';
import {
  fmtCompactCurrency,
  fmtCurrency,
  fmtNumber,
  fmtPercent,
} from '../shared/formatters.ts';
import { GridConfigModal } from './GridConfigModal.tsx';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

type GridMetric = 'surplus' | 'pitia' | 'all_in';

const GRID_METRICS: { id: GridMetric; label: string }[] = [
  { id: 'surplus', label: 'Surplus' },
  { id: 'pitia', label: 'PITIA' },
  { id: 'all_in', label: 'All-in' },
];

const COLORS = {
  tealText: '#0f766e',
  tealSoft: '#ecfdf5',
  tealStrong: '#99f6e4',
  amberText: '#d97706',
  amberSoft: '#fef3c7',
  amberStrong: '#fde68a',
  roseText: '#e11d48',
  roseSoft: '#fff1f2',
  roseStrong: '#fecdd3',
};

function clamp(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function hexToRgb(hex: string): [number, number, number] {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b]
    .map((channel) => Math.round(channel).toString(16).padStart(2, '0'))
    .join('')}`;
}

function mixColor(from: string, to: string, amount: number): string {
  const start = hexToRgb(from);
  const end = hexToRgb(to);
  const t = clamp(amount);
  return rgbToHex([
    start[0] + (end[0] - start[0]) * t,
    start[1] + (end[1] - start[1]) * t,
    start[2] + (end[2] - start[2]) * t,
  ]);
}

/**
 * Fixed color anchor: cells reach full teal/rose at ±this monthly surplus,
 * so the same surplus gets the same color regardless of grid range.
 */
const SURPLUS_SCALE_REF = 5_000;

const DIVERGING = {
  neutral: '#fafaf9',
  teal: '#5eead4',
  rose: '#fda4af',
  ink: '#334155',
};

function getSurplusStyle(surplus: number, threshold: number) {
  const intensity = clamp(Math.abs(surplus) / SURPLUS_SCALE_REF);
  const backgroundColor =
    surplus >= 0
      ? mixColor(DIVERGING.neutral, DIVERGING.teal, intensity)
      : mixColor(DIVERGING.neutral, DIVERGING.rose, intensity);

  const style: CSSProperties = { backgroundColor, color: DIVERGING.ink };
  if (threshold > 0 && surplus >= 0 && surplus < threshold) {
    style.boxShadow = `inset 0 -3px 0 0 ${COLORS.amberText}`;
  }
  return style;
}

function getRatioStyle(ratio: number) {
  if (ratio <= 0.28) {
    return {
      backgroundColor: mixColor(COLORS.tealStrong, COLORS.tealSoft, ratio / 0.28),
      color: COLORS.tealText,
    };
  }

  if (ratio <= 0.36) {
    return {
      backgroundColor: mixColor(COLORS.amberSoft, COLORS.amberStrong, (ratio - 0.28) / 0.08),
      color: COLORS.amberText,
    };
  }

  return {
    backgroundColor: mixColor(COLORS.roseSoft, COLORS.roseStrong, (ratio - 0.36) / 0.14),
    color: COLORS.roseText,
  };
}

function getMetricValue(cell: GridCell, metric: GridMetric): number {
  if (metric === 'pitia') return cell.pitia_ratio;
  if (metric === 'all_in') return cell.all_in_ratio;
  return cell.surplus_monthly;
}

function getCellStyle(cell: GridCell, metric: GridMetric, threshold: number) {
  if (metric === 'surplus') {
    return getSurplusStyle(cell.surplus_monthly, threshold);
  }

  return getRatioStyle(getMetricValue(cell, metric));
}

function formatCellValue(cell: GridCell, metric: GridMetric): string {
  if (metric === 'surplus') return fmtCurrency(cell.surplus_monthly);
  return fmtPercent(getMetricValue(cell, metric));
}

function formatSecondaryValue(cell: GridCell, metric: GridMetric): string {
  if (metric === 'surplus') return `${fmtPercent(cell.pitia_ratio)} PITIA`;
  return fmtCurrency(cell.surplus_monthly);
}

export function GridView() {
  const { inputs, gridConfig, selectCell, toggleGridConfig } = useAppContext();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);
  const [metric, setMetric] = useState<GridMetric>('surplus');

  const grid = useMemo(
    () => computeGrid(inputs, gridConfig),
    [inputs, gridConfig],
  );

  // Marginal housing cost of one price step — exact and constant because
  // every price-driven cost (P&I, tax, insurance, maintenance) is linear in price.
  const marginalCostPerStep = useMemo(
    () =>
      computeHousingCosts(
        gridConfig.price_step,
        inputs.down_payment_pct,
        inputs.apr,
        inputs.term_years,
        inputs.property_tax_rate_annual,
        inputs.insurance_rate_annual,
        inputs.maintenance_rate_annual,
        0,
      ).housing_total_monthly,
    [inputs, gridConfig.price_step],
  );

  const currentHouseholdIncome =
    inputs.earner1_wages_annual + inputs.earner2_wages_annual;

  return (
    <div className="h-full min-h-0 flex flex-col gap-3">
      <div className="bg-white border border-border-subtle rounded-xl px-4 py-3 shadow-sm shrink-0">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-text-secondary leading-snug min-w-[260px] flex-1">
            <strong className="text-brand-navy font-semibold">Find your comfort zone</strong>
            {' '}— each +{fmtCompactCurrency(gridConfig.price_step)} of price costs{' '}
            <strong className="text-brand-navy font-semibold">
              ≈ {fmtCurrency(marginalCostPerStep)}/mo
            </strong>.
          </p>
          <div className="inline-flex bg-surface-warm rounded-xl p-1 border border-border-subtle">
          {GRID_METRICS.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                metric === item.id
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-warm'
              }`}
              onClick={() => setMetric(item.id)}
            >
              {item.label}
            </button>
          ))}
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-text-muted whitespace-nowrap">
              {metric === 'surplus'
                ? `Target: ${fmtCurrency(gridConfig.surplus_threshold)}/mo`
                : 'Green <= 28% PITIA guideline'}
            </div>
            <button
              onClick={toggleGridConfig}
              className="p-2 rounded-lg hover:bg-surface-warm text-text-secondary hover:text-brand-navy transition-colors shrink-0"
              title="Grid Settings"
            >
              <Cog6ToothIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-border-subtle shadow-sm overflow-hidden shrink-0">
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr>
                <th className="px-4 py-2 text-left bg-surface-sidebar text-xs font-semibold uppercase text-text-secondary sticky left-0 top-0 z-30 border-b border-r border-border-subtle">
                  Income \ Price
                </th>
                {grid.prices.map((price, j) => (
                  <th
                    key={price}
                    className={`px-4 py-2 text-right bg-surface-sidebar text-xs font-semibold text-text-secondary whitespace-nowrap border-b border-border-subtle sticky top-0 z-20 ${
                      hoveredCell?.col === j ? 'bg-brand-navy/[0.03]' : ''
                    }`}
                  >
                    ${fmtNumber(price)}
                  </th>
                ))}
              </tr>
              <tr>
                <th className="px-4 py-1.5 text-left bg-surface-sidebar text-[10px] font-semibold uppercase tracking-wider text-text-muted sticky left-0 z-30 border-b border-r border-border-subtle">
                  Works down to
                </th>
                {grid.break_even_incomes.map((breakEven, j) => (
                  <th
                    key={grid.prices[j]}
                    className={`px-4 py-1.5 text-right bg-surface-sidebar text-[11px] font-medium text-text-muted whitespace-nowrap border-b border-border-subtle ${
                      hoveredCell?.col === j ? 'bg-brand-navy/[0.03]' : ''
                    }`}
                    title={`Minimum household income where surplus stays ≥ $0 at this price`}
                  >
                    {Number.isFinite(breakEven) ? (
                      <>
                        {fmtCompactCurrency(breakEven)}
                        {currentHouseholdIncome > 0 && (
                          <span className="ml-1 opacity-70">
                            ({breakEven <= currentHouseholdIncome ? '−' : '+'}
                            {Math.abs(
                              Math.round(
                                ((breakEven - currentHouseholdIncome) /
                                  currentHouseholdIncome) *
                                  100,
                              ),
                            )}
                            %)
                          </span>
                        )}
                      </>
                    ) : (
                      '—'
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.incomes.map((income, i) => (
                <tr key={income}>
                  <td className={`px-4 py-2 font-semibold bg-surface-sidebar text-sm text-brand-navy whitespace-nowrap sticky left-0 z-10 border-r border-border-subtle ${
                    hoveredCell?.row === i ? 'bg-brand-navy/[0.03]' : ''
                  }`}>
                    ${fmtNumber(income)}
                  </td>
                  {grid.cells[i].map((cell, j) => {
                    const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;
                    const isInHoveredRow = hoveredCell?.row === i;
                    const isInHoveredCol = hoveredCell?.col === j;
                    const cellStyle = getCellStyle(
                      cell,
                      metric,
                      gridConfig.surplus_threshold,
                    );

                    return (
                      <td
                        key={grid.prices[j]}
                        className={`px-4 py-2 text-right font-semibold tabular-nums cursor-pointer transition-all duration-150 ${
                          isHovered ? 'ring-2 ring-brand-navy/20 ring-inset z-10 relative' : ''
                        } ${
                          (isInHoveredRow || isInHoveredCol) && !isHovered ? 'brightness-95' : ''
                        }`}
                        style={cellStyle}
                        onClick={() => selectCell(cell.income, cell.price)}
                        onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`Income: $${fmtNumber(income)}, Price: $${fmtNumber(grid.prices[j])}\nSurplus: ${fmtCurrency(cell.surplus_monthly)}/mo\nPITIA: ${fmtPercent(cell.pitia_ratio)}\nAll-in: ${fmtPercent(cell.all_in_ratio)}`}
                      >
                        <div>{formatCellValue(cell, metric)}</div>
                        <div className="hidden xl:block text-[10px] font-medium opacity-70">
                          {formatSecondaryValue(cell, metric)}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend */}
      <div className="px-2 max-w-xl shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-brand-teal-dark">
            {metric === 'surplus' ? 'More cushion' : 'Lower ratio'}
          </span>
          <div
            className="h-2 flex-1 rounded-full"
            style={{
              background:
                metric === 'surplus'
                  ? `linear-gradient(to right, ${DIVERGING.teal}, ${DIVERGING.neutral}, ${DIVERGING.rose})`
                  : 'linear-gradient(to right, #99f6e4, #ecfdf5, #fef3c7, #fde68a, #fff1f2, #fecdd3)',
            }}
          />
          <span className="text-xs font-medium text-brand-rose">
            {metric === 'surplus' ? 'Over budget' : 'Higher ratio'}
          </span>
        </div>
        <div className="flex justify-between text-[11px] text-text-muted mt-1">
          {metric === 'surplus' ? (
            <>
              <span>+{fmtCompactCurrency(SURPLUS_SCALE_REF)}/mo or more</span>
              <span>$0/mo</span>
              <span>−{fmtCompactCurrency(SURPLUS_SCALE_REF)}/mo or less</span>
            </>
          ) : (
            <>
              <span>28%</span>
              <span>36%</span>
              <span>Stretched</span>
            </>
          )}
        </div>
        {metric === 'surplus' && gridConfig.surplus_threshold > 0 && (
          <div className="flex items-center gap-2 text-[11px] text-text-muted mt-1">
            <span
              className="inline-block w-4 h-1 rounded-sm"
              style={{ backgroundColor: COLORS.amberText }}
            />
            <span>
              underline = positive but below your{' '}
              {fmtCurrency(gridConfig.surplus_threshold)}/mo target
            </span>
          </div>
        )}
      </div>
      <p className="text-xs text-text-muted italic px-2 shrink-0">
        Click any cell for full breakdown. Income rows are household income;
        the grid applies your income profile split for per-earner payroll taxes.
      </p>

      <GridConfigModal />
    </div>
  );
}
