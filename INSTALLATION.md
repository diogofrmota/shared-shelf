# Installation — Deploying to Vercel

---

## Prerequisites

- A [GitHub](https://github.com) account
- A [Vercel](https://vercel.com) account (sign up with GitHub — free)
- A TMDB API key (see Step 1)

---

## Step 1 — Get a TMDB API Key

1. Go to [themoviedb.org/signup](https://www.themoviedb.org/signup) and create a free account
2. Go to **Settings → API → Create → Developer**
3. Fill in the form (app name and URL can be anything)
4. Copy your **API Key (v3 auth)** — you'll need it in Step 5

---

## Step 2 — Push to GitHub

If the code isn't on GitHub yet:

1. Go to [github.com/new](https://github.com/new), create a new repository, leave it empty
2. In a terminal inside the project folder:

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

> If the code is already on GitHub, skip this step.

---

## Step 3 — Deploy to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Click **Continue with GitHub**, authorise Vercel, then import your repository
3. On the configuration screen use these settings — leave everything else as default:

| Setting | Value |
|---|---|
| Framework Preset | Other |
| Root Directory | `./` |
| Build Command | *(leave empty)* |
| Output Directory | `./` |
| Install Command | `npm install` |

4. Click **Deploy** and wait for it to finish

The app will load but data won't persist yet — that's expected. You'll connect the database in the next step.

---

## Step 4 — Create and Link a Vercel Postgres Database

1. In the Vercel dashboard, go to the **Storage** tab
2. Click **Create Database → Postgres → Continue**
3. Select the **Free** tier, give it a name (e.g. `media-tracker-db`), choose a region near you
4. Click **Create**
5. Click **Connect Project**, select your project, click **Connect**

Vercel will automatically add the following environment variables to your project:

- `POSTGRES_URL`
- `POSTGRES_URL_NON_POOLING`
- `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_HOST`, `POSTGRES_DATABASE`

You don't need to copy these — they are injected automatically.

---

## Step 5 — Add Your TMDB API Key

1. In your project → **Settings → Environment Variables**
2. Add:

| Name | Value |
|---|---|
| `TMDB_API_KEY` | your key from Step 1 |

3. Make sure **Production**, **Preview**, and **Development** are all checked, then save

---

## Step 6 — Redeploy

After connecting the database and adding the API key, the project needs a new deployment to pick up the environment variables.

1. Go to your project → **Deployments**
2. Click the three-dot menu on the latest deployment → **Redeploy**
3. Wait for it to finish

The database schema is created automatically on the first request — no manual SQL needed.

---

## Step 7 — Verify

1. Open your live URL (`https://your-project.vercel.app`)
2. Search for and add a movie
3. Refresh — the item should still be there
4. Visit `https://your-project.vercel.app/api/health` — you should see:

```json
{ "status": "ok", "database": "connected", "timestamp": "..." }
```

---

## Step 8 — Custom Domain (Optional)

1. Project → **Settings → Domains**
2. Enter your domain (e.g. `tracker.yourdomain.com`) and click **Add**
3. Follow the DNS instructions (add a CNAME or A record at your domain registrar)

Vercel handles HTTPS automatically.

---

## Post-Deployment Checklist

- [ ] `/api/health` returns `"status": "ok"`
- [ ] TMDB search works (movies and TV shows)
- [ ] Added items persist after page refresh
- [ ] No errors in the browser console
- [ ] Mobile layout looks correct

---

## Troubleshooting

**Search doesn't work** — verify the TMDB API key is correct in Vercel's environment variables and that you redeployed after adding it.

**Data doesn't persist** — visit `/api/health`. If `database` is `"unreachable"`, the Postgres database isn't linked or the project hasn't been redeployed since linking. Repeat Steps 4–6.

**`/api/health` returns 500** — go to Vercel dashboard → **Deployments → Functions** and check the function logs.

**Build error on deploy** — confirm `package.json` exists at the root of the repository.

---

## Local Development

To run locally with the real database:

1. Install the [Vercel CLI](https://vercel.com/docs/cli): `npm i -g vercel`
2. Link your local project: `vercel link`
3. Pull environment variables: `vercel env pull .env.local`
4. Start a local server: `python -m http.server 8000` or `npx http-server -p 8000`
5. Open [http://localhost:8000](http://localhost:8000)

> The API functions (`/api/data`, `/api/health`) require `vercel dev` to run locally. Without it, the app falls back to `localStorage` automatically.
