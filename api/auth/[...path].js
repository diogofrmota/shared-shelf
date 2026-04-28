import register from '../../lib/auth-routes/register.js';
import login from '../../lib/auth-routes/login.js';
import me from '../../lib/auth-routes/me.js';
import forgotPassword from '../../lib/auth-routes/forgot-password.js';
import resetPassword from '../../lib/auth-routes/reset-password.js';
import confirmEmail from '../../lib/auth-routes/confirm-email.js';
import changePassword from '../../lib/auth-routes/change-password.js';
import changeEmail from '../../lib/auth-routes/change-email.js';
import confirmEmailChange from '../../lib/auth-routes/confirm-email-change.js';
import checkUsername from '../../lib/auth-routes/check-username.js';
import emailPreferences from '../../lib/auth-routes/email-preferences.js';
import { cors } from '../../lib/auth-shared.js';

const routes = {
  register,
  login,
  me,
  'forgot-password': forgotPassword,
  'reset-password': resetPassword,
  'confirm-email': confirmEmail,
  'change-password': changePassword,
  'change-email': changeEmail,
  'confirm-email-change': confirmEmailChange,
  'check-username': checkUsername,
  'email-preferences': emailPreferences
};

const pathValue = (value) => Array.isArray(value) ? value.join('/') : value;

export default async function handler(req, res) {
  const route = pathValue(req.query.path || '').replace(/^\/+|\/+$/g, '');
  const routeHandler = routes[route];

  if (!routeHandler) {
    cors(req, res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    return res.status(404).json({ error: 'Auth route not found' });
  }

  return routeHandler(req, res);
}
