import { getUserData, saveUserData, initializeDatabase } from '../lib/db.js';

let dbReady = false;

export default async function handler(req, res) {
  if (!dbReady) {
    dbReady = await initializeDatabase();
  }

  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, x-user-id');

  if (req.method === 'OPTIONS') return res.status(200).end();

  const userId = req.headers['x-user-id'];
  if (!userId) {
    return res.status(400).json({ error: 'Missing user ID' });
  }

  try {
    switch (req.method) {
      case 'GET': {
        const result = await getUserData(userId);
        return res.status(200).json(result?.data || { movies: [], anime: [], books: [] });
      }

      case 'POST':
      case 'PUT': {
        const { data } = req.body;
        if (!data || !data.movies || !data.anime || !data.books) {
          return res.status(400).json({ error: 'Invalid data structure' });
        }
        const result = await saveUserData(userId, data);
        return res.status(200).json({ success: true, updatedAt: result.updatedAt });
      }

      default:
        return res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    return res.status(500).json({ error: 'Database error' });
  }
}
