import {
  sql,
  bcrypt,
  cors,
  errResponse,
  ensureEmailChangeTokensTable,
  verifyJwt
} from '../../lib/auth-shared.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ error: 'Token is required' });

    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch (err) {
      const expired = err?.name === 'TokenExpiredError';
      return res.status(400).json({
        error: expired
          ? 'This confirmation link has expired. Please request a new email change.'
          : 'This confirmation link is not valid.',
        linkStatus: expired ? 'expired' : 'invalid'
      });
    }

    if (decoded.purpose !== 'email-change' || !decoded.userId || !decoded.newEmail) {
      return res.status(400).json({ error: 'Invalid confirmation token', linkStatus: 'invalid' });
    }

    await ensureEmailChangeTokensTable();

    const tokenRecord = await sql`
      SELECT token_hash, new_email, expires_at FROM email_change_tokens WHERE user_id = ${decoded.userId}
    `;

    if (!tokenRecord.rows[0]) {
      return res.status(400).json({
        error: 'This confirmation link has already been used or has expired.',
        linkStatus: 'used'
      });
    }

    const record = tokenRecord.rows[0];

    if (new Date(record.expires_at) < new Date()) {
      await sql`DELETE FROM email_change_tokens WHERE user_id = ${decoded.userId}`;
      return res.status(400).json({
        error: 'This confirmation link has expired. Please request a new email change.',
        linkStatus: 'expired'
      });
    }

    const hashMatch = await bcrypt.compare(token, record.token_hash);
    if (!hashMatch) {
      return res.status(400).json({ error: 'This confirmation link is not valid.', linkStatus: 'invalid' });
    }

    if (record.new_email.toLowerCase() !== decoded.newEmail.toLowerCase()) {
      return res.status(400).json({ error: 'This confirmation link is not valid.', linkStatus: 'invalid' });
    }

    const emailCheck = await sql`
      SELECT id FROM users WHERE LOWER(email) = LOWER(${decoded.newEmail}) AND id <> ${decoded.userId} LIMIT 1
    `;
    if (emailCheck.rows.length > 0) {
      await sql`DELETE FROM email_change_tokens WHERE user_id = ${decoded.userId}`;
      return res.status(409).json({
        error: 'This email address has already been taken by another account.',
        linkStatus: 'invalid'
      });
    }

    await sql`UPDATE users SET email = ${decoded.newEmail} WHERE id = ${decoded.userId}`;
    await sql`DELETE FROM email_change_tokens WHERE user_id = ${decoded.userId}`;

    return res.json({ message: 'Email address updated successfully.' });
  } catch (error) {
    return errResponse(res, error);
  }
}
