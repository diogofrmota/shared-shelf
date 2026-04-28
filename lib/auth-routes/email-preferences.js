import {
  cors,
  errResponse,
  verifyJwt,
  sql
} from '../auth-shared.js';
import { ensureEmailPreferenceColumns } from '../email-templates.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).json({ error: 'Method not allowed' });

  try {
    const token = `${req.query?.token || req.body?.token || ''}`.trim();
    if (!token) return res.status(400).json({ error: 'Preferences token is required' });

    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch {
      return res.status(400).json({ error: 'This email preferences link is not valid.' });
    }

    if (decoded.purpose !== 'email-preferences' || decoded.action !== 'unsubscribe-non-essential') {
      return res.status(400).json({ error: 'This email preferences link is not valid.' });
    }

    await ensureEmailPreferenceColumns();
    await sql`
      UPDATE users
      SET non_essential_email_opt_out = true
      WHERE id = ${decoded.userId}
    `;

    if (req.method === 'GET') {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      return res.status(200).send(`
        <!doctype html>
        <html>
          <head><title>Email preferences updated</title></head>
          <body style="margin:0;background:#FFF8F2;color:#241A18;font-family:Arial,sans-serif">
            <main style="max-width:560px;margin:60px auto;padding:32px;background:#fff;border:1px solid #F1D9CF;border-radius:18px">
              <h1 style="margin-top:0;color:#410001">Email preferences updated</h1>
              <p>You have been unsubscribed from non-essential Couple Planner emails.</p>
              <p>Required account and security emails, such as password resets, will still be sent.</p>
            </main>
          </body>
        </html>
      `);
    }

    return res.json({
      message: 'You have been unsubscribed from non-essential Couple Planner emails. Required account and security emails will still be sent.'
    });
  } catch (error) {
    return errResponse(res, error);
  }
}
