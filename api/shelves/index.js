import { cors, errResponse, sql, ensureSchema, getUserIdFromRequest } from './_shared.js';

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

    const name = req.body?.name?.trim();
    if (!name) return res.status(400).json({ error: 'Name required' });

    const created = await sql`
      INSERT INTO shelves (name, created_by)
      VALUES (${name}, ${userId})
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
  } catch (error) {
    return errResponse(res, error);
  }
}
