import { initializeDatabase } from '../lib/db.js';
import { assertSafeProductionJwtSecret, cors, IS_PRODUCTION, errResponse } from '../lib/auth-shared.js';
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
  const expectedBuffer = Buffer.from(expected);
  const providedBuffer = Buffer.from(provided);
  if (!expected || !provided || expectedBuffer.length !== providedBuffer.length) return false;

  return timingSafeEqual(providedBuffer, expectedBuffer);
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

  try {
    assertSafeProductionJwtSecret();

    const success = await initializeDatabase();
    if (success) {
      return res.status(200).json({ message: 'Database initialized successfully!' });
    }

    return res.status(500).json({ error: 'Failed to initialize database.' });
  } catch (error) {
    return errResponse(res, error);
  }
}
