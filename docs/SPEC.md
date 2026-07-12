# Home Affordability Modeler — SPEC (v2)

**Last updated:** 2026-07-11

This spec defines the **exact formulas**, **constants**, **rounding rules**, and **golden test cases** for v2 (per-earner wages, WA payroll programs, dual ratios).

---

## 1) Modeling assumptions (v2)

- Household income is entered as **annual wages per earner** (up to two earners) and spread evenly monthly. Federal/state income tax is computed on the combined income (one return); Social Security and WA PFML caps apply **per earner**.
- Retirement savings are user-entered monthly amounts:
  - **Pre-tax retirement savings** reduce taxable income (federal and state in v1).
  - **After-tax retirement savings** do not affect taxes; subtracted from net pay.
- Uses **standard deduction** only (no itemization).
- Does not model tax credits, AMT, RSU withholding, bonus timing, deductions beyond pre-tax retirement.
- No PMI. The UI warns when down payment < 20% that costs are understated.
- The income×price grid keeps a **single-earner tax approximation** (one SS/PFML cap on the whole cell income); the scenario detail view splits income across earners proportionally to the input-panel wages and is slightly more accurate.

---

## 2) Inputs

### 2.1 Household / tax inputs
- `filing_status`: `"MFJ"` or `"SINGLE"`
- `state`: US state code (default `"WA"`)
- `earner1_wages_annual`: number (USD / year)
- `earner2_wages_annual`: number (USD / year; 0 for a single-earner household)
- `earner1_pfml_exempt`, `earner2_pfml_exempt`: boolean (exempt or employer-paid)
- `earner1_wa_cares_exempt`, `earner2_wa_cares_exempt`: boolean
- `pre_tax_retirement_monthly`: number (USD / month)
- `after_tax_retirement_monthly`: number (USD / month)
- `living_expenses_monthly`: number (USD / month)
- `other_pre_tax_deductions_annual` (optional): number (USD / year, default 0)
- `state_effective_rate_override` (optional): number (0–1). If present, overrides state lookup.

### 2.2 Home / mortgage inputs
- `home_price`: number (USD)
- `down_payment_pct`: number (0–1). Below 0.20 the UI shows a PMI warning (not a block).
- `apr`: number (0–1) nominal APR (e.g., 0.065)
- `term_years`: integer (default 30)
- `property_tax_rate_annual`: number (0–1) as % of home value
- `insurance_rate_annual`: number (0–1) as % of home value
- `maintenance_rate_annual`: number (0–1) as % of home value
- `hoa_monthly`: number (USD / month)

---

## 3) Constants (Tax Year 2026 defaults)

These constants are defaults and live in `taxConstants2026.ts`.
Sources: IRS inflation adjustments (standard deduction) and bracket thresholds; SSA wage base; IRS additional Medicare thresholds; WA ESD (PFML rates); WA Cares statute.

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
- Social Security employee rate: **6.2%** up to wage base, **per earner**
- Social Security wage base: **$184,500** (per earner)
- Medicare employee rate: **1.45%** on all wages
- Additional Medicare: **0.9%** on **combined** wages above (per-return tax):
  - MFJ: **$250,000**
  - Single: **$200,000**

### 3.4 WA payroll programs (applied only when state = WA)
- **WA Paid Family & Medical Leave (PFML)**, 2026: total premium **1.13%**, employee share **71.43%** → employee rate **0.807159%** of wages, capped at the Social Security wage base **per earner**. (Source: WA ESD announcement, fall 2025. The rate is re-set each fall — update annually.)
- **WA Cares** (long-term care): **0.58%** of all wages, **no cap**, employee-paid. Rate set by statute.
- Each earner can be flagged exempt per program (PFML employer-paid or exempt; WA Cares exemption holders). Exempt earners contribute $0 to that program.
- Premiums apply to **gross wages** — they are not reduced by pre-tax retirement.

---

## 4) Tax formulas

### 4.1 Derived annual values
- `pre_tax_retirement_annual = pre_tax_retirement_monthly * 12`
- `after_tax_retirement_annual = after_tax_retirement_monthly * 12`
- `wages_annual = earner1_wages_annual + earner2_wages_annual`
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

### 4.4 Payroll taxes (per-earner SS cap)
- `ss_tax = Σ over earners: min(earner_wages, SS_WAGE_BASE) * 0.062`
- `medicare_tax = wages_annual * 0.0145`
- `addl_medicare_tax = max(0, wages_annual - addl_medicare_threshold(filing_status)) * 0.009`
  (combined wages — Additional Medicare is assessed per return, not per earner)
- `payroll_tax = ss_tax + medicare_tax + addl_medicare_tax`

### 4.5 WA premiums (state = WA only)
- `pfml_tax = Σ over non-exempt earners: min(earner_wages, SS_WAGE_BASE) * 0.0113 * 0.7143`
- `wa_cares_tax = Σ over non-exempt earners: earner_wages * 0.0058`  (no cap)

### 4.6 State income tax (v1 model retained)
A **single effective rate** per state (or user override) applied to `adj_wages_for_state`:

- `state_tax = adj_wages_for_state * state_effective_rate`

Notes:
- Default WA effective rate = **0%**
- User override available in UI.

### 4.7 Total taxes
- `taxes_annual = federal_tax + payroll_tax + state_tax + pfml_tax + wa_cares_tax`
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

### 5.3 PITIA and total housing
- `pitia_monthly = pi_monthly + property_tax_monthly + insurance_monthly + hoa_monthly`
  (the lender-style payment — excludes maintenance)
- `housing_total_monthly = pitia_monthly + maintenance_monthly`

---

## 6) Cashflow formulas

### 6.1 Monthly income
- `gross_monthly = wages_annual / 12`
- `net_pay_monthly = gross_monthly - taxes_monthly`

### 6.2 Monthly surplus (primary metric)
- `surplus_monthly = net_pay_monthly - pre_tax_retirement_monthly - after_tax_retirement_monthly - living_expenses_monthly - housing_total_monthly`

(Pre-tax retirement is subtracted here because `net_pay = gross - taxes` still contains those dollars; they are committed to savings, not spendable. This formula corrects an omission in SPEC v1, which the implementation and golden values always included.)

Equivalently: `surplus = gross − taxes − pre-tax retirement − after-tax savings − living expenses − housing total`.

### 6.3 Ratios (display metrics)
- `pitia_ratio = pitia_monthly / gross_monthly` — comparable to lender front-end guidelines (the common 28% rule of thumb applies to this number)
- `all_in_ratio = housing_total_monthly / gross_monthly` — true cost of ownership including maintenance

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
- Tax constants as defined above (2026 defaults, incl. PFML 0.807159% employee rate)
- State model: effective rate applied to `adj_wages_for_state`
- No itemization
- No exemptions unless stated

### G1 — Base WA: 250k/250k earners, $1.4M home
MFJ, WA, pre-tax retirement $4,000/mo, living $9,500/mo, 30% down, 6.5% APR, 30yr, property tax 1%, insurance 0.5%, maintenance 1%, HOA $0.

**Expected outputs:**

- Gross monthly income: $41,666.67
- Taxable income (annual): $419,800.00
- Federal income tax (annual): $87,248.00
- Payroll taxes (annual): $32,378.00
  - SS: 2 × min(250,000, 184,500) × 6.2% = $22,878 (per-earner caps)
  - Medicare: $7,250; Additional Medicare: $2,250
- WA PFML (annual): $2,978.42 (2 × 184,500 × 0.807159%)
- WA Cares (annual): $2,900.00 (500,000 × 0.58%)
- State income tax (annual): $0.00
- Taxes (monthly): $10,458.70
- Net pay (monthly): $31,207.97

**Housing breakdown (monthly):**
- Mortgage P&I: $6,194.27
- Property tax: $1,166.67
- Insurance: $583.33
- Maintenance: $1,166.67
- HOA: $0.00
- PITIA: $7,944.27
- Total housing: $9,110.93

- PITIA ratio: 19.07%
- All-in ratio: 21.87%
- Monthly surplus: $8,597.03

### G2 — Stress WA: 200k/150k earners, $1.4M home
MFJ, WA, pre-tax retirement $3,000/mo, living $8,500/mo, same home as G1.

**Expected outputs:**

- Gross monthly income: $29,166.67
- Taxable income (annual): $281,800.00
- Federal income tax (annual): $52,828.00
- Payroll taxes (annual): $26,714.00
  - SS: 11,439 (earner 1 capped) + 9,300 = $20,739
  - Medicare: $5,075; Additional Medicare: $900
- WA PFML (annual): $2,699.95 (1,489.21 capped + 1,210.74)
- WA Cares (annual): $2,030.00
- State income tax (annual): $0.00
- Taxes (monthly): $7,022.66
- Net pay (monthly): $22,144.00

**Housing breakdown (monthly):** same as G1 (PITIA $7,944.27, total $9,110.93)

- PITIA ratio: 27.24%
- All-in ratio: 31.24%
- Monthly surplus: $1,533.07

### G3 — Higher price WA: 300k/300k earners, $1.8M home + HOA
MFJ, WA, pre-tax retirement $5,000/mo, living $11,000/mo, 30% down, HOA $300.

**Expected outputs:**

- Gross monthly income: $50,000.00
- Taxable income (annual): $507,800.00
- Federal income tax (annual): $115,408.00
- Payroll taxes (annual): $34,728.00
  - SS: 2 × $11,439 = $22,878; Medicare: $8,700; Additional Medicare: $3,150
- WA PFML (annual): $2,978.42 (both earners capped)
- WA Cares (annual): $3,480.00
- State income tax (annual): $0.00
- Taxes (monthly): $13,049.53
- Net pay (monthly): $36,950.47

**Housing breakdown (monthly):**
- Mortgage P&I: $7,964.06
- Property tax: $1,500.00
- Insurance: $750.00
- Maintenance: $1,500.00
- HOA: $300.00
- PITIA: $10,514.06
- Total housing: $12,014.06

- PITIA ratio: 21.03%
- All-in ratio: 24.03%
- Monthly surplus: $8,936.41

### G4 — State tax example: CA effective 6%, single 500k earner, $1.4M home
Regression anchor: single earner outside WA — payroll math identical to SPEC v1, no WA premiums. All values unchanged from v1.

**Expected outputs:**

- Gross monthly income: $41,666.67
- Taxable income (annual): $419,800.00
- Federal income tax (annual): $87,248.00
- Payroll taxes (annual): $20,939.00
- WA PFML / WA Cares (annual): $0.00
- State income tax (annual): $27,120.00
- Taxes (monthly): $11,275.58
- Net pay (monthly): $30,391.08

**Housing breakdown (monthly):**
- Mortgage P&I: $6,194.27
- Property tax: $1,400.00
- Insurance: $700.00
- Maintenance: $1,166.67
- HOA: $0.00
- PITIA: $8,294.27
- Total housing: $9,460.93

- PITIA ratio: 19.91%
- All-in ratio: 22.71%
- Monthly surplus: $7,430.15


---

## 9) Required explainability outputs (Audit Drawer)

The app MUST be able to display these intermediate values for the active scenario:

- Per-earner wages and gross income (monthly, annual)
- Pre-tax retirement (monthly, annual)
- Standard deduction (annual)
- Taxable income (annual)
- Federal tax (annual)
- Payroll tax components (annual):
  - Social Security **per earner** (showing the per-earner cap), Medicare, Additional Medicare (combined-wages basis)
- WA premiums (annual): PFML, WA Cares (when state = WA)
- State tax (annual) and effective rate used
- Total taxes (monthly)
- Net pay (monthly)
- After-tax retirement (monthly)
- Living expenses (monthly)
- Housing breakdown (monthly):
  - P&I, property tax, insurance, maintenance, HOA, PITIA
- Monthly surplus
- PITIA ratio and all-in ratio

---

## 10) Notes on accuracy vs simplicity

This model is intended to be **decision-grade for monthly affordability** under steady-state assumptions, but it is not a full tax simulator.

Known accuracy gaps (accepted):
- Does not model itemization, credits, AMT, RSU/bonus timing, retirement plan limits, or benefit deductions beyond entered pre-tax amount.
- Treats all income as wages for payroll taxes (may overestimate payroll tax if some income is not subject to FICA).
- No PMI: scenarios below 20% down understate true costs (UI warns).
- The grid view uses a single-earner tax approximation per cell; the detail view is per-earner.
- State income tax is a flat effective rate, not brackets.
