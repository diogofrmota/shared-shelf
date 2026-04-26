import { sql, cors, errResponse, ensureUserProfileColumns, verifyJwt } from '../../lib/auth-shared.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'PATCH'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    await ensureUserProfileColumns();

    if (req.method === 'PATCH') {
      const name = `${req.body?.name || ''}`.trim();
      const username = `${req.body?.username || ''}`.trim();

      if (!name || name.length < 2) {
        return res.status(400).json({ error: 'Name must be at least 2 characters' });
      }
      if (!username || username.length < 4) {
        return res.status(400).json({ error: 'Username must be at least 4 characters' });
      }

      const usernameTaken = (await sql`
        SELECT id
        FROM users
        WHERE LOWER(COALESCE(username, display_name)) = LOWER(${username})
          AND id <> ${decoded.userId}
        LIMIT 1
      `).rows[0];

      if (usernameTaken) {
        return res.status(409).json({ error: 'Username already taken' });
      }

      const updated = (await sql`
        UPDATE users
        SET display_name = ${name}, username = ${username}
        WHERE id = ${decoded.userId}
        RETURNING id, email, display_name, username
      `).rows[0];

      if (!updated) return res.status(404).json({ error: 'User not found' });
      return res.json({
        user: {
          id: updated.id,
          email: updated.email,
          name: updated.display_name,
          username: updated.username || updated.display_name
        }
      });
    }

    const user = (await sql`SELECT id, email, display_name, username FROM users WHERE id = ${decoded.userId}`).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        username: user.username || user.display_name
      }
    });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Username already taken' });
    }
    return errResponse(res, error);
  }
}
