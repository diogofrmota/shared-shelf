# Couple Planner Audit (2026-05-02)

## Scope

Static audit of frontend, backend routes, configuration, and UX patterns.

## 1) Misconfigurations

1. **Vercel `maxDuration` may be too low for cold starts + upstream latency.**
   - `vercel.json` sets all API functions to `maxDuration: 10`, which can be tight for `/api/setup`, dashboard joins, and proxy calls under load.
2. **Broad SPA catch-all rewrite can hide missing-route mistakes.**
   - `/:path* -> /index.html` makes every unknown path look valid, which can mask deployment/path mistakes and analytics noise.
3. **Legacy auth helper points to `POST /api/auth` route that does not exist in current catch-all.**
   - `utils/storage.js` `authenticate()` posts to `/api/auth`, while real auth routes are `/api/auth/login` etc. This is dead/legacy behavior that can confuse maintainers.
4. **Nominatim default user-agent is app-specific but stale-branded.**
   - Falls back to `DiogoMonicaTracker/1.0`, which does not match product naming and may complicate provider policy compliance.

## 2) App design concerns

1. **Monolithic client orchestration in `media-tracker.jsx`.**
   - A very large top-level component coordinates auth, routing, persistence, modals, syncing, and navigation state. This increases regression risk and makes feature work slower.
2. **Heavy reliance on global `window` namespace.**
   - Many modules depend on globally attached functions/constants; this is fragile to script order and makes accidental runtime breakage easier.
3. **Mixed legacy + current persistence APIs.**
   - Current dashboard persistence coexists with legacy localStorage helpers and legacy keys, increasing cognitive load and risk of stale paths.

## 3) Performance risks

1. **Babel Standalone in browser (runtime transpilation).**
   - This adds startup parsing/transpilation overhead on every load and is expensive on mid/low-end mobile devices.
2. **Multiple external search calls from client-side flows.**
   - TV/anime search performs parallel third-party fetches and can increase latency/error variability, especially on weaker networks.
3. **Potentially large localStorage JSON writes.**
   - Legacy cache stores whole blobs; repeated full-object writes can block main thread and degrade responsiveness for large dashboards.
4. **Frequent debug logging in production path (`perfLog`).**
   - Although minimal, repeated debug logging can still add noise and overhead in large interactions.

## 4) Mobile design issues

1. **No explicit viewport safe-area handling.**
   - There is no visible use of `env(safe-area-inset-*)` patterns for notch/home-indicator padding.
2. **Dense header interactions on small screens.**
   - Header combines menu/settings/profile/share/editing behaviors in a complex interaction model that may feel crowded on small widths.
3. **Background gradients fixed to viewport.**
   - `background-attachment: fixed` can be janky on mobile browsers and may cause repaint cost.

## 5) UX/UI improvement opportunities

1. **Reduce user-facing route/flow ambiguity with explicit 404 view.**
   - Keep SPA rewrite but render an in-app “Page not found” state for unmatched routes.
2. **Add loading skeletons and optimistic states consistently.**
   - Especially for dashboard load, share generation, and media search to reduce perceived wait.
3. **Introduce stronger empty states + first-run onboarding.**
   - Guide couples through first dashboard setup, invite partner, and first entry per section.
4. **Standardize status/error toasts.**
   - Centralized feedback patterns reduce confusion across forms and settings panels.
5. **Improve accessibility affordances.**
   - Add explicit ARIA for dropdown/menus, keyboard escape handling consistency, and stronger contrast checks for muted text.

## Suggested priority order

1. Remove/retire legacy auth/persistence paths in `utils/storage.js` (or isolate as explicit migration-only layer).
2. Split `media-tracker.jsx` into smaller state domains (routing/auth/sync/ui shells).
3. Add route-level 404 rendering and basic mobile safe-area layout hardening.
4. Revisit API timeouts and add targeted retries/timeouts for upstream proxies.
5. Plan a lightweight build step (optional) to remove runtime Babel cost when/if deployment constraints allow.
