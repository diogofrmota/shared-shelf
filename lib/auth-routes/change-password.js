import {
  sql,
  bcrypt,
  cors,
  errResponse,
  ensureAuthSecurityTables,
  getBearerToken,
  verifyJwt,
  validatePassword,
  consumeRateLimit,
  rateLimitResponse,
  getClientIp
} from '../auth-shared.js';

const CHANGE_PASSWORD_RATE_LIMIT = { limit: 5, windowSeconds: 15 * 60 };

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = getBearerToken(req);
    if (!token) return res.status(401).json({ error: 'Authentication required' });

    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const { currentPassword, newPassword } = req.body || {};
    if (!currentPassword) return res.status(400).json({ error: 'Current password is required' });

    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    await ensureAuthSecurityTables();

    const ip = getClientIp(req);
    const limit = await consumeRateLimit({
      scope: 'auth-change-password',
      key: `${ip}:${decoded.userId}`,
      ...CHANGE_PASSWORD_RATE_LIMIT
    });
    if (!limit.allowed) {
      return rateLimitResponse(res, limit, 'Too many password change attempts. Please try again later.');
    }

    const userResult = await sql`SELECT id, password_hash FROM users WHERE id = ${decoded.userId}`;
    const user = userResult.rows[0];
    if (!user) return res.status(404).json({ error: 'User not found' });

    const passwordMatch = await bcrypt.compare(currentPassword, user.password_hash);
    if (!passwordMatch) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const newHash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password_hash = ${newHash} WHERE id = ${decoded.userId}`;

    return res.json({ message: 'Password updated successfully' });
  } catch (error) {
    return errResponse(res, error);
  }
}
