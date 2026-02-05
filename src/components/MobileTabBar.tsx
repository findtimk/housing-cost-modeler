import { useAppContext } from '../context/AppContext';

type Tab = 'inputs' | 'grid' | 'details';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'inputs', label: 'Inputs', icon: '📝' },
  { id: 'grid', label: 'Grid', icon: '📊' },
  { id: 'details', label: 'Details', icon: '📈' },
];

export function MobileTabBar() {
  const { mobileTab, setMobileTab } = useAppContext();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setMobileTab(tab.id)}
          className={`flex-1 flex flex-col items-center justify-center py-2 min-h-[56px] transition-colors ${
            mobileTab === tab.id
              ? 'text-blue-600 bg-blue-50'
              : 'text-gray-500 hover:bg-gray-50'
          }`}
        >
          <span className="text-xl mb-0.5">{tab.icon}</span>
          <span className="text-xs font-medium">{tab.label}</span>
        </button>
      ))}
    </nav>
  );
}
