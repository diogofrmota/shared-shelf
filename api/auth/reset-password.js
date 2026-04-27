import { sql, bcrypt, cors, errResponse, jwt, validatePassword, verifyJwt } from '../../lib/auth-shared.js';

const linkError = (res, status, error, action) =>
  res.status(status).json({
    error,
    linkStatus: action.status,
    nextAction: {
      label: action.label,
      target: action.target
    }
  });

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { token, newPassword, validateOnly } = req.body;
    if (!token) return res.status(400).json({ error: 'Reset token is required' });

    let decoded;
    try {
      decoded = verifyJwt(token);
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        return linkError(
          res,
          400,
          'This password reset link has expired. Please request a new reset email.',
          { status: 'expired', label: 'Request a new reset link', target: 'forgot-password' }
        );
      }

      return linkError(
        res,
        400,
        'This password reset link is not valid. Please request a new reset email.',
        { status: 'invalid', label: 'Request a new reset link', target: 'forgot-password' }
      );
    }
    if (decoded.purpose !== 'password-reset') {
      return linkError(
        res,
        400,
        'This password reset link is not valid. Please request a new reset email.',
        { status: 'invalid', label: 'Request a new reset link', target: 'forgot-password' }
      );
    }

    const row = (await sql`
      SELECT token_hash, expires_at
      FROM password_reset_tokens
      WHERE user_id = ${decoded.userId}
    `).rows[0];

    if (!row) {
      return linkError(
        res,
        400,
        'This password reset link has already been used. Please sign in or request a new reset email.',
        { status: 'used', label: 'Request a new reset link', target: 'forgot-password' }
      );
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await sql`DELETE FROM password_reset_tokens WHERE user_id = ${decoded.userId}`;
      return linkError(
        res,
        400,
        'This password reset link has expired. Please request a new reset email.',
        { status: 'expired', label: 'Request a new reset link', target: 'forgot-password' }
      );
    }

    const valid = await bcrypt.compare(token, row.token_hash);
    if (!valid) {
      return linkError(
        res,
        400,
        'This password reset link is not valid. Please request a new reset email.',
        { status: 'invalid', label: 'Request a new reset link', target: 'forgot-password' }
      );
    }

    if (validateOnly) {
      return res.json({ message: 'Reset link verified. You can set a new password now.' });
    }

    const passwordError = validatePassword(newPassword);
    if (passwordError) return res.status(400).json({ error: passwordError });

    const hash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${decoded.userId}`;
    await sql`DELETE FROM password_reset_tokens WHERE user_id = ${decoded.userId}`;
    return res.json({ message: 'Password updated successfully. You can now sign in.' });
  } catch (error) {
    return errResponse(res, error);
  }
}
