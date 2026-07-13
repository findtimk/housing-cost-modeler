# Home Affordability Modeler (v2)

A web app that models ongoing monthly affordability of a home purchase using a simplified tax estimator (per-earner Social Security caps, WA PFML + WA Cares), correct pre-tax vs after-tax retirement savings treatment, and a grid heatmap to visualize stress/comfort zones.

## Quick Start

```bash
npm install
npm run dev        # Start dev server (http://localhost:5173)
```

## Run Tests

```bash
npm test           # Run all tests once
npm run test:watch # Run tests in watch mode
```

**134 tests** covering:
- `taxEngine.test.ts` — Federal brackets, per-earner payroll taxes, WA PFML/WA Cares premiums, state tax, edge cases
- `housingEngine.test.ts` — Mortgage P&I formula, recurring costs, PITIA
- `cashflowEngine.test.ts` — Pre-tax vs after-tax behavior (AC1), income splitting, legacy-input migration, category-derived living expenses
- `expenseBuilder.test.ts` — Expense-plan defaults, category totals, disabled/custom items, manual/category sync
- `gridEngine.test.ts` — Grid axes, proportional income split, scenario/detail alignment
- `goldenTests.test.ts` — All 4 golden test cases from SPEC (G1-G4)

## Build for Production

```bash
npm run build      # TypeScript check + Vite build -> dist/
npm run preview    # Preview production build
```

## Architecture

```
src/
  engine/              # Pure TypeScript - no React dependencies
    types.ts           # ScenarioInputs, TaxResult, HousingResult, ScenarioResult
    taxConstants2026.ts# 2026 brackets, deductions, payroll thresholds, WA PFML/Cares rates, state table
    taxEngine.ts       # Federal tax, per-earner payroll tax, WA premiums, state tax
    housingEngine.ts   # Mortgage P&I, property tax, insurance, maintenance, HOA, PITIA
    cashflowEngine.ts  # Orchestrator: taxes + housing -> surplus + both ratios
    gridEngine.ts      # Income x Price grid with O(I+P) caching
    incomeSplit.ts     # Splits a grid cell's income across earners proportionally
    expenseBuilder.ts  # Category-based living expense plans and total sync

  components/          # React UI
    App.tsx            # Root layout
    InputPanel/        # Left sidebar with collapsible input sections
    GridView/          # Heatmap grid (income x home price)
    ScenarioView/      # Detail view for one scenario
    AuditDrawer/       # "Show Math" drawer with all intermediate values
    ExpenseBuilderModal.tsx # Master-detail worksheet for living expense categories

  context/
    AppContext.tsx      # Global state (inputs, grid config, selected cell)

  __tests__/           # Vitest test suites
```

## Key Design Decisions

- **Engine is pure functions** - no classes, no side effects, no React. Testable and reusable.
- **Surplus formula** includes pre-tax retirement: `surplus = net_pay - pre_tax_retirement - after_tax_retirement - living_expenses - housing`. This ensures AC1 (pre-tax saves taxes; after-tax does not).
- **Per-earner income** - Social Security and WA PFML wage-base caps apply per earner; Additional Medicare stays on combined wages (per-return tax). Federal/state income tax is computed on combined income.
- **Grid caching** - Tax depends only on HHI; housing depends only on price. Grid computes O(I+P) engine calls instead of O(I*P). Each HHI row is split across earners using the current income profile, so grid cells and scenario detail use the same per-earner tax treatment.
- **Two ratios** - lender-style PITIA ratio (excludes maintenance) vs all-in ownership ratio; the 28%/36% rule-of-thumb coloring keys off PITIA.
- **Living expense builder** - non-housing expenses can be a manual monthly value or built from category plans (`Current`, `With child`, `Custom`). The with-child default is $10,150/mo, including a $3,500/mo daycare assumption.
- **Inputs persist** in localStorage and restore on reload; legacy `hhi_annual` blobs migrate to earner 1, and legacy living-expense inputs remain manual.
