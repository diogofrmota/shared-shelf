import { initializeDatabase, sql } from '../lib/db.js';
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

async function resetDatabase() {
  const tables = [
    'auth_rate_limits',
    'email_change_tokens',
    'email_verification_tokens',
    'password_reset_tokens',
    'dashboard_data',
    'dashboard_join_codes',
    'dashboard_members',
    'dashboards',
    'users',
  ];

  for (const table of tables) {
    const { rows } = await sql`
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${table}
    `;
    if (rows.length > 0) {
      await sql.query(`TRUNCATE TABLE "${table}" CASCADE`);
    }
  }
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (!isSetupAuthorized(req)) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  if (req.method === 'DELETE') {
    try {
      await resetDatabase();
      return res.status(200).json({ message: 'Database cleared successfully.' });
    } catch (error) {
      return errResponse(res, error);
    }
  }

  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
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
