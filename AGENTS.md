# AGENTS.md

Guidance for AI coding agents working in this repository.

## Project Overview

Shared Shelf is a Vercel-hosted web app for shared planning. Users authenticate, create or join private shelves, and manage shared calendar, tasks, locations, trips, recipes, and watchlist (movies, TV shows, and books).

The app is intentionally lightweight and designed to deploy for free in Vercel:

- Frontend: React 18, ReactDOM, Babel Standalone, Tailwind CSS, Leaflet, and Lucide loaded from CDNs in `index.html`.
- App code: plain JavaScript/JSX in `media-tracker.jsx`, `config.js`, `components/`, and `utils/`.
- Backend: Vercel Serverless Functions in `api/`.
- Database: Vercel Postgres/Neon through `@vercel/postgres`.
- Auth: JWT sessions, `bcryptjs` password hashing, optional Resend password reset email.
- Local frontend edits do not require a build step.

## Important Constraints

- The project is on the Vercel free plan. Avoid adding new serverless function files unless necessary; on the free-plan there is a limit of 12 Serverless Functions per deployment.
- Prefer consolidating related shelf API behavior into `api/shelf/[...path].js` and the rewrites in `vercel.json`.
- Do not expose secret API keys in frontend files. External APIs requiring keys should be proxied through `api/`.
- Preserve localStorage cache/fallback behavior when changing persistence code.
- The app stores shelf data as JSON-ish application objects in `shelf_data.data` JSONB. Be conservative with data-shape changes and add migration/normalization logic when needed.
- Keep old saved shelf data rendering. Missing arrays/fields should get defaults at load/render time.

## Repository Map

- `index.html` - Entry point, CDN dependency loading, global theme CSS, and component script order.
- `media-tracker.jsx` - Main React application shell, auth restore, shelf selection, shelf data loading/saving, and top-level handlers.
- `config.js` - Root app constants/reference; runtime component scripts currently load globals from `components/Config.jsx`.
- `package.json` - Serverless/runtime dependencies; no package scripts are currently defined.
- `vercel.json` - Vercel function duration config and `/api/shelf` rewrites.
- `components/Config.jsx` - Runtime browser-global config/constants used by component scripts.
- `components/Login.jsx` - Sign in, registration, forgot password, and reset password UI.
- `components/ShelfSelector.jsx` - Post-login shelf list, create/join entry points, profile dropdown, and shelf management.
- `components/Header.jsx` - In-shelf navigation, global add, settings/profile/logout/back controls, sync status.
- `components/AddModal.jsx` - Global add modal plus edit modals for events, trips, and recipes.
- `components/CalendarView.jsx` - Calendar month grid and agenda.
- `components/TasksView.jsx` - Task list, editing, completion, assignment display, and reordering.
- `components/DatesView.jsx` - Date ideas, Nominatim search, categories, favorites, links, and map.
- `components/Dates.jsx`, `components/LeafletMap.jsx`, `components/NominatimSearch.jsx` - Alternate ES-module date/location components; not loaded by `index.html`.
- `components/TripsView.jsx` - Upcoming/past trip cards and trip detail view.
- `components/RecipesView.jsx` - Recipe list, search, detail, and editing.
- `components/MediaSectionsView.jsx`, `components/MediaCard.jsx`, `components/SearchModal.jsx`, `components/GlobalSearchModal.jsx` - Media display, search, add, statuses, and TV show progress.
- `components/ProfileModal.jsx`, `components/ShareShelfModal.jsx`, `components/JoinShelfModal.jsx` - Shelf settings, account/profile, sharing, and join/create flows.
- `components/UI.jsx`, `components/Icons.jsx`, `components/FormRenderer.jsx` - Reusable UI helpers.
- `utils/api.js` - Browser-global API helpers for auth, shelves, sharing, media search, and account updates.
- `utils/storage.js` - Legacy cloud/localStorage fallback helpers.
- `utils/helpers.js` - Shared formatting/filtering helpers.
- `api/auth/` - Authentication, account, and password reset routes.
- `api/shelf/[...path].js` - Consolidated shelf list/create/join/settings/share/data/membership route.
- `api/search.js`, `api/tvdetails.js`, `api/nominatim.js` - External API proxies.
- `api/setup.js`, `api/health.js` - Database setup and health checks.
- `lib/db.js` - Database schema initialization and legacy data helpers.
- `lib/auth-shared.js` - Shared auth helpers, JWT settings, CORS, Resend, profile migration helpers.
- `assets/logo.png` - App logo asset.
- `AGENTS.md` - Guidance for AI coding agents working in this repository.
- `README.md` - Human-facing architecture, setup, API, and usability notes.
- `skills/` - Local agent skill references and archives, not part of the runtime app.

## Coding Style

- Keep files plain JavaScript/JSX. There is no TypeScript setup.
- Match the existing CDN/global style: many modules expect browser globals from `index.html`.
- Respect script loading order when adding globals or components.
- Prefer small, focused helpers over broad refactors.
- Use existing constants from `config.js` or `components/Config.jsx` when possible.
- Keep comments useful and sparse.
- Use ASCII unless editing existing non-ASCII content that already requires it.

## Frontend Guidance

- Build the actual app experience, not a marketing page.
- Maintain responsive behavior for mobile and desktop.
- Keep touch targets comfortable and icon-only buttons accessible with labels/titles where appropriate.
- Preserve the current visual direction unless intentionally redesigning it: a high-contrast violet/pink palette inspired by `assets/ux_ui_color_palette.jpg`, light readable content surfaces, deep gradient app chrome, and clear focus rings.
- Prefer visible labels for form fields in authentication, joining, settings, and editing flows; placeholders can help but should not be the only cue.
- Keep body text on light surfaces near slate/black values and reserve white text for dark gradient or primary-action backgrounds.
- Use existing components and visual conventions before introducing new patterns.
- Avoid UI text that explains obvious mechanics or implementation details.
- When adding a new shared item/category, update navigation, add/edit flows, defaults, persistence, and empty states together.
- The active shelf header should continue to expose shelf settings, profile/account, logout, back-to-shelves, global add, and sync status.

## Backend/API Guidance

- Authentication routes live under `api/auth/`.
- Shelf-related routes are handled through `api/shelf/[...path].js` plus rewrites in `vercel.json`.
- Keep route responses consistent: return structured JSON with clear error messages and appropriate status codes.
- Use shared DB/auth helpers instead of duplicating token, CORS, password, or SQL logic.
- Validate user access to shelves before reading or mutating shelf metadata or shelf data.
- Owner-only behavior, such as shelf settings updates and share-code regeneration, should check `shelf_members.role`.
- Legacy `/api/data` persistence has been removed; use shelf-scoped APIs for current persistence behavior.
- TMDB and Nominatim proxy routes should require a bearer JWT because they expose server-side proxy capacity and, for TMDB, a server-held API key.
- User-provided URL fields should be normalized to safe `http`/`https` links before storage/rendering. Image fields should be limited to safe `http`/`https` URLs or known image data URLs. Escape saved text before passing it into non-React HTML sinks such as Leaflet popups.
- JWTs are intentionally stored in browser storage: `localStorage` for remembered sessions and `sessionStorage` otherwise. Treat XSS prevention as the main protection for those tokens because they are not HttpOnly cookies.

## Data Model Notes

Database tables initialized by `lib/db.js` include:

- `users`
- `shelf_id`
- `shelf_members`
- `shelf_join_codes`
- `shelf_data`
- `password_reset_tokens`
- legacy `user_data`

Shelf content can include:
shared calendar, tasks, locations, trips, recipes, and watchlist (movies, TV shows, and books).
- `calendarEvents`
- `tasks`
- `locations`
- `trips`
- `recipes`
- `watchlist`
- `profile`

Calendar events can include optional recurrence as `recurrence: { frequency, until }`, where frequency is `daily`, `weekly`, `monthly`, or `yearly`, and `until` can be blank for an open-ended series. The first recurrence version edits and deletes the whole series, so keep occurrence rendering derived from the base event rather than duplicating generated occurrences into saved data.

Tasks can include optional recurrence as `recurrence: { frequency }`, where frequency is `daily`, `weekly`, `monthly`, or `yearly`. Recurring task completion stores occurrence metadata such as `lastCompletedAt` and `completionCount`; it should keep the task active instead of moving it into the completed task group.

Trips can include `startDate`, `endDate`, `itinerary`, `bookings`, `notes`, and `packingList`. Normalize missing trip fields at load/render time so older trips with only destination/year/accommodation data remain usable.

Watchlist can be:

- `Movie`, `Tv Show` or `Book`.

Watchlist statuses:

- Movies/TV Shows: `plan-to-watch`, `watching`, `completed`
- Books: `plan-to-read`, `reading`, `read`

When adding fields to stored objects, ensure old saved data still renders.

## App Usability Expectations

- Homepage: users can sign in with email or username, register, remember their session, or request a password reset.
- Shelf selection: users can open existing shelves, create a shelf, join another shelf using shelf ID and join code, manage/remove their shelf membership, edit profile details, and log out.
- Shelf: users work inside one selected shelf. All members of the shelf read/write the same shelf JSON document.
- Sharing: shelf share information is exposed through share codes. Codes are one-time and expire after seven days; owners can regenerate them.
- Offline behavior: shelf data should be cached locally so the UI can remain useful when cloud calls fail.

## Verification

For simple frontend checks, run a local static server from the repo root:

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5173/index.html
```

Useful checks:

- `index.html` loads without console errors.
- Login, registration, session restore, and password reset screens still render.
- Shelf list/create/join/share/settings/profile flows still render and work when backend env is available.
- Add/edit/delete flows work for the touched category.
- Watchlist search still works for the touched category.
- Offline/localStorage fallback still behaves sensibly.

There are no package scripts or automated tests defined in `package.json` at the moment. If you add tests or scripts, document them in `README.md`.

## Deployment Notes

- `vercel.json` applies `maxDuration: 10` to `api/**/*.js`.
- Rewrites map `/api/shelf` and `/api/shelf/:path*` into the catch-all shelf route.
- Required environment variables include `POSTGRES_URL`; `TMDB_API_KEY` is needed for TMDB-backed search/details.
- Required production environment variables include `JWT_SECRET`; `SETUP_TOKEN` is required for production `/api/setup` calls; strongly recommended variables include `NOMINATIM_USER_AGENT`.
- Optional email variables include `RESEND_API_KEY`, `FROM_EMAIL`, and `APP_URL`.
- Resend sender domains must be verified before password reset email can be relied on in production.

## Agent Workflow

1. Read `README.md` and the relevant files before changing behavior.
2. Keep changes scoped to the requested feature or bug.
3. Do not revert user changes or unrelated work.
4. Prefer modifying existing modules over adding new top-level architecture.
5. Prefer modifying existing serverless route files over adding new function files when the behavior fits.
6. Verify locally when the change touches UI, routing, auth, storage, API behavior, or persistence.
7. Update documentation when commands, env vars, routes, data shapes, usability flows, or setup steps change.
