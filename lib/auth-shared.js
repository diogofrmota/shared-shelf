import { sql } from './db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

export { sql, jwt, bcrypt };

export const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
export const JWT_EXPIRY = '7d';
export const JWT_EXPIRY_REMEMBER = '30d';

export const APP_URL = process.env.APP_URL || 'https://shared-shelf.vercel.app';
export const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@shared-shelf.vercel.app';

export const getResend = () =>
  process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

export function cors(res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

export function errResponse(res, error) {
  console.error('Auth error:', error);
  const message = error?.message || 'Internal server error';
  const code = error?.code || error?.name;
  const hint =
    code === '42P01' || /relation .* does not exist/i.test(message)
      ? 'Database tables are missing - hit GET /api/setup once to create them.'
      : /missing_connection_string|POSTGRES_URL|connect ECONNREFUSED/i.test(message)
        ? 'Database not configured - set POSTGRES_URL in Vercel env vars.'
        : undefined;
  return res.status(500).json({ error: message, code, hint });
}
