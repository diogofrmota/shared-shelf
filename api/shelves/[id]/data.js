import { cors, errResponse, sql, ensureSchema, getUserIdFromRequest, requireShelfMember } from '../_shared.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'POST'].includes(req.method)) {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    await ensureSchema();

    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const shelfId = req.query?.id;
    if (!shelfId) return res.status(400).json({ error: 'Shelf ID is required' });

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
  } catch (error) {
    return errResponse(res, error);
  }
}
