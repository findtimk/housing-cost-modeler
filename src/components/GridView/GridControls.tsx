import { useAppContext } from '../../context/AppContext.tsx';
import type { GridConfig } from '../../engine/types.ts';
import { FormattedNumberInput } from '../shared/FormattedNumberInput.tsx';

function GridField({
  label,
  value,
  onChange,
  prefix,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  prefix?: string;
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-text-secondary">
      <span className="w-12 shrink-0">{label}</span>
      <FormattedNumberInput
        value={value}
        onChange={onChange}
        prefix={prefix}
        className="w-28 border border-border-subtle rounded-lg px-2 py-1.5 text-sm bg-white focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/30 transition-all"
      />
    </label>
  );
}

export function GridControls() {
  const { gridConfig, updateGridConfig } = useAppContext();

  const update = <K extends keyof GridConfig>(key: K) => (value: GridConfig[K]) =>
    updateGridConfig(key, value);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Income</span>
        <div className="space-y-2">
          <GridField label="Min" value={gridConfig.income_min} onChange={update('income_min')} prefix="$" />
          <GridField label="Max" value={gridConfig.income_max} onChange={update('income_max')} prefix="$" />
          <GridField label="Step" value={gridConfig.income_step} onChange={update('income_step')} prefix="$" />
        </div>
      </div>
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Home Price</span>
        <div className="space-y-2">
          <GridField label="Min" value={gridConfig.price_min} onChange={update('price_min')} prefix="$" />
          <GridField label="Max" value={gridConfig.price_max} onChange={update('price_max')} prefix="$" />
          <GridField label="Step" value={gridConfig.price_step} onChange={update('price_step')} prefix="$" />
        </div>
      </div>
      <div className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-text-secondary">Safety Margin</span>
        <GridField label="Monthly" value={gridConfig.surplus_threshold} onChange={update('surplus_threshold')} prefix="$" />
        <p className="text-xs text-text-muted italic">Monthly cushion needed to show as 'Comfortable' (green)</p>
      </div>
    </div>
  );
}
