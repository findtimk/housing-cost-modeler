import { useAppContext } from '../../context/AppContext.tsx';
import { useBreakpoint } from '../../hooks/useBreakpoint.ts';
import { GridControls } from './GridControls.tsx';

export function GridConfigModal() {
  const { gridConfigOpen, toggleGridConfig } = useAppContext();
  const breakpoint = useBreakpoint();

  if (!gridConfigOpen) return null;

  const isFullScreen = breakpoint === 'mobile' || breakpoint === 'tablet';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40"
        onClick={toggleGridConfig}
      />
      <div
        className={`fixed bg-white shadow-xl z-50 overflow-y-auto ${
          isFullScreen
            ? 'inset-4 rounded-lg'
            : 'inset-y-0 right-0 w-80 border-l border-gray-200'
        }`}
      >
        <div className="sticky top-0 bg-white border-b border-gray-200 p-3 flex justify-between items-center">
          <h2 className="font-bold text-sm text-gray-800">Grid Settings</h2>
          <button
            onClick={toggleGridConfig}
            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="p-3">
          <GridControls />
        </div>
      </div>
    </>
  );
}
