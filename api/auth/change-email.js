import {
  sql,
  bcrypt,
  APP_URL,
  FROM_EMAIL,
  IS_PRODUCTION,
  cors,
  errResponse,
  ensureEmailChangeTokensTable,
  getBearerToken,
  verifyJwt,
  validateEmail,
  consumeRateLimit,
  rateLimitResponse,
  getClientIp,
  getResend,
  escapeHtml,
  signJwt
} from '../../lib/auth-shared.js';

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

    const confirmUrl = `${APP_URL}?confirm_email_change=${encodeURIComponent(changeToken)}`;
    const resend = getResend();
    if (resend) {
      try {
        const safeNewEmail = escapeHtml(newEmail);
        const safeConfirmUrl = escapeHtml(confirmUrl);
        await resend.emails.send({
          from: FROM_EMAIL,
          to: newEmail,
          subject: 'Confirm your new email address — Couple Planner',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#E63B2E">Couple Planner</h2>
              <p>You requested to change your Couple Planner email to <strong>${safeNewEmail}</strong>.</p>
              <p>Click below to confirm. This link expires in <strong>1 hour</strong>.</p>
              <a href="${safeConfirmUrl}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#E63B2E;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">
                Confirm new email
              </a>
              <p style="color:#6b7280;font-size:13px">If you did not request this change, you can safely ignore this email.</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Email change confirmation send error:', emailError);
      }
    } else {
      console.warn(
        IS_PRODUCTION
          ? '[Email Change] RESEND_API_KEY not set; confirmation email was not sent.'
          : `[Email Change] Confirmation link for ${newEmail}: ${confirmUrl}`
      );
    }

    return res.json({
      message: `A confirmation link has been sent to ${newEmail}. Click it to complete your email change.`,
      ...(!IS_PRODUCTION && !resend ? { confirmUrl } : {})
    });
  } catch (error) {
    return errResponse(res, error);
  }
}
