import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ScenarioInputs, GridConfig } from '../engine/types.ts';
import { DEFAULT_INPUTS, DEFAULT_GRID_CONFIG } from '../components/InputPanel/defaults.ts';

const STORAGE_KEY = 'home-affordability-inputs';
const GRID_STORAGE_KEY = 'home-affordability-grid-config';

function loadInputs(): ScenarioInputs {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return { ...DEFAULT_INPUTS, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_INPUTS };
}

function loadGridConfig(): GridConfig {
  try {
    const saved = localStorage.getItem(GRID_STORAGE_KEY);
    if (saved) return { ...DEFAULT_GRID_CONFIG, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_GRID_CONFIG };
}

type ActiveView = 'grid' | 'scenario';

interface AppState {
  inputs: ScenarioInputs;
  gridConfig: GridConfig;
  activeView: ActiveView;
  selectedCell: { income: number; price: number } | null;
  auditOpen: boolean;
}

interface AppContextValue extends AppState {
  setInputs: (inputs: ScenarioInputs) => void;
  updateInput: <K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) => void;
  setGridConfig: (config: GridConfig) => void;
  updateGridConfig: <K extends keyof GridConfig>(key: K, value: GridConfig[K]) => void;
  setActiveView: (view: ActiveView) => void;
  selectCell: (income: number, price: number) => void;
  toggleAudit: () => void;
  resetDefaults: () => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputsState] = useState<ScenarioInputs>(loadInputs);
  const [gridConfig, setGridConfigState] = useState<GridConfig>(loadGridConfig);
  const [activeView, setActiveView] = useState<ActiveView>('grid');
  const [selectedCell, setSelectedCell] = useState<{ income: number; price: number } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(gridConfig));
  }, [gridConfig]);

  const setInputs = useCallback((newInputs: ScenarioInputs) => {
    setInputsState(newInputs);
  }, []);

  const updateInput = useCallback(<K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) => {
    setInputsState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const setGridConfig = useCallback((config: GridConfig) => {
    setGridConfigState(config);
  }, []);

  const updateGridConfig = useCallback(<K extends keyof GridConfig>(key: K, value: GridConfig[K]) => {
    setGridConfigState((prev) => ({ ...prev, [key]: value }));
  }, []);

  const selectCell = useCallback((income: number, price: number) => {
    setSelectedCell({ income, price });
    setActiveView('scenario');
  }, []);

  const toggleAudit = useCallback(() => {
    setAuditOpen((prev) => !prev);
  }, []);

  const resetDefaults = useCallback(() => {
    setInputsState({ ...DEFAULT_INPUTS });
    setGridConfigState({ ...DEFAULT_GRID_CONFIG });
  }, []);

  return (
    <AppContext.Provider
      value={{
        inputs,
        gridConfig,
        activeView,
        selectedCell,
        auditOpen,
        setInputs,
        updateInput,
        setGridConfig,
        updateGridConfig,
        setActiveView,
        selectCell,
        toggleAudit,
        resetDefaults,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be inside AppProvider');
  return ctx;
}
