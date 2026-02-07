import { useAppContext } from '../context/AppContext';
import {
  AdjustmentsHorizontalIcon,
  TableCellsIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';
import {
  AdjustmentsHorizontalIcon as AdjustmentsHorizontalIconSolid,
  TableCellsIcon as TableCellsIconSolid,
  DocumentTextIcon as DocumentTextIconSolid,
} from '@heroicons/react/24/solid';

type Tab = 'inputs' | 'grid' | 'details';

const tabs: {
  id: Tab;
  label: string;
  Icon: React.ComponentType<{ className?: string }>;
  IconActive: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'inputs', label: 'Inputs', Icon: AdjustmentsHorizontalIcon, IconActive: AdjustmentsHorizontalIconSolid },
  { id: 'grid', label: 'Grid', Icon: TableCellsIcon, IconActive: TableCellsIconSolid },
  { id: 'details', label: 'Details', Icon: DocumentTextIcon, IconActive: DocumentTextIconSolid },
];

export function MobileTabBar() {
  const { mobileTab, setMobileTab } = useAppContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-card border-t border-border-subtle flex z-50 shadow-[0_-2px_8px_rgba(0,0,0,0.04)]">
      {tabs.map((tab) => {
        const isActive = mobileTab === tab.id;
        const IconComponent = isActive ? tab.IconActive : tab.Icon;

        return (
          <button
            key={tab.id}
            onClick={() => setMobileTab(tab.id)}
            className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
              isActive
                ? 'text-brand-teal bg-brand-teal/5'
                : 'text-text-muted hover:bg-surface-warm'
            }`}
          >
            <IconComponent className="w-6 h-6 mb-0.5" />
            <span className={`text-xs ${isActive ? 'font-semibold' : 'font-medium'}`}>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
