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
    <label className="flex items-center gap-1 text-xs text-gray-600">
      <span className="w-12 shrink-0">{label}</span>
      <FormattedNumberInput
        value={value}
        onChange={onChange}
        prefix={prefix}
        className="w-24 border border-gray-300 rounded px-1 py-0.5 text-xs"
      />
    </label>
  );
}

export function GridControls() {
  const { gridConfig, updateGridConfig } = useAppContext();

  const update = <K extends keyof GridConfig>(key: K) => (value: GridConfig[K]) =>
    updateGridConfig(key, value);

  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 p-2 bg-gray-50 rounded border border-gray-200 text-xs">
      <div className="space-y-1">
        <span className="font-semibold text-gray-700">Income</span>
        <GridField label="Min" value={gridConfig.income_min} onChange={update('income_min')} prefix="$" />
        <GridField label="Max" value={gridConfig.income_max} onChange={update('income_max')} prefix="$" />
        <GridField label="Step" value={gridConfig.income_step} onChange={update('income_step')} prefix="$" />
      </div>
      <div className="space-y-1">
        <span className="font-semibold text-gray-700">Home Price</span>
        <GridField label="Min" value={gridConfig.price_min} onChange={update('price_min')} prefix="$" />
        <GridField label="Max" value={gridConfig.price_max} onChange={update('price_max')} prefix="$" />
        <GridField label="Step" value={gridConfig.price_step} onChange={update('price_step')} prefix="$" />
      </div>
      <div className="space-y-1">
        <span className="font-semibold text-gray-700">Threshold</span>
        <GridField label="Min $" value={gridConfig.surplus_threshold} onChange={update('surplus_threshold')} prefix="$" />
      </div>
    </div>
  );
}
