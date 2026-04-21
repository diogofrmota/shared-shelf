# Tracker do Diogo e Mónica

Track movies, TV shows, anime, and books. Hosted on Vercel with Vercel Postgres.

For deployment instructions see [INSTALLATION.md](INSTALLATION.md).

---

## How to use

**Add an item** — click "Add New", search, click the result.

**Change status** — click the three-dot menu on any card.

**Filter** — use the status buttons at the top. Multiple can be active at once.

---

## File structure

```
media-tracker/
├── index.html           # Entry point
├── media-tracker.jsx    # React app (single file, no build step)
├── package.json         # @vercel/postgres dependency
├── vercel.json          # Vercel config
├── config.js            # API endpoints and constants
├── .env.example         # Environment variable template
├── api/
│   ├── data.js          # Serverless: GET/POST user data
│   └── health.js        # Serverless: database health check
├── lib/
│   └── db.js            # Vercel Postgres queries
└── utils/
    └── storage.js       # Cloud sync + localStorage fallback
```

---

## APIs

| API | Used for | Key required |
|---|---|---|
| [TMDB](https://www.themoviedb.org/) | Movies & TV shows | Yes (free) |
| [Jikan](https://jikan.moe/) | Anime | No |
| [Google Books](https://books.google.com/) | Books | No |

---

## Tech stack

- React 18 via CDN (no build step)
- Tailwind CSS via CDN
- Vercel Postgres (cloud storage, free tier)
- Vercel (hosting, free tier)

---

## Troubleshooting

**Search not working** — check that the TMDB API key is set in `media-tracker.jsx` and you have an internet connection.

**Data not saving** — visit `/api/health` on your deployment. If it shows `"database": "unreachable"`, the Postgres database isn't linked to the project. Follow Steps 4–5 in INSTALLATION.md and redeploy.

**Data not syncing across devices** — each browser generates its own random user ID stored in localStorage. Data is scoped to that ID. Clearing localStorage generates a new ID and starts fresh.

---

## Privacy

Data is stored in Vercel Postgres under a random ID stored in your browser's localStorage. No account, email, or personal data is collected.

---

## Credits

- [The Movie Database (TMDB)](https://www.themoviedb.org/)
- [Jikan API](https://jikan.moe/) / [MyAnimeList](https://myanimelist.net/)
- [Google Books](https://books.google.com/)
