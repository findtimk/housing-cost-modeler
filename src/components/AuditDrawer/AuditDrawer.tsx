import { useMemo } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import { useBreakpoint } from '../../hooks/useBreakpoint.ts';
import { computeScenario } from '../../engine/cashflowEngine.ts';
import { fmtCurrencyExact, fmtPercentExact, fmtRate } from '../shared/formatters.ts';
import { XMarkIcon } from '@heroicons/react/24/outline';

function AuditRow({
  label,
  value,
  formula,
  highlight,
}: {
  label: string;
  value: string;
  formula?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`py-1.5 ${highlight ? 'bg-surface-warm -mx-5 px-5' : ''}`}
    >
      <div className="flex justify-between text-sm">
        <span className="text-text-primary">{label}</span>
        <span className={`font-mono tabular-nums text-right ${highlight ? 'font-semibold' : ''}`}>{value}</span>
      </div>
      {formula && (
        <div className="text-xs text-text-muted font-mono mt-0.5">
          {formula}
        </div>
      )}
    </div>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="text-xs font-semibold text-brand-teal uppercase tracking-wider mt-6 mb-3 pb-1 border-b border-border-subtle">
      {title}
    </div>
  );
}

export function AuditDrawer() {
  const { inputs, selectedCell, auditOpen, toggleAudit } = useAppContext();
  const breakpoint = useBreakpoint();

  const scenarioInputs = useMemo(() => {
    if (selectedCell) {
      return {
        ...inputs,
        hhi_annual: selectedCell.income,
        home_price: selectedCell.price,
      };
    }
    return inputs;
  }, [inputs, selectedCell]);

  const r = useMemo(() => computeScenario(scenarioInputs), [scenarioInputs]);

  if (!auditOpen) return null;

  const isFullScreen = breakpoint === 'mobile' || breakpoint === 'tablet';

  return (
    <>
      {/* Backdrop for mobile/tablet */}
      {isFullScreen && (
        <div
          className="fixed inset-0 bg-brand-navy/20 z-40"
          onClick={toggleAudit}
        />
      )}
      <div
        className={`fixed bg-white shadow-xl z-50 overflow-y-auto ${
          isFullScreen
            ? 'inset-4 rounded-xl'
            : 'inset-y-0 right-0 w-96 border-l border-border-subtle'
        }`}
      >
        <div className="sticky top-0 bg-brand-navy px-5 py-4 flex justify-between items-center">
          <div>
            <h2 className="font-semibold text-base text-white">
              Calculation Detail
            </h2>
            <p className="text-xs text-white/60">Full math behind this scenario</p>
          </div>
          <button
            onClick={toggleAudit}
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

      <div className="p-5">
        <SectionHeader title="Income" />
        <AuditRow
          label="Gross Income (annual)"
          value={fmtCurrencyExact(r.tax.wages_annual)}
          formula="= hhi_annual"
        />
        <AuditRow
          label="Gross Income (monthly)"
          value={fmtCurrencyExact(r.gross_monthly)}
          formula="= hhi_annual / 12"
        />

        <SectionHeader title="Pre-tax Deductions" />
        <AuditRow
          label="Pre-tax Retirement (monthly)"
          value={fmtCurrencyExact(r.inputs.pre_tax_retirement_monthly)}
        />
        <AuditRow
          label="Pre-tax Retirement (annual)"
          value={fmtCurrencyExact(r.tax.pre_tax_retirement_annual)}
          formula="= pre_tax_retirement_monthly * 12"
        />
        <AuditRow
          label="Other Pre-tax Deductions (annual)"
          value={fmtCurrencyExact(r.tax.other_pre_tax_deductions_annual)}
        />
        <AuditRow
          label="Standard Deduction"
          value={fmtCurrencyExact(r.tax.standard_deduction)}
          formula={`filing_status = ${r.inputs.filing_status}`}
        />

        <SectionHeader title="Federal Tax" />
        <AuditRow
          label="Taxable Income (annual)"
          value={fmtCurrencyExact(r.tax.taxable_income_federal)}
          formula="= max(0, wages - pre_tax_retirement - other_deductions - standard_deduction)"
          highlight
        />
        <AuditRow
          label="Federal Income Tax (annual)"
          value={fmtCurrencyExact(r.tax.federal_tax_annual)}
          formula="progressive brackets on taxable_income"
          highlight
        />

        <SectionHeader title="Payroll Tax" />
        <AuditRow
          label="Social Security (annual)"
          value={fmtCurrencyExact(r.tax.ss_tax_annual)}
          formula="= min(wages, $184,500) * 6.2%"
        />
        <AuditRow
          label="Medicare (annual)"
          value={fmtCurrencyExact(r.tax.medicare_tax_annual)}
          formula="= wages * 1.45%"
        />
        <AuditRow
          label="Additional Medicare (annual)"
          value={fmtCurrencyExact(r.tax.addl_medicare_tax_annual)}
          formula={`= max(0, wages - $${r.inputs.filing_status === 'MFJ' ? '250k' : '200k'}) * 0.9%`}
        />
        <AuditRow
          label="Total Payroll Tax (annual)"
          value={fmtCurrencyExact(r.tax.payroll_tax_annual)}
          formula="= SS + Medicare + Addl Medicare"
          highlight
        />

        <SectionHeader title="State Tax" />
        <AuditRow
          label="Adjusted Wages for State"
          value={fmtCurrencyExact(r.tax.adj_wages_for_state)}
          formula="= max(0, wages - pre_tax_retirement - other_deductions)"
        />
        <AuditRow
          label="State Effective Rate"
          value={fmtRate(r.tax.state_effective_rate)}
          formula={`state = ${r.inputs.state}${r.inputs.state_effective_rate_override !== undefined ? ' (override)' : ''}`}
        />
        <AuditRow
          label="State Income Tax (annual)"
          value={fmtCurrencyExact(r.tax.state_tax_annual)}
          formula="= adj_wages * state_rate"
          highlight
        />

        <SectionHeader title="Total Taxes" />
        <AuditRow
          label="Total Taxes (annual)"
          value={fmtCurrencyExact(r.tax.taxes_annual)}
          formula="= federal + payroll + state"
        />
        <AuditRow
          label="Total Taxes (monthly)"
          value={fmtCurrencyExact(r.tax.taxes_monthly)}
          formula="= taxes_annual / 12"
          highlight
        />

        <SectionHeader title="Net Pay" />
        <AuditRow
          label="Net Pay (monthly)"
          value={fmtCurrencyExact(r.net_pay_monthly)}
          formula="= gross_monthly - taxes_monthly"
          highlight
        />

        <SectionHeader title="Housing" />
        <AuditRow
          label="Loan Amount"
          value={fmtCurrencyExact(r.housing.loan_amount)}
          formula={`= ${fmtCurrencyExact(r.inputs.home_price)} * (1 - ${fmtPercentExact(r.inputs.down_payment_pct)})`}
        />
        <AuditRow
          label="Mortgage P&I (monthly)"
          value={fmtCurrencyExact(r.housing.pi_monthly)}
          formula={`= L * r(1+r)^n / ((1+r)^n - 1), APR=${fmtRate(r.inputs.apr)}, n=${r.inputs.term_years * 12}`}
        />
        <AuditRow
          label="Property Tax (monthly)"
          value={fmtCurrencyExact(r.housing.property_tax_monthly)}
          formula={`= home_price * ${fmtRate(r.inputs.property_tax_rate_annual)} / 12`}
        />
        <AuditRow
          label="Insurance (monthly)"
          value={fmtCurrencyExact(r.housing.insurance_monthly)}
          formula={`= home_price * ${fmtRate(r.inputs.insurance_rate_annual)} / 12`}
        />
        <AuditRow
          label="Maintenance (monthly)"
          value={fmtCurrencyExact(r.housing.maintenance_monthly)}
          formula={`= home_price * ${fmtRate(r.inputs.maintenance_rate_annual)} / 12`}
        />
        <AuditRow
          label="HOA (monthly)"
          value={fmtCurrencyExact(r.housing.hoa_monthly)}
        />
        <AuditRow
          label="Total Housing (monthly)"
          value={fmtCurrencyExact(r.housing.housing_total_monthly)}
          formula="= P&I + property_tax + insurance + maintenance + HOA"
          highlight
        />

        <SectionHeader title="Cash Flow Summary" />
        <AuditRow
          label="After-tax Retirement (monthly)"
          value={fmtCurrencyExact(r.after_tax_retirement_monthly)}
        />
        <AuditRow
          label="Living Expenses (monthly)"
          value={fmtCurrencyExact(r.living_expenses_monthly)}
        />
        <AuditRow
          label="Monthly Surplus"
          value={fmtCurrencyExact(r.surplus_monthly)}
          formula="= net_pay - pre_tax_retirement - after_tax_retirement - living - housing"
          highlight
        />
        <AuditRow
          label="Front-end Ratio"
          value={fmtPercentExact(r.front_end_ratio)}
          formula="= housing_total / gross_monthly"
          highlight
        />
      </div>
      </div>
    </>
  );
}
