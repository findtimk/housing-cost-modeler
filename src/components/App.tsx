import { useAppContext } from '../context/AppContext.tsx';
import { InputPanel } from './InputPanel/InputPanel.tsx';
import { GridView } from './GridView/GridView.tsx';
import { ScenarioView } from './ScenarioView/ScenarioView.tsx';
import { AuditDrawer } from './AuditDrawer/AuditDrawer.tsx';

export function App() {
  const { activeView, setActiveView } = useAppContext();

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
