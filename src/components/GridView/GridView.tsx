import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { computeGrid } from '../../engine/gridEngine.ts';
import { fmtCurrency, fmtNumber } from '../shared/formatters.ts';
import { GridConfigModal } from './GridConfigModal.tsx';

function cellColor(surplus: number, threshold: number): string {
  if (surplus < 0) return 'bg-red-100 text-red-800';
  if (surplus < threshold) return 'bg-yellow-50 text-yellow-800';
  return 'bg-green-100 text-green-800';
}

export function GridView() {
  const { inputs, gridConfig, selectCell, toggleGridConfig } = useAppContext();

  const grid = useMemo(
    () => computeGrid(inputs, gridConfig),
    [inputs, gridConfig],
  );

  return (
    <div className="space-y-3">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <div className="flex justify-between items-start mb-1">
          <h3 className="text-sm font-semibold text-blue-800">What This Grid Shows</h3>
          <button
            onClick={toggleGridConfig}
            className="p-1.5 text-blue-600 hover:bg-blue-100 rounded transition-colors"
            title="Grid Settings"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-blue-700">
          Each cell shows your <strong>monthly surplus</strong> (money left after all expenses)
          for a given income (rows) and home price (columns). Positive = affordable; negative = over budget.
        </p>
      </div>

      <div className="overflow-auto">
        <table className="text-xs border-collapse w-full">
          <thead>
            <tr>
              <th className="p-1.5 text-left bg-gray-100 border border-gray-200 sticky left-0 z-10">
                Income \ Price
              </th>
              {grid.prices.map((price) => (
                <th
                  key={price}
                  className="p-1.5 text-center bg-gray-100 border border-gray-200 whitespace-nowrap"
                >
                  ${fmtNumber(price)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {grid.incomes.map((income, i) => (
              <tr key={income}>
                <td className="p-1.5 font-medium bg-gray-50 border border-gray-200 whitespace-nowrap sticky left-0 z-10">
                  ${fmtNumber(income)}
                </td>
                {grid.cells[i].map((cell, j) => (
                  <td
                    key={grid.prices[j]}
                    className={`p-1.5 text-center border border-gray-200 cursor-pointer hover:ring-2 hover:ring-blue-400 transition-shadow ${cellColor(cell.surplus_monthly, gridConfig.surplus_threshold)}`}
                    onClick={() => selectCell(cell.income, cell.price)}
                    title={`Income: $${fmtNumber(income)}, Price: $${fmtNumber(grid.prices[j])}\nSurplus: ${fmtCurrency(cell.surplus_monthly)}/mo`}
                  >
                    {fmtCurrency(cell.surplus_monthly)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-1 space-y-2">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-green-100 border border-green-300"></span>
            <span className="text-gray-600">
              <strong>Green:</strong> Meets comfort buffer (surplus ≥ ${gridConfig.surplus_threshold.toLocaleString()}/mo)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-yellow-50 border border-yellow-300"></span>
            <span className="text-gray-600">
              <strong>Yellow:</strong> Below comfort buffer ($0 to ${gridConfig.surplus_threshold.toLocaleString()}/mo)
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="inline-block w-4 h-4 rounded bg-red-100 border border-red-300"></span>
            <span className="text-gray-600">
              <strong>Red:</strong> Unaffordable (negative surplus)
            </span>
          </div>
        </div>
        <p className="text-[10px] text-gray-400">
          Click any cell to see detailed breakdown of taxes, housing costs, and cash flow.
        </p>
      </div>

      <GridConfigModal />
    </div>
  );
}
