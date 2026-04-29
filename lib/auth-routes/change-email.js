import {
  sql,
  bcrypt,
  IS_PRODUCTION,
  appUrl,
  cors,
  errResponse,
  ensureEmailChangeTokensTable,
  getBearerToken,
  verifyJwt,
  validateEmail,
  consumeRateLimit,
  rateLimitResponse,
  getClientIp,
  signJwt
} from '../auth-shared.js';
import {
  emailChangeConfirmationEmail,
  logMissingEmailConfig,
  sendResendEmail
} from '../email-templates.js';

const CHANGE_EMAIL_RATE_LIMIT = { limit: 3, windowSeconds: 60 * 60 };

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

    const newEmail = `${req.body?.newEmail || ''}`.trim();
    const emailError = validateEmail(newEmail);
    if (emailError) return res.status(400).json({ error: emailError });

    const ip = getClientIp(req);
    const limit = await consumeRateLimit({
      scope: 'auth-change-email',
      key: `${ip}:${decoded.userId}`,
      ...CHANGE_EMAIL_RATE_LIMIT
    });
    if (!limit.allowed) {
      return rateLimitResponse(res, limit, 'Too many email change requests. Please wait and try again.');
    }

    await ensureEmailChangeTokensTable();

    const currentUserResult = await sql`SELECT email FROM users WHERE id = ${decoded.userId}`;
    const currentUser = currentUserResult.rows[0];
    if (!currentUser) return res.status(404).json({ error: 'User not found' });

    if (currentUser.email.toLowerCase() === newEmail.toLowerCase()) {
      return res.status(400).json({ error: 'That is already your current email address' });
    }

    const emailCheck = await sql`
      SELECT id FROM users WHERE LOWER(email) = LOWER(${newEmail}) AND id <> ${decoded.userId} LIMIT 1
    `;
    if (emailCheck.rows.length > 0) {
      return res.status(409).json({ error: 'That email address is already in use' });
    }

    const changeToken = signJwt(
      { userId: decoded.userId, purpose: 'email-change', newEmail },
      { expiresIn: '1h' }
    );
    const tokenHash = await bcrypt.hash(changeToken, 8);

    await sql`
      INSERT INTO email_change_tokens (user_id, token_hash, new_email, expires_at)
      VALUES (${decoded.userId}, ${tokenHash}, ${newEmail}, NOW() + INTERVAL '1 hour')
      ON CONFLICT (user_id) DO UPDATE
        SET token_hash = EXCLUDED.token_hash,
            new_email = EXCLUDED.new_email,
            expires_at = EXCLUDED.expires_at,
            created_at = NOW()
    `;

    const confirmUrl = appUrl('/login', { confirm_email_change: changeToken });
    let resend;
    try {
      resend = await sendResendEmail({
        to: newEmail,
        template: emailChangeConfirmationEmail({
          newEmail,
          confirmUrl
        })
      });
    } catch (emailError) {
      console.error('Email change confirmation send error:', emailError);
    }

    if (resend === null) {
      logMissingEmailConfig('Email Change', newEmail, confirmUrl);
    }

    return res.json({
      message: `A confirmation link has been sent to ${newEmail}. Click it to complete your email change.`,
      ...(!IS_PRODUCTION && !resend ? { confirmUrl } : {})
    });
  } catch (error) {
    return errResponse(res, error);
  }
}
