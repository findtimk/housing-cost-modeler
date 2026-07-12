import { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { computeGrid } from '../../engine/gridEngine.ts';
import type { GridCell } from '../../engine/types.ts';
import { fmtCurrency, fmtNumber, fmtPercent } from '../shared/formatters.ts';
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

function getSurplusStyle(
  surplus: number,
  threshold: number,
  maxDeficit: number,
  maxSurplusAboveTarget: number,
) {
  if (surplus < 0) {
    return {
      backgroundColor: mixColor(
        COLORS.roseSoft,
        COLORS.roseStrong,
        Math.abs(surplus) / Math.max(1, maxDeficit),
      ),
      color: COLORS.roseText,
    };
  }

  if (threshold > 0 && surplus < threshold) {
    return {
      backgroundColor: mixColor(
        COLORS.amberStrong,
        COLORS.amberSoft,
        surplus / threshold,
      ),
      color: COLORS.amberText,
    };
  }

  return {
    backgroundColor: mixColor(
      COLORS.tealSoft,
      COLORS.tealStrong,
      (surplus - Math.max(0, threshold)) / Math.max(1, maxSurplusAboveTarget),
    ),
    color: COLORS.tealText,
  };
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

function getCellStyle(
  cell: GridCell,
  metric: GridMetric,
  threshold: number,
  maxDeficit: number,
  maxSurplusAboveTarget: number,
) {
  if (metric === 'surplus') {
    return getSurplusStyle(
      cell.surplus_monthly,
      threshold,
      maxDeficit,
      maxSurplusAboveTarget,
    );
  }

  return getRatioStyle(getMetricValue(cell, metric));
}

function isPassing(cell: GridCell, metric: GridMetric, threshold: number): boolean {
  if (metric === 'surplus') return cell.surplus_monthly >= threshold;
  return getMetricValue(cell, metric) <= 0.28;
}

function hasBoundaryBelow(
  cells: GridCell[][],
  row: number,
  col: number,
  metric: GridMetric,
  threshold: number,
): boolean {
  const current = cells[row][col];
  if (!isPassing(current, metric, threshold)) return false;
  const below = cells[row + 1]?.[col];
  return below ? !isPassing(below, metric, threshold) : false;
}

function hasBoundaryRight(
  cells: GridCell[][],
  row: number,
  col: number,
  metric: GridMetric,
  threshold: number,
): boolean {
  const current = cells[row][col];
  if (!isPassing(current, metric, threshold)) return false;
  const right = cells[row]?.[col + 1];
  return right ? !isPassing(right, metric, threshold) : false;
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

  const colorScale = useMemo(() => {
    const cells = grid.cells.flat();
    return {
      maxDeficit: Math.max(
        1,
        ...cells.map((cell) => Math.max(0, -cell.surplus_monthly)),
      ),
      maxSurplusAboveTarget: Math.max(
        1,
        ...cells.map((cell) =>
          Math.max(0, cell.surplus_monthly - Math.max(0, gridConfig.surplus_threshold)),
        ),
      ),
    };
  }, [grid.cells, gridConfig.surplus_threshold]);

  return (
    <div className="space-y-4">
      {/* Explainer Box */}
      <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="text-sm text-text-secondary leading-relaxed">
            <strong className="text-brand-navy font-semibold">Find your comfort zone</strong> — each cell shows how much money you'd have left each month after mortgage, taxes, insurance, retirement, and living costs. Green means the surplus meets your target. Red means over budget. Click any cell for the full breakdown.
          </p>
          <button
            onClick={toggleGridConfig}
            className="p-2 rounded-lg hover:bg-surface-warm text-text-secondary hover:text-brand-navy transition-colors ml-3 shrink-0"
            title="Grid Settings"
          >
            <Cog6ToothIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-border-subtle">
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
        <div className="text-xs text-text-muted">
          {metric === 'surplus'
            ? `Target: ${fmtCurrency(gridConfig.surplus_threshold)}/mo`
            : 'Green <= 28% PITIA guideline'}
        </div>
      </div>

      {/* Grid Table */}
      <div className="bg-white rounded-xl border border-border-subtle shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="text-sm border-collapse w-full">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left bg-surface-sidebar text-xs font-semibold uppercase text-text-secondary sticky left-0 z-20 border-b border-r border-border-subtle">
                  Income \ Price
                </th>
                {grid.prices.map((price, j) => (
                  <th
                    key={price}
                    className={`px-4 py-3 text-right bg-surface-sidebar text-xs font-semibold text-text-secondary whitespace-nowrap border-b border-border-subtle ${
                      hoveredCell?.col === j ? 'bg-brand-navy/[0.03]' : ''
                    }`}
                  >
                    ${fmtNumber(price)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {grid.incomes.map((income, i) => (
                <tr key={income}>
                  <td className={`px-4 py-3 font-semibold bg-surface-sidebar text-sm text-brand-navy whitespace-nowrap sticky left-0 z-10 border-r border-border-subtle ${
                    hoveredCell?.row === i ? 'bg-brand-navy/[0.03]' : ''
                  }`}>
                    ${fmtNumber(income)}
                  </td>
                  {grid.cells[i].map((cell, j) => {
                    const isHovered = hoveredCell?.row === i && hoveredCell?.col === j;
                    const isInHoveredRow = hoveredCell?.row === i;
                    const isInHoveredCol = hoveredCell?.col === j;
                    const boundaryRight = hasBoundaryRight(
                      grid.cells,
                      i,
                      j,
                      metric,
                      gridConfig.surplus_threshold,
                    );
                    const boundaryBelow = hasBoundaryBelow(
                      grid.cells,
                      i,
                      j,
                      metric,
                      gridConfig.surplus_threshold,
                    );
                    const cellStyle = getCellStyle(
                      cell,
                      metric,
                      gridConfig.surplus_threshold,
                      colorScale.maxDeficit,
                      colorScale.maxSurplusAboveTarget,
                    );

                    return (
                      <td
                        key={grid.prices[j]}
                        className={`px-4 py-3 text-right font-semibold tabular-nums cursor-pointer transition-all duration-150 ${
                          isHovered ? 'ring-2 ring-brand-navy/20 ring-inset z-10 relative' : ''
                        } ${
                          (isInHoveredRow || isInHoveredCol) && !isHovered ? 'brightness-95' : ''
                        } ${
                          boundaryRight ? 'border-r-2 border-r-brand-navy/10' : ''
                        } ${
                          boundaryBelow ? 'border-b-2 border-b-brand-navy/10' : ''
                        }`}
                        style={cellStyle}
                        onClick={() => selectCell(cell.income, cell.price)}
                        onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`Income: $${fmtNumber(income)}, Price: $${fmtNumber(grid.prices[j])}\nSurplus: ${fmtCurrency(cell.surplus_monthly)}/mo\nPITIA: ${fmtPercent(cell.pitia_ratio)}\nAll-in: ${fmtPercent(cell.all_in_ratio)}`}
                      >
                        <div>{formatCellValue(cell, metric)}</div>
                        <div className="hidden xl:block text-[11px] font-medium opacity-70 mt-0.5">
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
      <div className="mt-4 px-2 max-w-xl">
        <div className="flex items-center gap-4">
          <span className="text-xs font-medium text-brand-teal-dark">
            {metric === 'surplus' ? 'More cushion' : 'Lower ratio'}
          </span>
          <div
            className="h-2 flex-1 rounded-full"
            style={{
              background:
                metric === 'surplus'
                  ? 'linear-gradient(to right, #99f6e4, #ecfdf5, #fef3c7, #fff1f2, #fecdd3)'
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
              <span>Meets target</span>
              <span>$0/mo</span>
              <span>Negative surplus</span>
            </>
          ) : (
            <>
              <span>28%</span>
              <span>36%</span>
              <span>Stretched</span>
            </>
          )}
        </div>
      </div>
      <p className="text-xs text-text-muted italic mt-2 px-2">
        Click any cell for full breakdown. The grid uses a simplified
        single-earner tax estimate; the detail view splits income across
        earners, so its numbers may differ slightly.
      </p>

      <GridConfigModal />
    </div>
  );
}
