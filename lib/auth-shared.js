import { sql } from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

export { sql, jwt, bcrypt };

const DEV_JWT_SECRET = 'dev-secret-change-in-production';
const isVercelRuntime = process.env.VERCEL === '1' || process.env.VERCEL === 'true';

export const IS_PRODUCTION = process.env.NODE_ENV === 'production' || isVercelRuntime;
export const JWT_SECRET = process.env.JWT_SECRET || DEV_JWT_SECRET;
export const JWT_EXPIRY = '7d';
export const JWT_EXPIRY_REMEMBER = '30d';

export const APP_URL = process.env.APP_URL || 'https://coupleplanner.app';
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@coupleplanner.app';

export const getResend = () =>
  process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

export const validateDisplayName = (name = '') => {
  const value = String(name).trim();
  if (!value) return 'Name is required';
  if (value.length > 20) return 'Name must be 20 characters or fewer';
  if (!/^[A-Za-z ]+$/.test(value)) return 'Name can only contain letters and spaces';
  return '';
};

export const validateUsername = (username = '') => {
  const value = String(username).trim();
  if (!value) return 'Username is required';
  if (value.length > 20) return 'Username must be 20 characters or fewer';
  if (!/^[A-Za-z0-9]+$/.test(value)) return 'Username can only contain letters and numbers';
  return '';
};

export const validateEmail = (email = '') => {
  const value = String(email).trim();
  if (!value) return 'Email is required';
  if (!value.includes('@')) return 'Email must include @';
  return '';
};

export const validatePassword = (password = '') => {
  const value = String(password);
  const letterCount = (value.match(/[A-Za-z]/g) || []).length;
  if (letterCount < 5) return 'Password must include at least 5 letters';
  if (!/\d/.test(value)) return 'Password must include at least 1 number';
  return '';
};

function unsafeJwtSecretError(reason) {
  const error = new Error('JWT_SECRET must be a strong random value in production');
  error.code = 'UNSAFE_JWT_SECRET';
  error.reason = reason;
  return error;
}

export function assertSafeProductionJwtSecret() {
  if (!IS_PRODUCTION) return true;

  const secret = process.env.JWT_SECRET || '';
  if (!secret || secret === DEV_JWT_SECRET) {
    throw unsafeJwtSecretError('missing-or-default');
  }

  if (secret.length < 32) {
    throw unsafeJwtSecretError('too-short');
  }

  if (new Set(secret).size < 8) {
    throw unsafeJwtSecretError('low-variety');
  }

  return true;
}

function getConfiguredJwtSecret() {
  assertSafeProductionJwtSecret();
  return JWT_SECRET;
}

export function signJwt(payload, options) {
  return jwt.sign(payload, getConfiguredJwtSecret(), options);
}

export function verifyJwt(token) {
  return jwt.verify(token, getConfiguredJwtSecret());
}

export function getBearerToken(req) {
  const authHeader = req.headers.authorization || '';
  return authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';
}

export function getUserIdFromRequest(req) {
  const token = getBearerToken(req);
  if (!token) return null;

  try {
    const decoded = verifyJwt(token);
    return decoded.userId || null;
  } catch {
    return null;
  }
}

const parseOriginList = (value = '') =>
  value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const normalizeOrigin = (value) => {
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const configuredOrigins = () => {
  const origins = new Set([
    normalizeOrigin(APP_URL),
    normalizeOrigin(process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : ''),
    ...parseOriginList(process.env.CORS_ORIGINS).map(normalizeOrigin)
  ]);

  origins.delete(null);
  return origins;
};

const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  if (!IS_PRODUCTION && /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) return true;
  return configuredOrigins().has(origin);
};

export function cors(reqOrRes, maybeRes) {
  const req = maybeRes ? reqOrRes : null;
  const res = maybeRes || reqOrRes;
  const origin = req?.headers?.origin;

  res.setHeader('Vary', 'Origin');
  if (isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin || (IS_PRODUCTION ? APP_URL : '*'));
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Setup-Token');
}

export function errResponse(res, error) {
  console.error('Server error:', error);

  if (IS_PRODUCTION) {
    return res.status(500).json({ error: 'Internal server error' });
  }

  const message = error?.message || 'Internal server error';
  const code = error?.code || error?.name;
  const hint =
    code === 'UNSAFE_JWT_SECRET'
      ? 'Set JWT_SECRET to a strong random value in Vercel environment variables.'
      : code === '42P01' || /relation .* does not exist/i.test(message)
        ? 'Database tables are missing - hit GET /api/setup once to create them.'
        : /missing_connection_string|POSTGRES_URL|connect ECONNREFUSED/i.test(message)
          ? 'Database not configured - set POSTGRES_URL in Vercel env vars.'
          : undefined;

  return res.status(500).json({ error: message, code, hint });
}

export function publicErrorDetails(error) {
  if (IS_PRODUCTION) return {};

  const message = error?.message || '';
  const code = error?.code || error?.name;
  const hint =
    code === '42P01' || /relation .* does not exist/i.test(message)
      ? 'Database tables are missing - hit GET /api/setup once to create them.'
      : /missing_connection_string|POSTGRES_URL|connect ECONNREFUSED/i.test(message)
        ? 'Database not configured - set POSTGRES_URL in Vercel env vars.'
        : undefined;

  return { code, hint };
}

const RATE_LIMIT_MAX_WINDOW_SECONDS = 24 * 60 * 60;

let authSecurityMigrationPromise = null;

export function ensureAuthSecurityTables() {
  if (!authSecurityMigrationPromise) {
    authSecurityMigrationPromise = (async () => {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS failed_login_count INTEGER DEFAULT 0 NOT NULL
      `;
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS last_failed_login_at TIMESTAMP
      `;
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS login_locked_until TIMESTAMP
      `;
      await sql`
        CREATE TABLE IF NOT EXISTS auth_rate_limits (
          id BIGSERIAL PRIMARY KEY,
          scope TEXT NOT NULL,
          rate_key TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
      await sql`
        CREATE INDEX IF NOT EXISTS idx_auth_rate_limits_scope_key_created
        ON auth_rate_limits(scope, rate_key, created_at)
      `;
    })().catch((error) => {
      authSecurityMigrationPromise = null;
      throw error;
    });
  }

  return authSecurityMigrationPromise;
}

export function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const forwardedValue = Array.isArray(forwarded) ? forwarded[0] : forwarded;
  if (forwardedValue) return forwardedValue.split(',')[0].trim();

  const realIp = req.headers['x-real-ip'];
  if (Array.isArray(realIp)) return realIp[0] || 'unknown';
  return realIp || req.socket?.remoteAddress || 'unknown';
}

export function normalizeRateLimitKey(value = '') {
  return String(value).trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 160) || 'unknown';
}

export async function consumeRateLimit({ scope, key, limit, windowSeconds }) {
  const safeScope = normalizeRateLimitKey(scope);
  const safeKey = normalizeRateLimitKey(key);
  const safeLimit = Math.max(1, Number(limit) || 1);
  const safeWindowSeconds = Math.min(
    RATE_LIMIT_MAX_WINDOW_SECONDS,
    Math.max(1, Number(windowSeconds) || 60)
  );

  await ensureAuthSecurityTables();

  await sql`
    DELETE FROM auth_rate_limits
    WHERE created_at < NOW() - (${RATE_LIMIT_MAX_WINDOW_SECONDS} * INTERVAL '1 second')
  `;
  await sql`
    DELETE FROM auth_rate_limits
    WHERE scope = ${safeScope}
      AND rate_key = ${safeKey}
      AND created_at < NOW() - (${safeWindowSeconds} * INTERVAL '1 second')
  `;
  await sql`
    INSERT INTO auth_rate_limits (scope, rate_key)
    VALUES (${safeScope}, ${safeKey})
  `;

  const result = await sql`
    SELECT COUNT(*)::int AS count, MIN(created_at) AS oldest_at
    FROM auth_rate_limits
    WHERE scope = ${safeScope}
      AND rate_key = ${safeKey}
      AND created_at >= NOW() - (${safeWindowSeconds} * INTERVAL '1 second')
  `;
  const row = result.rows[0] || {};
  const count = Number(row.count || 0);
  const oldest = row.oldest_at ? new Date(row.oldest_at).getTime() : Date.now();
  const retryAfter = Math.max(1, Math.ceil((oldest + safeWindowSeconds * 1000 - Date.now()) / 1000));

  return {
    allowed: count <= safeLimit,
    count,
    retryAfter,
    limit: safeLimit,
    windowSeconds: safeWindowSeconds
  };
}

export function rateLimitResponse(res, result, message = 'Too many attempts. Please wait a few minutes and try again.') {
  res.setHeader('Retry-After', String(result.retryAfter || 60));
  return res.status(429).json({
    error: message,
    retryAfter: result.retryAfter || 60
  });
}

let emailChangeMigrationPromise = null;

export function ensureEmailChangeTokensTable() {
  if (!emailChangeMigrationPromise) {
    emailChangeMigrationPromise = (async () => {
      await sql`
        CREATE TABLE IF NOT EXISTS email_change_tokens (
          user_id TEXT PRIMARY KEY,
          token_hash TEXT NOT NULL,
          new_email TEXT NOT NULL,
          expires_at TIMESTAMP NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        )
      `;
    })().catch((error) => {
      emailChangeMigrationPromise = null;
      throw error;
    });
  }

  return emailChangeMigrationPromise;
}

let userProfileMigrationPromise = null;

export function ensureUserProfileColumns() {
  if (!userProfileMigrationPromise) {
    userProfileMigrationPromise = (async () => {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS username TEXT
      `;
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN
      `;
      await sql`
        UPDATE users
        SET email_verified = true
        WHERE email_verified IS NULL
      `;
      await sql`
        ALTER TABLE users
        ALTER COLUMN email_verified SET DEFAULT false
      `;
      await sql`
        ALTER TABLE users
        ALTER COLUMN email_verified SET NOT NULL
      `;
      await sql`
        WITH ranked_users AS (
          SELECT
            id,
            COALESCE(NULLIF(username, ''), display_name) AS base_username,
            ROW_NUMBER() OVER (
              PARTITION BY LOWER(COALESCE(NULLIF(username, ''), display_name))
              ORDER BY created_at, id
            ) AS duplicate_rank
          FROM users
        )
        UPDATE users
        SET username = CASE
          WHEN ranked_users.duplicate_rank = 1 THEN ranked_users.base_username
          ELSE ranked_users.base_username || '-' || LEFT(users.id, 6)
        END
        FROM ranked_users
        WHERE users.id = ranked_users.id
          AND (
            users.username IS NULL
            OR users.username = ''
            OR ranked_users.duplicate_rank > 1
          )
      `;
      await sql`CREATE UNIQUE INDEX IF NOT EXISTS idx_users_username_lower ON users(LOWER(username))`;
    })().catch((error) => {
      userProfileMigrationPromise = null;
      throw error;
    });
  }

  return userProfileMigrationPromise;
}
