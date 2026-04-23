import { initializeDatabase } from '../lib/db.js';

export default async function handler(req, res) {
  const success = await initializeDatabase();
  if (success) {
    res.status(200).json({ message: 'Database initialized successfully!' });
  } else {
    res.status(500).json({ error: 'Failed to initialize database.' });
  }
}