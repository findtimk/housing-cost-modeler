import { useAppContext } from '../context/AppContext';
import { useBreakpoint } from '../hooks/useBreakpoint';
import { InputPanel } from './InputPanel/InputPanel';
import { GridView } from './GridView/GridView';
import { ScenarioView } from './ScenarioView/ScenarioView';
import { AuditDrawer } from './AuditDrawer/AuditDrawer';
import { MobileTabBar } from './MobileTabBar';
import { InputDrawer } from './InputDrawer';

export function App() {
  const { activeView, setActiveView, mobileTab, setInputDrawerOpen } = useAppContext();
  const breakpoint = useBreakpoint();

  // Desktop layout (≥1024px)
  if (breakpoint === 'desktop') {
    return (
      <div className="flex h-screen bg-gray-50 text-gray-900">
        {/* Left Panel: Inputs */}
        <aside className="w-72 shrink-0 bg-white border-r border-gray-200 overflow-hidden flex flex-col">
          <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
            <h1 className="text-sm font-bold text-gray-700">Home Affordability Modeler</h1>
          </div>
          <InputPanel />
        </aside>

        {/* Main Panel: Grid or Scenario */}
        <main className="flex-1 overflow-auto p-4">
          {/* View Tabs */}
          <div className="flex gap-1 mb-4">
            <button
              className={`px-3 py-1 text-xs rounded-t border border-b-0 ${
                activeView === 'grid'
                  ? 'bg-white text-gray-800 font-semibold border-gray-300'
                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setActiveView('grid')}
            >
              Grid
            </button>
            <button
              className={`px-3 py-1 text-xs rounded-t border border-b-0 ${
                activeView === 'scenario'
                  ? 'bg-white text-gray-800 font-semibold border-gray-300'
                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-50'
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
      <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
        {/* Header with menu button */}
        <header className="shrink-0 bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-3">
          <button
            onClick={() => setInputDrawerOpen(true)}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            aria-label="Open inputs"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-sm font-bold text-gray-700">Home Affordability Modeler</h1>
        </header>

        {/* Main content */}
        <main className="flex-1 overflow-auto p-4">
          {/* View Tabs */}
          <div className="flex gap-1 mb-4">
            <button
              className={`px-3 py-1 text-xs rounded-t border border-b-0 ${
                activeView === 'grid'
                  ? 'bg-white text-gray-800 font-semibold border-gray-300'
                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-50'
              }`}
              onClick={() => setActiveView('grid')}
            >
              Grid
            </button>
            <button
              className={`px-3 py-1 text-xs rounded-t border border-b-0 ${
                activeView === 'scenario'
                  ? 'bg-white text-gray-800 font-semibold border-gray-300'
                  : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-50'
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
    <div className="flex flex-col h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="shrink-0 bg-white border-b border-gray-200 px-4 py-3">
        <h1 className="text-sm font-bold text-gray-700 text-center">Home Affordability Modeler</h1>
      </header>

      {/* Main content - full screen with bottom padding for tab bar */}
      <main className="flex-1 overflow-auto pb-16">
        {mobileTab === 'inputs' && (
          <div className="bg-white min-h-full">
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
