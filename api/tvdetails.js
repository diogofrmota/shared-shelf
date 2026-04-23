export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { id } = req.query;
  if (!id) {
    return res.status(400).json({ error: 'Missing "id" parameter' });
  }

  const apiKey = process.env.TMDB_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'TMDB_API_KEY is not configured' });
  }

  try {
    const response = await fetch(
      `https://api.themoviedb.org/3/tv/${id}?api_key=${apiKey}`
    );
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
    console.error('TMDB TV details proxy error:', error);
    return res.status(502).json({ error: 'Upstream error' });
  }
}
