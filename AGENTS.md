# AGENTS.md

Guidance for AI coding agents working on **Couple Planner**.

## Project Overview

Couple Planner is a Vercel-hosted app for couples to share calendar, tasks, locations, trips, recipes, and a media watchlist. The frontend uses CDN-loaded React, Tailwind, Leaflet, and Lucide; the backend is a set of Vercel Serverless Functions with a Neon Postgres database. See `README.md` for full tech stack, routes, APIs, and data model.

## Critical Constraints

- **Vercel free plan**: maximum 12 serverless function files. Current layout uses 7 files. Consolidate auth behaviour into `api/auth/[...path].js` + `lib/auth-routes/`, and space behaviour into `api/space/[...path].js`; do not add new function files unless absolutely necessary.
- **No bundler or TypeScript**: plain `.js`/`.jsx` only; scripts loaded via `index.html` in a specific order.
- **CDN-first**: React, Babel, Tailwind, Leaflet, Lucide come from CDNs. Don’t add new build steps or npm build scripts.
- **localStorage caching**: preserve the existing cache/fallback when changing persistence; space data is cached locally.
- **Data backward compatibility**: always add normalization/defaults when changing JSONB shape so old space data still renders.
- **Secret keys**: never expose TMDB keys, JWT secrets, etc. in frontend files. Use proxy routes.
- **`APP_URL`**: must be set to `https://coupleplanner.app` in Vercel production env vars. It is the source of truth for all auth/email links (account confirmation, password reset, email preferences). The fallback in `lib/auth-shared.js` mirrors this value; always prefer the env var over the fallback in production.
- **Space table naming**: use `spaces`, `space_members`, `space_join_codes`, `space_data` in new queries. The `shelves` view exists only for legacy code.
- **Do not revert user changes** or unrelated work.

## Frontend Guidance

- Routing is handled by `media-tracker.jsx` and `vercel.json` rewrites. Keep both in sync when adding routes.
- Main components: `Login.jsx` (`/login`), `SpaceSelector.jsx` (space list, create/join), `Header.jsx` (in-space nav), `CalendarView.jsx`, `TasksView.jsx`, `DatesView.jsx` (locations), `TripsView.jsx`, `RecipesView.jsx`, `MediaSectionsView.jsx`, etc.
- Visual design: warm red palette (`#E63B2E`), cream/off-white surfaces, Epilogue headings, Manrope body text. Use visible labels, accessible touch targets, and existing conventions.
- When adding a new category/feature: update navigation (Header), add/edit modals, persistence, empty states, and data normalization together.
- `window` globals are common; respect the script loading order in `index.html`.

## Backend/API Guidance

- Auth routes are dispatched through `api/auth/[...path].js`; route handlers live in `lib/auth-routes/`. Keep public `/api/auth/*` URLs stable without adding per-route function files.
- Space routes consolidated in `api/space/[...path].js`. The catch-all parses `req.query.path` (do not rename).
- Always validate space membership before read/write (`getUserIdFromRequest`).
- Owner-only actions (settings, share regeneration) check `space_members.role`.
- Shared helpers in `lib/auth-shared.js` and `lib/db.js` — reuse them.
- Email templates and Resend sending live in `lib/email-templates.js`. Required account/security email must send even if `users.non_essential_email_opt_out` is true; only non-essential email should honor that opt-out.
- TMDB/Nominatim proxies require Bearer JWT; they are not public.
- URL fields: normalize to `http`/`https`; image fields: `http`/`https`/`data:image`; escape text before inserting into Leaflet popups or similar non-React sinks.

## Data Model Notes (see `README.md` for full table details)

- Recurring calendar events/tasks: render occurrences at render time; editing/deleting affects the whole series.
- Task recurrence status stored in `lastCompletedAt`/`completionCount`; recurring tasks remain active.
- Trips: normalize missing `startDate`, `endDate`, `itinerary`, etc. on load.
- Watchlist items are objects with `mediaType`, `title`, `status`, etc. Use the statuses listed in README.

## Verification

For UI-only checks, serve the repo root:

```powershell
python -m http.server 5173 --bind 127.0.0.1
# open http://127.0.0.1:5173/index.html
```

Checklist:

- `index.html` loads without errors.
- Public pages (`/`, `/login`, `/privacy-policy`, etc.) render with footer; signed-in redirects work.
- `/login?mode=signup` opens on register tab.
- Login, registration, password reset, and confirmation screens render.
- Space list/create/join/share/settings/profile flows still work.
- Add/edit/delete flows for calendar, tasks, locations, trips, recipes, watchlist still work.
- Media search still works.
- Offline/localStorage fallback still shows cached data.

There are no automated tests; if added, document in `README.md`.

## Agent Workflow

1. Read relevant files before making changes.
2. Keep changes scoped; do not refactor unrelated parts.
3. Prefer modifying existing modules and serverless route files.
4. Verify UI/routing/auth/persistence locally when touching those areas.
5. Update documentation when commands, env vars, routes, data shapes, or flows change.
6. When renaming concepts, update all references (code, DB, docs).
