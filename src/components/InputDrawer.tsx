import { useAppContext } from '../context/AppContext';
import { InputPanel } from './InputPanel/InputPanel';
import { XMarkIcon, HomeIcon } from '@heroicons/react/24/outline';

export function InputDrawer() {
  const { inputDrawerOpen, setInputDrawerOpen } = useAppContext();

  return (
    <>
      {/* Backdrop */}
      {inputDrawerOpen && (
        <div
          className="fixed inset-0 bg-brand-navy/20 z-40 transition-opacity"
          onClick={() => setInputDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-surface-sidebar shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          inputDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-4 py-4 bg-brand-navy flex items-center justify-between">
          <div className="flex items-center gap-2">
            <HomeIcon className="w-5 h-5 text-white" />
            <h1 className="text-base font-bold text-white">Inputs</h1>
          </div>
          <button
            onClick={() => setInputDrawerOpen(false)}
            className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
        <InputPanel />
      </aside>
    </>
  );
}
