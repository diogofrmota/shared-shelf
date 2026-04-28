import { APP_URL, FROM_EMAIL, IS_PRODUCTION, escapeHtml, getResend, signJwt, sql } from './auth-shared.js';

export const SUPPORT_EMAIL = process.env.SUPPORT_EMAIL || 'support@coupleplanner.app';
const BRAND = 'Couple Planner';

const absoluteUrl = (path = '') => new URL(path, APP_URL).toString();

export function emailPreferencesUrl(userId) {
  const token = signJwt(
    { userId, purpose: 'email-preferences', action: 'unsubscribe-non-essential' },
    { expiresIn: '365d' }
  );
  return absoluteUrl(`/api/auth/email-preferences?token=${encodeURIComponent(token)}&unsubscribe=1`);
}

export async function ensureEmailPreferenceColumns() {
  await sql`
    ALTER TABLE users
    ADD COLUMN IF NOT EXISTS non_essential_email_opt_out BOOLEAN DEFAULT false NOT NULL
  `;
}

export async function canSendNonEssentialEmail(userId) {
  await ensureEmailPreferenceColumns();
  const user = (await sql`
    SELECT non_essential_email_opt_out
    FROM users
    WHERE id = ${userId}
  `).rows[0];
  return Boolean(user) && !user.non_essential_email_opt_out;
}

const templateText = ({ greeting, lines, ctaLabel, ctaUrl, preferencesUrl }) => [
  BRAND,
  '',
  greeting,
  '',
  ...lines,
  '',
  ctaLabel && ctaUrl ? `${ctaLabel}: ${ctaUrl}` : '',
  '',
  `Need help? Contact ${SUPPORT_EMAIL}.`,
  preferencesUrl ? `Email preferences: ${preferencesUrl}` : '',
  APP_URL
].filter(Boolean).join('\n');

const templateHtml = ({ preheader, heading, greeting, body, ctaLabel, ctaUrl, preferencesUrl }) => {
  const safeSupportEmail = escapeHtml(SUPPORT_EMAIL);
  const safeAppUrl = escapeHtml(APP_URL);
  const safePreferencesUrl = preferencesUrl ? escapeHtml(preferencesUrl) : '';
  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <title>${escapeHtml(heading)}</title>
      </head>
      <body style="margin:0;background:#FFF8F2;color:#241A18;font-family:Manrope,Arial,sans-serif">
        <div style="display:none;max-height:0;overflow:hidden;color:transparent;opacity:0">${escapeHtml(preheader)}</div>
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#FFF8F2;padding:28px 12px">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#FFFFFF;border:1px solid #F1D9CF;border-radius:18px;overflow:hidden">
                <tr>
                  <td style="padding:28px 28px 18px;background:#E63B2E;color:#FFFFFF">
                    <div style="font-family:Epilogue,Arial,sans-serif;font-size:24px;font-weight:800;letter-spacing:0">${BRAND}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding:30px 28px 8px">
                    <h1 style="margin:0 0 16px;font-family:Epilogue,Arial,sans-serif;font-size:26px;line-height:1.2;color:#410001">${escapeHtml(heading)}</h1>
                    <p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#534340">${greeting}</p>
                    ${body}
                    ${ctaLabel && ctaUrl ? `
                      <p style="margin:28px 0">
                        <a href="${escapeHtml(ctaUrl)}" style="display:inline-block;background:#E63B2E;color:#FFFFFF;border-radius:999px;padding:14px 22px;font-size:15px;font-weight:800;text-decoration:none">${escapeHtml(ctaLabel)}</a>
                      </p>
                    ` : ''}
                  </td>
                </tr>
                <tr>
                  <td style="padding:18px 28px 30px">
                    <p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#7B6863">Need help? Contact <a href="mailto:${safeSupportEmail}" style="color:#E63B2E;text-decoration:underline">${safeSupportEmail}</a>.</p>
                    ${preferencesUrl ? `<p style="margin:0 0 10px;font-size:13px;line-height:1.6;color:#7B6863">You can <a href="${safePreferencesUrl}" style="color:#E63B2E;text-decoration:underline">unsubscribe from non-essential email</a>. Required account and security emails will still be sent.</p>` : ''}
                    <p style="margin:0;font-size:12px;line-height:1.6;color:#9B8882"><a href="${safeAppUrl}" style="color:#9B8882;text-decoration:underline">${safeAppUrl}</a></p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
};

const paragraph = (value) =>
  `<p style="margin:0 0 16px;font-size:16px;line-height:1.6;color:#534340">${value}</p>`;

export function accountConfirmationEmail({ displayName, verificationUrl }) {
  const name = escapeHtml(displayName || 'there');
  return {
    subject: 'Confirm your Couple Planner account',
    html: templateHtml({
      preheader: 'Confirm your email address to finish creating your Couple Planner account.',
      heading: 'Confirm your account',
      greeting: `Hi ${name},`,
      body: [
        paragraph('Confirm your email address to finish creating your account. This link expires in <strong>24 hours</strong>.'),
        paragraph('If you did not create this account, you can safely ignore this email.')
      ].join(''),
      ctaLabel: 'Confirm account',
      ctaUrl: verificationUrl
    }),
    text: templateText({
      greeting: `Hi ${displayName || 'there'},`,
      lines: [
        'Confirm your email address to finish creating your Couple Planner account.',
        'This link expires in 24 hours.',
        'If you did not create this account, you can safely ignore this email.'
      ],
      ctaLabel: 'Confirm account',
      ctaUrl: verificationUrl
    })
  };
}

export function passwordResetEmail({ displayName, resetUrl }) {
  const name = escapeHtml(displayName || 'there');
  return {
    subject: 'Reset your Couple Planner password',
    html: templateHtml({
      preheader: 'Use this secure link to reset your Couple Planner password.',
      heading: 'Reset your password',
      greeting: `Hi ${name},`,
      body: [
        paragraph('We received a request to reset your password. This link expires in <strong>1 hour</strong>.'),
        paragraph('If you did not request this, you can safely ignore this email.')
      ].join(''),
      ctaLabel: 'Reset password',
      ctaUrl: resetUrl
    }),
    text: templateText({
      greeting: `Hi ${displayName || 'there'},`,
      lines: [
        'We received a request to reset your password.',
        'This link expires in 1 hour.',
        'If you did not request this, you can safely ignore this email.'
      ],
      ctaLabel: 'Reset password',
      ctaUrl: resetUrl
    })
  };
}

export function emailChangeConfirmationEmail({ newEmail, confirmUrl }) {
  return {
    subject: 'Confirm your new email address - Couple Planner',
    html: templateHtml({
      preheader: 'Confirm the new email address for your Couple Planner account.',
      heading: 'Confirm your new email',
      greeting: 'Hi there,',
      body: [
        paragraph(`You requested to change your Couple Planner email to <strong>${escapeHtml(newEmail)}</strong>.`),
        paragraph('This link expires in <strong>1 hour</strong>. If you did not request this change, you can safely ignore this email.')
      ].join(''),
      ctaLabel: 'Confirm new email',
      ctaUrl: confirmUrl
    }),
    text: templateText({
      greeting: 'Hi there,',
      lines: [
        `You requested to change your Couple Planner email to ${newEmail}.`,
        'This link expires in 1 hour.',
        'If you did not request this change, you can safely ignore this email.'
      ],
      ctaLabel: 'Confirm new email',
      ctaUrl: confirmUrl
    })
  };
}

export function welcomeEmail({ displayName, appUrl = APP_URL, preferencesUrl }) {
  const name = escapeHtml(displayName || 'there');
  return {
    subject: 'Welcome to Couple Planner',
    html: templateHtml({
      preheader: 'Your Couple Planner account is confirmed and ready to use.',
      heading: 'Welcome in',
      greeting: `Hi ${name},`,
      body: [
        paragraph('Your account is confirmed. You can now create or join a shared space, plan dates, track tasks, save recipes, and keep your watchlist together.'),
        paragraph('This is an onboarding email, so you can opt out of future non-essential messages below. Required account and security emails will still reach you.')
      ].join(''),
      ctaLabel: 'Open Couple Planner',
      ctaUrl: appUrl,
      preferencesUrl
    }),
    text: templateText({
      greeting: `Hi ${displayName || 'there'},`,
      lines: [
        'Your Couple Planner account is confirmed and ready to use.',
        'You can now create or join a shared space, plan dates, track tasks, save recipes, and keep your watchlist together.',
        'This is an onboarding email. You can opt out of future non-essential messages below. Required account and security emails will still be sent.'
      ],
      ctaLabel: 'Open Couple Planner',
      ctaUrl: appUrl,
      preferencesUrl
    }),
    headers: {
      'List-Unsubscribe': `<${preferencesUrl}>`,
      'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click'
    }
  };
}

export async function sendResendEmail({ to, template }) {
  const resend = getResend();
  if (!resend) return null;

  const payload = {
    from: FROM_EMAIL,
    to,
    subject: template.subject,
    html: template.html,
    text: template.text
  };
  if (template.headers) payload.headers = template.headers;

  await resend.emails.send(payload);
  return resend;
}

export function logMissingEmailConfig(label, address, url) {
  console.warn(
    IS_PRODUCTION
      ? `[${label}] RESEND_API_KEY not set; email was not sent.`
      : `[${label}] RESEND_API_KEY not set. Link for ${address}: ${url}`
  );
}
