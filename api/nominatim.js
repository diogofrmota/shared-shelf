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
  if (!query || String(query).trim().length < 2) return res.status(400).json({ error: 'Missing query' });
  if (String(query).length > 160) return res.status(400).json({ error: 'Query is too long' });

  const userAgent = process.env.NOMINATIM_USER_AGENT || 'CouplePlanner/1.0 (+https://coupleplanner.app)';
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(String(query).trim())}&format=json&addressdetails=1&limit=5`;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(url, {
      headers: { 'User-Agent': userAgent },
      signal: controller.signal
    });
    if (!response.ok) return res.status(response.status).json({ error: 'Nominatim request failed' });
    const data = await response.json();
    return res.status(200).json(data);
  } catch (error) {
    if (error?.name === 'AbortError') {
      return res.status(504).json({ error: 'Address lookup timed out' });
    }
    console.error('Nominatim proxy error:', error);
    return res.status(502).json({ error: 'Upstream error' });
  } finally {
    clearTimeout(timeout);
  }
}
