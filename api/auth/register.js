import { randomUUID } from 'crypto';
import { sql, jwt, bcrypt, JWT_SECRET, JWT_EXPIRY, cors, errResponse } from './_shared.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name || password.length < 6 || name.length < 4) {
      return res.status(400).json({ error: 'Invalid input' });
    }

    const [emailCheck, nameCheck] = await Promise.all([
      sql`SELECT id FROM users WHERE email = ${email}`,
      sql`SELECT id FROM users WHERE display_name = ${name}`
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
      INSERT INTO users (id, email, password_hash, display_name)
      VALUES (${id}, ${email}, ${hash}, ${name})
      RETURNING id, email, display_name
    `;
    const user = result.rows[0];
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
    return res.status(201).json({
      token,
      user: { id: user.id, email: user.email, name: user.display_name }
    });
  } catch (error) {
    return errResponse(res, error);
  }
}
