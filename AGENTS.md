# AGENTS.md

Guidance for AI coding agents working on **Couple Planner**.

## Project Overview

Couple Planner is a Vercel-hosted app for couples to share calendar, tasks, dates, trips, recipes, and entertainment. The frontend uses CDN-loaded React, Tailwind, Leaflet, and Lucide; the backend is a set of Vercel Serverless Functions with a Neon Postgres database. See `README.md` for full tech stack, routes, APIs, and data model.

## Critical Constraints

- **Vercel free plan**: maximum 12 serverless function files. Current layout uses 7 files. Consolidate auth behaviour into `api/auth/[...path].js` + `lib/auth-routes/`, and dashboard behaviour into `api/dashboard/[...path].js`; do not add new function files unless absolutely necessary.
- **No bundler or TypeScript**: plain `.js`/`.jsx` only; scripts loaded via `index.html` in a specific order.
- **CDN-first**: React, Babel, Tailwind, Leaflet, Lucide come from CDNs. Don’t add new build steps or npm build scripts.
- **localStorage caching**: preserve the existing cache/fallback when changing persistence; dashboard data is cached locally.
- **Data backward compatibility**: always add normalization/defaults when changing JSONB shape so old dashboard data still renders.
- **Secret keys**: never expose TMDB keys, JWT secrets, etc. in frontend files. Use proxy routes.
- **`APP_URL`**: must be set to `https://coupleplanner.app` in Vercel production env vars. It is the source of truth for all auth/email links (account confirmation, password reset, email preferences). The fallback in `lib/auth-shared.js` mirrors this value; always prefer the env var over the fallback in production.
- **dashboard table naming**: use `dashboards`, `dashboard_members`, `dashboard_join_codes`, `dashboard_data` in new queries. The `shelves` view exists only for legacy code.
- **Do not revert user changes** or unrelated work.

## Frontend Guidance

- Routing is handled by `media-tracker.jsx` and `vercel.json` rewrites. Keep both in sync when adding routes.
- Main components: `Login.jsx` (`/login`), `DashboardSelector.jsx` (dashboard list, create/join), `Header.jsx` (in-dashboard nav), `CalendarView.jsx`, `TasksView.jsx`, `DatesView.jsx` (Dates section — date ideas/places), `TripsView.jsx` (Trips section — trip planning), `RecipesView.jsx`, `MediaSectionsView.jsx`, etc.
- Visual design: warm red palette (`#E63B2E`), cream/off-white surfaces, Epilogue headings, Manrope body text. Use visible labels, accessible touch targets, and existing conventions.
- When adding a new category/feature: update navigation (Header), add/edit modals, persistence, empty states, and data normalization together.
- `window` globals are common; respect the script loading order in `index.html`.

## Backend/API Guidance

- Auth routes are dispatched through `api/auth/[...path].js`; route handlers live in `lib/auth-routes/`. Keep public `/api/auth/*` URLs stable without adding per-route function files.
- dashboard routes consolidated in `api/dashboard/[...path].js`. The catch-all parses `req.query.path` (do not rename).
- Always validate dashboard membership before read/write (`getUserIdFromRequest`).
- Owner-only actions (settings, share regeneration) check `dashboard_members.role`.
- Shared helpers in `lib/auth-shared.js` and `lib/db.js` — reuse them.
- Email templates and Resend sending live in `lib/email-templates.js`. Required account/security email must send even if `users.non_essential_email_opt_out` is true; only non-essential email should honor that opt-out.
- TMDB/Nominatim proxies require Bearer JWT; they are not public.
- URL fields: normalize to `http`/`https`; image fields: `http`/`https`/`data:image`; escape text before inserting into Leaflet popups or similar non-React sinks.

## Data Model Notes (see `README.md` for full table details)

- Recurring calendar events/tasks: render occurrences at render time; editing/deleting affects the whole series. Calendar events also support a `color` field (hex string) chosen from the AddModal palette.
- Task recurrence status stored in `lastCompletedAt`/`completionCount`; recurring tasks remain active. Each completion (recurring or one-off) appends an entry to `completionHistory` (`{ completedAt, completedBy, completedByName }`).
- Tasks support `priority` (`low`|`medium`|`high`|null), `assignedTo`, `dueDate`. Always normalize missing fields on load.
- Dates (the `dates` array) require `name`, `address`, `category`, `status` (`want-to-go`|`visited`), and `notes`. Old `locations` data and `beenThere` booleans are migrated automatically (see `lib/db.js`).
- Trips (the `trips` array) carry `destination`, `startDate`/`endDate`, `flights`, `hotel`, `budget`, `itinerary` (per-day plans), `packingList`, `placesToVisit`, `restaurants`, `documents`, `notes`. The legacy `expenses` data shape is *not* migrated — old expenses are dropped and the `trips` array starts empty.
- Section ids: legacy `locations`/`expenses` are remapped to `dates`/`trips` in both `lib/db.js` (`normalizeDashboardSections`) and the client (`utils/app-model.js`). Always run new section ids through `remapLegacySection` before comparing.
- Entertainment items are stored in `watchlist` as objects with `mediaType`, `title`, `status`, etc. Use the statuses listed in README.

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
- dashboard list/create/join/share/settings/profile flows still work.
- Add/edit/delete flows for calendar, tasks, dates, trips, recipes, entertainment still work.
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
