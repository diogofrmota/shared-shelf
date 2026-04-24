import { sql, jwt, bcrypt, JWT_SECRET, JWT_EXPIRY, JWT_EXPIRY_REMEMBER, cors, errResponse, ensureUserProfileColumns } from '../../lib/auth-shared.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { login, password, rememberMe } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Missing fields' });

    await ensureUserProfileColumns();

    const loginValue = `${login}`.trim();
    const result = await sql`
      SELECT *
      FROM users
      WHERE LOWER(email) = LOWER(${loginValue})
        OR LOWER(COALESCE(username, display_name)) = LOWER(${loginValue})
      LIMIT 1
    `;
    const user = result.rows[0];
    if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
      expiresIn: rememberMe ? JWT_EXPIRY_REMEMBER : JWT_EXPIRY
    });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        username: user.username || user.display_name
      }
    });
  } catch (error) {
    return errResponse(res, error);
  }
}
