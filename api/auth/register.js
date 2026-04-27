import { randomUUID } from 'crypto';
import {
  sql,
  bcrypt,
  APP_URL,
  FROM_EMAIL,
  IS_PRODUCTION,
  consumeRateLimit,
  cors,
  errResponse,
  ensureUserProfileColumns,
  escapeHtml,
  getClientIp,
  getResend,
  normalizeRateLimitKey,
  rateLimitResponse,
  signJwt,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername
} from '../../lib/auth-shared.js';
import { initializeDatabase } from '../../lib/db.js';

const REGISTER_RATE_LIMIT = { limit: 5, windowSeconds: 60 * 60 };
const REGISTER_IP_RATE_LIMIT = { limit: 20, windowSeconds: 60 * 60 };

async function sendVerificationEmail(user) {
  const verificationToken = signJwt({ userId: user.id, purpose: 'email-verification' }, { expiresIn: '24h' });
  const tokenHash = await bcrypt.hash(verificationToken, 8);
  await sql`
    INSERT INTO email_verification_tokens (user_id, token_hash, expires_at)
    VALUES (${user.id}, ${tokenHash}, NOW() + INTERVAL '24 hours')
    ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at, created_at = NOW()
  `;

  const verificationUrl = `${APP_URL}?confirm_token=${encodeURIComponent(verificationToken)}`;
  const resend = getResend();
  if (resend) {
    try {
      const safeDisplayName = escapeHtml(user.display_name);
      const safeVerificationUrl = escapeHtml(verificationUrl);
      await resend.emails.send({
        from: FROM_EMAIL,
        to: user.email,
        subject: 'Confirm your Couple Planner account',
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
            <h2 style="color:#E63B2E">Couple Planner</h2>
            <p>Hi ${safeDisplayName},</p>
            <p>Confirm your email address to finish creating your account. This link expires in <strong>24 hours</strong>.</p>
            <a href="${safeVerificationUrl}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#004385;color:#ffffff;border-radius:8px;text-decoration:none;font-weight:600">
              Confirm account
            </a>
            <p style="color:#6b7280;font-size:13px">If you did not create this account, you can ignore this email.</p>
          </div>
        `
      });
    } catch (emailError) {
      console.error('Verification email error:', emailError);
    }
  } else {
    console.warn(
      IS_PRODUCTION
        ? '[Email Verification] RESEND_API_KEY not set; verification email was not sent.'
        : `[Email Verification] RESEND_API_KEY not set. Verification link for ${user.email}: ${verificationUrl}`
    );
  }

  return { verificationUrl, resend };
}

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

    const inputError =
      validateDisplayName(displayName) ||
      validateUsername(username) ||
      validateEmail(emailValue) ||
      validatePassword(password);
    if (inputError) return res.status(400).json({ error: inputError });

    const ip = getClientIp(req);
    const [emailLimit, ipLimit] = await Promise.all([
      consumeRateLimit({
        scope: 'auth-register-email',
        key: `${ip}:${normalizeRateLimitKey(emailValue)}`,
        ...REGISTER_RATE_LIMIT
      }),
      consumeRateLimit({
        scope: 'auth-register-ip',
        key: ip,
        ...REGISTER_IP_RATE_LIMIT
      })
    ]);

    if (!emailLimit.allowed || !ipLimit.allowed) {
      return rateLimitResponse(
        res,
        !emailLimit.allowed ? emailLimit : ipLimit,
        'Too many account creation attempts. Please wait and try again later.'
      );
    }

    await ensureUserProfileColumns();

    const [emailCheck, nameCheck] = await Promise.all([
      sql`SELECT id, email, display_name, username, email_verified FROM users WHERE LOWER(email) = LOWER(${emailValue})`,
      sql`SELECT id FROM users WHERE LOWER(COALESCE(username, display_name)) = LOWER(${username})`
    ]);
    if (emailCheck.rows.length > 0) {
      const existingUser = emailCheck.rows[0];
      if (!existingUser.email_verified) {
        const { verificationUrl, resend } = await sendVerificationEmail(existingUser);
        return res.status(202).json({
          message: 'If this account still needs confirmation, a new confirmation email has been sent.',
          ...(!IS_PRODUCTION && !resend ? { verificationUrl } : {})
        });
      }

      return res.status(409).json({ error: 'Email already registered' });
    }
    if (nameCheck.rows.length > 0) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const id = randomUUID();
    const hash = await bcrypt.hash(password, 10);
    const result = await sql`
      INSERT INTO users (id, email, password_hash, display_name, username, email_verified)
      VALUES (${id}, ${emailValue}, ${hash}, ${displayName}, ${username}, false)
      RETURNING id, email, display_name, username, email_verified
    `;
    const user = result.rows[0];

    const { verificationUrl, resend } = await sendVerificationEmail(user);

    return res.status(201).json({
      message: 'Account created. Check your email to confirm your account before signing in.',
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        username: user.username,
        emailVerified: user.email_verified
      },
      ...(!IS_PRODUCTION && !resend ? { verificationUrl } : {})
    });
  } catch (error) {
    if (error?.code === '23505') {
      return res.status(409).json({ error: 'Email or username already registered' });
    }
    return errResponse(res, error);
  }
}
