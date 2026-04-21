# Media Tracker - Architecture Documentation

## Project Structure

```
media-tracker/
├── index.html                 # App entry point
├── media-tracker.jsx          # Main application (single-file React)
├── config.js                  # Centralized configuration (API keys, constants)
├── package.json               # Node dependencies (@vercel/postgres)
├── vercel.json                # Vercel deployment configuration
├── .env.example               # Environment variable template
│
├── /api                       # Vercel serverless functions
│   ├── data.js               # GET/POST user media data
│   └── health.js             # Database health check
│
├── /lib                       # Server-side utilities
│   └── db.js                 # Vercel Postgres helper functions
│
├── /components                # Reusable UI components
│   ├── Icons.jsx             # SVG icon components
│   ├── MediaCard.jsx         # Individual media item card
│   ├── SearchModal.jsx       # API search modal
│   ├── GlobalSearchModal.jsx # Library search modal
│   ├── Header.jsx            # Header and navigation
│   └── UI.jsx                # Reusable UI components (FilterButton, EmptyState, etc.)
│
└── /utils                    # Client-side utilities
    ├── api.js                # API calls (TMDB, Jikan, Google Books)
    ├── storage.js            # Cloud sync + localStorage fallback
    └── helpers.js            # Helper functions and common logic
```

## Vercel Architecture (Cloud Storage)

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│    Browser      │───▶│  Vercel Edge/CDN │───▶│  Static Files   │
│  (React + JS)   │◀───│    (Hosting)     │◀───│  (index.html)   │
└────────┬────────┘    └────────┬─────────┘    └─────────────────┘
         │                      │
         │ API Calls            │ Routes to
         ▼                      ▼
┌─────────────────┐    ┌──────────────────┐
│   /api/data     │───▶│  Vercel Postgres │
│ Serverless Func │◀───│   (Free Tier)    │
└─────────────────┘    └──────────────────┘
```

**Data Flow**:
1. User loads app → requests `/api/data` with `x-user-id` header
2. Serverless function queries Postgres for user's JSON blob
3. Changes are saved via `POST /api/data` (upsert)
4. localStorage cache provides offline fallback

## Key Architecture Decisions

### 1. **Single Responsibility**

- `api/data.js` — HTTP handler only, delegates to `lib/db.js`
- `lib/db.js` — all Postgres queries, no HTTP concerns
- `utils/storage.js` — client-side cloud sync logic
- `config.js` — all configuration in one place

### 2. **User Identity**

No authentication is required. A random UUID is generated on first visit and stored in localStorage as `media-tracker-user-id`. This ID is sent with every API request as the `x-user-id` header, scoping all data to that browser.

### 3. **Offline Support**

Cloud data is cached in localStorage under `media-tracker-data-cache`. If the API is unreachable, the app falls back to this cache. Every save also writes to localStorage simultaneously.

### 4. **Data Model**

```sql
CREATE TABLE user_data (
  user_id    TEXT PRIMARY KEY,
  data       JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

The entire user library is stored as a single JSONB blob per user:

```json
{
  "movies": [...],
  "anime":  [...],
  "books":  [...]
}
```

## Component Documentation

### MediaCard

Displays a single media item with title, rating, year, and status dropdown.

```jsx
<MediaCard
  item={{ title: "Movie Title", rating: 8.5, year: 2023, ... }}
  onStatusChange={(id, status) => handleStatusChange(id, status)}
/>
```

### SearchModal

Modal for searching and adding items from external APIs.

```jsx
<SearchModal
  isOpen={true}
  onClose={() => setOpen(false)}
  category="movies"
  onAdd={(item) => handleAdd(item)}
/>
```

### GlobalSearchModal

Modal for searching within the user's saved library.

```jsx
<GlobalSearchModal
  isOpen={true}
  onClose={() => setOpen(false)}
  data={savedData}
  setActiveTab={(tab) => setTab(tab)}
/>
```

## Utility Functions

### API Functions (`utils/api.js`)

- `searchMovies(query)` — Search TMDB for movies/TV
- `searchAnime(query)` — Search Jikan for anime
- `searchBooks(query)` — Search Google Books

All return a consistent format:

```javascript
{
  id: "unique-id",
  title: "Item Title",
  thumbnail: "image-url",
  rating: "8.5",
  year: "2023",
  type: "Movie|TV Show|Anime",
  author: "Author Name" // books only
}
```

### Storage Functions (`utils/storage.js`)

- `getStoredData()` — Fetch from cloud, fall back to localStorage cache
- `saveData(data)` — Save to Postgres + localStorage
- `exportData()` — Export as JSON string
- `importData(jsonString)` — Import from JSON
- `clearStoredData()` — Reset all data
- `checkCloudConnection()` — Ping `/api/health`

### Database Functions (`lib/db.js`)

- `getUserData(userId)` — Fetch user's data blob
- `saveUserData(userId, data)` — Upsert user's data blob
- `deleteUserData(userId)` — Remove user record
- `cleanupOldData(daysOld)` — Delete stale records (utility)
- `checkConnection()` — Verify database is reachable
- `initializeDatabase()` — Create table if not exists

## Configuration (`config.js`)

```javascript
API_CONFIG        // API endpoints and keys
STORAGE_CONFIG    // localStorage keys and defaults
STATUS_CONFIG     // Status constants
STATUS_STYLES     // CSS classes for each status
STATUS_LABELS     // Display labels for statuses
FILTER_CONFIG     // Filter options per category
TAB_CONFIG        // Tab definitions
PLACEHOLDER_IMAGE // Default image URL
API_REQUEST_CONFIG // Debounce delay, timeouts
```

## Deployment

### Vercel Setup

1. Link a Vercel Postgres database to the project — Vercel auto-provides `POSTGRES_URL` and related env vars
2. Add `TMDB_API_KEY` in Vercel project settings
3. Run the `CREATE TABLE` SQL once via the Vercel Postgres query console
4. Deploy — no build step required

### Environment Variables

| Variable | Source | Required |
|---|---|---|
| `POSTGRES_URL` | Auto-provided by Vercel Postgres | Yes |
| `POSTGRES_URL_NON_POOLING` | Auto-provided by Vercel Postgres | Yes |
| `TMDB_API_KEY` | Set manually in Vercel settings | Yes |

## Security Considerations

- The `user_id` is a random UUID stored in the user's browser — it's not a secret and not tied to any account
- All write operations go through the serverless function, preventing direct DB access
- The TMDB API key is currently hardcoded in `media-tracker.jsx` (client-side) since the search is browser-side; consider proxying through a serverless function if you want to keep it private
- Consider adding rate limiting in `vercel.json` for the API routes if needed

## How to Add New Features

### Adding a New Filter

1. Update `config.js`:
```javascript
export const FILTER_CONFIG = {
  MOVIES_TV: [
    { value: 'on-hold', label: 'On Hold' },
  ],
};
```

2. Update `STATUS_CONFIG` and `STATUS_STYLES` in `config.js`

The component will automatically support the new filter.

### Adding a New API

1. Add search function in `utils/api.js`
2. Add endpoint config in `config.js`
3. Wire into `SearchModal` switch statement in `media-tracker.jsx`
