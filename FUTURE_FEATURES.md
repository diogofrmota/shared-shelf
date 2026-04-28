# Couple Planner Next Prompts

## Prompt 1: Account Settings - Change Password, Change Email, Username Availability

Improve signed-in account management.

Requirements:

- Add a change-password flow for signed-in users.
- Require the current password before changing to a new password.
- Validate new passwords consistently with registration and reset rules.
- Add a change-email flow for signed-in users.
- Require confirmation of the new email address before replacing the active account email.
- Add username availability feedback during registration.
- Add username availability feedback during profile editing.
- Keep errors helpful but avoid leaking unnecessary account data.
- Update auth/profile API routes using existing shared auth helpers.

Preserve existing profile editing behavior for name and username.

## Prompt 2: Transactional Emails And Welcome Email

Improve production email quality for Couple Planner.

Requirements:

- Send a welcome email after a user successfully confirms their email address.
- Create properly styled HTML email templates for account confirmation, password reset, and welcome emails.
- Keep plain-text fallbacks if supported by the existing email helper.
- Use the public `APP_URL` for all links.
- Include support/contact information in transactional emails.
- Add unsubscribe or email preferences handling where required by email regulations, especially for non-essential emails.
- Keep required account/security emails functional even if users opt out of non-essential email.

Use the existing Resend integration and avoid exposing email API keys to the frontend.

## Prompt 3: Branding Assets And Metadata

Add consistent public branding assets. Get context at readme and agents.md  

Requirements:

- Add the app favicon.
- Add consistent logo usage across public pages, login, shelf selection, and shelf pages.
- Add social preview metadata for shared links.
- Add app title and description metadata.

Use existing assets where possible before adding new ones.
Keep AGENTS.md and README.md updated.

## Later

- Add contact/support information with a monitored support email address.
- Verify Resend sender domain setup so account confirmation and password reset emails are reliable in production.