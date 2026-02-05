import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { computeScenario } from '../../engine/cashflowEngine.ts';
import { fmtCurrency, fmtPercent, fmtNumber } from '../shared/formatters.ts';

function KPI({ label, value, subtext, negative }: { label: string; value: string; subtext?: string; negative?: boolean }) {
  return (
    <div className={`rounded-lg p-4 ${negative ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
      <div className="text-xs text-gray-500 uppercase tracking-wide">{label}</div>
      <div className={`text-2xl font-bold mt-1 ${negative ? 'text-red-700' : 'text-green-700'}`}>{value}</div>
      {subtext && <div className="text-xs text-gray-500 mt-0.5">{subtext}</div>}
    </div>
  );
}

function BreakdownRow({ label, value, indent }: { label: string; value: string; indent?: boolean }) {
  return (
    <div className={`flex justify-between py-0.5 text-sm ${indent ? 'pl-4 text-gray-500' : 'text-gray-700'}`}>
      <span>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

export function ScenarioView() {
  const { inputs, selectedCell, toggleAudit } = useAppContext();

  if (!selectedCell) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
        Click a cell in the Grid view to see scenario details.
      </div>
    );
  }

  const scenarioInputs = useMemo(() => {
    return { ...inputs, hhi_annual: selectedCell.income, home_price: selectedCell.price };
  }, [inputs, selectedCell]);

  const result = useMemo(() => computeScenario(scenarioInputs), [scenarioInputs]);

  const surplus = result.surplus_monthly;

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-sm font-bold text-gray-800">
          Scenario: ${fmtNumber(scenarioInputs.hhi_annual)} income, ${fmtNumber(scenarioInputs.home_price)} home
        </h2>
        <button
          onClick={toggleAudit}
          className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded border border-gray-300"
        >
          Show Math
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <KPI
          label="Monthly Surplus"
          value={fmtCurrency(surplus)}
          subtext="/month"
          negative={surplus < 0}
        />
        <KPI
          label="Total Housing"
          value={fmtCurrency(result.housing.housing_total_monthly)}
          subtext="/month"
        />
        <KPI
          label="Front-end Ratio"
          value={fmtPercent(result.front_end_ratio)}
          subtext="housing / gross"
          negative={result.front_end_ratio > 0.28}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Housing Costs</h3>
          <BreakdownRow label="Mortgage P&I" value={fmtCurrency(result.housing.pi_monthly)} indent />
          <BreakdownRow label="Property Tax" value={fmtCurrency(result.housing.property_tax_monthly)} indent />
          <BreakdownRow label="Insurance" value={fmtCurrency(result.housing.insurance_monthly)} indent />
          <BreakdownRow label="Maintenance" value={fmtCurrency(result.housing.maintenance_monthly)} indent />
          <BreakdownRow label="HOA" value={fmtCurrency(result.housing.hoa_monthly)} indent />
          <div className="border-t border-gray-200 mt-1 pt-1">
            <BreakdownRow label="Total Housing" value={fmtCurrency(result.housing.housing_total_monthly)} />
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-3">
          <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Taxes</h3>
          <BreakdownRow label="Federal Income Tax" value={fmtCurrency(result.tax.federal_tax_annual / 12)} indent />
          <BreakdownRow label="Social Security" value={fmtCurrency(result.tax.ss_tax_annual / 12)} indent />
          <BreakdownRow label="Medicare" value={fmtCurrency(result.tax.medicare_tax_annual / 12)} indent />
          <BreakdownRow label="Addl. Medicare" value={fmtCurrency(result.tax.addl_medicare_tax_annual / 12)} indent />
          <BreakdownRow label="State Tax" value={fmtCurrency(result.tax.state_tax_annual / 12)} indent />
          <div className="border-t border-gray-200 mt-1 pt-1">
            <BreakdownRow label="Total Taxes" value={fmtCurrency(result.tax.taxes_monthly)} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-3">
        <h3 className="text-xs font-semibold text-gray-600 uppercase mb-2">Cash Flow</h3>
        <BreakdownRow label="Gross Income" value={fmtCurrency(result.gross_monthly)} />
        <BreakdownRow label="− Taxes" value={fmtCurrency(result.tax.taxes_monthly)} indent />
        <BreakdownRow label="= Net Pay" value={fmtCurrency(result.net_pay_monthly)} />
        <BreakdownRow label="− Pre-tax Retirement" value={fmtCurrency(result.inputs.pre_tax_retirement_monthly)} indent />
        <BreakdownRow label="− After-tax Retirement" value={fmtCurrency(result.after_tax_retirement_monthly)} indent />
        <BreakdownRow label="− Living Expenses" value={fmtCurrency(result.living_expenses_monthly)} indent />
        <BreakdownRow label="− Housing" value={fmtCurrency(result.housing.housing_total_monthly)} indent />
        <div className="border-t border-gray-200 mt-1 pt-1">
          <BreakdownRow label="= Monthly Surplus" value={fmtCurrency(surplus)} />
        </div>
      </div>
    </div>
  );
}
