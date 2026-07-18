---
name: verify
description: Build, launch, and drive housing-cost-modeler to verify changes end-to-end in a real browser.
---

# Verifying housing-cost-modeler

## Launch

```bash
npm run dev -- --port 5199 --strictPort   # run in background; ready in <1s
curl -s -o /dev/null -w "%{http_code}" http://localhost:5199/   # expect 200
```

Use a non-default port (not 5173) to avoid clashing with a dev server the user may have running.

## Drive (headless Chrome via puppeteer-core)

No Playwright in this project. `npm install puppeteer-core` in the scratchpad and drive system Chrome:

```js
executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
headless: 'new', userDataDir: mkdtempSync(...)  // temp profile — never touches user localStorage
```

Viewport ≥1024px wide for desktop layout (sidebar + grid); <768 for mobile tab bar.

## Gotchas

- **CSS uppercases header labels**: `innerText` returns "WORKS DOWN TO", not "Works down to". Match case-insensitively.
- **Typing into inputs via page.keyboard can hang** (CDP dispatchKeyEvent timeout). Set React inputs with the native-setter trick instead:
  `Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input, v); input.dispatchEvent(new Event('input',{bubbles:true}))`
- Grid Settings modal: `button[title="Grid Settings"]`; its inputs in order are income min/max/step, price min/max/step, surplus threshold (index 6).
- Cell click → scenario view; wait for "Back to Grid" text. Grid rows found by first `<td>` text like `$400,000`.
- App state persists to localStorage; a temp `userDataDir` isolates each run.

## Flows worth driving

- Grid: header sentence, break-even ("works down to") row, cell colors (diverging around $0, fixed anchor — same surplus ⇒ same color after changing price range).
- Set surplus threshold > 0 → amber underline ticks on cells in (0, threshold) + legend caption.
- Click teal cell → scenario view (badge, resilience line, KPI translations); click deep-rose cell → "Over budget" + "Needs at least …" variant.
