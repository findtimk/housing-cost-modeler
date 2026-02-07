import { useAppContext } from '../../context/AppContext.tsx';
import { useBreakpoint } from '../../hooks/useBreakpoint.ts';
import { GridControls } from './GridControls.tsx';
import { XMarkIcon } from '@heroicons/react/24/outline';

export function GridConfigModal() {
  const { gridConfigOpen, toggleGridConfig } = useAppContext();
  const breakpoint = useBreakpoint();

  if (!gridConfigOpen) return null;

  const isFullScreen = breakpoint === 'mobile' || breakpoint === 'tablet';

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-navy/20 z-40"
        onClick={toggleGridConfig}
      />
      <div
        className={`fixed bg-white shadow-xl z-50 overflow-y-auto ${
          isFullScreen
            ? 'inset-4 rounded-xl'
            : 'inset-y-0 right-0 w-80 border-l border-border-subtle'
        }`}
      >
        <div className="sticky top-0 bg-brand-navy px-5 py-4 flex justify-between items-center">
          <h2 className="font-semibold text-base text-white">Grid Settings</h2>
          <button
            onClick={toggleGridConfig}
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5">
          <GridControls />
        </div>
      </div>
    </>
  );
}
