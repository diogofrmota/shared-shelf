import {
  sql,
  cors,
  errResponse,
  ensureUserProfileColumns,
  validateUsername
} from '../auth-shared.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const username = `${req.query?.username || ''}`.trim();
  const excludeUserId = `${req.query?.excludeUserId || ''}`.trim();

  const formatError = validateUsername(username);
  if (formatError) {
    return res.json({ available: false, reason: formatError });
  }

  try {
    await ensureUserProfileColumns();

    const rows = excludeUserId
      ? (await sql`
          SELECT id FROM users
          WHERE LOWER(COALESCE(username, display_name)) = LOWER(${username})
            AND id <> ${excludeUserId}
          LIMIT 1
        `).rows
      : (await sql`
          SELECT id FROM users
          WHERE LOWER(COALESCE(username, display_name)) = LOWER(${username})
          LIMIT 1
        `).rows;

    return res.json({ available: rows.length === 0 });
  } catch (error) {
    return errResponse(res, error);
  }
}
