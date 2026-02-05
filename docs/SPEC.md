# Home Affordability Modeler — SPEC (v1)

**Last updated:** 2026-02-04

This spec defines the **exact formulas**, **constants**, **rounding rules**, and **golden test cases** for v1.

---

## 1) Modeling assumptions (v1)

- Annual household income (HHI) is treated as **wage-like** income and spread evenly monthly.
- Retirement savings are user-entered monthly amounts:
  - **Pre-tax retirement savings** reduce taxable income (federal and state in v1).
  - **After-tax retirement savings** do not affect taxes; subtracted from net pay.
- Uses **standard deduction** only (no itemization).
- Does not model tax credits, AMT, RSU withholding, bonus timing, deductions beyond pre-tax retirement.
- No PMI.

---

## 2) Inputs

### 2.1 Household / tax inputs
- `filing_status`: `"MFJ"` or `"SINGLE"`
- `state`: US state code (default `"WA"`)
- `hhi_annual`: number (USD / year)
- `pre_tax_retirement_monthly`: number (USD / month)
- `after_tax_retirement_monthly`: number (USD / month)
- `living_expenses_monthly`: number (USD / month)
- `other_pre_tax_deductions_annual` (optional): number (USD / year, default 0)
- `state_effective_rate_override` (optional): number (0–1). If present, overrides state lookup.

### 2.2 Home / mortgage inputs
- `home_price`: number (USD)
- `down_payment_pct`: number (0–1)
- `apr`: number (0–1) nominal APR (e.g., 0.065)
- `term_years`: integer (default 30)
- `property_tax_rate_annual`: number (0–1) as % of home value
- `insurance_rate_annual`: number (0–1) as % of home value
- `maintenance_rate_annual`: number (0–1) as % of home value
- `hoa_monthly`: number (USD / month)

---

## 3) Constants (Tax Year 2026 defaults)

These constants are defaults and should live in a config file (e.g., `taxConstants2026.ts`).  
Sources: IRS inflation adjustments (standard deduction) and bracket thresholds; SSA wage base; IRS additional Medicare thresholds.

### 3.1 Standard deduction
- MFJ: **$32,200**
- Single: **$16,100**

### 3.2 Federal income tax brackets (taxable income)
MFJ (cap inclusive in bracket table interpretation):
- 10%: 0 – 24,800
- 12%: 24,801 – 100,800
- 22%: 100,801 – 211,400
- 24%: 211,401 – 403,550
- 32%: 403,551 – 512,450
- 35%: 512,451 – 768,700
- 37%: 768,701+

Single:
- 10%: 0 – 12,400
- 12%: 12,401 – 50,400
- 22%: 50,401 – 105,700
- 24%: 105,701 – 201,775
- 32%: 201,776 – 256,225
- 35%: 256,226 – 640,600
- 37%: 640,601+

### 3.3 Payroll taxes
- Social Security employee rate: **6.2%** up to wage base
- Social Security wage base: **$184,500**
- Medicare employee rate: **1.45%** on all wages
- Additional Medicare: **0.9%** on wages above:
  - MFJ: **$250,000**
  - Single: **$200,000**

---

## 4) Tax formulas

### 4.1 Derived annual values
- `pre_tax_retirement_annual = pre_tax_retirement_monthly * 12`
- `after_tax_retirement_annual = after_tax_retirement_monthly * 12`
- `wages_annual = hhi_annual`  (v1 simplification)
- `adj_wages_for_state = max(0, wages_annual - pre_tax_retirement_annual - other_pre_tax_deductions_annual)`

### 4.2 Taxable income (federal)
Use standard deduction:

- `taxable_income_federal = max(0, wages_annual - pre_tax_retirement_annual - other_pre_tax_deductions_annual - standard_deduction(filing_status))`

### 4.3 Federal income tax
Compute progressive tax over `taxable_income_federal` using filing-status brackets.

Implementation requirement:
- Use an ordered list of `(cap, rate)` pairs.
- For each bracket:
  - `amount_in_bracket = min(taxable_income, cap) - prev_cap`
  - `tax += amount_in_bracket * rate`

### 4.4 Payroll taxes
- `ss_tax = min(wages_annual, SS_WAGE_BASE) * 0.062`
- `medicare_tax = wages_annual * 0.0145`
- `addl_medicare_tax = max(0, wages_annual - addl_medicare_threshold(filing_status)) * 0.009`
- `payroll_tax = ss_tax + medicare_tax + addl_medicare_tax`

### 4.5 State income tax (v1)
v1 uses a **single effective rate** per state (or user override) applied to `adj_wages_for_state`:

- `state_tax = adj_wages_for_state * state_effective_rate`

Notes:
- Default WA effective rate = **0%**
- For non-WA, implement either:
  1) a small built-in table (WA, CA, NY, TX, FL, “Other”), AND/OR
  2) allow user override directly in UI (recommended).

### 4.6 Total taxes
- `taxes_annual = federal_tax + payroll_tax + state_tax`
- `taxes_monthly = taxes_annual / 12`

---

## 5) Housing cost formulas

### 5.1 Loan and mortgage P&I
- `loan_amount = home_price * (1 - down_payment_pct)`
- `n = term_years * 12`
- `r = apr / 12`

Monthly principal+interest:
- If `loan_amount <= 0`: `pi_monthly = 0`
- Else if `r == 0`: `pi_monthly = loan_amount / n`
- Else:
  - `pi_monthly = loan_amount * (r * (1+r)^n) / ((1+r)^n - 1)`

### 5.2 Recurring home costs (monthly)
- `property_tax_monthly = home_price * property_tax_rate_annual / 12`
- `insurance_monthly = home_price * insurance_rate_annual / 12`
- `maintenance_monthly = home_price * maintenance_rate_annual / 12`
- `hoa_monthly = input`

### 5.3 Total housing
- `housing_total_monthly = pi_monthly + property_tax_monthly + insurance_monthly + maintenance_monthly + hoa_monthly`

---

## 6) Cashflow formulas

### 6.1 Monthly income
- `gross_monthly = wages_annual / 12`
- `net_pay_monthly = gross_monthly - taxes_monthly`

### 6.2 Monthly surplus (primary metric)
- `surplus_monthly = net_pay_monthly - after_tax_retirement_monthly - living_expenses_monthly - housing_total_monthly`

### 6.3 Front-end ratio (display metric)
- `front_end_ratio = housing_total_monthly / gross_monthly`

---

## 7) Rounding rules (UI and tests)

To avoid off-by-a-few-dollars drift between UI and tests:

- Keep internal calculations in full floating precision.
- In UI:
  - Display money values rounded to nearest **$1** by default (or $10 if you prefer).
  - Display ratios as percent with 1–2 decimals.
- For golden tests:
  - Assert within a tolerance, e.g. **±$1** for money and **±0.0001** for ratios,
    OR assert exact to 2 decimals if the implementation uses identical rounding.

---

## 8) Golden test cases (fixtures)

Use these fixtures to validate implementation. They assume:
- Tax constants as defined above (2026 defaults)
- State model: effective rate applied to `adj_wages_for_state`
- No itemization
- Wages = HHI

### G1 — Base WA: $500k HHI, $1.4M home

**Expected outputs (using v1 formulas + 2026 constants in this spec):**

- Gross monthly income: $41,666.67
- Taxable income (annual): $419,800.00
- Federal income tax (annual): $87,248.00
- Payroll taxes (annual): $20,939.00
- State income tax (annual): $0.00
- Taxes (monthly): $9,015.58
- Net pay (monthly): $32,651.08

**Housing breakdown (monthly):**
- Mortgage P&I: $6,194.27
- Property tax: $1,166.67
- Insurance: $583.33
- Maintenance: $1,166.67
- HOA: $0.00
- Total housing: $9,110.93

- Front-end ratio (housing / gross): 22.00%
- Monthly surplus: $10,040.15

### G2 — Stress WA: $350k HHI, $1.4M home

**Expected outputs (using v1 formulas + 2026 constants in this spec):**

- Gross monthly income: $29,166.67
- Taxable income (annual): $281,800.00
- Federal income tax (annual): $52,828.00
- Payroll taxes (annual): $17,414.00
- State income tax (annual): $0.00
- Taxes (monthly): $5,853.50
- Net pay (monthly): $23,313.17

**Housing breakdown (monthly):**
- Mortgage P&I: $6,194.27
- Property tax: $1,166.67
- Insurance: $583.33
- Maintenance: $1,166.67
- HOA: $0.00
- Total housing: $9,110.93

- Front-end ratio (housing / gross): 31.00%
- Monthly surplus: $2,702.23

### G3 — Higher price WA: $600k HHI, $1.8M home + HOA

**Expected outputs (using v1 formulas + 2026 constants in this spec):**

- Gross monthly income: $50,000.00
- Taxable income (annual): $507,800.00
- Federal income tax (annual): $115,408.00
- Payroll taxes (annual): $23,289.00
- State income tax (annual): $0.00
- Taxes (monthly): $11,558.08
- Net pay (monthly): $38,441.92

**Housing breakdown (monthly):**
- Mortgage P&I: $7,964.06
- Property tax: $1,500.00
- Insurance: $750.00
- Maintenance: $1,500.00
- HOA: $300.00
- Total housing: $12,014.06

- Front-end ratio (housing / gross): 24.00%
- Monthly surplus: $10,427.86

### G4 — State tax example: CA effective 6%, $500k HHI, $1.4M home

**Expected outputs (using v1 formulas + 2026 constants in this spec):**

- Gross monthly income: $41,666.67
- Taxable income (annual): $419,800.00
- Federal income tax (annual): $87,248.00
- Payroll taxes (annual): $20,939.00
- State income tax (annual): $27,120.00
- Taxes (monthly): $11,275.58
- Net pay (monthly): $30,391.08

**Housing breakdown (monthly):**
- Mortgage P&I: $6,194.27
- Property tax: $1,400.00
- Insurance: $700.00
- Maintenance: $1,166.67
- HOA: $0.00
- Total housing: $9,460.93

- Front-end ratio (housing / gross): 23.00%
- Monthly surplus: $7,430.15


---

## 9) Required explainability outputs (Audit Drawer)

The app MUST be able to display these intermediate values for the active scenario:

- Gross income (monthly, annual)
- Pre-tax retirement (monthly, annual)
- Standard deduction (annual)
- Taxable income (annual)
- Federal tax (annual)
- Payroll tax components (annual):
  - Social Security, Medicare, Additional Medicare
- State tax (annual) and effective rate used
- Total taxes (monthly)
- Net pay (monthly)
- After-tax retirement (monthly)
- Living expenses (monthly)
- Housing breakdown (monthly):
  - P&I, property tax, insurance, maintenance, HOA
- Monthly surplus
- Front-end ratio

---

## 10) Notes on accuracy vs simplicity

This v1 model is intended to be **decision-grade for monthly affordability** under steady-state assumptions, but it is not a full tax simulator.

Known accuracy gaps (accepted in v1):
- Does not model itemization, credits, AMT, RSU/bonus timing, retirement plan limits, or benefit deductions beyond entered pre-tax amount.
- Treats all income as wages for payroll taxes (conservative for some income types; may overestimate payroll tax if some income is not subject to FICA).
