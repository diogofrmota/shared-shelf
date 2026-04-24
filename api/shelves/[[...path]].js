import { randomUUID } from 'crypto';
import { jwt, JWT_SECRET, cors, errResponse, sql } from '../../lib/auth-shared.js';
import { initializeDatabase } from '../../lib/db.js';

async function ensureSchema() {
  await initializeDatabase();
}

function getUserIdFromRequest(req) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded.userId || null;
  } catch {
    return null;
  }
}

async function requireShelfMember(shelfId, userId) {
  const result = await sql`
    SELECT role
    FROM shelf_members
    WHERE shelf_id = ${shelfId} AND user_id = ${userId}
    LIMIT 1
  `;

  return result.rows[0] || null;
}

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    await ensureSchema();

    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const segments = Array.isArray(req.query?.path)
      ? req.query.path
      : req.query?.path
        ? [req.query.path]
        : [];

    if (segments.length === 0) {
      if (req.method === 'GET') {
        const shelves = await sql`
          SELECT s.id, s.name, s.created_by, sm.role, s.created_at
          FROM shelves s
          JOIN shelf_members sm ON s.id = sm.shelf_id
          WHERE sm.user_id = ${userId}
          ORDER BY s.created_at DESC
        `;

        return res.json({ shelves: shelves.rows });
      }

      if (req.method === 'POST') {
        const name = req.body?.name?.trim();
        if (!name) return res.status(400).json({ error: 'Name required' });
        const shelfId = randomUUID();

        const created = await sql`
          INSERT INTO shelves (id, name, created_by)
          VALUES (${shelfId}, ${name}, ${userId})
          RETURNING id, name, created_by, created_at
        `;
        const shelf = created.rows[0];

        await sql`
          INSERT INTO shelf_members (shelf_id, user_id, role)
          VALUES (${shelf.id}, ${userId}, 'owner')
          ON CONFLICT (shelf_id, user_id) DO NOTHING
        `;

        await sql`
          INSERT INTO shelf_data (shelf_id, data)
          VALUES (${shelf.id}, ${JSON.stringify({})}::jsonb)
          ON CONFLICT (shelf_id) DO NOTHING
        `;

        return res.status(201).json({ shelf });
      }
    }

    if (segments.length === 1 && segments[0] === 'join' && req.method === 'POST') {
      const shelfId = req.body?.shelfId?.trim();
      const joinCode = req.body?.joinCode?.trim();
      if (!shelfId || !joinCode) {
        return res.status(400).json({ error: 'Shelf ID and join code are required' });
      }

      const existingMember = await requireShelfMember(shelfId, userId);
      if (existingMember) {
        return res.status(409).json({ error: 'You are already a member of this shelf' });
      }

      const codeMatch = await sql`
        SELECT id
        FROM shelf_join_codes
        WHERE shelf_id = ${shelfId}
          AND code = ${joinCode}
          AND is_used = false
          AND expires_at > NOW()
        ORDER BY created_at DESC
        LIMIT 1
      `;
      if (codeMatch.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired join code' });
      }

      await sql`
        INSERT INTO shelf_members (shelf_id, user_id, role)
        VALUES (${shelfId}, ${userId}, 'member')
      `;

      await sql`
        UPDATE shelf_join_codes
        SET is_used = true
        WHERE id = ${codeMatch.rows[0].id}
      `;

      return res.json({ success: true });
    }

    if (segments.length === 2 && segments[1] === 'data' && ['GET', 'POST'].includes(req.method)) {
      const shelfId = segments[0];
      const membership = await requireShelfMember(shelfId, userId);
      if (!membership) return res.status(403).json({ error: 'Not a member of this shelf' });

      if (req.method === 'GET') {
        const result = await sql`
          SELECT data
          FROM shelf_data
          WHERE shelf_id = ${shelfId}
          LIMIT 1
        `;

        return res.json(result.rows[0]?.data || {});
      }

      const payload = req.body?.data;
      if (!payload || typeof payload !== 'object') {
        return res.status(400).json({ error: 'Data payload is required' });
      }

      await sql`
        INSERT INTO shelf_data (shelf_id, data, updated_at)
        VALUES (${shelfId}, ${JSON.stringify(payload)}::jsonb, NOW())
        ON CONFLICT (shelf_id)
        DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()
      `;

      return res.json({ success: true });
    }

    if (segments.length === 2 && segments[1] === 'membership' && req.method === 'DELETE') {
      const shelfId = segments[0];
      const membership = await requireShelfMember(shelfId, userId);
      if (!membership) return res.status(404).json({ error: 'Shelf not found' });

      await sql`
        DELETE FROM shelf_members
        WHERE shelf_id = ${shelfId} AND user_id = ${userId}
      `;

      const remainingMembers = await sql`
        SELECT COUNT(*)::int AS count
        FROM shelf_members
        WHERE shelf_id = ${shelfId}
      `;

      if ((remainingMembers.rows[0]?.count || 0) === 0) {
        await sql`
          DELETE FROM shelves
          WHERE id = ${shelfId}
        `;
      }

      return res.json({ success: true });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    return errResponse(res, error);
  }
}
