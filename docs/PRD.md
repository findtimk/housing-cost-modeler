# Home Affordability Modeler — PRD (v1)

**Last updated:** 2026-02-04

## 1) Summary

A web app that models **ongoing monthly affordability** of a home purchase using:
- a simplified but transparent **tax estimator** (federal + payroll + state)
- correct treatment of **pre-tax vs after-tax retirement savings**
- a **grid (income × home price)** to visualize stress/comfort zones
- a **scenario detail view** plus an **audit drawer** to make the math trustworthy

**Primary decision metric:** minimum monthly surplus (avoid negative cash flow).

### In-scope (v1)
- Steady-state monthly model (no future-year projection)
- Annual household income (HHI) spread evenly across months
- Retirement savings modeled as user-entered monthly amounts:
  - pre-tax retirement savings (reduces taxable income)
  - after-tax retirement savings (does not reduce taxable income)
- Housing costs: mortgage P&I + property tax + insurance + maintenance + HOA
- Results: monthly surplus, housing breakdown, take-home breakdown, front-end ratio
- Grid heatmap + click-through scenario view
- Audit drawer with intermediate values and formulas

### Out-of-scope (v1)
- One-time costs, reserves, closing costs, furnishings
- PMI (assume down payment sufficient)
- Itemization / mortgage interest deduction / SALT cap
- HSA, child tax credits, AMT, RSU withholding specifics, bonus timing
- Long-term projection, net worth, investment returns, refinance modeling

## 2) Target user and use cases

**Target user:** high-income dual-income household planning via a single **HHI** input.

### Primary use cases
1. **Purchase decision:** “Which home prices keep me from going negative monthly cash flow given my spending and savings goals?”
2. **Stress map:** “How does affordability change across a plausible range of future incomes?”
3. **Tradeoffs:** “Which lever matters most: rate, down payment, living expenses, retirement savings?”

## 3) Success metrics

- Baseline setup completed in **< 3 minutes**
- Results update on any input change in **< 300ms**
- Grid generation for a typical 9×10 grid in **< 250ms**
- Users can open the audit drawer and validate each computed number

## 4) UX / IA

### Core layout
- **Left panel:** Assumptions (inputs) grouped into 4 collapsible sections
- **Main panel:** Results tabs (Grid | Scenario | Breakdown)
- **Right drawer / bottom sheet:** Audit (“Show math”) with a calculation table + formulas

### Inputs (Left panel)
1) **Income & Tax**
- Filing status: Single / Married Filing Jointly (default MFJ)
- State: dropdown (default WA)
- Annual household income (HHI)
- Optional advanced: “Other annual pre-tax deductions” (default 0)

2) **Savings**
- Pre-tax retirement savings ($/month)
- After-tax retirement savings ($/month)

3) **Spending**
- Living expenses ($/month) — non-housing

4) **Home & Mortgage**
- Home price (Scenario) or price range (Grid)
- Down payment % (default 30%, preset 20% available)
- Interest rate (APR)
- Term (years, default 30)
- Property tax rate (% annual of home value)
- Insurance rate (% annual of home value)
- Maintenance rate (% annual of home value)
- HOA ($/month)

### Results
**Grid (default view)**
- Controls:
  - Income min/max/step (default: HHI ± $200k, step $50k)
  - Home price min/max/step (default: $1.0M–$1.9M, step $100k)
  - Minimum surplus threshold (default $0; affects coloring)
- Grid cell shows **monthly surplus** and is color-coded:
  - Red: < 0
  - Neutral: 0 to threshold
  - Green: ≥ threshold
- Clicking a cell updates the Scenario view to that income+price.

**Scenario view**
- Big KPI: monthly surplus
- Secondary KPI: total housing cost and front-end ratio
- Breakdown cards:
  - Housing cost components
  - Taxes (federal / payroll / state)
  - Net pay and savings/expenses summary

**Breakdown view**
- Itemized list and optional charts for:
  - Housing components
  - Tax components
  - “Where the money goes” summary

### Trust / auditability
- Every computed value has an info tooltip.
- Audit drawer shows the full calculation pipeline:
  gross → (taxes) → net pay → (after-tax savings, living, housing) → surplus

## 5) Functional requirements

### FR1 — Input management
- Persist last-used assumptions (local storage)
- Reset to defaults
- Input validation with clear error messages (hard errors only for impossible states)

### FR2 — Tax engine (simplified estimator)
- Federal income tax with standard deduction and progressive brackets (by filing status)
- Payroll taxes:
  - Social Security up to wage base
  - Medicare on all wages
  - Additional Medicare above threshold
- State selection with **default WA**; state income tax handled via v1 approach (see SPEC)

### FR3 — Housing cost engine
- Monthly P&I from amortization
- Monthly property tax, insurance, maintenance based on % of home value
- HOA monthly input

### FR4 — Cashflow engine
- Correct handling of pre-tax vs after-tax retirement savings:
  - Pre-tax reduces taxable income (federal and state in v1)
  - After-tax does not affect taxes; subtracts from net pay

### FR5 — Grid computation
- Generate results for each income×price cell
- Cache computations (tax per income; housing per price)

### FR6 — Audit drawer
- Must show all intermediate values used in computations
- Must match the numbers displayed in scenario/grid (within rounding rules)

## 6) Acceptance criteria (testable)

**AC1 — Pre-tax vs after-tax correctness**
- Increasing pre-tax retirement by $1,000/mo should reduce taxes and reduce surplus by **< $1,000/mo** (tax savings offsets part).
- Increasing after-tax retirement by $1,000/mo should reduce surplus by **exactly $1,000/mo** (taxes unchanged).

**AC2 — Grid/scenario consistency**
- Clicking any grid cell yields the same surplus as displayed in that cell (within rounding).

**AC3 — Performance**
- Grid recompute for a typical 9×10 grid completes within performance target.

**AC4 — Audit visibility**
- Audit drawer includes all intermediate values + formulas.

## 7) Non-goals / guardrails
- Do not add v1.1 features (itemization, HSA, reserves, projection) into v1.
- Prioritize correctness and auditability over UI flourishes.

## 8) Open items (post-v1)
- Optional “calibrate to paycheck” flow
- Full 50-state tax modeling
- Income composition (bonus/RSU) and irregular pay timing
- Projection mode and “income change over time” modeling
