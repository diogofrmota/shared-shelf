# Shared Shelf

Web app for managing everything in a relationship, such as shared calendar, trips, dates, recipes, and tracking movies, TV shows, anime, and books.

## Architecture

### File structure

```
relationship-dashboard/
├── index.html                 # Entry point — loads React, Babel, Tailwind via CDN
├── media-tracker.jsx          # Full React application (self-contained, no build step)
├── config.js                  # API endpoints and app constants
├── package.json               # @vercel/postgres dependency
├── README.md                  # Project documentation
├── vercel.json                # Vercel function config
├── .gitignore                 # Git ignore rules for node_modules, .env, etc.
│
├── api/
│   ├── data.js               # Serverless function — GET/POST/PUT user data
│   ├── health.js             # Serverless function — database health check
│   ├── nominatim.js          # Proxy for OpenStreetMap Nominatim (place search)
│   └── search.js             # Proxy for TMDB search (hides API key)
│
├── lib/
│   └── db.js                 # Vercel Postgres helpers (getUserData, saveUserData, etc.)
│
├── components/               # Modular components
│   ├── Icons.jsx             # SVG icon components (Search, Plus, Film, Tv, Book, etc.)
│   ├── MediaCard.jsx         # Card component for displaying media items with status menu
│   ├── SearchModal.jsx       # Modal for searching and adding new media items
│   ├── GlobalSearchModal.jsx # Modal for searching across the user's entire library
│   ├── Header.jsx            # App header with title, search/add buttons, and tab navigation
│   ├── UI.jsx                # Reusable UI components (FilterButton, FilterBar, EmptyState, etc.)
│   ├── AddModal.jsx          # Modal for adding new items (media via search, others via forms)
│   ├── Dates.jsx             # Date spots section with map and location management
│   ├── LeafletMap.jsx        # Leaflet map wrapper component for displaying interactive maps
│   └── NominatimSearch.jsx   # Place search component using OpenStreetMap Nominatim API
│
├── utils/
│   ├── api.js                # External API calls (TMDB, Jikan, Google Books)
│   ├── storage.js            # Cloud sync + localStorage fallback
│   └── helpers.js            # Shared helper functions (debounce, status formatting, filtering)
│
└── trips/                    # (Reserved for future trip‑related assets)
```

### Database schema

```sql
CREATE TABLE user_data (
  user_id    TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

The entire library is one JSONB blob per user:

```json
{
  "movies": [],
  "tvshows": [],
  "books": [],
  "calendarEvents": [],
  "trips": [],
  "recipes": [],
  "dates": []
}
```

The schema is created automatically on the first API call (`CREATE TABLE IF NOT EXISTS` runs in `api/data.js`).

### Status values

**Movies, TV shows, Anime**

| Value | Label |
|---|---|
| `plan-to-watch` | To Watch |
| `watching` | Watching |
| `completed` | Completed |

**Books**

| Value | Label |
|---|---|
| `plan-to-read` | To Read |
| `reading` | Reading |
| `read` | Read |

*Calendar events, trips, date spots, and recipes do not use status tracking.*

### API layer (`lib/db.js`)

```javascript
getUserData(userId)           // → { data, updatedAt } | null
saveUserData(userId, data)    // → { success, updatedAt }
deleteUserData(userId)        // → true
cleanupOldData(daysOld)       // → rowCount  (utility, not called by routes)
checkConnection()             // → boolean
initializeDatabase()          // → boolean  (called on cold start in api/data.js)
```

### Storage layer (`utils/storage.js`)

```javascript
getStoredData()         // cloud first, falls back to localStorage cache
saveData(data)          // writes to cloud + localStorage simultaneously
clearStoredData()       // clears cloud + localStorage
exportData()            // returns JSON string of current data
importData(jsonString)  // validates and saves imported data
checkCloudConnection()  // pings /api/health
forceCloudSync()        // forces upload of local data to cloud
```

### Environment variables

| Variable | Source | Purpose |
|---|---|---|
| `POSTGRES_URL` | Auto-injected by Vercel Postgres | Pooled connection (used by `@vercel/postgres`) |
| `POSTGRES_URL_NON_POOLING` | Auto-injected by Vercel Postgres | Direct connection |
| `TMDB_API_KEY` | Set manually in Vercel dashboard | Available to serverless functions |
| `NOMINATIM_USER_AGENT` | Optional, set in Vercel | Identifies app to Nominatim (OSM) |

### Adding a new status (media items only)

1. Add the value to `STATUS_CONFIG` in `config.js`
2. Add a label to `STATUS_LABELS`
3. Add a CSS class to `STATUS_STYLES`
4. Add to `FILTER_CONFIG` for the relevant category

### Adding a new API source

1. Add search function to `utils/api.js`
2. Add endpoint config to `config.js`
3. Mirror the inline equivalent in `media-tracker.jsx`
4. Wire into the `SearchModal` switch statement

## APIs

| API | Used for | Key required |
|---|---|---|
| [TMDB](https://www.themoviedb.org/) | Movies & TV shows | Yes (free) |
| [Jikan](https://jikan.moe/) | Anime | No |
| [Google Books](https://books.google.com/) | Books | No |
| [Nominatim](https://nominatim.openstreetmap.org/) | Place search (date spots, trips) | No (but requires User-Agent) |

TMDB search is proxied through `/api/search` to keep the API key secure.

## Tech stack

- React 18 via CDN (no build step)
- Tailwind CSS via CDN
- Vercel Postgres / Neon (cloud storage, free tier)
- Vercel (hosting, free tier)
- Leaflet (interactive maps)

## Current issues to fix for next version
App
- Task 1 - Buy domain
- Task 2 - Create logo

In Login Page
- Task 1 - Add app logo to login page above "Shared Shelf"
- Task 2 - Change "Please enter your credentials to login" → "Sign in to your shared space."
- Task 3 - Add a "Remember me" checkbox
- Task 4 - Include a "Forgot password?" link
- Task 5 - Add a "Create account" option
- Task 6 - Add Google/Apple SSO
- Task 7 - Add a subtle testimonial or tagline: "Organize your life, together."
- Task 8 - Add input validation feedback in real-time (e.g., "Username must be at least 4 characters")

Main Dashboard (Post-Login)
- Task 1 - Add avatar in profile (*)
- Task 2 - In Porfile you can set User 1 name, User 2 name, and can add more users (button) (*)
- Task 2 - "Add" button should be a global add (+) that lets you quickly add to any category (*)
- Task 3 - Add a subtle "last synced" indicator or online status dot on header (*)
- Task 4 - Add to header a "Profile button" that lets you edit profile (*)

Navigation
- Task 1 - 9 tabs is too many for horizontal tabs, do a bottom nav (mobile-first thinking)
- Task 2 - Group related items - Plan → Tasks, Calendar; Go → Dates, Trips; Enjoy → Recipes, TV Shows, Movies, Books

Tasks
- Task 1 - When adding task - Assign to User 1 or User 2
- Task 2 - When adding task - Due date
- Task 3 - When selecting appears a buttom called "Mark as completed"

Calendar (*)
- Task 1 - Export to Google Calendar button

Dates (*)
- Task 1 - "Been there" toggle — not just favorites
- Task 2 - Rating system (1-5 stars) — your own private rating per spot
- Task 3 - Photo upload

TV Shows (*)
- Task 1 - Add progress tracking — "S2 E5" not just Watching/Completed

Missing Features
- Task 1 - Onboarding flow — First-time couple - Set your names/avatars
- Task 2 - Have 2 theme colors
- Task 3 - in-app activity feed, in the header add a notification bell and if you click it added a dropdown with the latest changes like "Added a new date spot" and "Completed 'Book flights'"
- Task 4 - "Our stats" — playful dashboard: "47 dates planned this year", "23 recipes cooked together", "8 countries visited"