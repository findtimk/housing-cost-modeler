import { useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { computeGrid } from '../../engine/gridEngine.ts';
import type { GridCell } from '../../engine/types.ts';
import { fmtCurrency, fmtNumber } from '../shared/formatters.ts';
import { GridConfigModal } from './GridConfigModal.tsx';
import { Cog6ToothIcon } from '@heroicons/react/24/outline';

function cellColor(surplus: number, threshold: number): string {
  if (surplus < 0) return 'bg-brand-rose-light text-brand-rose';
  if (surplus < threshold) return 'bg-brand-amber-light text-brand-amber';
  return 'bg-brand-teal-light text-brand-teal-dark';
}

function hasBoundaryBelow(cells: GridCell[][], row: number, col: number): boolean {
  const current = cells[row][col].surplus_monthly;
  if (current < 0) return false;
  const below = cells[row + 1]?.[col];
  return below ? below.surplus_monthly < 0 : false;
}

function hasBoundaryRight(cells: GridCell[][], row: number, col: number): boolean {
  const current = cells[row][col].surplus_monthly;
  if (current < 0) return false;
  const right = cells[row]?.[col + 1];
  return right ? right.surplus_monthly < 0 : false;
}

export function GridView() {
  const { inputs, gridConfig, selectCell, toggleGridConfig } = useAppContext();
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number } | null>(null);

  const grid = useMemo(
    () => computeGrid(inputs, gridConfig),
    [inputs, gridConfig],
  );

  return (
    <div className="space-y-4">
      {/* Explainer Box */}
      <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm">
        <div className="flex justify-between items-start">
          <p className="text-sm text-text-secondary leading-relaxed">
            <strong className="text-brand-navy font-semibold">Find your comfort zone</strong> — each cell shows how much money you'd have left each month after mortgage, taxes, insurance, retirement, and living costs. Green means comfortable. Red means stretched too thin. Click any cell for the full breakdown.
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
                    const boundaryRight = hasBoundaryRight(grid.cells, i, j);
                    const boundaryBelow = hasBoundaryBelow(grid.cells, i, j);

                    return (
                      <td
                        key={grid.prices[j]}
                        className={`px-4 py-3 text-right font-semibold tabular-nums cursor-pointer transition-all duration-150 ${cellColor(cell.surplus_monthly, gridConfig.surplus_threshold)} ${
                          isHovered ? 'ring-2 ring-brand-navy/20 ring-inset z-10 relative' : ''
                        } ${
                          (isInHoveredRow || isInHoveredCol) && !isHovered ? 'brightness-95' : ''
                        } ${
                          boundaryRight ? 'border-r-2 border-r-brand-navy/10' : ''
                        } ${
                          boundaryBelow ? 'border-b-2 border-b-brand-navy/10' : ''
                        }`}
                        onClick={() => selectCell(cell.income, cell.price)}
                        onMouseEnter={() => setHoveredCell({ row: i, col: j })}
                        onMouseLeave={() => setHoveredCell(null)}
                        title={`Income: $${fmtNumber(income)}, Price: $${fmtNumber(grid.prices[j])}\nSurplus: ${fmtCurrency(cell.surplus_monthly)}/mo`}
                      >
                        {fmtCurrency(cell.surplus_monthly)}
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
      <div className="flex items-center gap-6 mt-4 px-2">
        <span className="text-xs font-medium text-brand-teal-dark">Comfortable</span>
        <div
          className="h-2 flex-1 rounded-full max-w-md"
          style={{ background: 'linear-gradient(to right, #ccfbf1, #fef3c7, #ffe4e6)' }}
        />
        <span className="text-xs font-medium text-brand-rose">Over Budget</span>
      </div>
      <p className="text-xs text-text-muted italic mt-2 px-2">
        Click any cell for full breakdown
      </p>

      <GridConfigModal />
    </div>
  );
}
