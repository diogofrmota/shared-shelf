import { initializeDatabase } from '../lib/db.js';
import { cors, IS_PRODUCTION } from '../lib/auth-shared.js';
import { timingSafeEqual } from 'crypto';

function getSetupToken(req) {
  const headerToken = req.headers['x-setup-token'];
  if (headerToken) return Array.isArray(headerToken) ? headerToken[0] : headerToken;

  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

function isSetupAuthorized(req) {
  if (!IS_PRODUCTION) return true;

  const expected = process.env.SETUP_TOKEN || '';
  const provided = getSetupToken(req);
  if (!expected || !provided || expected.length !== provided.length) return false;

  return timingSafeEqual(Buffer.from(provided), Buffer.from(expected));
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!isSetupAuthorized(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const success = await initializeDatabase();
  if (success) {
    res.status(200).json({ message: 'Database initialized successfully!' });
  } else {
    res.status(500).json({ error: 'Failed to initialize database.' });
  }
}
