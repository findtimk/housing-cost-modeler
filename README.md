# Home Affordability Modeler (v1)

A web app that models ongoing monthly affordability of a home purchase using a simplified tax estimator, correct pre-tax vs after-tax retirement savings treatment, and a grid heatmap to visualize stress/comfort zones.

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

**87 tests** covering:
- `taxEngine.test.ts` — Federal brackets, payroll taxes, state tax, edge cases
- `housingEngine.test.ts` — Mortgage P&I formula, recurring costs
- `cashflowEngine.test.ts` — Pre-tax vs after-tax behavior (AC1 acceptance criteria)
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
    taxConstants2026.ts# 2026 brackets, deductions, payroll thresholds, state table
    taxEngine.ts       # Federal tax, payroll tax, state tax
    housingEngine.ts   # Mortgage P&I, property tax, insurance, maintenance, HOA
    cashflowEngine.ts  # Orchestrator: taxes + housing -> surplus
    gridEngine.ts      # Income x Price grid with O(I+P) caching

  components/          # React UI
    App.tsx            # Root layout
    InputPanel/        # Left sidebar with collapsible input sections
    GridView/          # Heatmap grid (income x home price)
    ScenarioView/      # Detail view for one scenario
    AuditDrawer/       # "Show Math" drawer with all intermediate values

  context/
    AppContext.tsx      # Global state (inputs, grid config, selected cell)

  __tests__/           # Vitest test suites
```

## Key Design Decisions

- **Engine is pure functions** - no classes, no side effects, no React. Testable and reusable.
- **Surplus formula** includes pre-tax retirement: `surplus = net_pay - pre_tax_retirement - after_tax_retirement - living_expenses - housing`. This ensures AC1 (pre-tax saves taxes; after-tax does not).
- **Grid caching** - Tax depends only on income; housing depends only on price. Grid computes O(I+P) engine calls instead of O(I*P).
- **Inputs persist** in localStorage and restore on reload.
