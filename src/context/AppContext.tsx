import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';
import type { ScenarioInputs, GridConfig } from '../engine/types.ts';
import { DEFAULT_GRID_CONFIG, createDefaultInputs, migrateInputs } from '../components/InputPanel/defaults.ts';
import { syncLivingExpensesFromBuilder } from '../engine/expenseBuilder.ts';

const STORAGE_KEY = 'home-affordability-inputs';
const GRID_STORAGE_KEY = 'home-affordability-grid-config';

function loadInputs(): ScenarioInputs {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return migrateInputs(JSON.parse(saved));
  } catch { /* ignore */ }
  return createDefaultInputs();
}

function loadGridConfig(): GridConfig {
  try {
    const saved = localStorage.getItem(GRID_STORAGE_KEY);
    if (saved) return { ...DEFAULT_GRID_CONFIG, ...JSON.parse(saved) };
  } catch { /* ignore */ }
  return { ...DEFAULT_GRID_CONFIG };
}

type ActiveView = 'grid' | 'scenario';
type MobileTab = 'inputs' | 'grid' | 'details';

interface AppState {
  inputs: ScenarioInputs;
  gridConfig: GridConfig;
  activeView: ActiveView;
  selectedCell: { income: number; price: number } | null;
  auditOpen: boolean;
  mobileTab: MobileTab;
  inputDrawerOpen: boolean;
  gridConfigOpen: boolean;
  expenseBuilderOpen: boolean;
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
  setMobileTab: (tab: MobileTab) => void;
  setInputDrawerOpen: (open: boolean) => void;
  toggleGridConfig: () => void;
  setExpenseBuilderOpen: (open: boolean) => void;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [inputs, setInputsState] = useState<ScenarioInputs>(loadInputs);
  const [gridConfig, setGridConfigState] = useState<GridConfig>(loadGridConfig);
  const [activeView, setActiveView] = useState<ActiveView>('grid');
  const [selectedCell, setSelectedCell] = useState<{ income: number; price: number } | null>(null);
  const [auditOpen, setAuditOpen] = useState(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('grid');
  const [inputDrawerOpen, setInputDrawerOpen] = useState(false);
  const [gridConfigOpen, setGridConfigOpen] = useState(false);
  const [expenseBuilderOpen, setExpenseBuilderOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(inputs));
  }, [inputs]);

  useEffect(() => {
    localStorage.setItem(GRID_STORAGE_KEY, JSON.stringify(gridConfig));
  }, [gridConfig]);

  const setInputs = useCallback((newInputs: ScenarioInputs) => {
    setInputsState(syncLivingExpensesFromBuilder(newInputs));
  }, []);

  const updateInput = useCallback(<K extends keyof ScenarioInputs>(key: K, value: ScenarioInputs[K]) => {
    setInputsState((prev) => syncLivingExpensesFromBuilder({ ...prev, [key]: value }));
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
    setMobileTab('details');
  }, []);

  const toggleAudit = useCallback(() => {
    setAuditOpen((prev) => !prev);
  }, []);

  const toggleGridConfig = useCallback(() => {
    setGridConfigOpen((prev) => !prev);
  }, []);

  const resetDefaults = useCallback(() => {
    setInputsState(createDefaultInputs());
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
        mobileTab,
        inputDrawerOpen,
        expenseBuilderOpen,
        setInputs,
        updateInput,
        setGridConfig,
        updateGridConfig,
        setActiveView,
        selectCell,
        toggleAudit,
        resetDefaults,
        setMobileTab,
        setInputDrawerOpen,
        gridConfigOpen,
        toggleGridConfig,
        setExpenseBuilderOpen,
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
