# Couple Planner

Lightweight Vercel-hosted web app for couples to plan together. Users create a private shared dashboard, invite their partner, and manage calendar, tasks, locations, expenses, recipes, and entertainment (movies, TV, books).

## Tech Stack

- Frontend: React 18 UMD, Babel Standalone, Tailwind CSS CDN, Leaflet, Lucide
- Backend: Vercel Serverless Functions (`api/`)
- DB: Vercel Postgres / Neon via `@vercel/postgres`
- Auth: JWT, `bcryptjs`, optional Resend email

## Frontend Routes

All paths rewrite to `index.html`; routing is handled in `media-tracker.jsx`.

| Path | Purpose | Auth |
| --- | --- | --- |
| `/` | Public homepage (hero, features, release notes, footer). Signed-in users → `/dashboard-selection/`. | Public |
| `/login` | Sign in, register, forgot/reset password, account confirmation. `?mode=signup`, `?reset_token`, `?confirm_token`. Signed-in → `/dashboard-selection/` | Public |
| `/privacy-policy`, `/terms-of-service` | Static legal pages with global footer | Public |
| `/report-a-bug` | Bug report form (opens email client) | Public |
| `/dashboard-selection/` | dashboard list, create/join, profile, logout | Signed-in |
| `/dashboard/<dashboard-id>/` | Main workspace with header, sections, settings, sharing | Signed-in |

Route workflow note: after login, users who already belong to a dashboard are sent directly to `/dashboard/<dashboard-id>/`. `/dashboard-selection/` is for signed-in users who do not yet have a private dashboard, or for invite links before joining.

## Key API Routes (Vercel Hobby plan: max 12 function files)

Vercel Hobby deployments allow no more than 12 Serverless Function files. This repo intentionally keeps the API surface consolidated into 7 function files:

- `api/auth/[...path].js` for all `/api/auth/*` routes.
- `api/dashboard/[...path].js` for all `/api/dashboard/*` routes.
- `api/search.js`, `api/tvdetails.js`, `api/nominatim.js`, `api/setup.js`, and `api/health.js`.

When adding API behavior, route it through an existing catch-all unless a new function file is absolutely necessary.

| Route | Purpose |
| --- | --- |
| `POST /api/auth/register` | Unverified account + confirmation email |
| `POST /api/auth/confirm-email` | Verify email token |
| `POST /api/auth/login` | Email/username login (returns JWT) |
| `GET /api/auth/me` | Current user profile |
| `PATCH /api/auth/me` | Update name/username |
| `POST /api/auth/forgot-password` | Create reset token + email |
| `POST /api/auth/reset-password` | Consume token, change password |
| `POST /api/auth/change-password` | Signed-in password change |
| `POST /api/auth/change-email` | Send new-email confirmation |
| `POST /api/auth/confirm-email-change` | Confirm new account email |
| `GET/POST /api/auth/email-preferences` | Unsubscribe from non-essential email |
| `GET /api/dashboard` | List user’s dashboards |
| `POST /api/dashboard` | Create dashboard + join code |
| `POST /api/dashboard/join` | Join dashboard with ID + code |
| `PATCH /api/dashboard/:id` | Owner updates dashboard settings |
| `GET /api/dashboard/:id/share` | Current share code and invite link |
| `POST /api/dashboard/:id/share` | Owner regenerates a one-use code/invite link |
| `GET /api/dashboard/:id/data` | Read dashboard JSON data |
| `POST /api/dashboard/:id/data` | Save dashboard JSON data |
| `DELETE /api/dashboard/:id/membership` | Leave dashboard |
| `GET /api/search` | TMDB proxy |
| `GET /api/tvdetails` | TMDB TV details proxy |
| `GET /api/nominatim` | Nominatim proxy |
| `GET/POST /api/setup` | DB schema init (requires `SETUP_TOKEN` in prod) |
| `GET /api/health` | DB health check |

Auth routes are dispatched by `api/auth/[...path].js`; individual auth handlers live in `lib/auth-routes/`. dashboard routes are consolidated into `api/dashboard/[...path].js` via `vercel.json` rewrites.

Share route note: `GET /api/dashboard/:id/share` returns the current read-only share state and never creates a join code. Owners use `POST /api/dashboard/:id/share` to create or refresh the one-use code and invite link. Members receive a read-only response with `canGenerateInvite: false`.

Browser configuration is intentionally kept in loaded global scripts (`components/Config.jsx` and `utils/api.js`). Do not add root ES module config/helper files unless the app gains a bundler or explicit module loading.

## Data Model (tables created by `lib/db.js`)

- `users`, `dashboards`, `dashboard_members`, `dashboard_join_codes`, `dashboard_data` (JSONB), `password_reset_tokens`, `email_verification_tokens`, `email_change_tokens`, `auth_rate_limits`
- `users.non_essential_email_opt_out` stores opt-out state for non-essential email. Required account/security email still sends.
- A `shelves` view over `dashboards` for compatibility; old `shelf_` tables are auto-migrated.

Typical `dashboard_data.data` JSONB shape:

```json
{
  "tasks": [...],
  "locations": [...],
  "calendarEvents": [...],
  "expenses": [...],
  "recipes": [...],
  "watchlist": [...],
  "profile": { "users": [] }
}
```

Recurrence fields: `recurrence: { frequency: "daily"|"weekly"|"monthly"|"yearly", until? }`.  
Locations may contain `lat`, `lng`, `geocodingStatus`, `geocodingError`, `geocodedAddress`, and `geocodedAt`; missing coordinates are normalized to `null` and shown with an address-search fallback.  
Expenses contain `description`, `amount` (number|null), `category` (`food`|`transport`|`accommodation`|`entertainment`|`shopping`|`health`|`other`), `date`, `paidBy`, `notes`.  
Entertainment statuses: Movies/TV: `plan-to-watch`, `watching`, `completed`; Books: `plan-to-read`, `reading`, `read`.

Always add normalization/defaults so old saved data still renders.

## Environment Variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `POSTGRES_URL` | Yes | Neon/Postgres connection |
| `JWT_SECRET` | Yes (prod) | ≥32 chars, random secret |
| `SETUP_TOKEN` | Yes (prod) | Protects `/api/setup` |
| `TMDB_API_KEY` | Yes (for media proxy) | Server-side key |
| `NOMINATIM_USER_AGENT` | Recommended | Required for Nominatim |
| `RESEND_API_KEY` | Optional (email) | Confirm/reset emails |
| `FROM_EMAIL` | Optional | Resend sender address (default: `noreply@coupleplanner.app`) |
| `SUPPORT_EMAIL` | Optional | Support contact in transactional emails (default: `support@coupleplanner.app`) |
| `APP_URL` | Yes (prod) | Base URL for auth/email links — set to `https://coupleplanner.app` |
| `CORS_ORIGINS` | Optional | Extra allowed CORS origins (comma-separated, e.g. `https://www.coupleplanner.app`) |

## Local Development

```powershell
npm install   # only for serverless dependencies
python -m http.server 5173 --bind 127.0.0.1
# open http://127.0.0.1:5173/index.html
```

Full auth/persistence requires Vercel env + Postgres.

## Production Setup

Set required env vars, then call `/api/setup` with the setup token:

```powershell
curl -X POST https://coupleplanner.app/api/setup -H "X-Setup-Token: <token>"
```

## Security & Implementation Notes

- All dashboard APIs require Bearer JWT; membership enforced.
- Login/reset responses are generic to avoid user enumeration.
- Account confirmation, password reset, email-change, and welcome emails use Resend from server-only code. All links use `APP_URL`; welcome email includes non-essential unsubscribe/preferences handling.
- TMDB & Nominatim proxies require JWT.
- dashboard JSON normalizes missing fields; user text rendered through React text nodes, URLs restricted to `http`/`https`, images to `http`/`https`/`data:image`.
- Tokens stored in `localStorage` (remembered) or `sessionStorage`; strictly avoid HTML rendering to prevent XSS.
- Prefer updating `api/auth/[...path].js`, `lib/auth-routes/`, or `api/dashboard/[...path].js` over adding new function files.
- Keep `dashboard_` table references; the `shelves` view is only for legacy queries.
- `lib/db.js` auto-migrates old tables; always create new tables with the `dashboard_` prefix.
- No bundler/TypeScript; plain JS/JSX in browser scripts.
- Recurring events/tasks render occurrences from base data; deleting/editing affects the whole series.
- Keep local cache behavior intact when modifying persistence.
- All UI component files in `components/`; `utils/` for helpers.
- `vercel.json` maps frontend routes and `/api/dashboard` catch-all, with `maxDuration: 10` for functions.
