import { randomUUID } from 'crypto';
import {
  sql,
  bcrypt,
  APP_URL,
  IS_PRODUCTION,
  consumeRateLimit,
  cors,
  errResponse,
  ensureUserProfileColumns,
  getClientIp,
  normalizeRateLimitKey,
  rateLimitResponse,
  signJwt,
  validateDisplayName,
  validateEmail,
  validatePassword,
  validateUsername
} from '../auth-shared.js';
import { initializeDatabase } from '../db.js';
import {
  accountConfirmationEmail,
  logMissingEmailConfig,
  sendResendEmail
} from '../email-templates.js';

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
  let resend;
  try {
    resend = await sendResendEmail({
      to: user.email,
      template: accountConfirmationEmail({
        displayName: user.display_name,
        verificationUrl
      })
    });
  } catch (emailError) {
    console.error('Verification email error:', emailError);
  }

  if (resend === null) {
    logMissingEmailConfig('Email Verification', user.email, verificationUrl);
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
