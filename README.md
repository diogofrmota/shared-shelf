# Tracker do Diogo e Mónica

A beautiful, responsive web app to track movies, TV shows, anime, and books.

Deployed on **Vercel** (free tier) with **Vercel Postgres** (free tier) for cloud storage.

## Features

✨ **Multi-Category Tracking**

- Movies & TV Shows (via TMDB API)
- Anime (via Jikan/MyAnimeList API)
- Books (via Google Books API)

☁️ **Cloud Persistence**

- Data stored in Vercel Postgres, synced across devices
- localStorage cache for offline fallback

🎨 **Beautiful Dark Purple Theme**

- Clean, modern interface
- Smooth animations
- Responsive grid layout

📊 **Status Tracking**

- Plan to Watch/Read
- Currently Watching/Reading
- Completed/Read

🔍 **Smart Filtering**

- Multi-select status filters
- Real-time filtering
- Persistent across sessions

## Setup Instructions

### 1. Get API Keys

1. **TMDB API Key** (Required for Movies/Shows)
   - Go to [The Movie Database](https://www.themoviedb.org/signup)
   - Create a free account
   - Go to Settings > API
   - Request an API key (choose "Developer" option)

2. **Google Books API Key** (Optional — works without one)

### 2. Deploy to Vercel (Free Tier)

1. **Fork/Clone this repository**

2. **Create a Vercel Account** at [vercel.com](https://vercel.com)

3. **Set Up Vercel Postgres**:
   - Go to your Vercel dashboard → Storage → Create Database
   - Choose Postgres, select the free tier
   - Link it to your project — Vercel will auto-inject `POSTGRES_URL` and related env vars

4. **Run the Database Schema** (once):
   - Open the Vercel Postgres query console and run:
   ```sql
   CREATE TABLE IF NOT EXISTS user_data (
     user_id TEXT PRIMARY KEY,
     data JSONB NOT NULL,
     created_at TIMESTAMP DEFAULT NOW(),
     updated_at TIMESTAMP DEFAULT NOW()
   );
   ```

5. **Add Environment Variables** in Vercel project settings:
   - `TMDB_API_KEY`: Your TMDB API key

6. **Deploy** — import the GitHub repository in Vercel and deploy.

Your app will be live at `https://your-project.vercel.app`. Data syncs across devices automatically.

### 3. Local Development

Copy `.env.example` to `.env.local` and fill in the values from your Vercel project settings:

```bash
cp .env.example .env.local
```

Then serve the project with any static server:

```bash
# Python
python -m http.server 8000

# Node.js
npx http-server -p 8000
```

## API Information

### TMDB (Movies & Shows)

- **Cost**: FREE
- **Requires Key**: YES
- **Rate Limit**: 40 requests per 10 seconds

### Jikan (Anime)

- **Cost**: FREE
- **Requires Key**: NO
- **Rate Limit**: 3 requests per second

### Google Books

- **Cost**: FREE
- **Requires Key**: NO
- **Rate Limit**: 1000 requests per day

## How to Use

### Adding Items

1. Click "Add New" in the top right
2. Search for a movie, show, anime, or book
3. Click on an item to add it with "Plan to Watch/Read" status

### Changing Status

1. Click the three-dot menu on any card
2. Select a new status or remove the item

### Filtering

- Use the filter buttons at the top to show/hide items by status
- Multiple filters can be selected at once

## File Structure

```
media-tracker/
├── index.html              # Main HTML entry point
├── media-tracker.jsx       # React application (single file)
├── package.json            # Node dependencies (@vercel/postgres)
├── vercel.json             # Vercel configuration
├── config.js               # Centralized configuration
├── .env.example            # Environment variable template
├── api/
│   ├── data.js             # Serverless function: GET/POST user data
│   └── health.js           # Serverless function: database health check
├── lib/
│   └── db.js               # Vercel Postgres database utilities
└── utils/
    └── storage.js          # Client-side storage with cloud sync
```

## Troubleshooting

### "Failed to search" error

- Check that your TMDB API key is set in `media-tracker.jsx`
- Ensure you have an internet connection

### Data not saving

- Check that Vercel Postgres is linked to your project
- Verify the `user_data` table was created
- Check the browser console for API errors

### Data not syncing across devices

- Both devices use a `user_id` stored in localStorage
- The same browser/device will always see the same data
- Clearing browser storage will generate a new user ID

## Technical Details

- **Framework**: React 18 (loaded via CDN)
- **Styling**: Tailwind CSS (loaded via CDN)
- **Storage**: Vercel Postgres (cloud) + localStorage (offline cache)
- **Hosting**: Vercel free tier
- **APIs**: TMDB, Jikan, Google Books

## Privacy

- Your media list is stored in Vercel Postgres, identified by a random ID in your browser's localStorage
- No personal information (name, email, account) is required
- No tracking or analytics

## Credits

- Movie/TV data from [The Movie Database (TMDB)](https://www.themoviedb.org/)
- Anime data from [MyAnimeList](https://myanimelist.net/) via [Jikan API](https://jikan.moe/)
- Book data from [Google Books](https://books.google.com/)
