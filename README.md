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
**App**
- Task 1 - Buy domain
- Task 2 - Create logo
- Task 3 - Add app logo to login page above "Shared Shelf"
- Task 4 - Onboarding flow — First-time couple - Set your names/avatars
- Task 5 - Have 2 theme colors
- Task 6 - in-app activity feed, in the header add a notification bell and if you click it added a dropdown with the latest changes like "Added a new date spot" and "Completed 'Book flights'"
- Task 7 - "Our stats" — playful dashboard: "47 dates planned this year", "23 recipes cooked together", "8 countries visited"


**In Login Page**
In the login page for the app users should be able to register/ sign-in. Using both an email to register or use Google/Apple SSO. After creating account then you go to a screen like when you enter netflix with profiles but in this case its shelfs, where you see your shelfs horizontly and at the end on the right instead of the square for the shelf you have a [+] where you can create a new shelf. After creating the shelf you have a share button on the header and you can create a link to send to other users in order to join that shelf.
In the login page please change add a "Remember me" checkbox, Include a "Forgot password?" link
Also in the login page add a tag line like "Organize your life, together. Create your shared calendar, mark your favorite dating spots, favourite recipes and track your movies, tv shows and books."
When creating account add an input validation feedback in real-time (e.g., "Username must be at least 4 characters")


**Change Navigation**
Please updated header to be like this, from left to right:
1. Shelf logo - users can edit from profile the shelf logo
2. Shelf name - shelf name that was given when creating the specific shelf (that can be edited from shelf settings
3. Plan button - open tab which is composed of Tasks and Calendar tab
4. Go button - open tab which is composed of Dates, Trips and Recipes tab
5. Media Track button - open tab which is composed of TV Shows, Movies and Books tab
6. + Add
7. Settings
8. Account
9. Logout

Meaning that the big 8 horizontal tabs will disapear and will only have 3 main tabs that will be included inside the header.


**Tasks tab**
In the tasks tab, "Mark as completed" is not well implemented, at the moment it appears when i click a specific task. Please remove this mark as completed feature.


**Calendar**
In the calendar tab remove Export to Google Calendar button. Also let me edit activities in the agenda by clicking in them in the calendar or at the agenda that appears bellow.


**Dates**
In date tabs change "Been There" to "Visited". Also change the categories, which appears in filter, to All, Restaurant, Bar, Brunch, Viewpoint, Other, Fvourites and Visited.
Remove (check) Been there, it should be like this:
(Date Spot) (star, which you are able to click to add or remove from favourites) (check, instead of the written check it should be the emoji of a green check that you can click to add or remove as visited)
Bellow it has a tag with the category (removed the pinned)
Bellow it should have the 5 stars to evaluate but it is not well programmed, when i have my mouse for example in the middle start it should fill the starts before it, it is only filling the starts before after clicking.
Bellow it should have the address
Bellow have the Open in OpenStreetMap


**TV Shows**
In the TV Shows tab, add progress tracking for tv shows in Watching. The api should be able to get how many seasons and episodes the tv show has and you can mark in which season/ episode you are.