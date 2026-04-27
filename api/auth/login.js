import {
  sql,
  bcrypt,
  JWT_EXPIRY,
  JWT_EXPIRY_REMEMBER,
  consumeRateLimit,
  cors,
  errResponse,
  ensureAuthSecurityTables,
  ensureUserProfileColumns,
  getClientIp,
  normalizeRateLimitKey,
  rateLimitResponse,
  signJwt
} from '../../lib/auth-shared.js';

const LOGIN_RATE_LIMIT = { limit: 12, windowSeconds: 15 * 60 };
const LOGIN_IP_RATE_LIMIT = { limit: 40, windowSeconds: 15 * 60 };
const LOGIN_LOCK_THRESHOLD = 5;
const LOGIN_LOCK_MINUTES = 15;

function invalidLoginResponse(res) {
  return res.status(401).json({
    error: 'Email/username or password is incorrect. Please check your details and try again.'
  });
}

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { login, password, rememberMe } = req.body;
    if (!login || !password) return res.status(400).json({ error: 'Email/username and password are required.' });

    await ensureAuthSecurityTables();
    await ensureUserProfileColumns();

    const loginValue = `${login}`.trim();
    const ip = getClientIp(req);
    const normalizedLogin = normalizeRateLimitKey(loginValue);
    const [identityLimit, ipLimit] = await Promise.all([
      consumeRateLimit({
        scope: 'auth-login-identity',
        key: `${ip}:${normalizedLogin}`,
        ...LOGIN_RATE_LIMIT
      }),
      consumeRateLimit({
        scope: 'auth-login-ip',
        key: ip,
        ...LOGIN_IP_RATE_LIMIT
      })
    ]);

    if (!identityLimit.allowed || !ipLimit.allowed) {
      return rateLimitResponse(
        res,
        !identityLimit.allowed ? identityLimit : ipLimit,
        'Too many sign-in attempts. Please wait a few minutes and try again.'
      );
    }

    const result = await sql`
      SELECT
        id,
        email,
        password_hash,
        display_name,
        username,
        email_verified,
        failed_login_count,
        last_failed_login_at,
        login_locked_until
      FROM users
      WHERE LOWER(email) = LOWER(${loginValue})
        OR LOWER(COALESCE(username, display_name)) = LOWER(${loginValue})
      LIMIT 1
    `;
    const user = result.rows[0];
    if (!user || !user.password_hash) return invalidLoginResponse(res);

    const lockedUntil = user.login_locked_until ? new Date(user.login_locked_until) : null;
    if (lockedUntil && lockedUntil.getTime() > Date.now()) {
      const retryAfter = Math.max(1, Math.ceil((lockedUntil.getTime() - Date.now()) / 1000));
      res.setHeader('Retry-After', String(retryAfter));
      return res.status(423).json({
        error: 'Too many failed sign-in attempts. Please wait a few minutes and try again.',
        retryAfter
      });
    }

    const lastFailedAt = user.last_failed_login_at ? new Date(user.last_failed_login_at).getTime() : 0;
    const recentFailureWindowMs = LOGIN_LOCK_MINUTES * 60 * 1000;
    const currentFailedCount = lastFailedAt && Date.now() - lastFailedAt <= recentFailureWindowMs
      ? Number(user.failed_login_count || 0)
      : 0;

    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      const nextFailedCount = currentFailedCount + 1;
      const shouldLock = nextFailedCount >= LOGIN_LOCK_THRESHOLD;
      await sql`
        UPDATE users
        SET
          failed_login_count = ${nextFailedCount},
          last_failed_login_at = NOW(),
          login_locked_until = CASE
            WHEN ${shouldLock} THEN NOW() + (${LOGIN_LOCK_MINUTES} * INTERVAL '1 minute')
            ELSE login_locked_until
          END
        WHERE id = ${user.id}
      `;

      if (shouldLock) {
        res.setHeader('Retry-After', String(LOGIN_LOCK_MINUTES * 60));
        return res.status(423).json({
          error: 'Too many failed sign-in attempts. Please wait a few minutes and try again.',
          retryAfter: LOGIN_LOCK_MINUTES * 60
        });
      }

      return invalidLoginResponse(res);
    }

    if (!user.email_verified) {
      return res.status(403).json({ error: 'Please confirm your email before signing in.' });
    }

    await sql`
      UPDATE users
      SET failed_login_count = 0, last_failed_login_at = NULL, login_locked_until = NULL
      WHERE id = ${user.id}
    `;

    const token = signJwt({ userId: user.id }, {
      expiresIn: rememberMe ? JWT_EXPIRY_REMEMBER : JWT_EXPIRY
    });
    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.display_name,
        username: user.username || user.display_name,
        emailVerified: user.email_verified
      }
    });
  } catch (error) {
    return errResponse(res, error);
  }
}
