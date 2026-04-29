import {
  sql,
  bcrypt,
  appUrl,
  consumeRateLimit,
  getClientIp,
  cors,
  errResponse,
  normalizeRateLimitKey,
  rateLimitResponse,
  signJwt,
  validateEmail
} from '../auth-shared.js';
import {
  logMissingEmailConfig,
  passwordResetEmail,
  sendResendEmail
} from '../email-templates.js';

const FORGOT_PASSWORD_RATE_LIMIT = { limit: 5, windowSeconds: 60 * 60 };
const FORGOT_PASSWORD_IP_RATE_LIMIT = { limit: 25, windowSeconds: 60 * 60 };

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body;
    const emailError = validateEmail(email);
    if (emailError) return res.status(400).json({ error: emailError });

    const emailValue = `${email}`.trim();
    const ip = getClientIp(req);
    const [emailLimit, ipLimit] = await Promise.all([
      consumeRateLimit({
        scope: 'auth-forgot-password-email',
        key: `${ip}:${normalizeRateLimitKey(emailValue)}`,
        ...FORGOT_PASSWORD_RATE_LIMIT
      }),
      consumeRateLimit({
        scope: 'auth-forgot-password-ip',
        key: ip,
        ...FORGOT_PASSWORD_IP_RATE_LIMIT
      })
    ]);

    if (!emailLimit.allowed || !ipLimit.allowed) {
      return rateLimitResponse(
        res,
        !emailLimit.allowed ? emailLimit : ipLimit,
        'Too many password reset requests. Please wait and try again later.'
      );
    }

    const userRow = (await sql`SELECT id, display_name FROM users WHERE LOWER(email) = LOWER(${emailValue})`).rows[0];
    if (userRow) {
      const resetToken = signJwt({ userId: userRow.id, purpose: 'password-reset' }, { expiresIn: '1h' });
      const tokenHash = await bcrypt.hash(resetToken, 8);
      await sql`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${userRow.id}, ${tokenHash}, NOW() + INTERVAL '1 hour')
        ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at
      `;

      const resetUrl = appUrl('/login', { reset_token: resetToken });
      let resend;
      try {
        resend = await sendResendEmail({
          to: emailValue,
          template: passwordResetEmail({
            displayName: userRow.display_name,
            resetUrl
          })
        });
      } catch (e) {
        console.error('Resend email error:', e);
      }

      if (resend === null) {
        logMissingEmailConfig('Password Reset', emailValue, resetUrl);
      }
    }

    return res.json({ message: 'If that email is registered, a password reset link has been sent.' });
  } catch (error) {
    return errResponse(res, error);
  }
}
