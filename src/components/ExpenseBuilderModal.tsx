import { useRef, useState } from 'react';
import { useAppContext } from '../context/AppContext.tsx';
import type {
  ExpenseBucket,
  ExpenseBuilderState,
  ExpenseLineItem,
  ExpenseScenario,
} from '../engine/types.ts';
import {
  computeExpenseBucketTotal,
  computeExpenseScenarioTotal,
  createDefaultExpenseBuilder,
  getActiveExpenseScenario,
  getExpenseBuilderSummary,
} from '../engine/expenseBuilder.ts';
import { fmtCurrency } from './shared/formatters.ts';
import { FormattedNumberInput } from './shared/FormattedNumberInput.tsx';
import { PlusIcon, TrashIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SCENARIO_ORDER = ['current', 'with_child', 'custom'];

function updateScenario(
  builder: ExpenseBuilderState,
  updater: (scenario: ExpenseScenario) => ExpenseScenario,
): ExpenseBuilderState {
  return {
    ...builder,
    source: 'user_edited',
    scenarios: builder.scenarios.map((scenario) =>
      scenario.id === builder.active_scenario_id ? updater(scenario) : scenario,
    ),
  };
}

function updateBucket(
  scenario: ExpenseScenario,
  bucketId: string,
  updater: (bucket: ExpenseBucket) => ExpenseBucket,
): ExpenseScenario {
  return {
    ...scenario,
    buckets: scenario.buckets.map((bucket) =>
      bucket.id === bucketId ? updater(bucket) : bucket,
    ),
  };
}

function updateItem(
  bucket: ExpenseBucket,
  itemId: string,
  updater: (item: ExpenseLineItem) => ExpenseLineItem,
): ExpenseBucket {
  return {
    ...bucket,
    items: bucket.items.map((expenseItem) =>
      expenseItem.id === itemId ? updater(expenseItem) : expenseItem,
    ),
  };
}

function scenarioLabel(id: string): string {
  if (id === 'current') return 'Current';
  if (id === 'with_child') return 'With child';
  return 'Custom';
}

export function ExpenseBuilderModal() {
  const { inputs, setInputs, expenseBuilderOpen, setExpenseBuilderOpen } = useAppContext();
  const customItemCounter = useRef(0);
  const [selectedBucketId, setSelectedBucketId] = useState('travel');

  const builder = inputs.expense_builder ?? createDefaultExpenseBuilder();
  const activeScenario = getActiveExpenseScenario(builder) ?? builder.scenarios[0];
  const activeBucket =
    activeScenario.buckets.find((bucket) => bucket.id === selectedBucketId) ??
    activeScenario.buckets[0];
  const summary = getExpenseBuilderSummary(builder);
  const sortedScenarios = [...builder.scenarios].sort(
    (a, b) => SCENARIO_ORDER.indexOf(a.id) - SCENARIO_ORDER.indexOf(b.id),
  );

  const saveBuilder = (nextBuilder: ExpenseBuilderState) => {
    setInputs({
      ...inputs,
      expense_builder: nextBuilder,
    });
  };

  const selectScenario = (scenarioId: string) => {
    const nextScenario = builder.scenarios.find((scenario) => scenario.id === scenarioId);
    if (nextScenario?.buckets[0]) {
      setSelectedBucketId(nextScenario.buckets[0].id);
    }
    saveBuilder({
      ...builder,
      mode: 'categories',
      active_scenario_id: scenarioId,
      source: 'user_edited',
    });
  };

  const updateItemAmount = (bucketId: string, itemId: string, amount: number) => {
    saveBuilder(
      updateScenario(builder, (scenario) =>
        updateBucket(scenario, bucketId, (bucket) =>
          updateItem(bucket, itemId, (expenseItem) => ({
            ...expenseItem,
            amount_monthly: Math.max(0, Math.round(amount)),
          })),
        ),
      ),
    );
  };

  const updateItemLabel = (bucketId: string, itemId: string, label: string) => {
    saveBuilder(
      updateScenario(builder, (scenario) =>
        updateBucket(scenario, bucketId, (bucket) =>
          updateItem(bucket, itemId, (expenseItem) => ({
            ...expenseItem,
            label,
          })),
        ),
      ),
    );
  };

  const toggleItemEnabled = (bucketId: string, itemId: string) => {
    saveBuilder(
      updateScenario(builder, (scenario) =>
        updateBucket(scenario, bucketId, (bucket) =>
          updateItem(bucket, itemId, (expenseItem) => ({
            ...expenseItem,
            enabled: !expenseItem.enabled,
          })),
        ),
      ),
    );
  };

  const addCustomItem = (bucketId: string) => {
    customItemCounter.current += 1;
    const newItem: ExpenseLineItem = {
      id: `custom_${customItemCounter.current}`,
      label: 'New item',
      amount_monthly: 0,
      enabled: true,
      is_default: false,
      is_custom: true,
    };

    saveBuilder(
      updateScenario(builder, (scenario) =>
        updateBucket(scenario, bucketId, (bucket) => ({
          ...bucket,
          items: [...bucket.items, newItem],
        })),
      ),
    );
  };

  const deleteCustomItem = (bucketId: string, itemId: string) => {
    saveBuilder(
      updateScenario(builder, (scenario) =>
        updateBucket(scenario, bucketId, (bucket) => ({
          ...bucket,
          items: bucket.items.filter((expenseItem) =>
            expenseItem.id === itemId ? !expenseItem.is_custom : true,
          ),
        })),
      ),
    );
  };

  if (!expenseBuilderOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-brand-navy/25 p-4">
      <section className="w-full max-w-4xl h-[min(760px,calc(100vh-2rem))] bg-surface-warm rounded-xl shadow-xl border border-border-subtle overflow-hidden flex flex-col">
        <div className="bg-brand-navy px-5 py-3 flex items-center justify-between shrink-0">
          <div>
            <h2 className="font-semibold text-base text-white">Build Living Expenses</h2>
            <p className="text-xs text-white/60">Non-housing monthly expenses</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpenseBuilderOpen(false)}
              className="px-3 py-1.5 text-xs font-semibold text-brand-navy bg-white rounded-lg hover:bg-white/90 transition-colors"
            >
              Done
            </button>
            <button
              onClick={() => setExpenseBuilderOpen(false)}
              className="p-1 text-white/70 hover:text-white hover:bg-white/10 rounded transition-colors"
              aria-label="Close expense builder"
            >
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="px-5 py-3 border-b border-border-subtle bg-white shrink-0">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
                Monthly total
              </div>
              <div className="text-3xl font-bold text-brand-navy tabular-nums">
                {fmtCurrency(computeExpenseScenarioTotal(activeScenario))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-lg bg-surface-warm border border-border-subtle px-3 py-2">
                <div className="text-text-muted">Actual run-rate</div>
                <div className="text-sm font-bold text-text-primary tabular-nums">
                  {fmtCurrency(summary.actualTotal)}
                </div>
              </div>
              <div className="rounded-lg bg-surface-warm border border-border-subtle px-3 py-2">
                <div className="text-text-muted">Child / family</div>
                <div className="text-sm font-bold text-text-primary tabular-nums">
                  {fmtCurrency(summary.childTotal)}
                </div>
              </div>
            </div>
          </div>

          <div className="inline-flex bg-surface-warm rounded-xl p-1 border border-border-subtle mt-3">
            {sortedScenarios.map((scenario) => {
              const active = scenario.id === builder.active_scenario_id;
              return (
                <button
                  key={scenario.id}
                  onClick={() => selectScenario(scenario.id)}
                  className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                    active
                      ? 'bg-brand-navy text-white shadow-sm'
                      : 'text-text-secondary hover:text-text-primary hover:bg-white'
                  }`}
                >
                  {scenarioLabel(scenario.id)}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] min-h-0 flex-1">
          <div className="border-r border-border-subtle bg-white p-3 overflow-y-auto">
            <div className="space-y-1">
              {activeScenario.buckets.map((bucketForRender) => {
                const bucketTotal = computeExpenseBucketTotal(bucketForRender);
                const selected = bucketForRender.id === activeBucket?.id;
                return (
                  <button
                    key={bucketForRender.id}
                    onClick={() => setSelectedBucketId(bucketForRender.id)}
                    className={`w-full rounded-lg px-3 py-2 text-left transition-colors ${
                      selected
                        ? 'bg-brand-navy text-white shadow-sm'
                        : 'hover:bg-surface-warm text-text-primary'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="text-sm font-semibold truncate">
                        {bucketForRender.label}
                      </span>
                      <span className="text-xs font-bold tabular-nums">
                        {fmtCurrency(bucketTotal)}
                      </span>
                    </div>
                    {bucketForRender.description && (
                      <div className={`text-[11px] mt-0.5 truncate ${
                        selected ? 'text-white/70' : 'text-text-muted'
                      }`}>
                        {bucketForRender.description}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="min-h-0 overflow-y-auto p-5">
            {activeBucket && (
              <div className="bg-white border border-border-subtle rounded-lg shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-border-subtle flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-base font-bold text-brand-navy">
                      {activeBucket.label}
                    </h3>
                    {activeBucket.description && (
                      <p className="text-xs text-text-muted mt-0.5">
                        {activeBucket.description}
                      </p>
                    )}
                  </div>
                  <div className="text-base font-bold text-brand-navy tabular-nums">
                    {fmtCurrency(computeExpenseBucketTotal(activeBucket))}
                  </div>
                </div>

                <div className="px-4 py-3 space-y-2">
                  {activeBucket.items.map((expenseItem) => (
                    <div
                      key={expenseItem.id}
                      className={`grid grid-cols-[24px_1fr_auto] items-center gap-3 min-h-[40px] ${
                        expenseItem.enabled ? '' : 'opacity-50'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={expenseItem.enabled}
                        onChange={() =>
                          toggleItemEnabled(activeBucket.id, expenseItem.id)
                        }
                        className="w-4 h-4 accent-brand-teal"
                        aria-label={`Include ${expenseItem.label}`}
                      />
                      {expenseItem.is_custom ? (
                        <input
                          value={expenseItem.label}
                          onChange={(e) =>
                            updateItemLabel(
                              activeBucket.id,
                              expenseItem.id,
                              e.target.value,
                            )
                          }
                          className="w-full border border-border-subtle rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/30"
                        />
                      ) : (
                        <span className="text-sm text-text-primary">
                          {expenseItem.label}
                        </span>
                      )}
                      <div className="flex items-center gap-2">
                        <FormattedNumberInput
                          value={expenseItem.amount_monthly}
                          onChange={(value) =>
                            updateItemAmount(
                              activeBucket.id,
                              expenseItem.id,
                              value,
                            )
                          }
                          prefix="$"
                          min={0}
                          className="w-24 border border-border-subtle rounded-lg px-2 py-2 text-right text-sm text-text-primary focus:outline-none focus:border-brand-teal focus:ring-1 focus:ring-brand-teal/30"
                        />
                        {expenseItem.is_custom && (
                          <button
                            onClick={() =>
                              deleteCustomItem(activeBucket.id, expenseItem.id)
                            }
                            className="p-2 text-text-muted hover:text-brand-rose rounded-lg hover:bg-brand-rose-light transition-colors"
                            aria-label={`Delete ${expenseItem.label}`}
                          >
                            <TrashIcon className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  <button
                    onClick={() => addCustomItem(activeBucket.id)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-teal hover:text-brand-teal-dark px-1 py-2"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add item
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
