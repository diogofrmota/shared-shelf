import { cors, getUserIdFromRequest } from '../lib/auth-shared.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  const tvId = Array.isArray(id) ? id[0] : id;
  if (!getUserIdFromRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!tvId) {
    return res.status(400).json({ error: 'Missing "id" parameter' });
  }
  if (!/^\d+$/.test(String(tvId))) {
    return res.status(400).json({ error: 'Invalid "id" parameter' });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const url = new URL(`https://api.themoviedb.org/3/tv/${tvId}`);
    url.searchParams.set('api_key', apiKey);
    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'TMDB request failed' });
    }
    const data = await response.json();
    return res.status(200).json({
      id: data.id,
      name: data.name,
      number_of_seasons: data.number_of_seasons,
      number_of_episodes: data.number_of_episodes,
      seasons: (data.seasons || [])
        .filter(s => s.season_number > 0)
        .map(s => ({
          season_number: s.season_number,
          episode_count: s.episode_count,
          name: s.name
        }))
    });
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'TMDB request timed out' });
    }
    console.error('TMDB TV details proxy error:', error);
    return res.status(502).json({ error: 'Upstream error' });
  } finally {
    clearTimeout(timeout);
  }
}
