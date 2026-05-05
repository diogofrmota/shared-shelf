# Edge Cases Needing Fix

Static review date: 2026-05-05

This list focuses on edge cases the current code does not handle correctly or handles only partially. References use `file:line` from the current tree.

## High Priority

### Debounced saves report false failures while a newer save is still pending

- References: `utils/api.js:585`, `utils/api.js:601`, `media-tracker.jsx:511`, `media-tracker.jsx:523`
- What happens: every new debounced save clears the previous timer and resolves the previous save promise with `false`. `MediaTracker` treats that `false` as a sync failure, restores deletion markers, and can show "Could not sync" while the newer save is simply waiting for debounce.
- User impact: normal fast editing can show false offline/sync errors and can keep stale deletion ids around.
- Fix direction: distinguish `superseded` from `failed`, or avoid resolving superseded promises as `false`. Only show sync failure after the latest pending persist actually fails.

### Offline/local cache edits are not retried automatically on reconnect

- References: `media-tracker.jsx:139`, `utils/api.js:533`, `utils/api.js:585`, `utils/api.js:616`
- What happens: failed saves are cached locally, but the `online` listener only flips `isOnline`; it does not flush the latest cached dashboard data or pending failed save. The app retries only if another data change happens.
- User impact: a user can edit offline, come back online, and believe data synced even though the server still has old data.
- Fix direction: keep an explicit dirty queue per dashboard and flush it on `online`, visibility return, login restore, and dashboard load. Surface unsynced state until the flush succeeds.

### Top-level items without ids can be impossible to edit safely, and deleting one can delete all id-less items

- References: `lib/db.js:132`, `lib/db.js:154`, `lib/db.js:184`, `lib/db.js:231`, `lib/db.js:250`, `media-tracker.jsx:714`, `media-tracker.jsx:715`, `media-tracker.jsx:733`, `media-tracker.jsx:734`, `media-tracker.jsx:751`, `media-tracker.jsx:752`, `media-tracker.jsx:799`, `media-tracker.jsx:800`, `media-tracker.jsx:890`, `media-tracker.jsx:891`
- What happens: normalizers preserve missing top-level ids instead of assigning stable ids. Handlers then filter by `item.id !== id`. If `id` is `undefined`, every item with a missing id is removed from that section.
- User impact: old imported/cached data, manually repaired JSONB, or legacy records can cause bulk accidental deletion.
- Fix direction: assign stable ids during client and server normalization for every top-level item in `calendarEvents`, `tasks`, `dates`, `trips`, `recipes`, and `watchlist`. Guard delete/update paths when `id` is missing.

### Concurrent saves can duplicate id-less items and cannot delete them reliably

- References: `api/dashboard/[...path].js:18`, `api/dashboard/[...path].js:22`, `api/dashboard/[...path].js:42`, `api/dashboard/[...path].js:48`
- What happens: merge keys id-less items as `source:index`, so the same legacy item from server and client becomes two items. Deletions are tracked by id, so id-less items cannot be included in deletion payloads.
- User impact: after a merge, legacy/id-less entries can duplicate or reappear.
- Fix direction: normalize ids before merging, or use a deterministic legacy fingerprint only as a migration bridge.

### One-dashboard-per-user is enforced only by preflight checks, not by the database

- References: `api/dashboard/[...path].js:71`, `api/dashboard/[...path].js:203`, `api/dashboard/[...path].js:290`, `lib/db.js:531`, `lib/db.js:607`, `lib/db.js:608`
- What happens: `userHasDashboard` is checked before create/join, but there is no unique constraint preventing two concurrent requests from inserting two dashboard memberships for the same user.
- User impact: double-clicks, duplicate tabs, or racing join/create requests can leave a user in multiple dashboards, while the UI assumes one.
- Fix direction: add a unique index on `dashboard_members(user_id)` if the product rule is truly one dashboard per user, and handle `23505` cleanly.

### Join codes are intended to be one-use but can be consumed concurrently by multiple users

- References: `api/dashboard/[...path].js:272`, `api/dashboard/[...path].js:319`, `api/dashboard/[...path].js:325`
- What happens: join checks select an unused code, then insert membership, then mark the code used. Two requests can select the same still-unused code before either updates it.
- User impact: a single invite can admit multiple users under race conditions.
- Fix direction: use a transaction or atomic `UPDATE ... WHERE is_used = false ... RETURNING id` before inserting membership.

### Dashboard creation can fail on random id collision without retry

- References: `api/dashboard/[...path].js:209`, `api/dashboard/[...path].js:213`
- What happens: dashboard ids are generated as two four-digit random chunks. A rare collision causes a primary key error and a 500-style failure rather than a retry.
- User impact: rare but confusing create failure.
- Fix direction: use `gen_random_uuid()`/`randomUUID()`, or retry on `23505`.

### Client API helpers are overwritten by older Config helpers

- References: `index.html:430`, `index.html:436`, `utils/api.js:114`, `utils/api.js:147`, `components/Config.jsx:185`, `components/Config.jsx:201`, `components/Config.jsx:253`
- What happens: `utils/api.js` exports safer/current search helpers first, then `components/Config.jsx` overwrites `window.searchMovies`, `window.searchTvShows`, `window.searchAnime`, and `window.searchBooks`.
- User impact: behavior depends on the older Config implementations, including direct third-party calls and less defensive transforms.
- Fix direction: keep one canonical set of API helpers. If Config must export constants, do not reassign the same function names.

### Jikan anime transforms can crash on missing nested image data

- References: `components/Config.jsx:153`, `components/Config.jsx:156`, `components/Config.jsx:215`, `utils/api.js:184`
- What happens: the active helper from `Config.jsx` reads `item.images.jpg.image_url` without optional chaining. If Jikan returns a partial item, the whole search mapping can throw and return no results.
- User impact: one malformed anime result can blank the TV search results.
- Fix direction: use the defensive `item.images?.jpg?.image_url || PLACEHOLDER_IMAGE` pattern and keep it in the active helper.

### localStorage/sessionStorage access can crash the app when browser storage is blocked

- References: `media-tracker.jsx:29`, `media-tracker.jsx:30`, `utils/api.js:221`, `utils/api.js:289`, `utils/api.js:327`
- What happens: optional chaining does not catch `SecurityError`. `getAuthToken` directly reads local/session storage without a try/catch.
- User impact: Safari private modes, strict privacy settings, or embedded browsers can fail before fallback UI renders.
- Fix direction: wrap all storage reads/writes in safe helpers and use in-memory fallback where possible.

### Malformed encoded dashboard URLs can crash routing

- References: `utils/app-model.js:48`, `utils/app-model.js:53`
- What happens: `decodeURIComponent(dashboardMatch[1])` is not guarded. A bad percent-encoded URL throws during route parsing.
- User impact: `/dashboard/%E0%A4%A/` or similar malformed shared links can break the app instead of showing not-found.
- Fix direction: catch decode errors and return a `not-found` route.

## Medium Priority

### Existing JWTs remain valid after password reset or email change

- References: `lib/auth-routes/reset-password.js:93`, `lib/auth-routes/reset-password.js:95`, `lib/auth-routes/confirm-email-change.js:79`
- What happens: password reset and email change update account data but do not revoke existing JWTs.
- User impact: a stolen or old session can remain valid after account recovery.
- Fix direction: add a token version/session invalidation timestamp to users and include it in JWT verification.

### Recurring tasks do not render actual occurrences

- References: `utils/app-model.js:94`, `utils/app-model.js:119`, `components/TasksView.jsx:35`, `components/TasksView.jsx:54`, `components/TasksView.jsx:193`
- What happens: tasks keep one row with recurrence metadata. Due/overdue state is calculated from the original `dueDate`, not the next recurrence occurrence.
- User impact: weekly/monthly recurring tasks can stay overdue forever after the first date, or fail to show the next due occurrence.
- Fix direction: compute current/next occurrence from recurrence + due date at render time, similar to calendar occurrence expansion.

### Invalid numeric fields can normalize to `NaN`

- References: `utils/app-model.js:129`, `lib/db.js:146`
- What happens: `Number(task.completionCount || 0)` becomes `NaN` when stored data contains a non-empty non-numeric string.
- User impact: counters and future calculations can display or persist invalid values.
- Fix direction: use finite-number helpers for task counts and clamp to non-negative integers.

### Calendar event colors are not normalized to valid hex colors

- References: `components/CalendarView.jsx:195`, `components/CalendarView.jsx:196`, `lib/db.js:154`, `utils/app-model.js:83`
- What happens: stored `event.color` is used directly in CSS concatenation like `color + '25'`. Invalid old values or arbitrary strings can produce broken visual styles.
- User impact: some events can render with missing/invalid colors or unreadable chips.
- Fix direction: normalize color to a known palette or strict `#RRGGBB`, with fallback to `#E63B2E`.

### Trip edits can create impossible date ranges

- References: `components/AddModal.jsx:603`, `components/AddModal.jsx:605`, `components/TripsView.jsx:227`, `components/TripsView.jsx:239`, `media-tracker.jsx:737`
- What happens: add flow blocks `endDate < startDate`, but inline trip editing allows changing either date independently with no validation.
- User impact: trips can show backwards ranges and later date-derived itinerary logic will be unreliable.
- Fix direction: validate in `handleUpdateTrip` or in `TripsView` before applying date patches.

### More than two dashboard members are allowed, but media "Who" filters only expose up to two people

- References: `api/dashboard/[...path].js:290`, `media-tracker.jsx:981`, `media-tracker.jsx:997`, `media-tracker.jsx:1016`
- What happens: join flow does not cap dashboard members, but `mediaWatchOptions` only adds the other member when `byId.size === 2`.
- User impact: if a dashboard has three or more members, personal media items for extra members can be hidden with no filter option.
- Fix direction: either enforce a two-member dashboard invariant server-side or render a filter for every member.

### Edit date closes before async geocoding/update completes

- References: `components/AddModal.jsx:1141`, `components/AddModal.jsx:1152`, `components/AddModal.jsx:1170`, `media-tracker.jsx:807`, `media-tracker.jsx:826`
- What happens: `EditDateModal` calls async `onSave` without awaiting it and closes immediately. Address updates can finish later, fail silently, or race with other date edits.
- User impact: users get no saving/error state for slow address lookups and can navigate away believing the update is done.
- Fix direction: make edit-date submit async, await `onSave`, show saving/error state, and only close on success.

### Address autocomplete bypasses the authenticated proxy and has no timeout/cancellation

- References: `components/AddModal.jsx:539`, `components/AddModal.jsx:541`, `components/AddModal.jsx:1118`, `components/AddModal.jsx:1120`, `api/nominatim.js:9`
- What happens: final geocoding uses authenticated `/api/nominatim`, but autocomplete calls Photon directly from the browser with no abort controller.
- User impact: autocomplete can hang, continue after close, or behave differently from final geocoding. It also avoids the same auth/rate-control boundary.
- Fix direction: add a proxy or timeout/cancellation for suggestions, and ignore stale responses after modal close.

### Media search has no duplicate handling before adding an item

- References: `components/SearchModal.jsx:151`, `components/SearchModal.jsx:152`, `media-tracker.jsx:641`, `media-tracker.jsx:642`
- What happens: adding the same result twice appends duplicate watchlist entries with the same id/category.
- User impact: status/progress/delete operations update or remove every duplicate with that id/category, because handlers match by id.
- Fix direction: prevent duplicates per `category:id`, or convert add into update/bring-to-front behavior.

### Watchlist merge can collapse distinct items that share a title and lack ids

- References: `utils/app-model.js:276`, `utils/app-model.js:285`, `lib/db.js:280`, `lib/db.js:289`
- What happens: migration keys watchlist items by `category:id || title || index`. Two different title-identical items without ids in the same category collapse into one.
- User impact: legacy items can disappear during normalization.
- Fix direction: assign ids before de-duping, or include more fields in a deterministic legacy fingerprint.

### Register/profile validation rejects many valid real names and usernames from existing data

- References: `lib/auth-shared.js:32`, `lib/auth-shared.js:40`, `lib/auth-routes/register.js:69`, `lib/db.js:364`
- What happens: display names allow only `A-Za-z` and spaces, while migration can seed usernames from old display names that may contain spaces, accents, punctuation, or be over 20 chars.
- User impact: international names cannot be used in registration/profile, and migrated usernames may not be editable back to their current value.
- Fix direction: decide product rules, then align migration, validation, and UI. If couples can use accented names, validate Unicode letters.

### Login lock counters can race under concurrent failed attempts

- References: `lib/auth-routes/login.js:93`, `lib/auth-routes/login.js:101`, `lib/auth-routes/login.js:103`
- What happens: failed count is read, computed in JS, then written. Parallel failed requests can overwrite each other with the same `nextFailedCount`.
- User impact: lockout can trigger later than intended under parallel attack traffic.
- Fix direction: increment with one atomic SQL update and use `RETURNING failed_login_count`.

## Lower Priority / Cleanup

### Public route normalization can leave stale search params in internal route state

- References: `media-tracker.jsx:105`, `media-tracker.jsx:168`, `components/Login.jsx:85`, `components/Login.jsx:111`, `components/Login.jsx:137`
- What happens: some login flows mutate `window.history` directly to strip query params, bypassing `navigateTo` and `currentUrlRef` bookkeeping.
- User impact: back/forward behavior around confirmation/reset links can become inconsistent.
- Fix direction: route all URL changes through one navigation helper or notify `MediaTracker` after direct history replacement.

### Rate-limit rows count successful attempts too

- References: `lib/auth-shared.js:274`, `lib/auth-shared.js:281`, `lib/auth-routes/login.js:43`, `lib/auth-routes/register.js:80`, `lib/auth-routes/forgot-password.js:35`
- What happens: `consumeRateLimit` inserts before the protected action and keeps the row even if the action succeeds.
- User impact: legitimate repeated successes can hit the same limit as abuse, especially forgot-password/register flows during testing.
- Fix direction: split "attempt" limits from failure limits, or apply stricter counters only after failed outcomes.

### Setup DELETE can still be exposed if production `SETUP_TOKEN` is weak

- References: `api/setup.js:13`, `api/setup.js:16`, `api/setup.js:57`
- What happens: production requires a token, but there is no strength check for `SETUP_TOKEN` equivalent to the JWT secret check.
- User impact: a weak setup token protects a destructive database wipe endpoint.
- Fix direction: validate token length/entropy in production, or remove `DELETE /api/setup` from production.

