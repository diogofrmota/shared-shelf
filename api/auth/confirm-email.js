import {
  sql,
  bcrypt,
  consumeRateLimit,
  cors,
  errResponse,
  getClientIp,
  normalizeRateLimitKey,
  rateLimitResponse,
  verifyJwt
} from '../../lib/auth-shared.js';
import { initializeDatabase } from '../../lib/db.js';

const CONFIRM_EMAIL_RATE_LIMIT = { limit: 8, windowSeconds: 15 * 60 };
const CONFIRM_EMAIL_IP_RATE_LIMIT = { limit: 30, windowSeconds: 15 * 60 };

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    await initializeDatabase();

    const { token } = req.body;
    if (!token) return res.status(400).json({ error: 'Confirmation token is required' });

    const ip = getClientIp(req);
    const tokenKey = normalizeRateLimitKey(String(token).slice(0, 48));
    const [tokenLimit, ipLimit] = await Promise.all([
      consumeRateLimit({
        scope: 'auth-confirm-email-token',
        key: `${ip}:${tokenKey}`,
        ...CONFIRM_EMAIL_RATE_LIMIT
      }),
      consumeRateLimit({
        scope: 'auth-confirm-email-ip',
        key: ip,
        ...CONFIRM_EMAIL_IP_RATE_LIMIT
      })
    ]);

    if (!tokenLimit.allowed || !ipLimit.allowed) {
      return rateLimitResponse(
        res,
        !tokenLimit.allowed ? tokenLimit : ipLimit,
        'Too many confirmation attempts. Please wait and try again later.'
      );
    }

    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch {
      return res.status(400).json({ error: 'Confirmation link has expired or is invalid.' });
    }

    if (decoded.purpose !== 'email-verification') {
      return res.status(400).json({ error: 'Invalid confirmation token.' });
    }

    const row = (await sql`
      SELECT token_hash, expires_at
      FROM email_verification_tokens
      WHERE user_id = ${decoded.userId}
    `).rows[0];

    if (!row) return res.status(400).json({ error: 'Confirmation link already used or expired.' });
    if (new Date(row.expires_at).getTime() < Date.now()) {
      await sql`DELETE FROM email_verification_tokens WHERE user_id = ${decoded.userId}`;
      return res.status(400).json({ error: 'Confirmation link has expired.' });
    }

    const valid = await bcrypt.compare(token, row.token_hash);
    if (!valid) return res.status(400).json({ error: 'Confirmation link is invalid.' });

    await sql`UPDATE users SET email_verified = true WHERE id = ${decoded.userId}`;
    await sql`DELETE FROM email_verification_tokens WHERE user_id = ${decoded.userId}`;

    return res.json({ message: 'Account confirmed. You can now sign in.' });
  } catch (error) {
    return errResponse(res, error);
  }
}
