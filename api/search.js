import { cors, getUserIdFromRequest } from '../lib/auth-shared.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!getUserIdFromRequest(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { q } = req.query;
  const query = Array.isArray(q) ? q[0] : q;
  if (!query || String(query).trim().length < 2) {
    return res.status(400).json({ error: 'Missing query parameter "q"' });
  }
  if (String(query).length > 120) {
    return res.status(400).json({ error: 'Query is too long' });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
  }

  const url = new URL('https://api.themoviedb.org/3/search/multi');
  url.searchParams.set('api_key', apiKey);
  url.searchParams.set('query', String(query).trim());
  url.searchParams.set('include_adult', 'false');

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url.toString(), { signal: controller.signal });
    if (!response.ok) {
      return res.status(response.status).json({ error: 'TMDB request failed' });
    }
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'TMDB request timed out' });
    }
    console.error('TMDB proxy error:', error);
    return res.status(502).json({ error: 'Upstream error' });
  } finally {
    clearTimeout(timeout);
  }
}
