---
name: verify
description: Build, launch, and drive the leetcode-patterns app to verify changes end-to-end.
---

# Verifying leetcode-patterns changes

## Build & launch

```bash
cd leetcode-patterns
npm ci                      # node_modules is not checked in
npm run build               # tsc -b && vite build
npm run preview -- --port 4173 &   # serves dist/ at http://localhost:4173
```

The backend (`npm run server`) is NOT needed for the flashcards, patterns,
or landing pages — they are static data. A "Backend unreachable" banner on
the page is expected and harmless in this mode.

## Drive (headless browser)

Chromium is pre-installed at `/opt/pw-browsers/chromium`. Install
`playwright-core` in the scratchpad (not the repo) and launch with
`executablePath: "/opt/pw-browsers/chromium"`.

Routing is hash-based: `http://localhost:4173/#flashcards`, `#patterns`,
`#popular-lists`, `#interview-drill`, `#submit`.

## Flashcards flow

- Tag filter chips are buttons with exact-text names (`all`, `array`, `hash`, …).
- Click the card (`h2`) to flip it; the back has a "Visualize" button when
  the card has `viz` or `vizPath`.
- The algo-viz modal auto-plays frames (~900ms/step); wait ~2s before
  screenshotting so state is mid-animation. Escape closes the modal.
- Advance cards with the next-chevron button or ArrowRight.

## Gotchas

- External resource errors (ERR_CERT_AUTHORITY_INVALID, ERR_CONNECTION_RESET)
  in the console come from wallpaper/backend fetches through the sandbox
  proxy — not app bugs.
- `VizKind` is defined twice: `src/data/flashcards.ts` and
  `src/components/algo-viz/index.tsx`. New viz kinds must be added to both,
  plus the switch in `AlgoViz`.
