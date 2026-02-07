import { useState } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import type { FilingStatus, ScenarioInputs } from '../../engine/types.ts';
import { STATE_EFFECTIVE_RATES } from '../../engine/taxConstants2026.ts';
import { FormattedNumberInput } from '../shared/FormattedNumberInput.tsx';
import {
  BanknotesIcon,
  ShoppingCartIcon,
  ReceiptPercentIcon,
  HomeModernIcon,
  ChevronDownIcon,
  ArrowPathIcon,
} from '@heroicons/react/24/outline';

const STATES = Object.keys(STATE_EFFECTIVE_RATES).sort();

function Section({
  title,
  hint,
  icon: Icon,
  defaultOpen = true,
  children,
}: {
  title: string;
  hint?: string;
  icon?: React.ComponentType<{ className?: string }>;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-border-subtle">
      <button
        className="w-full flex justify-between items-center py-3 px-1 text-left font-semibold text-sm text-text-primary hover:bg-white/50 min-h-[44px] transition-colors"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-[18px] h-[18px] text-brand-teal shrink-0" />}
          <div>
            <span>{title}</span>
            {hint && <span className="text-[11px] text-text-secondary font-normal block">{hint}</span>}
          </div>
        </div>
        <ChevronDownIcon
          className={`w-4 h-4 text-text-muted transition-transform duration-200 ${
            open ? 'rotate-0' : '-rotate-90'
          }`}
        />
      </button>
      {open && <div className="pb-3 space-y-3">{children}</div>}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-0.5 text-sm font-medium text-text-primary">
      {label}
      {children}
    </label>
  );
}

function NumberInput({
  value,
  onChange,
  prefix,
  suffix,
  step,
  min,
  max,
}: {
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div className="flex items-center border border-border-subtle rounded-lg bg-white focus-within:border-brand-teal focus-within:ring-1 focus-within:ring-brand-teal/30 transition-all">
      {prefix && <span className="text-sm text-text-muted pl-3 select-none">{prefix}</span>}
      <input
        type="number"
        className="w-full bg-transparent border-none outline-none px-2 py-2.5 text-base text-text-primary min-h-[44px] tabular-nums"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
      />
      {suffix && <span className="text-sm text-text-muted pr-3 select-none">{suffix}</span>}
    </div>
  );
}

export function InputPanel() {
  const { inputs, updateInput, resetDefaults } = useAppContext();

  const update = <K extends keyof ScenarioInputs>(key: K) => (value: ScenarioInputs[K]) =>
    updateInput(key, value);

  return (
    <div className="h-full overflow-y-auto p-4 space-y-1">
      <div className="flex justify-between items-center mb-3 pb-2 border-b border-border-subtle">
        <h2 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">Assumptions</h2>
        <button
          onClick={resetDefaults}
          className="flex items-center gap-1 text-xs font-medium text-brand-rose hover:text-brand-rose/80 transition-colors"
        >
          <ArrowPathIcon className="w-4 h-4" />
          Reset
        </button>
      </div>

      <Section title="Savings" hint="Retirement & other savings" icon={BanknotesIcon}>
        <Field label="Pre-tax Retirement ($/month)">
          <FormattedNumberInput
            value={inputs.pre_tax_retirement_monthly}
            onChange={update('pre_tax_retirement_monthly')}
            prefix="$"
            min={0}
          />
        </Field>
        <Field label="After-tax Savings ($/month)">
          <FormattedNumberInput
            value={inputs.after_tax_retirement_monthly}
            onChange={update('after_tax_retirement_monthly')}
            prefix="$"
            min={0}
          />
        </Field>
      </Section>

      <Section title="Spending" hint="Non-housing living expenses" icon={ShoppingCartIcon}>
        <Field label="Living Expenses ($/month)">
          <FormattedNumberInput
            value={inputs.living_expenses_monthly}
            onChange={update('living_expenses_monthly')}
            prefix="$"
            min={0}
          />
        </Field>
      </Section>

      <Section title="Tax Settings" hint="Filing status & deductions" icon={ReceiptPercentIcon} defaultOpen={false}>
        <Field label="Filing Status">
          <select
            className="w-full border border-border-subtle rounded-lg px-3 py-2.5 text-base min-h-[44px] bg-white text-text-primary focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/30 transition-all"
            value={inputs.filing_status}
            onChange={(e) => update('filing_status')(e.target.value as FilingStatus)}
          >
            <option value="MFJ">Married Filing Jointly</option>
            <option value="SINGLE">Single</option>
          </select>
        </Field>
        <Field label="State">
          <select
            className="w-full border border-border-subtle rounded-lg px-3 py-2.5 text-base min-h-[44px] bg-white text-text-primary focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/30 transition-all"
            value={inputs.state}
            onChange={(e) => update('state')(e.target.value)}
          >
            {STATES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Other Pre-tax Deductions (annual)">
          <FormattedNumberInput
            value={inputs.other_pre_tax_deductions_annual}
            onChange={update('other_pre_tax_deductions_annual')}
            prefix="$"
            min={0}
          />
        </Field>
        <Field label="State Effective Rate Override">
          <NumberInput
            value={(inputs.state_effective_rate_override ?? -1) === -1 ? -1 : (inputs.state_effective_rate_override ?? 0) * 100}
            onChange={(v) => update('state_effective_rate_override')(v < 0 ? undefined as unknown as number : v / 100)}
            suffix="%"
            step={0.1}
            min={-1}
            max={100}
          />
          <span className="text-xs text-text-muted italic mt-1">Set to -1 to use state default</span>
        </Field>
      </Section>

      <Section title="Home & Mortgage" hint="Loan terms & property costs" icon={HomeModernIcon} defaultOpen={false}>
        <Field label="Down Payment %">
          <NumberInput
            value={inputs.down_payment_pct * 100}
            onChange={(v) => update('down_payment_pct')(v / 100)}
            suffix="%"
            step={5}
            min={0}
            max={100}
          />
        </Field>
        <Field label="Interest Rate (APR)">
          <NumberInput
            value={inputs.apr * 100}
            onChange={(v) => update('apr')(v / 100)}
            suffix="%"
            step={0.125}
            min={0}
            max={20}
          />
        </Field>
        <Field label="Term (years)">
          <NumberInput
            value={inputs.term_years}
            onChange={update('term_years')}
            suffix="yr"
            step={5}
            min={1}
            max={50}
          />
        </Field>
        <Field label="Property Tax Rate (annual)">
          <NumberInput
            value={inputs.property_tax_rate_annual * 100}
            onChange={(v) => update('property_tax_rate_annual')(v / 100)}
            suffix="%"
            step={0.1}
            min={0}
            max={10}
          />
        </Field>
        <Field label="Insurance Rate (annual)">
          <NumberInput
            value={inputs.insurance_rate_annual * 100}
            onChange={(v) => update('insurance_rate_annual')(v / 100)}
            suffix="%"
            step={0.1}
            min={0}
            max={10}
          />
        </Field>
        <Field label="Maintenance Rate (annual)">
          <NumberInput
            value={inputs.maintenance_rate_annual * 100}
            onChange={(v) => update('maintenance_rate_annual')(v / 100)}
            suffix="%"
            step={0.1}
            min={0}
            max={10}
          />
        </Field>
        <Field label="HOA ($/month)">
          <FormattedNumberInput
            value={inputs.hoa_monthly}
            onChange={update('hoa_monthly')}
            prefix="$"
            min={0}
          />
        </Field>
      </Section>
    </div>
  );
}
