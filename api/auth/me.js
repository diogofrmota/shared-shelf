import { sql, jwt, JWT_SECRET, cors, errResponse } from './_shared.js';

export default async function handler(req, res) {
  cors(res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
    const token = authHeader.split(' ')[1];

    let decoded;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const user = (await sql`SELECT id, email, display_name FROM users WHERE id = ${decoded.userId}`).rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });
    return res.json({ user: { id: user.id, email: user.email, name: user.display_name } });
  } catch (error) {
    return errResponse(res, error);
  }
}
