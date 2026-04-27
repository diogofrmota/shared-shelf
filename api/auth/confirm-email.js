import {
  sql,
  bcrypt,
  consumeRateLimit,
  cors,
  errResponse,
  getClientIp,
  normalizeRateLimitKey,
  rateLimitResponse,
  jwt,
  verifyJwt
} from '../../lib/auth-shared.js';
import { initializeDatabase } from '../../lib/db.js';

const CONFIRM_EMAIL_RATE_LIMIT = { limit: 8, windowSeconds: 15 * 60 };
const CONFIRM_EMAIL_IP_RATE_LIMIT = { limit: 30, windowSeconds: 15 * 60 };

const linkError = (res, status, error, action) =>
  res.status(status).json({
    error,
    linkStatus: action.status,
    nextAction: {
      label: action.label,
      target: action.target
    }
  });

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
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return linkError(
          res,
          400,
          'This confirmation link has expired. For your security, please request a new confirmation email.',
          { status: 'expired', label: 'Send a new confirmation email', target: 'signup' }
        );
      }

      return linkError(
        res,
        400,
        'This confirmation link is not valid. Please use the latest email from Couple Planner or start again.',
        { status: 'invalid', label: 'Return to sign in', target: 'signin' }
      );
    }

    if (decoded.purpose !== 'email-verification') {
      return linkError(
        res,
        400,
        'This confirmation link is not valid. Please use the latest email from Couple Planner or start again.',
        { status: 'invalid', label: 'Return to sign in', target: 'signin' }
      );
    }

    const row = (await sql`
      SELECT token_hash, expires_at
      FROM email_verification_tokens
      WHERE user_id = ${decoded.userId}
    `).rows[0];

    if (!row) {
      const user = (await sql`
        SELECT email_verified
        FROM users
        WHERE id = ${decoded.userId}
      `).rows[0];

      if (user?.email_verified) {
        return linkError(
          res,
          400,
          'This confirmation link has already been used. Your account is ready, so you can sign in.',
          { status: 'used', label: 'Return to sign in', target: 'signin' }
        );
      }

      return linkError(
        res,
        400,
        'This confirmation link is no longer active. Please request a new confirmation email.',
        { status: 'expired', label: 'Send a new confirmation email', target: 'signup' }
      );
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await sql`DELETE FROM email_verification_tokens WHERE user_id = ${decoded.userId}`;
      return linkError(
        res,
        400,
        'This confirmation link has expired. For your security, please request a new confirmation email.',
        { status: 'expired', label: 'Send a new confirmation email', target: 'signup' }
      );
    }

    const valid = await bcrypt.compare(token, row.token_hash);
    if (!valid) {
      return linkError(
        res,
        400,
        'This confirmation link is not valid. Please use the latest email from Couple Planner or start again.',
        { status: 'invalid', label: 'Return to sign in', target: 'signin' }
      );
    }

    await sql`UPDATE users SET email_verified = true WHERE id = ${decoded.userId}`;
    await sql`DELETE FROM email_verification_tokens WHERE user_id = ${decoded.userId}`;

    return res.json({ message: 'Account confirmed. You can now sign in.' });
  } catch (error) {
    return errResponse(res, error);
  }
}
