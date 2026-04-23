import { sql } from '../lib/db.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const APP_URL = process.env.APP_URL || 'https://shared-shelf.vercel.app';
const FROM_EMAIL = process.env.FROM_EMAIL || 'noreply@shared-shelf.vercel.app';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRY = '7d';
const JWT_EXPIRY_REMEMBER = '30d';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();

  // Parse URL to determine endpoint
  const url = new URL(req.url, `http://${req.headers.host}`);
  const path = url.pathname;

  try {
    // POST /api/auth/register
    if (path === '/api/auth/register' && req.method === 'POST') {
      const { email, password, name } = req.body;
      if (!email || !password || !name || password.length < 6 || name.length < 4) {
        return res.status(400).json({ error: 'Invalid input', errors: {} });
      }

      const existing = await sql`SELECT id FROM users WHERE email = ${email}`;
      if (existing.rows.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const hash = await bcrypt.hash(password, 10);
      const result = await sql`
        INSERT INTO users (email, password_hash, display_name) 
        VALUES (${email}, ${hash}, ${name}) 
        RETURNING id, email, display_name
      `;
      const user = result.rows[0];
      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: JWT_EXPIRY });
      return res.status(201).json({
        token,
        user: { id: user.id, email: user.email, name: user.display_name }
      });
    }

    // POST /api/auth/login
    if (path === '/api/auth/login' && req.method === 'POST') {
      const { email, password, rememberMe } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Missing fields' });

      const result = await sql`SELECT * FROM users WHERE email = ${email}`;
      const user = result.rows[0];
      if (!user || !user.password_hash) return res.status(401).json({ error: 'Invalid credentials' });

      const valid = await bcrypt.compare(password, user.password_hash);
      if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: rememberMe ? JWT_EXPIRY_REMEMBER : JWT_EXPIRY
      });
      return res.json({
        token,
        user: { id: user.id, email: user.email, name: user.display_name }
      });
    }

    // GET /api/auth/me
    if (path === '/api/auth/me' && req.method === 'GET') {
      const authHeader = req.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) return res.status(401).json({ error: 'No token' });
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const user = (await sql`SELECT id, email, display_name FROM users WHERE id = ${decoded.userId}`).rows[0];
        if (!user) return res.status(404).json({ error: 'User not found' });
        return res.json({ user: { id: user.id, email: user.email, name: user.display_name } });
      } catch {
        return res.status(401).json({ error: 'Invalid token' });
      }
    }

    // POST /api/auth/forgot-password
    if (path === '/api/auth/forgot-password' && req.method === 'POST') {
      const { email } = req.body;
      if (!email) return res.status(400).json({ error: 'Email is required' });

      const userRow = (await sql`SELECT id, display_name FROM users WHERE email = ${email}`).rows[0];
      if (userRow) {
        const resetToken = jwt.sign({ userId: userRow.id, purpose: 'password-reset' }, JWT_SECRET, { expiresIn: '1h' });
        const tokenHash = await bcrypt.hash(resetToken, 8);
        await sql`
          INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
          VALUES (${userRow.id}, ${tokenHash}, NOW() + INTERVAL '1 hour')
          ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at
        `;

        const resetUrl = `${APP_URL}?reset_token=${encodeURIComponent(resetToken)}`;
        await resend.emails.send({
          from: FROM_EMAIL,
          to: email,
          subject: 'Reset your Shared Shelf password',
          html: `
            <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
              <h2 style="color:#7c3aed">Shared Shelf</h2>
              <p>Hi ${userRow.display_name},</p>
              <p>We received a request to reset your password. Click the button below — the link expires in <strong>1 hour</strong>.</p>
              <a href="${resetUrl}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#7c3aed;color:#fff;border-radius:8px;text-decoration:none;font-weight:600">
                Reset password
              </a>
              <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
            </div>
          `
        });
      }

      return res.json({ message: 'If that email is registered, a password reset link has been sent.' });
    }

    // POST /api/auth/reset-password
    if (path === '/api/auth/reset-password' && req.method === 'POST') {
      const { token, newPassword } = req.body;
      if (!token || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Invalid request' });
      }
      let decoded;
      try {
        decoded = jwt.verify(token, JWT_SECRET);
      } catch {
        return res.status(400).json({ error: 'Reset link has expired or is invalid.' });
      }
      if (decoded.purpose !== 'password-reset') {
        return res.status(400).json({ error: 'Invalid reset token.' });
      }
      const row = (await sql`SELECT token_hash FROM password_reset_tokens WHERE user_id = ${decoded.userId}`).rows[0];
      if (!row) return res.status(400).json({ error: 'Reset link already used or expired.' });

      const valid = await bcrypt.compare(token, row.token_hash);
      if (!valid) return res.status(400).json({ error: 'Reset link is invalid.' });

      const hash = await bcrypt.hash(newPassword, 10);
      await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${decoded.userId}`;
      await sql`DELETE FROM password_reset_tokens WHERE user_id = ${decoded.userId}`;
      return res.json({ message: 'Password updated successfully. You can now sign in.' });
    }

    return res.status(404).json({ error: 'Not found' });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}