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

export const APP_URL = process.env.APP_URL || 'https://shared-shelf.vercel.app';
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@shared-shelf.vercel.app';

export const getResend = () =>
  process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

function getConfiguredJwtSecret() {
  if (IS_PRODUCTION && (!process.env.JWT_SECRET || process.env.JWT_SECRET === DEV_JWT_SECRET)) {
    const error = new Error('JWT_SECRET is not safely configured');
    error.code = 'UNSAFE_JWT_SECRET';
    throw error;
  }

  return JWT_SECRET;
}

export function signJwt(payload, options) {
  return jwt.sign(payload, getConfiguredJwtSecret(), options);
}

export function verifyJwt(token) {
  return jwt.verify(token, getConfiguredJwtSecret());
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
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

let userProfileMigrationPromise = null;

export function ensureUserProfileColumns() {
  if (!userProfileMigrationPromise) {
    userProfileMigrationPromise = (async () => {
      await sql`
        ALTER TABLE users
        ADD COLUMN IF NOT EXISTS username TEXT
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
