import { randomUUID } from 'crypto';
import { sql, bcrypt, JWT_EXPIRY, cors, errResponse, ensureUserProfileColumns, signJwt } from '../../lib/auth-shared.js';
import { initializeDatabase } from '../../lib/db.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initializeDatabase();

    const emailValue = `${req.body.email || ''}`.trim();
    const username = `${req.body.username || req.body.name || ''}`.trim();
    const displayName = `${req.body.name || username}`.trim();
    const { password } = req.body;

    if (!emailValue || !password || !username || password.length < 6 || username.length < 4) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    await ensureUserProfileColumns();

    const [emailCheck, nameCheck] = await Promise.all([
      sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${emailValue})`,
      sql`SELECT id FROM users WHERE LOWER(COALESCE(username, display_name)) = LOWER(${username})`
    ]);
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    if (nameCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const id = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (id, email, password_hash, display_name, username)
      VALUES (${id}, ${emailValue}, ${hash}, ${displayName}, ${username})
      RETURNING id, email, display_name, username
    `;
    const user = result.rows[0];
    const token = signJwt({ userId: user.id }, { expiresIn: JWT_EXPIRY });
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.display_name, username: user.username }
    });
  } catch (error) {
    return errResponse(res, error);
  }
}
