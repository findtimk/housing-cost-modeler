import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import {
  computeBreakEvenIncome,
  computeScenario,
} from '../../engine/cashflowEngine.ts';
import { splitIncome } from '../../engine/incomeSplit.ts';
import {
  computeExpenseBucketTotal,
  getActiveExpenseScenario,
  isCategoryExpenseMode,
} from '../../engine/expenseBuilder.ts';
import {
  fmtCompactCurrency,
  fmtCurrency,
  fmtPercent,
} from '../shared/formatters.ts';
import {
  ArrowLeftIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  CalculatorIcon,
} from '@heroicons/react/24/solid';

function VerdictBadge({ surplus, threshold }: { surplus: number; threshold: number }) {
  if (surplus < 0) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-rose-light border border-brand-rose/20 text-brand-rose text-xs font-semibold mt-2">
        <XCircleIcon className="w-4 h-4" />
        Over budget
      </span>
    );
  }
  if (surplus < threshold) {
    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-amber-light border border-brand-amber/20 text-brand-amber text-xs font-semibold mt-2">
        <ExclamationTriangleIcon className="w-4 h-4" />
        Tight but possible
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-brand-teal-light border border-brand-teal/20 text-brand-teal-dark text-xs font-semibold mt-2">
      <CheckCircleIcon className="w-4 h-4" />
      Cash flow clears your target
    </span>
  );
}

function KPI({
  label,
  value,
  subtext,
  secondaryText,
  accentColor,
}: {
  label: string;
  value: string;
  subtext?: string;
  secondaryText?: string;
  accentColor: string;
}) {
  return (
    <div
      className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm"
      style={{ borderTopWidth: '4px', borderTopColor: accentColor }}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary mb-1">{label}</div>
      <div className="text-4xl font-bold tabular-nums" style={{ color: accentColor }}>{value}</div>
      {subtext && <div className="text-sm text-text-secondary mt-0.5">{subtext}</div>}
      {secondaryText && <div className="text-xs text-text-muted italic mt-1">{secondaryText}</div>}
    </div>
  );
}

function MoneyFlowChart({ result }: { result: ReturnType<typeof computeScenario> }) {
  const gross = result.gross_monthly;
  const taxes = result.tax.taxes_monthly;
  const retirement = result.inputs.pre_tax_retirement_monthly + result.after_tax_retirement_monthly;
  const housing = result.housing.housing_total_monthly;
  const living = result.living_expenses_monthly;
  const surplus = Math.max(0, result.surplus_monthly);

  const items = [
    { label: 'Taxes', value: taxes, color: '#94a3b8' },
    { label: 'Housing', value: housing, color: '#1a2b4a' },
    { label: 'Living', value: living, color: '#64748b' },
    { label: 'Savings', value: retirement, color: '#0d9488' },
    { label: 'Left Over', value: surplus, color: '#ccfbf1', border: '#0d9488' },
  ].filter(item => item.value > 0);

  return (
    <div className="bg-white border border-border-subtle rounded-xl p-5 shadow-sm">
      <h3 className="text-sm font-semibold text-brand-navy mb-4">Where Your Money Goes</h3>
      <div className="flex h-8 rounded-full overflow-hidden">
        {items.map((item) => (
          <div
            key={item.label}
            className="relative"
            style={{
              width: `${(item.value / gross) * 100}%`,
              backgroundColor: item.color,
              borderRight: item.border ? `2px solid ${item.border}` : undefined,
            }}
            title={`${item.label}: ${fmtCurrency(item.value)} (${Math.round((item.value / gross) * 100)}%)`}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-6 gap-y-2 mt-3">
        {items.map((item) => (
          <div key={item.label} className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color, border: item.border ? `1px solid ${item.border}` : undefined }}
            />
            <span className="text-xs text-text-secondary">
              {item.label} {fmtCurrency(item.value)} ({Math.round((item.value / gross) * 100)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function BreakdownRow({
  label,
  value,
  indent,
  highlight,
}: {
  label: string;
  value: string;
  indent?: boolean;
  highlight?: boolean;
}) {
  return (
    <div
      className={`flex justify-between py-1.5 text-sm ${
        indent ? 'pl-4 text-text-secondary' : highlight ? 'text-brand-navy font-semibold' : 'text-text-primary font-semibold'
      }`}
    >
      <span>{label}</span>
      <span className={`tabular-nums ${highlight ? 'font-bold' : indent ? '' : 'font-bold'}`}>{value}</span>
    </div>
  );
}

function ExpenseBucketSummary({ result }: { result: ReturnType<typeof computeScenario> }) {
  if (!isCategoryExpenseMode(result.inputs.expense_builder)) return null;

  const scenario = getActiveExpenseScenario(result.inputs.expense_builder);
  if (!scenario) return null;

  return (
    <div className="ml-4 my-1 rounded-lg bg-surface-warm border border-border-subtle px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wider text-text-muted mb-1">
        Built from categories
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
        {scenario.buckets.map((bucket) => {
          const total = computeExpenseBucketTotal(bucket);
          if (total <= 0) return null;
          return (
            <div key={bucket.id} className="flex justify-between py-0.5 text-xs text-text-secondary">
              <span>{bucket.label}</span>
              <span className="tabular-nums font-semibold text-text-primary">{fmtCurrency(total)}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScenarioView() {
  const { inputs, selectedCell, gridConfig, toggleAudit, setActiveView } = useAppContext();

  // Hooks must run unconditionally, so the "no cell selected" return comes after them.
  const scenarioInputs = useMemo(() => {
    if (!selectedCell) return inputs;
    const [earner1, earner2] = splitIncome(
      selectedCell.income,
      inputs.earner1_wages_annual,
      inputs.earner2_wages_annual,
    );
    return {
      ...inputs,
      earner1_wages_annual: earner1,
      earner2_wages_annual: earner2,
      home_price: selectedCell.price,
    };
  }, [inputs, selectedCell]);

  const result = useMemo(() => computeScenario(scenarioInputs), [scenarioInputs]);

  const breakEvenIncome = useMemo(
    () =>
      computeBreakEvenIncome(scenarioInputs, result.housing.housing_total_monthly),
    [scenarioInputs, result.housing.housing_total_monthly],
  );

  if (!selectedCell) {
    return (
      <div className="flex items-center justify-center h-64 text-text-muted text-sm">
        Click a cell in the Grid view to see scenario details.
      </div>
    );
  }

  const surplus = result.surplus_monthly;
  const threshold = gridConfig.surplus_threshold;
  const householdIncome =
    scenarioInputs.earner1_wages_annual + scenarioInputs.earner2_wages_annual;
  // Matches the "Take-home Pay" line in the Cash Flow card below.
  const takeHomeMonthly =
    result.gross_monthly -
    result.inputs.pre_tax_retirement_monthly -
    result.tax.taxes_monthly;
  const totalSpendMonthly =
    result.living_expenses_monthly + result.housing.housing_total_monthly;

  // Determine accent colors based on values
  const surplusColor = surplus < 0 ? '#e11d48' : surplus < threshold ? '#d97706' : '#0d9488';
  const ratioColor = result.pitia_ratio > 0.36 ? '#e11d48' : result.pitia_ratio > 0.28 ? '#d97706' : '#0d9488';

  return (
    <div className="space-y-6">
      {/* Back Link */}
      <button
        onClick={() => setActiveView('grid')}
        className="flex items-center gap-1 text-sm font-medium text-brand-teal hover:text-brand-teal-dark transition-colors"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        Back to Grid
      </button>

      {/* Header */}
      <div>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold text-brand-navy">
              {fmtCompactCurrency(householdIncome)} income · {fmtCompactCurrency(scenarioInputs.home_price)} home
            </h2>
            <VerdictBadge surplus={surplus} threshold={threshold} />
            {Number.isFinite(breakEvenIncome) && householdIncome > 0 && (
              <p className="text-xs text-text-muted mt-1.5">
                {breakEvenIncome <= householdIncome
                  ? 'Works down to '
                  : 'Needs at least '}
                {fmtCompactCurrency(breakEvenIncome)} household income (
                {breakEvenIncome <= householdIncome ? '−' : '+'}
                {Math.abs(
                  Math.round(
                    ((breakEvenIncome - householdIncome) / householdIncome) * 100,
                  ),
                )}
                % vs this scenario)
              </p>
            )}
          </div>
          <button
            onClick={toggleAudit}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-secondary border border-border-subtle rounded-lg px-3 py-1.5 bg-white hover:bg-surface-warm hover:text-brand-navy transition-colors"
          >
            <CalculatorIcon className="w-4 h-4" />
            Show Calculations
          </button>
        </div>
      </div>

      {/* Hero Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPI
          label="Money Left Over"
          value={fmtCurrency(surplus)}
          subtext={
            surplus > 0 && takeHomeMonthly > 0
              ? `/month · ${fmtPercent(surplus / takeHomeMonthly)} of take-home`
              : '/month'
          }
          secondaryText={
            surplus > 0 && totalSpendMonthly > 0
              ? `≈ ${((surplus * 12) / totalSpendMonthly).toFixed(1)} months of expenses saved per year`
              : undefined
          }
          accentColor={surplusColor}
        />
        <KPI
          label="Total Housing Cost"
          value={fmtCurrency(result.housing.housing_total_monthly)}
          subtext="/month"
          accentColor="#1a2b4a"
        />
        <KPI
          label="Housing Ratio (PITIA)"
          value={fmtPercent(result.pitia_ratio)}
          subtext={`All-in incl. maintenance: ${fmtPercent(result.all_in_ratio)}`}
          secondaryText="28% front-end / 36% back-end is a common lender rule of thumb for PITIA. This app's verdict is based on your monthly surplus instead."
          accentColor={ratioColor}
        />
      </div>

      {/* Money Flow Chart */}
      <MoneyFlowChart result={result} />

      {/* Detail Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-xl border border-border-subtle p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4 pb-2 border-b border-border-subtle">Housing Costs</h3>
          <BreakdownRow label="Mortgage P&I" value={fmtCurrency(result.housing.pi_monthly)} indent />
          <BreakdownRow label="Property Tax" value={fmtCurrency(result.housing.property_tax_monthly)} indent />
          <BreakdownRow label="Insurance" value={fmtCurrency(result.housing.insurance_monthly)} indent />
          <BreakdownRow label="Maintenance" value={fmtCurrency(result.housing.maintenance_monthly)} indent />
          <BreakdownRow label="HOA" value={fmtCurrency(result.housing.hoa_monthly)} indent />
          <div className="border-t border-border-subtle mt-2 pt-3">
            <BreakdownRow label="Total Housing" value={fmtCurrency(result.housing.housing_total_monthly)} />
          </div>
          {scenarioInputs.down_payment_pct < 0.2 && (
            <p className="text-xs text-brand-amber mt-2">
              Down payment is below 20% — PMI isn't modeled, so actual costs
              will be higher than shown.
            </p>
          )}
        </div>

        <div className="bg-white rounded-xl border border-border-subtle p-5 shadow-sm">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4 pb-2 border-b border-border-subtle">Taxes</h3>
          <BreakdownRow label="Federal Income Tax" value={fmtCurrency(result.tax.federal_tax_annual / 12)} indent />
          <BreakdownRow label="Social Security" value={fmtCurrency(result.tax.ss_tax_annual / 12)} indent />
          <BreakdownRow label="Medicare" value={fmtCurrency(result.tax.medicare_tax_annual / 12)} indent />
          <BreakdownRow label="Addl. Medicare" value={fmtCurrency(result.tax.addl_medicare_tax_annual / 12)} indent />
          <BreakdownRow label="State Tax" value={fmtCurrency(result.tax.state_tax_annual / 12)} indent />
          {result.tax.pfml_tax_annual > 0 && (
            <BreakdownRow label="WA Paid Leave (PFML)" value={fmtCurrency(result.tax.pfml_tax_annual / 12)} indent />
          )}
          {result.tax.wa_cares_tax_annual > 0 && (
            <BreakdownRow label="WA Cares" value={fmtCurrency(result.tax.wa_cares_tax_annual / 12)} indent />
          )}
          <div className="border-t border-border-subtle mt-2 pt-3">
            <BreakdownRow label="Total Taxes" value={fmtCurrency(result.tax.taxes_monthly)} />
          </div>
        </div>
      </div>

      {/* Cash Flow Card */}
      <div className="bg-white rounded-xl border border-border-subtle p-5 shadow-sm">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-secondary mb-4 pb-2 border-b border-border-subtle">Cash Flow</h3>
        <BreakdownRow label="Gross Income" value={fmtCurrency(result.gross_monthly)} />
        <BreakdownRow label="− Pre-tax Retirement" value={fmtCurrency(result.inputs.pre_tax_retirement_monthly)} indent />
        <BreakdownRow label="− Taxes (on reduced income)" value={fmtCurrency(result.tax.taxes_monthly)} indent />
        <div className="border-t border-border-subtle mt-2 pt-2">
        <BreakdownRow label="= Take-home Pay" value={fmtCurrency(result.gross_monthly - result.inputs.pre_tax_retirement_monthly - result.tax.taxes_monthly)} />
        </div>
        <BreakdownRow label="− After-tax Savings" value={fmtCurrency(result.after_tax_retirement_monthly)} indent />
        <BreakdownRow label="− Living Expenses" value={fmtCurrency(result.living_expenses_monthly)} indent />
        <ExpenseBucketSummary result={result} />
        <BreakdownRow label="− Housing" value={fmtCurrency(result.housing.housing_total_monthly)} indent />
        <div className="border-t border-border-subtle mt-2 pt-3">
          <div className="flex justify-between py-1.5">
            <span className="text-sm font-semibold text-brand-navy">= Monthly Surplus</span>
            <span className={`text-sm font-bold tabular-nums ${surplus >= 0 ? 'text-brand-teal' : 'text-brand-rose'}`}>
              {fmtCurrency(surplus)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
