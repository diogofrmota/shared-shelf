import { cors, errResponse, sql, ensureSchema, getUserIdFromRequest, requireShelfMember } from './_shared.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await ensureSchema();

    const userId = getUserIdFromRequest(req);
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

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
  } catch (error) {
    return errResponse(res, error);
  }
}
