# Migrating LeetCards to the App Store

**Recommendation: wrap the existing React SPA with [Capacitor](https://capacitorjs.com).**
The app is a Vite + React 19 SPA with all heavy lifting (judging, LLM review,
storage) already behind an HTTP API, which is the ideal shape for a WebView
shell. Capacitor reuses ~95% of the current code, keeps the Netlify web deploy
untouched, and adds native iOS/Android projects that load the same `dist/`
bundle. A React Native rewrite is not justified — no screen here needs
native-level rendering performance.

## Component mapping

| Current tech piece | Where it lives | App Store counterpart |
| --- | --- | --- |
| React 19 + Vite + TypeScript SPA | `leetcode-patterns/src/` | Capacitor WebView shell (`@capacitor/ios`, `@capacitor/android`); same `vite build` output copied via `npx cap sync` |
| Tailwind CSS 4 UI | `src/index.css`, components | Unchanged; add `viewport-fit=cover` + `env(safe-area-inset-*)` padding for notch/home-indicator |
| Hono API server | `server/app.ts` → `netlify/functions/api.mts` | Stays server-side; the native app calls `https://leetcodecards.com/api/*` over `fetch`/`CapacitorHttp` — nothing runs on-device |
| Netlify Blobs (prod) / better-sqlite3 (dev) storage | `server/blobs-store.ts`, `server/sqlite-store.ts` | Stays server-side; add `@capacitor-community/sqlite` later only if offline drill history is wanted |
| Judge0 code execution | `server/judge0Client.ts`, `judgeHarness.ts` | Stays remote — required for App Store guideline 2.5.2 (no downloading/executing code on device); server-side execution is compliant |
| Anthropic LLM review | `server/reviewClient.ts` | Stays behind the API proxy; API key never ships in the app binary |
| `localStorage` user state (userId, wallpaper prefetch) | `src/lib/`, `index.html` inline script | `@capacitor/preferences` — WKWebView may evict `localStorage` under storage pressure; migrate reads through a small adapter |
| Camera capture | `src/components/CameraCapture.tsx` | `@capacitor/camera` (falls back to `getUserMedia` on web); needs `NSCameraUsageDescription` in `Info.plist` |
| Theory tab PDFs (SICP-JS, DDIA, NP list) | `public/*.pdf`, `src/lib/theoryBooks.ts` | Bundle in the app package (offline win) or keep remote; WKWebView renders PDFs natively, page bookmarks/deep links keep working |
| Wallpaper fetch (GitHub API + wsrv.nl) | `src/lib/wallpaper.ts` | Allowed remote fetch; list both hosts in the iOS ATS config (already HTTPS, so default ATS passes) |
| Problem/data build pipeline | `scripts/*.ts`, `refresh.py` | Unchanged — runs at build time, output ships inside the web bundle |
| Netlify CI/CD (PR previews, gated prod deploy) | GitHub Actions + Netlify | Add a release lane: GitHub Actions builds `dist/`, then fastlane or Xcode Cloud archives, signs, and uploads to TestFlight/App Store Connect |

## Migration steps (~1–2 weeks to TestFlight)

1. `npm i @capacitor/core @capacitor/ios && npx cap init` inside
   `leetcode-patterns/`; commit the generated `ios/` project.
2. Point `capacitor.config.ts` `webDir` at `dist/`; set `server.url` unset so
   the bundle ships offline-first, with API calls going to production.
3. Swap the `localStorage` adapter and `CameraCapture` to Capacitor plugins
   (both behind feature detection so the web build is untouched).
4. Add app icons, splash screen, safe-area CSS, and `Info.plist` privacy
   strings (camera).
5. Wire fastlane into CI; ship to TestFlight, then submit for review.

**Review risks to plan for:** Apple rejects thin "repackaged website" apps
(guideline 4.2) — the offline PDF library, camera capture, and (later) offline
drills are the native-value story to cite. Account deletion must be offered
in-app if accounts are ever added; today's anonymous `userId` avoids that.
