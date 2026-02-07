# UX Design Spec: Home Affordability Modeler Redesign

**Version:** 1.0  
**Date:** February 5, 2026  
**Tech Stack:** Vite + React + Tailwind CSS (existing)

---

## 1. DESIGN TOKENS

All design changes are driven by a centralized set of tokens. Extend the Tailwind config with this palette and override the current `gray-50`/`white` defaults.

### 1.1 Colors

Add these to `tailwind.config.js` under `theme.extend.colors`:
```js
colors: {
  'brand-navy':       '#1a2b4a',
  'brand-navy-light': '#2d4a7a',
  'brand-teal':       '#0d9488',
  'brand-teal-light': '#ccfbf1',
  'brand-teal-dark':  '#0f766e',
  'brand-amber':      '#d97706',
  'brand-amber-light':'#fef3c7',
  'brand-rose':       '#e11d48',
  'brand-rose-light': '#ffe4e6',
  'surface-warm':     '#faf9f7',
  'surface-card':     '#ffffff',
  'surface-sidebar':  '#f5f3f0',
  'border-subtle':    '#e8e5e0',
  'text-primary':     '#1a2b4a',
  'text-secondary':   '#6b7280',
  'text-muted':       '#9ca3af',
}
```

### 1.2 Typography

Use the existing system font stack. Apply these refinements:

| Element | Size | Weight | Extras |
|---|---|---|---|
| App title | 18px (`text-lg`) | bold | `text-white`, `tracking-tight` |
| App tagline | 12px (`text-xs`) | normal | `text-white/60` |
| Section headers (sidebar) | 14px (`text-sm`) | semibold (600) | `text-brand-navy` |
| Section subtitles | 11px | normal | `text-text-muted` |
| "Assumptions" label | 11px | semibold (600) | `uppercase`, `tracking-wider`, `text-text-secondary` |
| Input labels | 14px (`text-sm`) | medium (500) | `text-text-primary` |
| Input values | 16px (`text-base`) | normal | `tabular-nums` |
| Grid cell values | 14px (`text-sm`) | semibold (600) | `tabular-nums` |
| Grid header values | 12px (`text-xs`) | semibold (600) | `text-text-secondary`, `uppercase` |
| Hero metric numbers | 36px (`text-4xl`) | bold | `tabular-nums` |
| Hero metric labels | 11px | semibold (600) | `uppercase`, `tracking-wider`, `text-text-secondary` |

Add `font-variant-numeric: tabular-nums` to all cells, inputs, and numeric displays globally.

### 1.3 Spacing & Radii

| Token | Value |
|---|---|
| Card border radius | `12px` (`rounded-xl`) |
| Input border radius | `8px` (`rounded-lg`) |
| Button border radius | `8px` (`rounded-lg`) |
| Grid cell padding | `12px` vertical, `16px` horizontal |
| Card shadow | `0 1px 3px rgba(26,43,74,0.06), 0 1px 2px rgba(26,43,74,0.04)` |
| Card hover shadow | `0 4px 12px rgba(26,43,74,0.08)` |
| Sidebar width | `288px` (`w-72`) — unchanged |
| Sidebar section gap | `16px` between collapsed sections, `12px` between fields within |

---

## 2. APP HEADER & BRANDING

### 2.1 Sidebar Header

**Current:** Plain text `Home Affordability Modeler` on white background.

**New design:**
```
┌──────────────────────────────┐
│ 🏠  Home Affordability       │   ← icon + title line
│     Modeler                  │
│ See what you can truly       │   ← tagline
│ afford                       │
└──────────────────────────────┘
```

| Property | Value |
|---|---|
| Background | `brand-navy` (`#1a2b4a`) |
| Padding | `16px` |
| Border bottom | none |
| Title | `text-base`, `font-bold`, `text-white` |
| Icon | Heroicons `HomeIcon` (outline), 20×20px, inline before title text, `text-white` |
| Tagline text | `"See what you can truly afford"` |
| Tagline style | `text-xs`, `text-white/60`, `font-normal`, `mt-1` |

### 2.2 Browser Tab

**Current:** `housing-temp`

**Change to:** `Home Affordability Modeler` — update `<title>` in `index.html`.

Replace the Vite favicon with a simple teal house icon on transparent background (or keep existing if effort is too high).

---

## 3. SIDEBAR REDESIGN

### 3.1 Sidebar Container

| Property | Current | New |
|---|---|---|
| Background | white | `surface-sidebar` (`#f5f3f0`) |
| Right border color | `gray-200` | `border-subtle` (`#e8e5e0`) |
| Scrollbar | browser default | thin, `border-subtle` track, `text-secondary` thumb |

### 3.2 "Assumptions" Subheader + Reset Button

| Element | Style |
|---|---|
| Container | `px-4`, `pt-4`, `pb-2`, `flex justify-between items-center` |
| "Assumptions" text | `text-[11px]`, `font-semibold`, `uppercase`, `tracking-wider`, `text-text-secondary` |
| "Reset" button | `text-xs`, `font-medium`, `text-brand-rose`, `hover:text-brand-rose/80` |
| Reset icon | Heroicons `ArrowPathIcon` 16×16, inline before "Reset" text |

### 3.3 Collapsible Section Headers

Add an icon to each section. Each section header button has this structure:
```
[icon]  Section Name
        Subtitle text                [chevron]
```

**Section icons** (Heroicons outline, 18×18px, `text-brand-teal`):

| Section | Icon |
|---|---|
| Savings | `BanknotesIcon` |
| Spending | `ShoppingCartIcon` |
| Tax Settings | `ReceiptPercentIcon` |
| Home & Mortgage | `HomeModernIcon` |

**Styling:**

| Property | Value |
|---|---|
| Container | `px-4`, `py-3`, `hover:bg-white/50`, `transition-colors`, `rounded-lg`, `mx-2` |
| Section name | `text-sm`, `font-semibold`, `text-brand-navy` |
| Subtitle | `text-xs`, `text-text-secondary`, `font-normal` |
| Toggle icon | Replace `+`/`-` with Heroicons `ChevronDownIcon` 16×16 that **rotates 180°** when expanded (`transition-transform duration-200`) |
| Icon | `mr-3`, `flex-shrink-0` |

Add a `1px` `border-subtle` divider line between sections (`mx-4`).

### 3.4 Input Fields

| Property | Value |
|---|---|
| Container | `px-4`, `py-1` |
| Label | `text-sm`, `font-medium`, `text-text-primary`, `mb-1` |
| Input wrapper | `flex items-center`, `border border-border-subtle`, `rounded-lg`, `bg-white`, `focus-within:border-brand-teal`, `focus-within:ring-1 focus-within:ring-brand-teal/30`, `transition-all` |
| `$` prefix | `text-sm`, `text-text-muted`, `pl-3`, `select-none` |
| `%` suffix | `text-sm`, `text-text-muted`, `pr-3`, `select-none` |
| Input element | `text-base`, `font-normal`, `tabular-nums`, `text-text-primary`, `border-none`, `outline-none`, `bg-transparent`, `py-2.5`, `px-2`, `flex-1` |
| Select elements | Same border/radius treatment. Custom chevron icon (`ChevronDownIcon`) instead of browser default. |

### 3.5 Helper Text

Style for hints like `"Set to -1 to use state default"`:
```
text-xs, text-text-muted, italic, mt-1, px-4
```

---

## 4. MAIN CONTENT — GRID VIEW

### 4.1 Tab Switcher (Grid / Scenario)

**Current:** Two text buttons with underline active state.

**New:** Pill toggle style:

| Property | Value |
|---|---|
| Container | `inline-flex`, `bg-white`, `rounded-xl`, `p-1`, `shadow-sm`, `border border-border-subtle`, `mb-4` |
| Inactive tab | `px-5`, `py-2`, `text-sm`, `font-medium`, `text-text-secondary`, `rounded-lg`, `hover:text-text-primary`, `hover:bg-surface-warm`, `transition-all` |
| Active tab | `px-5`, `py-2`, `text-sm`, `font-semibold`, `text-white`, `bg-brand-navy`, `rounded-lg`, `shadow-sm` |

### 4.2 Explainer Box

**Current:** Blue-bordered box titled "What This Grid Shows" with technical language.

**New:**

| Property | Value |
|---|---|
| Container | `bg-white`, `border border-border-subtle`, `rounded-xl`, `p-5`, `mb-5`, `shadow-sm` |
| Title | **Remove** the "What This Grid Shows" heading entirely |
| Body text | See below |
| Text style | `text-sm`, `text-text-secondary`, `leading-relaxed` |
| Bold phrase | `"Find your comfort zone"` — `text-sm`, `font-semibold`, `text-brand-navy` |
| Settings gear icon | Keep in top-right. Style: `p-2`, `rounded-lg`, `hover:bg-surface-warm`, `text-text-secondary`, `hover:text-brand-navy`. Use Heroicons `Cog6ToothIcon` 20×20. |

**New body text:**

> **Find your comfort zone** — each cell shows how much money you'd have left each month after mortgage, taxes, insurance, retirement, and living costs. Green means comfortable. Red means stretched too thin. Click any cell for the full breakdown.

### 4.3 Heatmap Grid

#### 4.3.1 Table Container

| Property | Value |
|---|---|
| Wrapper | `bg-white`, `rounded-xl`, `border border-border-subtle`, `shadow-sm`, `overflow-hidden` |
| Scroll | `overflow-x-auto` with styled thin scrollbar (`brand-teal` thumb) |

#### 4.3.2 Column & Row Headers

| Element | Style |
|---|---|
| Corner cell `"Income \\ Price"` | `bg-surface-sidebar`, `text-xs`, `font-semibold`, `uppercase`, `text-text-secondary`, `sticky left-0 z-20`, `px-4 py-3` |
| Column headers (prices) | `bg-surface-sidebar`, `text-xs`, `font-semibold`, `text-text-secondary`, `px-4 py-3`, `text-right`, `sticky top-0 z-10`, `border-b border-border-subtle` |
| Row headers (incomes) | `bg-surface-sidebar`, `text-sm`, `font-semibold`, `text-brand-navy`, `px-4 py-3`, `sticky left-0 z-10`, `border-r border-border-subtle` |

#### 4.3.3 Cell Colors

Replace the current 3-color system:

| State | Background | Text Color |
|---|---|---|
| Affordable (surplus ≥ comfort buffer) | `brand-teal-light` (`#ccfbf1`) | `brand-teal-dark` (`#0f766e`) |
| Caution (surplus 0 to comfort buffer) | `brand-amber-light` (`#fef3c7`) | `brand-amber` (`#d97706`) |
| Unaffordable (negative surplus) | `brand-rose-light` (`#ffe4e6`) | `brand-rose` (`#e11d48`) |

All cells: `px-4`, `py-3`, `text-sm`, `font-semibold`, `text-right`, `tabular-nums`, `cursor-pointer`, `transition-all duration-150`.

#### 4.3.4 Crosshair Hover Effect (NEW)

When hovering over any data cell, highlight the entire row and column to help trace back to headers.

**Implementation:**
- Track `hoveredRow` and `hoveredCol` indices in React state.
- On cell `onMouseEnter`, set both indices. On `onMouseLeave`, clear both.
- Row highlight: apply `bg-brand-navy/[0.03]` to all cells in the same `<tr>`.
- Column highlight: apply `bg-brand-navy/[0.03]` to all cells sharing the same column index.
- The hovered cell itself: `ring-2 ring-brand-navy/20 ring-inset`, `z-10`, `relative`.

#### 4.3.5 Affordability Boundary Indicator (NEW)

For each cell that is **affordable** (green) and has an **unaffordable** (red) neighbor to its right or below:
- Apply `border-right-2 border-brand-navy/10` (if neighbor to right is red).
- Apply `border-bottom-2 border-brand-navy/10` (if neighbor below is red).

This creates a subtle visual "frontier line" across the grid.

### 4.4 Legend

**Current:** Three colored squares with text labels.

**New:** Horizontal gradient bar with labels.
```
  Comfortable          Tight            Over Budget
  ████████████████████████████████████████████████████
  (teal-light ──────── amber-light ──── rose-light)
```

| Property | Value |
|---|---|
| Container | `flex items-center gap-6`, `mt-4`, `px-2` |
| Gradient bar | `h-2`, `flex-1`, `rounded-full`, `max-w-md`, `background: linear-gradient(to right, #ccfbf1, #fef3c7, #ffe4e6)` |
| Left label | `text-xs`, `font-medium`, `text-brand-teal-dark`, `"Comfortable"` |
| Center label | `text-xs`, `font-medium`, `text-brand-amber`, `"Tight"` |
| Right label | `text-xs`, `font-medium`, `text-brand-rose`, `"Over Budget"` |
| Instruction text | `"Click any cell for full breakdown"` — `text-xs`, `text-text-muted`, `mt-2`, `italic` |

---

## 5. MAIN CONTENT — SCENARIO VIEW

### 5.1 Back Link (NEW)

Add above the scenario title:
```
← Back to Grid
```

| Property | Value |
|---|---|
| Style | `text-sm`, `font-medium`, `text-brand-teal`, `hover:text-brand-teal-dark`, `cursor-pointer`, `mb-2` |
| Behavior | Switches to Grid tab view |

### 5.2 Scenario Header

**Current:** `Scenario: $400,000 income, $1,000,000 home`

**New:**

| Property | Value |
|---|---|
| Title text | Abbreviate to `$400K income · $1M home` |
| Title style | `text-lg`, `font-bold`, `text-brand-navy` |

### 5.3 Verdict Badge (NEW)

Add below the scenario title, an inline colored badge:

| Condition | Badge BG | Badge Text Color | Border | Icon (Heroicons, 16×16) | Text |
|---|---|---|---|---|---|
| Surplus > comfort buffer | `brand-teal-light` | `brand-teal-dark` | `brand-teal/20` | `CheckCircleIcon` | `"Comfortably affordable"` |
| Surplus 0 to buffer | `brand-amber-light` | `brand-amber` | `brand-amber/20` | `ExclamationTriangleIcon` | `"Tight but possible"` |
| Surplus < 0 | `brand-rose-light` | `brand-rose` | `brand-rose/20` | `XCircleIcon` | `"Over budget"` |

Badge style: `inline-flex items-center gap-1.5`, `text-xs`, `font-semibold`, `px-3 py-1`, `rounded-full`, `mt-2`.

### 5.4 "Show Math" Button

**Current:** `Show Math`

**New:**

| Property | Value |
|---|---|
| Label | `"Show Calculations"` |
| Icon | Heroicons `CalculatorIcon` 14×14, inline before text |
| Style | `text-xs`, `font-medium`, `text-text-secondary`, `border border-border-subtle`, `rounded-lg`, `px-3 py-1.5`, `bg-white`, `hover:bg-surface-warm`, `hover:text-brand-navy` |

### 5.5 Hero Metric Cards

**Current:** Three cards with green-tinted backgrounds and green left borders.

**New:** White cards with colored **top** accent borders.

**All three cards share:**

| Property | Value |
|---|---|
| Container | `grid grid-cols-3 gap-4`, `mb-6` |
| Card | `bg-white`, `border border-border-subtle`, `rounded-xl`, `p-5`, `shadow-sm` |
| Top border | `4px solid [accent color]` (see per-card below) |
| Label style | `text-[11px]`, `font-semibold`, `uppercase`, `tracking-wider`, `text-text-secondary`, `mb-1` |
| Value style | `text-4xl`, `font-bold`, `tabular-nums` |
| Sublabel style | `text-sm`, `text-text-secondary`, `font-normal` |

**Card 1 — Monthly Surplus:**

| Property | Value |
|---|---|
| Label | Change from `MONTHLY SURPLUS` → `MONEY LEFT OVER` |
| Top border color | `brand-teal` (if surplus ≥ buffer), `brand-amber` (if 0–buffer), `brand-rose` (if < 0) |
| Value color | Matches top border color |
| Sublabel | `/month` |
| Secondary line | Add below value: `"monthly surplus"` in `text-xs`, `text-text-muted`, `italic` |

**Card 2 — Total Housing:**

| Property | Value |
|---|---|
| Label | Change from `TOTAL HOUSING` → `TOTAL HOUSING COST` |
| Top border color | `brand-navy` (always) |
| Value color | `brand-navy` |
| Sublabel | `/month` |

**Card 3 — Front-End Ratio:**

| Property | Value |
|---|---|
| Label | Change from `FRONT-END RATIO` → `HOUSING-TO-INCOME RATIO` |
| Top border color | `brand-teal` (if ≤ 28%), `brand-amber` (if 28–36%), `brand-rose` (if > 36%) |
| Value color | Matches top border color |
| Sublabel | Change from `housing / gross` → `of gross income` |
| Contextual note | Add below: `"Lenders typically recommend under 28%"` in `text-xs`, `text-text-muted`, `italic` |

### 5.6 Monthly Budget Breakdown Chart (NEW COMPONENT)

Add a horizontal stacked bar chart between hero cards and detail cards.

| Property | Value |
|---|---|
| Location | After hero cards, before Housing Costs / Taxes cards |
| Container | `bg-white`, `border border-border-subtle`, `rounded-xl`, `p-5`, `shadow-sm`, `mb-6` |
| Title | `"Where Your Money Goes"`, `text-sm`, `font-semibold`, `text-brand-navy`, `mb-4` |

**Bar chart** — a single horizontal stacked bar, `100%` width, `32px` height, `rounded-full`:

| Segment (left to right) | Color | Width |
|---|---|---|
| Federal + State Taxes | `#94a3b8` (slate-400) | `(taxes / gross) × 100%` |
| Housing | `#1a2b4a` (brand-navy) | `(housing / gross) × 100%` |
| Living Expenses | `#64748b` (slate-500) | `(living / gross) × 100%` |
| Retirement & Savings | `#0d9488` (brand-teal) | `(retirement + savings / gross) × 100%` |
| Money Left Over | `#ccfbf1` (brand-teal-light) with `brand-teal` border | remainder |

**Legend row** below the bar:
```
flex flex-wrap gap-x-6 gap-y-2, mt-3
Each item: flex items-center gap-2
  Color dot:  w-3 h-3, rounded-full, bg-[color]
  Label:      text-xs, text-text-secondary — e.g. "Taxes $9,439 (28%)"
```

**Implementation:** Build with plain `<div>` flex children — no charting library. Each segment is a `<div>` with `width: X%` and the appropriate background color. If surplus is negative, omit the surplus segment and optionally show a note.

### 5.7 Housing Costs & Taxes Detail Cards

**Current:** Two side-by-side cards with line items. Green left border.

**New:**

| Property | Value |
|---|---|
| Container | `grid grid-cols-2 gap-4`, `mb-4` |
| Card | `bg-white`, `border border-border-subtle`, `rounded-xl`, `p-5`, `shadow-sm` |
| Card heading | `text-xs`, `font-semibold`, `uppercase`, `tracking-wider`, `text-text-secondary`, `mb-4`, `pb-2`, `border-b border-border-subtle` |
| Line item row | `flex justify-between`, `py-1.5` |
| Line item label | `text-sm`, `text-text-secondary` |
| Line item value | `text-sm`, `font-semibold`, `tabular-nums`, `text-text-primary` |
| Total row | `flex justify-between`, `pt-3`, `mt-2`, `border-t border-border-subtle` |
| Total label | `text-sm`, `font-semibold`, `text-brand-navy` |
| Total value | `text-sm`, `font-bold`, `tabular-nums`, `text-brand-navy` |

### 5.8 Cash Flow Card

Keep the arithmetic layout. Improve visual hierarchy:

| Element | Style |
|---|---|
| Card | `bg-white`, `border border-border-subtle`, `rounded-xl`, `p-5`, `shadow-sm` |
| Heading | `"CASH FLOW"`, `text-xs`, `font-semibold`, `uppercase`, `tracking-wider`, `text-text-secondary`, `mb-4`, `pb-2`, `border-b border-border-subtle` |
| Top-level items (Gross Income, Take-home Pay, Monthly Surplus) | Label: `text-sm`, `font-semibold`, `text-brand-navy`. Value: `text-sm`, `font-bold`, `tabular-nums`, `text-brand-navy`. |
| Sub-items (deductions with `–` prefix) | Label: `text-sm`, `text-text-secondary`, `pl-4`. Value: `text-sm`, `tabular-nums`, `text-text-secondary`. |
| `=` separator lines (Take-home, Monthly Surplus) | `border-t border-border-subtle`, `pt-2`, `mt-2` |
| Monthly Surplus value | `brand-teal` if positive, `brand-rose` if negative, `font-bold` |

### 5.9 Audit / Calculation Detail Panel

**Current:** Right-side slide-in panel titled "Audit — Calculation Detail" with dark-green formula text.

**New:**

| Element | Style |
|---|---|
| Panel header | `bg-brand-navy`, `text-white`, `px-5`, `py-4` |
| Title | `"Calculation Detail"`, `text-base`, `font-semibold` |
| Subtitle | `"Full math behind this scenario"`, `text-xs`, `text-white/60` |
| Close button | `text-white/70`, `hover:text-white`, Heroicons `XMarkIcon` 20×20 |
| Section headers (INCOME, FEDERAL TAX, etc.) | `text-xs`, `font-semibold`, `uppercase`, `tracking-wider`, `text-brand-teal`, `mt-6`, `mb-3`, `pb-1`, `border-b border-border-subtle` |
| Line item label | `text-sm`, `text-text-primary` |
| Line item value | `text-sm`, `font-semibold`, `tabular-nums`, `text-right` |
| Formula text | `text-xs`, `text-text-muted`, `font-mono`, `mt-0.5` |
| Total/summary lines | `bg-surface-warm`, `-mx-5`, `px-5`, `py-2`, `font-semibold` |

---

## 6. GRID SETTINGS PANEL

**Current:** Right-side panel with inputs for Income min/max/step, Home Price min/max/step, Comfort Buffer.

**New:**

| Element | Style |
|---|---|
| Panel | Same slide-in pattern as Audit panel |
| Header | `bg-brand-navy`, `text-white`, `px-5`, `py-4` |
| Title | `"Grid Settings"`, `text-base`, `font-semibold` |
| Close button | `XMarkIcon`, `text-white/70` |
| Body | `p-5`, `bg-white` |
| Section headers | `text-xs`, `font-semibold`, `uppercase`, `tracking-wider`, `text-text-secondary`, `mb-3`, `mt-5` (first section `mt-0`) |
| Inputs | Same styling as sidebar inputs (Section 3.4) |

**Label rename:**

| Current | New | Helper Text |
|---|---|---|
| `Comfort Buffer` | `Safety Margin` | `"Monthly cushion needed to show as 'Comfortable' (green)"` — `text-xs`, `text-text-muted`, `italic`, `mt-1` |

---

## 7. RESPONSIVE / MOBILE

### 7.1 Tablet (md, ≤1024px)

**Current:** Hamburger menu opens sidebar as overlay.

**Changes:**

| Element | Style |
|---|---|
| Hamburger icon | Heroicons `Bars3Icon` 24×24, `text-brand-navy`, `p-2`, `hover:bg-surface-warm`, `rounded-lg` |
| Sidebar overlay background | `surface-sidebar` (not white) |
| Sidebar header | Same branded navy header from Section 2.1 |
| Close button | Heroicons `XMarkIcon`, `text-brand-navy` |
| Backdrop | `bg-brand-navy/20` |

### 7.2 Mobile (sm, ≤640px)

**Current:** Bottom tab bar with Inputs / Grid / Details.

**Changes:**

| Element | Style |
|---|---|
| Tab bar | `bg-white`, `border-t border-border-subtle`, `shadow-[0_-2px_8px_rgba(0,0,0,0.04)]`, `fixed bottom-0`, `pb-safe` |
| Active tab | `text-brand-teal`, `font-semibold` |
| Inactive tab | `text-text-muted` |
| Icons | 24×24 consistent sizing |
| Label | `text-xs`, `mt-0.5` |
| Grid on mobile | Horizontally scrollable with momentum scroll. Sticky first column (income). |

---

## 8. INTERACTION & ANIMATION

| Interaction | Animation |
|---|---|
| Section expand/collapse | Content: `max-height` transition, `duration-200`, `ease-out`. Chevron: `rotate-180`, `duration-200`. |
| Grid cell hover | Cell: `transition-all duration-150`. Crosshair highlight: instant (no transition). |
| Tab switch (Grid ↔ Scenario) | Content: opacity fade, `duration-150`. |
| Panel slide-in (Settings, Audit) | Panel: `translate-x-full → translate-x-0`, `duration-300`, `ease-out`. Backdrop: `opacity-0 → opacity-100`, `duration-200`. |
| Input focus | Border: `transition-colors duration-150`. Ring: `transition-shadow duration-150`. |

---

## 9. COMPLETE TEXT/LABEL CHANGES

| Location | Current | New |
|---|---|---|
| Browser `<title>` | `housing-temp` | `Home Affordability Modeler` |
| Sidebar header title | `Home Affordability Modeler` | `Home Affordability Modeler` (unchanged, add tagline below) |
| Sidebar header tagline | _(none)_ | `See what you can truly afford` |
| Explainer box title | `What This Grid Shows` | **Remove entirely** |
| Explainer box body | `Each cell shows your monthly surplus (money left after all expenses) for a given income (rows) and home price (columns). Positive = affordable; negative = over budget.` | `Find your comfort zone — each cell shows how much money you'd have left each month after mortgage, taxes, insurance, retirement, and living costs. Green means comfortable. Red means stretched too thin. Click any cell for the full breakdown.` |
| Legend green label | `Green: Meets comfort buffer (surplus ≥ $0/mo)` | Remove — replaced by gradient bar + `"Comfortable"` |
| Legend yellow label | `Yellow: Below comfort buffer ($0 to $0/mo)` | Remove — replaced by gradient bar + `"Tight"` |
| Legend red label | `Red: Unaffordable (negative surplus)` | Remove — replaced by gradient bar + `"Over Budget"` |
| Legend instruction | `Click any cell to see detailed breakdown of taxes, housing costs, and cash flow.` | `Click any cell for full breakdown` |
| Scenario title format | `Scenario: $400,000 income, $1,000,000 home` | `$400K income · $1M home` |
| Hero card 1 label | `MONTHLY SURPLUS` | `MONEY LEFT OVER` |
| Hero card 1 secondary | _(none)_ | Add `"monthly surplus"` in muted italic |
| Hero card 2 label | `TOTAL HOUSING` | `TOTAL HOUSING COST` |
| Hero card 3 label | `FRONT-END RATIO` | `HOUSING-TO-INCOME RATIO` |
| Hero card 3 sublabel | `housing / gross` | `of gross income` |
| Hero card 3 note | _(none)_ | Add `"Lenders typically recommend under 28%"` |
| Show Math button | `Show Math` | `Show Calculations` |
| Audit panel title | `Audit — Calculation Detail` | `Calculation Detail` |
| Audit panel subtitle | _(none)_ | `Full math behind this scenario` |
| Grid Settings: Comfort Buffer label | `Comfort Buffer` | `Safety Margin` |
| Grid Settings: Comfort Buffer helper | `Surplus needed to show green` | `Monthly cushion needed to show as 'Comfortable' (green)` |

---

## 10. IMPLEMENTATION ORDER

Implement in this order for incremental progress:

### Phase 1 — Tokens & Foundation
1. Add color tokens and typography overrides to `tailwind.config.js`
2. Update `index.html` `<title>` and favicon
3. Apply `surface-warm` background to body/root container
4. Apply `surface-sidebar` background to sidebar
5. Restyle sidebar header with navy background, icon, and tagline

### Phase 2 — Sidebar Polish
6. Install `@heroicons/react` (if not present)
7. Add section icons to collapsible headers
8. Replace `+`/`-` with animated chevron
9. Restyle all input fields with new border/focus treatment
10. Add section dividers

### Phase 3 — Grid View
11. Restyle tab switcher as pill toggle
12. Rewrite explainer box (remove title, new copy, new styling)
13. Apply new cell colors (`brand-teal-light`, `brand-amber-light`, `brand-rose-light`)
14. Implement crosshair hover effect
15. Implement affordability boundary indicator
16. Replace legend with gradient bar
17. Wrap grid table in rounded card container

### Phase 4 — Scenario View
18. Add "← Back to Grid" link
19. Abbreviate scenario title format
20. Add verdict badge component
21. Restyle hero metric cards (top accent, new labels, contextual notes)
22. Build "Where Your Money Goes" stacked bar chart
23. Restyle Housing Costs, Taxes, and Cash Flow detail cards
24. Restyle Audit panel header and body

### Phase 5 — Panels & Responsive
25. Restyle Grid Settings panel and rename Comfort Buffer → Safety Margin
26. Restyle mobile hamburger menu and sidebar overlay
27. Restyle mobile bottom tab bar
28. Add slide-in/fade animations for panels and tab switching
29. Final pass: spacing, shadows, transitions, edge cases

---

## 11. FILES LIKELY TO CHANGE
```
tailwind.config.js              — Extended theme (colors, font settings)
index.html                      — <title>, favicon
src/App.jsx (or .tsx)           — Root layout container bg color
src/components/Sidebar/         — Header, sections, input styling
src/components/Grid/            — Table, cells, hover logic, legend, explainer
src/components/Scenario/        — Hero cards, detail cards, cash flow, NEW bar chart, verdict badge
src/components/GridSettings/    — Panel styling, label rename
src/components/AuditPanel/      — Panel header, body formatting
src/index.css (or global CSS)   — Global styles, scrollbar, font-variant-numeric
package.json                    — Add @heroicons/react if missing
```