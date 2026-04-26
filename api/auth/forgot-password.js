import { sql, bcrypt, APP_URL, FROM_EMAIL, getResend, cors, errResponse, IS_PRODUCTION, signJwt } from '../../lib/auth-shared.js';

const escapeHtml = (value = '') =>
  String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[char]);

export default async function handler(req, res) {
  cors(req, res);
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required' });

    const userRow = (await sql`SELECT id, display_name FROM users WHERE email = ${email}`).rows[0];
    if (userRow) {
      const resetToken = signJwt({ userId: userRow.id, purpose: 'password-reset' }, { expiresIn: '1h' });
      const tokenHash = await bcrypt.hash(resetToken, 8);
      await sql`
        INSERT INTO password_reset_tokens (user_id, token_hash, expires_at)
        VALUES (${userRow.id}, ${tokenHash}, NOW() + INTERVAL '1 hour')
        ON CONFLICT (user_id) DO UPDATE SET token_hash = EXCLUDED.token_hash, expires_at = EXCLUDED.expires_at
      `;

      const resetUrl = `${APP_URL}?reset_token=${encodeURIComponent(resetToken)}`;
      const resend = getResend();
      if (resend) {
        try {
          const safeDisplayName = escapeHtml(userRow.display_name);
          const safeResetUrl = escapeHtml(resetUrl);
          await resend.emails.send({
            from: FROM_EMAIL,
            to: email,
            subject: 'Reset your Shared Shelf password',
            html: `
              <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px">
                <h2 style="color:#780000">Shared Shelf</h2>
                <p>Hi ${safeDisplayName},</p>
                <p>We received a request to reset your password. Click the button below — the link expires in <strong>1 hour</strong>.</p>
                <a href="${safeResetUrl}" style="display:inline-block;margin:24px 0;padding:12px 24px;background:#c1121f;color:#fdf0d5;border-radius:8px;text-decoration:none;font-weight:600">
                  Reset password
                </a>
                <p style="color:#6b7280;font-size:13px">If you didn't request this, you can safely ignore this email.</p>
              </div>
            `
          });
        } catch (e) {
          console.error('Resend email error:', e);
        }
      } else {
        console.warn(
          IS_PRODUCTION
            ? '[Password Reset] RESEND_API_KEY not set; reset email was not sent.'
            : `[Password Reset] RESEND_API_KEY not set. Reset link for ${email}: ${resetUrl}`
        );
      }
    }

    return res.json({ message: 'If that email is registered, a password reset link has been sent.' });
  } catch (error) {
    return errResponse(res, error);
  }
}
