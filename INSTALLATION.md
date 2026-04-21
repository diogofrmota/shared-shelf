# Installation — Deploying to Vercel

This guide covers everything from pushing the code to GitHub through to a live, working deployment on Vercel with a Postgres database.

---

## Prerequisites

Before starting you need:

- A **GitHub account** — [github.com](https://github.com)
- A **Vercel account** — [vercel.com](https://vercel.com) (sign up with GitHub, it's free)
- A **TMDB API key** — see Step 1 below

---

## Step 1 — Get a TMDB API Key

The app uses TMDB to search for movies and TV shows.

1. Go to [themoviedb.org/signup](https://www.themoviedb.org/signup) and create a free account
2. After signing in, go to **Settings → API**
3. Click **Create** and choose **Developer**
4. Fill in the form (the app name and URL can be anything, e.g. "Personal tracker")
5. Copy your **API Key (v3 auth)** — you'll need it in Step 4

---

## Step 2 — Push the Repository to GitHub

If the code isn't on GitHub yet:

1. Go to [github.com/new](https://github.com/new) and create a new **private** repository (name it anything, e.g. `media-tracker`)
2. Leave it empty (no README, no .gitignore)
3. Open a terminal in the project folder and run:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

Replace `YOUR_USERNAME` and `YOUR_REPO` with your actual GitHub username and repository name.

> If the repository already exists on GitHub and the code is already pushed, skip this step.

---

## Step 3 — Create the Vercel Project

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Continue with GitHub** and authorise Vercel to access your repositories
3. Find your repository in the list and click **Import**
4. On the configuration screen, set the following and leave everything else as-is:

| Setting | Value |
|---|---|
| Framework Preset | **Other** |
| Root Directory | `./` |
| Build Command | *(leave empty)* |
| Output Directory | `./` |
| Install Command | `npm install` |

5. **Do not click Deploy yet** — you need to set up the database first (Step 4)

---

## Step 4 — Create the Vercel Postgres Database

1. In the Vercel dashboard, go to the **Storage** tab (top navigation)
2. Click **Create Database**
3. Choose **Postgres** and click **Continue**
4. Select the **Free** tier
5. Give it a name (e.g. `media-tracker-db`) and choose a region close to you
6. Click **Create**

### Link the database to your project

1. After the database is created, click **Connect Project**
2. Select your project from the dropdown and click **Connect**

Vercel will automatically add these environment variables to your project:

- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_HOST`
- `POSTGRES_DATABASE`

You don't need to copy or set these yourself — they are injected automatically.

---

## Step 5 — Add Your TMDB API Key

1. In the Vercel dashboard, go to your project → **Settings → Environment Variables**
2. Add the following:

| Name | Value |
|---|---|
| `TMDB_API_KEY` | your TMDB API key from Step 1 |

3. Make sure **Production**, **Preview**, and **Development** are all checked
4. Click **Save**

> **Note:** The current version of the app uses the TMDB API key directly from the client-side code in `media-tracker.jsx`. The environment variable you're setting here is available to the serverless API functions, which is the correct approach for future improvements. The app will work either way.

---

## Step 6 — Deploy

1. Go to your project in the Vercel dashboard
2. Click **Deployments → Redeploy** (or simply go back to the project overview and click **Deploy** if you haven't deployed yet)
3. Wait for the build to complete (usually under 1 minute)
4. Your app is now live at `https://your-project-name.vercel.app`

---

## Step 7 — Create the Database Schema

This is a one-time step to create the table that stores your data.

1. In the Vercel dashboard, go to **Storage → your database**
2. Click the **Query** tab
3. Paste and run the following SQL:

```sql
CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_data_updated_at
ON user_data(updated_at);
```

4. Click **Run Query**

> The app also creates this table automatically on the first API call, but running it manually here ensures it exists before anyone visits the site.

---

## Step 8 — Verify the Deployment

1. Open your live URL in a browser
2. Try searching for and adding a movie
3. Refresh the page — the item should still be there (data is stored in Postgres)
4. Open the browser **Developer Tools → Console** and check there are no red errors
5. Optional: open the URL in a different browser — it will have a different user ID and show a separate empty list (each browser is its own user)

### Testing the API directly

You can confirm the database connection is working by visiting:

```
https://your-project-name.vercel.app/api/health
```

A healthy response looks like:

```json
{ "status": "ok", "database": "connected", "timestamp": "..." }
```

---

## Step 9 — Custom Domain (Optional)

1. In the Vercel dashboard, go to your project → **Settings → Domains**
2. Type your domain (e.g. `tracker.yourdomain.com`) and click **Add**
3. Follow the DNS instructions Vercel provides (you'll add a CNAME or A record with your domain registrar)
4. Vercel handles HTTPS automatically

---

## Post-Deployment Checklist

- [ ] TMDB API key is set in Vercel environment variables
- [ ] Database schema has been created (run the SQL in Step 7)
- [ ] `/api/health` returns `"status": "ok"`
- [ ] Adding an item works and persists after page refresh
- [ ] No errors in the browser console
- [ ] Mobile layout looks correct

---

## Troubleshooting

### The app loads but search doesn't work

Check the browser console for errors. The most common cause is a missing or invalid TMDB API key. Verify it is set correctly in Vercel's environment variables and redeploy.

### Data doesn't persist after refresh

Visit `/api/health`. If `database` is `"unreachable"`, the database is not connected — go back through Step 4 and make sure the database is linked to your project and you have redeployed since linking it.

### `/api/health` returns an error or 500

Go to Vercel dashboard → **Deployments → Functions** and check the function logs for details.

### Vercel shows a build error

Check that `package.json` exists at the root of the repository. It must be present so Vercel installs the `@vercel/postgres` dependency.

---

## Local Development

To run the app locally:

1. Copy the environment variables from your Vercel project:
   - Go to Vercel dashboard → your project → **Settings → Environment Variables**
   - Click **Download .env** or copy the values manually

2. Create a `.env.local` file in the project root (see `.env.example` for the format)

3. Start a local web server:

```bash
# Python
python -m http.server 8000

# Or Node.js
npx http-server -p 8000
```

4. Open [http://localhost:8000](http://localhost:8000)

> The API functions (`/api/data`, `/api/health`) won't work locally without running `vercel dev` from the [Vercel CLI](https://vercel.com/docs/cli). For local testing, the app falls back to `localStorage` automatically.
