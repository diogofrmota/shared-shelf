import { jwt, JWT_SECRET, cors, errResponse, sql } from '../auth/_shared.js';
import { initializeDatabase } from '../../lib/db.js';

export { cors, errResponse, sql };

export async function ensureSchema() {
  await initializeDatabase();
}

export function getUserIdFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId || null;
  } catch {
    return null;
  }
}

export async function requireShelfMember(shelfId, userId) {
  const result = await sql`
    SELECT role
    FROM shelf_members
    WHERE shelf_id = ${shelfId} AND user_id = ${userId}
    LIMIT 1
  `;

  return result.rows[0] || null;
}
