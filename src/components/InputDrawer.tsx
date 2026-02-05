import { useAppContext } from '../context/AppContext';
import { InputPanel } from './InputPanel/InputPanel';

export function InputDrawer() {
  const { inputDrawerOpen, setInputDrawerOpen } = useAppContext();

  return (
    <>
      {/* Backdrop */}
      {inputDrawerOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={() => setInputDrawerOpen(false)}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          inputDrawerOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="px-3 py-2 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <h1 className="text-sm font-bold text-gray-700">Inputs</h1>
          <button
            onClick={() => setInputDrawerOpen(false)}
            className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <InputPanel />
      </aside>
    </>
  );
}
