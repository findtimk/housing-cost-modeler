import { useState } from 'react';
import { useAppContext } from '../../context/AppContext.tsx';
import type { FilingStatus, ScenarioInputs } from '../../engine/types.ts';
import { STATE_EFFECTIVE_RATES } from '../../engine/taxConstants2026.ts';
import { FormattedNumberInput } from '../shared/FormattedNumberInput.tsx';

const STATES = Object.keys(STATE_EFFECTIVE_RATES).sort();

function Section({
  title,
  hint,
  defaultOpen = true,
  children,
}: {
  title: string;
  hint?: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-gray-200">
      <button
        className="w-full flex justify-between items-center py-2 px-1 text-left font-semibold text-sm text-gray-700 hover:bg-gray-50"
        onClick={() => setOpen(!open)}
      >
        <div>
          {title}
          {hint && <span className="text-[10px] text-gray-400 font-normal ml-2">{hint}</span>}
        </div>
        <span className="text-gray-400">{open ? '−' : '+'}</span>
      </button>
      {open && <div className="pb-3 space-y-2">{children}</div>}
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
    <label className="flex flex-col gap-0.5 text-xs text-gray-600">
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
    <div className="flex items-center gap-1">
      {prefix && <span className="text-gray-500 text-xs">{prefix}</span>}
      <input
        type="number"
        className="w-full border border-gray-300 rounded px-2 py-1 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        step={step}
        min={min}
        max={max}
      />
      {suffix && <span className="text-gray-500 text-xs">{suffix}</span>}
    </div>
  );
}

export function InputPanel() {
  const { inputs, updateInput, resetDefaults } = useAppContext();

  const update = <K extends keyof ScenarioInputs>(key: K) => (value: ScenarioInputs[K]) =>
    updateInput(key, value);

  return (
    <div className="h-full overflow-y-auto p-3 space-y-1">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-sm font-bold text-gray-800">Assumptions</h2>
        <button
          onClick={resetDefaults}
          className="text-xs text-blue-600 hover:underline"
        >
          Reset
        </button>
      </div>

      <Section title="Savings" hint="Retirement & other savings">
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

      <Section title="Spending" hint="Non-housing living expenses">
        <Field label="Living Expenses ($/month)">
          <FormattedNumberInput
            value={inputs.living_expenses_monthly}
            onChange={update('living_expenses_monthly')}
            prefix="$"
            min={0}
          />
        </Field>
      </Section>

      <Section title="Tax Settings" hint="Filing status & deductions" defaultOpen={false}>
        <Field label="Filing Status">
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
            value={inputs.filing_status}
            onChange={(e) => update('filing_status')(e.target.value as FilingStatus)}
          >
            <option value="MFJ">Married Filing Jointly</option>
            <option value="SINGLE">Single</option>
          </select>
        </Field>
        <Field label="State">
          <select
            className="border border-gray-300 rounded px-2 py-1 text-sm"
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
          <span className="text-[10px] text-gray-400">Set to -1 to use state default</span>
        </Field>
      </Section>

      <Section title="Home & Mortgage" hint="Loan terms & property costs" defaultOpen={false}>
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
