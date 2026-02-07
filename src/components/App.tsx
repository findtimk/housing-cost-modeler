import { useAppContext } from '../context/AppContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { InputPanel } from './InputPanel/InputPanel';
import { GridView } from './GridView/GridView';
import { ScenarioView } from './ScenarioView/ScenarioView';
import { AuditDrawer } from './AuditDrawer/AuditDrawer';
import { MobileTabBar } from './MobileTabBar';
import { InputDrawer } from './InputDrawer';
import { HomeIcon, Bars3Icon } from '@heroicons/react/24/outline';

export function App() {
  const { activeView, setActiveView, mobileTab, setInputDrawerOpen } = useAppContext();
  const breakpoint = useBreakpoint();

  // Desktop layout (≥1024px)
  if (breakpoint === 'desktop') {
    return (
      <div className="flex h-screen bg-surface-warm text-text-primary">
        {/* Left Panel: Inputs */}
        <aside className="w-72 shrink-0 bg-surface-sidebar border-r border-border-subtle overflow-hidden flex flex-col">
          <div className="px-4 py-4 bg-brand-navy">
            <div className="flex items-center gap-2">
              <HomeIcon className="w-5 h-5 text-white" />
              <h1 className="text-base font-bold text-white">Home Affordability Modeler</h1>
            </div>
            <p className="text-xs text-white/60 mt-1">See what you can truly afford</p>
          </div>
          <InputPanel />
        </aside>

        {/* Main Panel: Grid or Scenario */}
        <main className="flex-1 overflow-auto p-4">
          {/* View Tabs - Pill Style */}
          <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-border-subtle mb-4">
            <button
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeView === 'grid'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-warm'
              }`}
              onClick={() => setActiveView('grid')}
            >
              Grid
            </button>
            <button
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeView === 'scenario'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-warm'
              }`}
              onClick={() => setActiveView('scenario')}
            >
              Scenario
            </button>
          </div>

          {activeView === 'grid' ? <GridView /> : <ScenarioView />}
        </main>

        {/* Audit Drawer (right overlay) */}
        <AuditDrawer />
      </div>
    );
  }

  // Tablet layout (768-1023px)
  if (breakpoint === 'tablet') {
    return (
      <div className="flex flex-col h-screen bg-surface-warm text-text-primary">
        {/* Header with menu button */}
        <header className="shrink-0 bg-white border-b border-border-subtle px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => setInputDrawerOpen(true)}
            className="p-2 text-brand-navy hover:bg-surface-warm rounded-lg transition-colors"
            aria-label="Open inputs"
          >
            <Bars3Icon className="w-6 h-6" />
          </button>
          <h1 className="text-sm font-bold text-text-primary">Home Affordability Modeler</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4">
          {/* View Tabs - Pill Style */}
          <div className="inline-flex bg-white rounded-xl p-1 shadow-sm border border-border-subtle mb-4">
            <button
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeView === 'grid'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-warm'
              }`}
              onClick={() => setActiveView('grid')}
            >
              Grid
            </button>
            <button
              className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${
                activeView === 'scenario'
                  ? 'bg-brand-navy text-white shadow-sm'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-warm'
              }`}
              onClick={() => setActiveView('scenario')}
            >
              Scenario
            </button>
          </div>

          {activeView === 'grid' ? <GridView /> : <ScenarioView />}
        </main>

        {/* Input drawer (slides in from left) */}
        <InputDrawer />

        {/* Audit Drawer (modal on tablet) */}
        <AuditDrawer />
      </div>
    );
  }

  // Mobile layout (<768px)
  return (
    <div className="flex flex-col h-screen bg-surface-warm text-text-primary">
      {/* Header */}
      <header className="shrink-0 bg-brand-navy px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <HomeIcon className="w-5 h-5 text-white" />
          <h1 className="text-sm font-bold text-white">Home Affordability Modeler</h1>
        </div>
      </header>

      {/* Main content - full screen with bottom padding for tab bar */}
      <main className="flex-1 overflow-auto pb-16">
        {mobileTab === 'inputs' && (
          <div className="bg-surface-sidebar min-h-full">
            <InputPanel />
          </div>
        )}
        {mobileTab === 'grid' && (
          <div className="p-4">
            <GridView />
          </div>
        )}
        {mobileTab === 'details' && (
          <div className="p-4">
            <ScenarioView />
          </div>
        )}
      </main>

      {/* Bottom tab bar */}
      <MobileTabBar />

      {/* Audit Drawer (full-screen modal on mobile) */}
      <AuditDrawer />
    </div>
  );
}
