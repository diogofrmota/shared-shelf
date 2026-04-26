import { sql, bcrypt, cors, errResponse, verifyJwt } from '../../lib/auth-shared.js';

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    let decoded;
    try {
      decoded = verifyJwt(token);
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
  } catch (error) {
    return errResponse(res, error);
  }
}
