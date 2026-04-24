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

function getPathSegments(req) {
  const rawPath = req.query?.path;
  const values = Array.isArray(rawPath) ? rawPath : rawPath ? [rawPath] : [];

  return values
    .flatMap((value) => String(value).split('/'))
    .map((value) => value.trim())
    .filter((value) => value && value !== '__root__');
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

async function getShelfSummary(shelfId) {
  const result = await sql`
    SELECT id, name, created_by, logo_url AS logo, created_at, updated_at
    FROM shelves
    WHERE id = ${shelfId}
    LIMIT 1
  `;

  return result.rows[0] || null;
}

function generateJoinCode() {
  return Math.random().toString(36).slice(2, 10).toUpperCase();
}

async function createJoinCode(shelfId) {
  const code = generateJoinCode();

  await sql`
    INSERT INTO shelf_join_codes (shelf_id, code, is_used, expires_at)
    VALUES (${shelfId}, ${code}, false, NOW() + INTERVAL '7 days')
  `;

  return code;
}

async function getLatestActiveJoinCode(shelfId) {
  const result = await sql`
    SELECT id, code, expires_at, created_at
    FROM shelf_join_codes
    WHERE shelf_id = ${shelfId}
      AND is_used = false
      AND expires_at > NOW()
    ORDER BY created_at DESC
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

    const segments = getPathSegments(req);

    if (segments.length === 0) {
      if (req.method === 'GET') {
        const shelves = await sql`
          SELECT s.id, s.name, s.created_by, s.logo_url AS logo, sm.role, s.created_at, s.updated_at
          FROM shelves s
          JOIN shelf_members sm ON s.id = sm.shelf_id
          WHERE sm.user_id = ${userId}
          ORDER BY s.updated_at DESC NULLS LAST, s.created_at DESC
        `;

        return res.json({ shelves: shelves.rows });
      }

      if (req.method === 'POST') {
        const name = req.body?.name?.trim();
        if (!name) return res.status(400).json({ error: 'Name required' });
        const shelfId = randomUUID();

        const created = await sql`
          INSERT INTO shelves (id, name, created_by, updated_at)
          VALUES (${shelfId}, ${name}, ${userId}, NOW())
          RETURNING id, name, created_by, logo_url AS logo, created_at, updated_at
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

        const joinCode = await createJoinCode(shelf.id);

        return res.status(201).json({ shelf, joinCode });
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

      const shelf = await getShelfSummary(shelfId);

      return res.json({ success: true, shelf });
    }

    if (segments.length === 1 && req.method === 'PATCH') {
      const shelfId = segments[0];
      const membership = await requireShelfMember(shelfId, userId);
      if (!membership) return res.status(403).json({ error: 'Not a member of this shelf' });
      if (membership.role !== 'owner') {
        return res.status(403).json({ error: 'Only the shelf owner can update shelf settings' });
      }

      const nextName = req.body?.name?.trim();
      const nextLogo = typeof req.body?.logo === 'string' ? req.body.logo.trim() : undefined;

      if (!nextName && nextLogo === undefined) {
        return res.status(400).json({ error: 'At least one shelf setting is required' });
      }

      const existingShelf = await getShelfSummary(shelfId);
      if (!existingShelf) return res.status(404).json({ error: 'Shelf not found' });

      const updated = await sql`
        UPDATE shelves
        SET
          name = ${nextName || existingShelf.name},
          logo_url = ${nextLogo === undefined ? existingShelf.logo : nextLogo || null},
          updated_at = NOW()
        WHERE id = ${shelfId}
        RETURNING id, name, created_by, logo_url AS logo, created_at, updated_at
      `;

      return res.json({ shelf: updated.rows[0] });
    }

    if (segments.length === 2 && segments[1] === 'share' && ['GET', 'POST'].includes(req.method)) {
      const shelfId = segments[0];
      const membership = await requireShelfMember(shelfId, userId);
      if (!membership) return res.status(403).json({ error: 'Not a member of this shelf' });

      const shelf = await getShelfSummary(shelfId);
      if (!shelf) return res.status(404).json({ error: 'Shelf not found' });

      let activeCode = await getLatestActiveJoinCode(shelfId);

      if (req.method === 'POST') {
        if (membership.role !== 'owner') {
          return res.status(403).json({ error: 'Only the shelf owner can generate a new join code' });
        }

        await sql`
          UPDATE shelf_join_codes
          SET is_used = true
          WHERE shelf_id = ${shelfId}
            AND is_used = false
            AND expires_at > NOW()
        `;

        await createJoinCode(shelfId);
        activeCode = await getLatestActiveJoinCode(shelfId);
      } else if (!activeCode) {
        await createJoinCode(shelfId);
        activeCode = await getLatestActiveJoinCode(shelfId);
      }

      return res.json({
        shelfId: shelf.id,
        shelfName: shelf.name,
        joinCode: activeCode?.code || null,
        expiresAt: activeCode?.expires_at || null
      });
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

      await sql`
        UPDATE shelves
        SET updated_at = NOW()
        WHERE id = ${shelfId}
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
