# Shared Shelf

Shared Shelf is a lightweight Vercel-hosted web app for shared planning. Users sign in, create or join private shared lists called shelves, invite other users to those shelves, and manage shared calendar events, tasks, locations, trips, recipes, and a watchlist for movies, TV shows, and books.

Each shelf is a private group with its own unique shelf ID. A shelf can have multiple members, and all members read and write the same shelf content.

The app is intentionally simple on the frontend: React, Babel, Tailwind, Leaflet, and Lucide are loaded from CDNs in `index.html`, so local UI changes do not require a build step. The backend is deployed on Vercel's free plan with a free Neon Postgres database, so shelf-related APIs are consolidated to stay under the free-plan function limit.

## User Experience

### Public Homepage

The root URL `https://shared-shelf.vercel.app/` is the public homepage. It introduces Shared Shelf to people who have not signed in, with a hero section, an explanation of what the app is, who it is for, how private shelves work, a feature overview for calendar, tasks, locations, trips, recipes, and watchlist, and clear `Sign in` and `Create account` calls to action that link to `/login`. A release notes section near the bottom of the homepage lists the most recent app updates. Returning users who already have a remembered session are redirected from `/` to `/shelf-selection/` automatically, so the app experience stays smooth for signed-in users.

A global footer is rendered on the homepage, login screen, legal pages, and bug report page. It shows `© [Year] Shared Shelf` on the left and links to `Privacy Policy` (`/privacy-policy`), `Terms of Service` (`/terms-of-service`), and `Report a Bug` (`/report-a-bug`).

### Login Page

The login page is at `/login`. It shows the Shared Shelf logo, the tagline "Organize your life, together.", a `Back to homepage` link, and a centered authentication panel.

Users can click the `Sign In` and `Register` tabs to switch between forms. Visiting `/login?mode=signup` opens the page directly on the `Register` tab; the `mode` query parameter is consumed and removed on first render. In `Sign In`, the page shows visible labels for `Email or Username` and `Password`, a `Remember me` checkbox, a `Forgot password?` action, and a `Login` button. Submitting a verified account's email or username with the correct password logs the user in and opens the shelf selection page. Checking `Remember me` stores the JWT in `localStorage` for longer-lived access; otherwise the token is stored in `sessionStorage` for the current browser session.

Clicking `Forgot password?` opens a reset-password popup where users enter their email address. If the address belongs to an account, the server creates a one-hour reset token and sends a reset email through Resend when email is configured. The response is intentionally generic so unknown emails are not disclosed.

In `Register`, the page shows `Name`, `Username`, `Email`, and `Password` fields plus a `Create Account` button. The form validates the same rules as the API: name is required, 20 characters or fewer, and letters/spaces only; username is required, unique, 20 characters or fewer, and letters/numbers only; email must include `@`; password must include at least five letters and at least one number. Special characters are allowed in passwords. Creating an account does not log the user in. Instead, the server creates an unverified account, stores a hashed confirmation token, and sends a confirmation email. Users can sign in only after opening the confirmation link.

If `/login` is opened with a reset token in the URL, it switches to the reset-password form. Users can enter a new password, click `Update password`, and then return to sign in. `Back to sign in` leaves the reset form without changing the password. If `/login` is opened with a confirmation token in the URL, it confirms the account and then prompts the user to sign in.

Login, register, confirmation, and reset errors appear inside the authentication panel or popup. Messages are specific enough to help users fix input, such as a missing password number, invalid credentials, an already-used username, or an unconfirmed account.

Signed-in users who navigate to `/login` are redirected to `/shelf-selection/`.

### Legal Pages and Bug Report

`/privacy-policy` and `/terms-of-service` render simple, readable legal pages with the global header and footer. They are reachable from the footer on every public page. `/report-a-bug` renders a short bug report form with title, description, optional steps to reproduce, and optional reply email. Submitting the form opens the user's email client with the report pre-filled and also offers a `Copy report` button so the user can paste the report somewhere else if a mail client is unavailable.

### Shelf Selection Page

After login, users land on the shelf selection page at `/shelf-selection/`, titled `Join Your Shared Space`. This page lists the shelves connected to the signed-in account as square shelf tiles with shelf names underneath. When a new user has no shelves yet, an empty state prompts them to create a shelf or join one with a shelf ID and code.

Clicking a shelf tile opens that shelf and loads its shared content. The `Add / Join a Shelf` tile opens a modal with `Create` and `Join` tabs. In `Create`, users enter a shelf name and choose which shared items the shelf should include: `Calendar`, `Tasks`, `Locations`, `Trips`, `Recipes`, and `Watchlist`. Clicking `Create` creates the shelf, adds the user as a member, and opens it. In `Join`, users enter a `Shelf ID` and `Join Code`; clicking `Join` adds the user to that shelf when the code is valid.

The `Manage` button toggles shelf removal mode. In manage mode, each shelf tile shows a delete control. Clicking it asks for confirmation and then removes the current user's membership from that shelf. `Cancel` exits manage mode.

The `Profile` button opens a profile panel showing the account name, username, and email. Clicking `Edit Information` changes the panel into editable name and username fields; `Save` updates the account, and `Cancel` discards the edit. The `Logout` button clears the current session and returns to the login page.

### Shelf Page

The shelf page at `/shelf/<shelf-id>/` is the main workspace for a selected shelf. It has a sticky blue header and a content area that changes based on the selected shelf section.

The header shows the shelf name on the left, followed by icon-labeled tabs for the enabled shared items. `Calendar`, `Tasks`, `Locations`, `Trips`, and `Recipes` open their matching views. `Watchlist` opens a media chooser with three square options for `TV Shows`, `Movies`, and `Books`; selecting one opens that specific watchlist. The active tab is highlighted.

On the right side of the header, `Settings` opens shelf settings and `Profile` opens the account modal. Adding content is done from the body of the current section with an add button for that shelf item. The profile modal shows the account name, username, and email, then provides `Edit Information`, `Back`, and `Logout` actions in a vertical stack. `Back` returns to the shelf selection page without logging out.

Shelf settings let users edit the shelf name, enable or disable shared item sections, and manage sharing. The share panel shows the shelf ID and current one-time join code, with `Copy` buttons for each. `Generate New` creates a fresh join code. `Save Changes` persists shelf name and shared-item settings; `Cancel` closes without saving local edits.

The account modal shows the current user's name, username, and email. `Edit Information` lets the user update name and username. `Logout` signs out from inside the shelf.

### Shelf Content Views

`Calendar` shows a responsive month grid and agenda. Previous and next arrow buttons change the visible month. `Today` returns to the current month. Clicking a date filters the agenda to that day; clicking the selected day again clears the filter. Activities can repeat daily, weekly, monthly, or yearly, with an optional repeat-until date. Recurring activities render as occurrences in the month grid and agenda. Clicking any occurrence opens the edit activity modal for the whole series, and deleting a recurring occurrence confirms that the whole series will be removed.

`Tasks` shows all tasks with filters for `All`, `Active`, and `Completed`. Each task has a completion checkbox, title, optional description, assigned user, optional due date, and optional recurrence. Recurring tasks can repeat daily, weekly, monthly, or yearly. Checking a recurring task records the current occurrence as done and keeps the task active, with a clear repeat badge and last-done status in the list. Active tasks can be reordered with move buttons or drag and drop. The edit button changes a task into editable title, description, and recurrence fields. The delete button removes the task. Completed non-recurring tasks are grouped and can be expanded or collapsed in the all view.

`Locations` shows a Leaflet map, category filters, favourite and visited filters, and location cards. Location cards can focus the map marker, toggle favourite, mark visited, set a star rating, add/change/remove a photo, open a saved website link, open the place in OpenStreetMap, or delete the place.

`Trips` separates `Next Trips` and `Past Trips`. Each trip card keeps a readable summary with destination, trip dates or year, optional photo, optional accommodation link, and compact counts for itinerary, bookings, and packing progress. Clicking a card opens a trip detail view with itinerary items, booking links, notes, and packing list details. Adding or editing a trip supports start and end dates, itinerary rows, booking information for accommodation, transport, reservations, trip notes, packing items, photo URL, and legacy accommodation URL.

`Recipes` includes a search field for recipe name or ingredient. Recipe cards show the recipe photo, name, prep time, and source link when available. Clicking a recipe opens its detail modal with ingredients and instructions. The detail modal can close or open edit mode. Hover actions on cards allow editing or deleting.

`Watchlist` contains `TV Shows`, `Movies`, and `Books`. TV shows and movies are grouped into `Watching`, `Planned to Watch`, and `Completed`. Books are grouped into `Reading`, `To Be Read`, and `Read`. Each media card shows cover art, title, author when available, rating/year metadata, and a menu button. The menu changes status or removes the item. TV shows in `Watching` also show a progress button that opens season/episode progress controls.

The media search modal is used when adding TV shows, movies, or books. It contains a search field, loading and empty states, and result cards. Clicking a result adds it to the current watchlist category with the default status.

### Visual Design

The current UI uses a warm red editorial palette based on the `/new_ui` references: vibrant red accents (`#E63B2E`), soft cream/off-white surfaces, Epilogue headings, and Manrope body text. The login screen keeps immersive red app chrome, while shelf selection and shelf workspaces use light editorial canvases with readable brown/slate text, compact top navigation, visible form labels, and warm focus rings.

## Design And Architecture

Shared Shelf has a public landing page at `/` for new visitors and a focused app experience for signed-in users. The homepage explains what the app is, who it is for, how private shelves work, the main features, and the latest changelog entries. The login page at `/login` uses a compact centered panel so authentication is the only task. The shelf selection page uses large shelf tiles because the main decision is which shared space to enter, plus a first-use empty state when the account has no shelves. The shelf page uses a persistent high-contrast header so navigation, add actions, settings, account controls, back navigation, logout, and sync state remain visible while users work. A shared footer renders on the homepage, login, legal, and bug report pages with copyright on the left and footer links on the right.

The application uses a CDN-first frontend architecture. `index.html` loads React 18, ReactDOM, Babel Standalone, Tailwind CSS, Leaflet, and Lucide from CDNs, then loads browser-global scripts from `utils/`, `components/`, and `media-tracker.jsx`. Because JSX is transformed in the browser, local frontend edits can be checked with a static server and do not need a bundler or build step.

The backend uses Vercel Serverless Functions. Auth routes live under `api/auth/`; most shelf behavior is consolidated into `api/shelf/[...path].js` and reached through rewrites in `vercel.json`. This keeps the deployment within the Vercel free-plan limit of 12 serverless function files.

Authentication is JWT-based. Passwords are hashed with `bcryptjs`; login accepts either email or username plus password. Session duration is controlled by the `rememberMe` flag: normal sessions use the standard JWT expiry, and remembered sessions use a longer expiry. Account registration creates `email_verified = false` and stores a hashed email-confirmation token in `email_verification_tokens`. The `/api/auth/confirm-email` route verifies the JWT purpose, compares the token against the stored hash, marks the account as verified, and consumes the token. Login rejects unverified users.

Password reset follows a similar token pattern. `/api/auth/forgot-password` stores one hashed reset token per user in `password_reset_tokens` and emails a reset link. `/api/auth/reset-password` verifies the reset JWT purpose, compares the token hash, updates the password hash, and consumes the token.

The database is initialized and migrated by `lib/db.js`, with shared auth helpers in `lib/auth-shared.js`. User profile records store email, username, display name, password hash, and verification status. Existing users from older schemas are migrated with `email_verified = true` so established accounts are not locked out when the verification column is introduced.

Shelves are configurable. When a shelf is created or edited, users can choose which sections are visible for that shelf. Disabled sections are hidden from the header and from the global add chooser, which keeps smaller shelves focused.

Shared data is organized by category but persisted as one shelf-scoped JSON document. The UI keeps old data usable by normalizing missing arrays and legacy watchlist fields at load time. The app also caches shelf data in `localStorage`, so the interface remains useful when cloud calls fail.

The interface uses simple modals for focused tasks: creating or joining a shelf, adding content, editing content, editing shelf settings, sharing a shelf, and editing account details. Buttons that mutate data give immediate UI feedback through loading, disabled, copied, empty, or validation states where applicable.

## Tech Stack

- Frontend: React 18 UMD, ReactDOM, Babel Standalone, Tailwind CSS CDN
- UI/runtime libraries: Leaflet for maps, Lucide for icons
- Backend: Vercel Serverless Functions in `api/`
- Database: Vercel Postgres / Neon via `@vercel/postgres`
- Auth: email or username plus password, `bcryptjs` password hashing, JWT sessions via `jsonwebtoken`
- Email: Resend integration for account confirmation and password reset mail
- External data: TMDB proxy, Jikan, Open Library, and OpenStreetMap Nominatim proxy

## Repository Structure

```text
shared-shelf/
|-- index.html                  # App entry point, CDN scripts, global CSS/theme, component loading order
|-- media-tracker.jsx           # Main React shell, auth restore, shelf selection, shelf state orchestration
|-- config.js                   # Root app constants/reference; runtime globals are loaded from components/Config.jsx
|-- package.json                # Serverless/runtime dependencies; no npm scripts currently
|-- vercel.json                 # Function duration config and /api/shelf rewrites
|-- AGENTS.md                   # Guidance for AI coding agents
|-- README.md                   # Project documentation
|-- assets/
|   `-- logo.png                # Login/logo asset
|-- api/
|   |-- health.js               # Database health check
|   |-- nominatim.js            # Nominatim proxy for location search
|   |-- search.js               # TMDB multi-search proxy
|   |-- setup.js                # Initializes database schema
|   |-- tvdetails.js            # TMDB TV details proxy
|   |-- auth/
|   |   |-- confirm-email.js    # Consumes account confirmation tokens
|   |   |-- forgot-password.js  # Creates password reset token and sends reset email when possible
|   |   |-- login.js            # Email/username login
|   |   |-- me.js               # Current account read/update
|   |   |-- register.js         # Account registration
|   |   `-- reset-password.js   # Password reset token consumption
|   `-- shelf/
|       `-- [...path].js        # Shelf list/create/join/settings/share/data/membership catch-all route
|-- components/
|   |-- AddModal.jsx            # Global add modal and edit modals
|   |-- BugReport.jsx           # /report-a-bug page with bug report form
|   |-- CalendarView.jsx        # Calendar month/agenda view
|   |-- Config.jsx              # Browser-global constants and legacy helpers
|   |-- DatesView.jsx           # Location cards, filters, Nominatim search helpers, map
|   |-- Footer.jsx              # Global footer with copyright and legal links
|   |-- FormRenderer.jsx        # Shared form rendering helper
|   |-- GlobalSearchModal.jsx   # Library-wide search modal
|   |-- Header.jsx              # In-shelf navigation/header
|   |-- HomePage.jsx            # Public homepage with hero, features, CTAs, and release notes
|   |-- Icons.jsx               # Icon wrappers exposed globally
|   |-- JoinShelfModal.jsx      # Create/join shelf modal
|   |-- LegalPages.jsx          # /privacy-policy and /terms-of-service pages
|   |-- Login.jsx               # /login sign in/register/reset UI
|   |-- MediaCard.jsx           # Media item card and TV show progress modal
|   |-- MediaSectionsView.jsx   # Media status sections
|   |-- ProfileModal.jsx        # Shelf settings, sharing, profiles, account modal modes
|   |-- RecipesView.jsx         # Recipe list/detail/edit UI
|   |-- SearchModal.jsx         # Media search/add modal
|   |-- ShareShelfModal.jsx     # Share-code modal
|   |-- ShelfSelector.jsx       # Shelf landing, profile dropdown, shelf management
|   |-- TasksView.jsx           # Task list, editing, completion, ordering
|   `-- TripsView.jsx           # Trip cards and editing
|-- lib/
|   |-- auth-shared.js          # Shared auth, JWT, CORS, Resend, and profile migration helpers
|   `-- db.js                   # Postgres schema initialization and legacy data helpers
|-- utils/
|   |-- api.js                  # Browser-global API/search/auth/shelf helpers
|   |-- helpers.js              # Shared browser helper functions
|   `-- storage.js              # Legacy cloud/localStorage fallback helpers
`-- skills/                     # Local agent skill references; not part of app runtime
```

## Frontend Routes

The single-page app handles client-side routing via `window.history` and `vercel.json` rewrites that map all known paths to `index.html`.

| Path | Purpose | Auth |
| --- | --- | --- |
| `/` | Public homepage with intro, features, CTAs, and release notes. Signed-in users are redirected to `/shelf-selection/`. | Public |
| `/login` | Sign in, register, forgot password, password reset, and account confirmation flows. Accepts `?mode=signup` to open on the register tab, `?reset_token=...` for password reset, and `?confirm_token=...` for account confirmation. Signed-in users are redirected to `/shelf-selection/`. | Public |
| `/privacy-policy` | Static privacy policy page. | Public |
| `/terms-of-service` | Static terms of service page. | Public |
| `/report-a-bug` | Bug report form that opens the user's email client with the report pre-filled. | Public |
| `/shelf-selection/` | Authenticated shelf list, create/join, manage, and profile. | Signed in |
| `/shelf/<shelf-id>/` | Authenticated shelf workspace. | Signed in |

Unauthenticated visits to authenticated routes are redirected to `/`.

## Data Model

Current shared-shelf data is stored by shelf:

- `users`: account records with email, username, display name, password hash, and optional provider IDs.
- `email_verification_tokens`: one active confirmation token per unverified user.
- `shelf_id`: shelf metadata such as unique shelf ID, name, owner, logo, enabled shared items, and timestamps.
- `shelf_members`: user-to-shelf membership and role.
- `shelf_join_codes`: one-time join codes that expire after seven days.
- `shelf_data`: one JSONB document per shelf.
- `password_reset_tokens`: one active reset token per user.
- `user_data`: legacy per-user JSON table kept for compatibility.

The shelf JSON document can contain:

```json
{
  "tasks": [
    {
      "id": "task-...",
      "title": "",
      "description": "",
      "assignedTo": null,
      "dueDate": null,
      "completed": false,
      "recurrence": { "frequency": "weekly" },
      "lastCompletedAt": null,
      "completionCount": 0
    }
  ],
  "locations": [],
  "calendarEvents": [
    {
      "id": "event-...",
      "title": "",
      "date": "2026-04-27",
      "startDate": "2026-04-27",
      "endDate": "2026-04-27",
      "time": "",
      "description": "",
      "recurrence": { "frequency": "weekly", "until": "2026-06-30" }
    }
  ],
  "trips": [
    {
      "id": "trip-...",
      "destination": "",
      "year": 2026,
      "tripType": "next",
      "startDate": "",
      "endDate": "",
      "photo": "",
      "accommodation": "",
      "itinerary": [],
      "bookings": [],
      "notes": "",
      "packingList": []
    }
  ],
  "recipes": [],
  "watchlist": [],
  "profile": { "users": [] }
}
```

When adding new fields, keep old saved shelf data rendering by adding normalization or defaults in the loading path.

## API Routes

| Route | Purpose |
| --- | --- |
| `POST /api/auth/register` | Create an unverified user account and send a confirmation email |
| `POST /api/auth/confirm-email` | Confirm a registered account from an email token |
| `POST /api/auth/login` | Login with email or username and password after email confirmation |
| `GET /api/auth/me` | Read the current account |
| `PATCH /api/auth/me` | Update account name/username |
| `POST /api/auth/forgot-password` | Create reset token and send email when Resend is configured |
| `POST /api/auth/reset-password` | Reset password from token |
| `GET /api/shelf` | List shelves for the current user |
| `POST /api/shelf` | Create a shelf and initial join code |
| `POST /api/shelf/join` | Join a shelf with shelf ID and join code |
| `PATCH /api/shelf/:id` | Owner-only shelf settings update |
| `GET /api/shelf/:id/share` | Read or create current share code |
| `POST /api/shelf/:id/share` | Owner-only share code regeneration |
| `GET /api/shelf/:id/data` | Read shelf JSON data |
| `POST /api/shelf/:id/data` | Save shelf JSON data |
| `DELETE /api/shelf/:id/membership` | Leave/remove shelf membership for current user |
| `GET /api/health` | Database health check |
| `GET /api/setup` | Initialize database schema |
| `GET /api/search` | Authenticated TMDB search proxy |
| `GET /api/tvdetails` | Authenticated TMDB TV details proxy |
| `GET /api/nominatim` | Authenticated OpenStreetMap Nominatim search proxy |

Shelf routes are consolidated through `api/shelf/[...path].js` and the rewrites in `vercel.json` to stay within the Vercel free-plan limit of 12 Serverless Functions per deployment.
Older databases that still have a `shelves` metadata table are migrated to `shelf_id` by `lib/db.js`; a compatibility view named `shelves` is kept for legacy code paths.
Legacy `/api/data` persistence has been removed. Current persistence must use authenticated shelf-scoped routes.

## Media Status Values

Movies and TV shows:

| Value | Label |
| --- | --- |
| `plan-to-watch` | To Watch |
| `watching` | Watching |
| `completed` | Completed |

Books:

| Value | Label |
| --- | --- |
| `plan-to-read` | To be Read |
| `reading` | Reading |
| `read` | Read |

Calendar events, trips, tasks, locations, and recipes use their own fields instead of media statuses. Calendar event recurrence is optional; `recurrence.frequency` can be `daily`, `weekly`, `monthly`, or `yearly`, and `recurrence.until` may be blank for an open-ended series. Editing or deleting recurring events currently applies to the whole series. Task recurrence is optional as `recurrence: { "frequency": "daily" | "weekly" | "monthly" | "yearly" }`. Recurring task completion stores `lastCompletedAt` and increments `completionCount`; recurring tasks stay active instead of moving into the completed group. Trips are normalized on load so older saved trips without `startDate`, `endDate`, `itinerary`, `bookings`, `notes`, or `packingList` still render with safe defaults.

## External APIs

| API | Used for | Key required |
| --- | --- | --- |
| TMDB | Movie, TV, and TV episode metadata | Yes, via serverless proxy |
| Jikan | Additional TV show search/details | No |
| Open Library | Book search and covers | No |
| Nominatim | Place/address search | No key, but a User-Agent is recommended |

Do not expose secret keys in frontend files. TMDB calls that need a key should go through `api/search.js` or `api/tvdetails.js`.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `POSTGRES_URL` | Yes | Vercel Postgres/Neon connection used by `@vercel/postgres` |
| `JWT_SECRET` | Required in production | JWT signing secret. Production requests fail without a non-default value. |
| `CORS_ORIGINS` | Optional | Comma-separated extra origins allowed to call authenticated APIs. `APP_URL`, the current Vercel URL, and local dev origins are already handled. |
| `SETUP_TOKEN` | Optional | Required to call `/api/setup` in production. Send it as `X-Setup-Token` or `Authorization: Bearer ...`. |
| `TMDB_API_KEY` | Required for TMDB search/details | Server-side TMDB API key |
| `NOMINATIM_USER_AGENT` | Recommended | Identifies the app to Nominatim |
| `RESEND_API_KEY` | Required for production account confirmation | Enables account confirmation and password reset emails |
| `FROM_EMAIL` | Optional | Sender address for Resend mail |
| `APP_URL` | Optional | Base URL used in account confirmation and password reset links |

## Local Development

Install dependencies for serverless functions if needed:

```powershell
npm install
```

For simple frontend checks, serve the repo root:

```powershell
python -m http.server 5173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:5173/index.html
```

Static serving is enough to inspect frontend rendering, but authenticated flows and cloud persistence require the Vercel API environment and Postgres variables.

Useful manual checks after UI or data changes:

- Public homepage at `/` renders with hero, features, calls to action, and release notes when signed out.
- Returning users are redirected from `/` to `/shelf-selection/` automatically.
- `/login` renders the sign-in form by default and opens on the register tab when visited as `/login?mode=signup`.
- `/privacy-policy`, `/terms-of-service`, and `/report-a-bug` render with the global footer.
- Submitting the bug report form opens the system email client with a pre-filled message.
- Login, registration, email confirmation, remembered session restore, forgot-password popup, and password reset screens render.
- Shelf list, create, join, share-code, profile, settings, and leave/manage flows still work.
- Add/edit/delete flows work for the touched shelf section.
- Media search still works for the touched media category.
- Offline/localStorage fallback remains sensible when shelf data cannot be fetched.
- `index.html` loads without console errors.

There are no package scripts or automated tests currently defined in `package.json`. If scripts or tests are added, document them here.

## Security Notes

All shelf APIs require a valid bearer JWT. Listing shelves is scoped to memberships, shelf settings updates require the current user to be an owner, share-code regeneration requires the current user to be an owner, and shelf data reads/writes require membership in that shelf. If an owner leaves a shelf that still has members, the oldest remaining member is promoted so owner-only controls remain available.

The TMDB and Nominatim proxy routes also require a valid bearer JWT before they call upstream services. This keeps API-key-backed and server-side proxy behavior limited to signed-in users without adding new Vercel function files.

Shelf JSON is normalized on read and write. Stored user text is rendered through React text nodes where possible, URL fields are limited to safe `http`/`https` links, image fields are limited to `http`/`https` images or base64 `data:image` values, and Leaflet popup HTML escapes saved place names/addresses before binding the popup.

Sessions are JWT-based and sent with the `Authorization` header. With `Remember me` enabled, the token is stored in `localStorage` so it survives browser restarts until JWT expiry. Without `Remember me`, the token is stored in `sessionStorage`, which usually clears when the tab or browser session ends. This app does not use HttpOnly cookies, so a successful XSS bug could read the token from browser storage; the current mitigation is to avoid raw HTML rendering and strip unsafe stored URLs.

## Implementation Notes

- Keep browser code plain JavaScript/JSX. There is no TypeScript or bundler setup.
- Most browser modules expose functions/components on `window`; respect the script loading order in `index.html`.
- Prefer updating existing API catch-all routes over adding new function files where it fits.
- Validate shelf membership before reading or mutating shelf data.
- Preserve local cache behavior when changing persistence.
- Keep data-shape changes backward compatible with existing JSONB shelf documents.

## Future Ideas

- Buy and configure a custom domain.
- Refine logo/brand usage across login and shelf screens.
- Add onboarding for first shelf setup, member names, and avatars.
- Add shelf theme customization.
- Add an in-app activity feed for recent changes.
- Add shared stats such as locations saved, recipes cooked, and trips taken.
- Confirm Resend sender-domain setup before relying on password reset email in production.
