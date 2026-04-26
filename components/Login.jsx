const React = window.React;
const { useState, useEffect } = React;

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOpen, setForgotOpen] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Activate reset-password form when URL contains ?reset_token=
  const [resetToken, setResetToken] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reset = params.get('reset_token');
    const confirmation = params.get('confirm_token');
    if (reset) {
      setResetToken(reset);
      setMode('reset');
      return;
    }
    if (confirmation) {
      setLoading(true);
      confirmEmail(confirmation)
        .then((result) => {
          if (result.success) {
            setServerSuccess(result.message || 'Account confirmed. You can now sign in.');
            window.history.replaceState({}, '', window.location.pathname);
          } else {
            setServerError(result.message || 'Confirmation link has expired or is invalid.');
          }
        })
        .catch(() => setServerError('Something went wrong confirming your account. Please try again.'))
        .finally(() => setLoading(false));
    }
  }, []);

  const validateNameValue = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Name is required';
    if (trimmed.length > 20) return 'Name must be 20 characters or fewer';
    if (!/^[A-Za-z ]+$/.test(trimmed)) return 'Name can only contain letters and spaces';
    return '';
  };

  const validateUsernameValue = (value) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Username is required';
    if (trimmed.length > 20) return 'Username must be 20 characters or fewer';
    if (!/^[A-Za-z0-9]+$/.test(trimmed)) return 'Username can only contain letters and numbers';
    return '';
  };

  const validateEmailValue = (value) => {
    if (!value.trim()) return 'Email is required';
    if (!value.includes('@')) return 'Email must include @';
    return '';
  };

  const validatePasswordValue = (value) => {
    const letters = (value.match(/[A-Za-z]/g) || []).length;
    if (letters < 5) return 'Password must include at least 5 letters';
    if (!/\d/.test(value)) return 'Password must include at least 1 number';
    return '';
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    switch (field) {
      case 'name':
        if (mode === 'signup') {
          const error = validateNameValue(value);
          if (error) newErrors.name = error;
          else delete newErrors.name;
        } else {
          delete newErrors.name;
        }
        break;
      case 'username':
        if (mode === 'signup') {
          const error = validateUsernameValue(value);
          if (error) newErrors.username = error;
          else delete newErrors.username;
        } else {
          delete newErrors.username;
        }
        break;
      case 'email':
        if (mode === 'signup') {
          const error = validateEmailValue(value);
          if (error) newErrors.email = error;
          else delete newErrors.email;
        } else {
          if (!value || value.length < 1) {
            newErrors.email = 'Please enter your email or username';
          } else {
            delete newErrors.email;
          }
        }
        break;
      case 'password':
        if (mode === 'signin') {
          if (!value) newErrors.password = 'Please enter your password';
          else delete newErrors.password;
        } else {
          const error = validatePasswordValue(value);
          if (error) newErrors.password = error;
          else delete newErrors.password;
        }
        break;
      case 'newPassword':
        {
          const error = validatePasswordValue(value);
          if (error) newErrors.newPassword = error;
          else delete newErrors.newPassword;
        }
        break;
    }
    setErrors(newErrors);
  };

  const handleInput = (field, value) => {
    switch (field) {
      case 'name': setName(value); break;
      case 'username': setUsername(value); break;
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'newPassword': setNewPassword(value); break;
    }
    validateField(field, value);
  };

  const handleForgotPassword = async (event) => {
    event.preventDefault();
    const emailError = validateEmailValue(forgotEmail);
    if (emailError) {
      setErrors({ forgotEmail: emailError });
      return;
    }
    setLoading(true);
    setServerError('');
    setServerSuccess('');
    try {
      const response = await forgotPassword(forgotEmail);
      if (response.success) {
        setServerSuccess(response.message || 'If that email is registered, a reset link has been sent.');
        setForgotOpen(false);
        setForgotEmail('');
      } else {
        setServerError(response.message || 'Something went wrong. Please try again.');
      }
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');
    const passwordError = validatePasswordValue(newPassword);
    if (passwordError) {
      setErrors({ newPassword: passwordError });
      return;
    }
    setLoading(true);
    try {
      const result = await resetPassword(resetToken, newPassword);
      if (result.success) {
        setServerSuccess(result.message);
        // Strip token from URL without reloading
        window.history.replaceState({}, '', window.location.pathname);
        setResetToken(null);
        setTimeout(() => setMode('signin'), 2000);
      } else {
        setServerError(result.message || 'Failed to reset password. The link may have expired.');
      }
    } catch {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');
    setLoading(true);

    const allErrors = {};
    const nameError = validateNameValue(name);
    const usernameError = validateUsernameValue(username);
    const emailError = validateEmailValue(email);
    const passwordError = validatePasswordValue(password);
    if (mode === 'signup' && nameError) allErrors.name = nameError;
    if (mode === 'signup' && usernameError) allErrors.username = usernameError;
    if (mode === 'signup' && emailError) allErrors.email = emailError;
    if (mode === 'signin' && (!email || email.length < 1)) allErrors.email = 'Please enter your email or username';
    if (mode === 'signup' && passwordError) allErrors.password = passwordError;
    if (mode === 'signin' && !password) allErrors.password = 'Please enter your password';
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setLoading(false);
      return;
    }

    try {
      if (mode === 'signin') {
        const user = await loginUser(email, password, rememberMe);
        if (user) {
          onLogin(user);
        } else {
          setServerError('Authentication failed. Please try again.');
        }
      } else {
        const result = await registerUser(email, password, name, username);
        setServerSuccess(result?.message || 'Account created. Check your email to confirm your account before signing in.');
        setMode('signin');
        setPassword('');
      }
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full bg-white border border-purple-100 rounded-xl px-4 py-3 text-slate-950 placeholder-slate-500 shadow-sm focus:border-purple-500 focus:ring-2 focus:ring-purple-200";
  const labelClass = "mb-1.5 block text-sm font-bold text-slate-800";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-pink-900 flex items-center justify-center p-4 sm:p-6">
      <div className="w-full max-w-md min-h-[34rem] rounded-[1.75rem] border border-white/30 bg-white/95 p-6 shadow-2xl shadow-purple-950/30 backdrop-blur-xl sm:p-8">
        <img src="assets/logo.png" alt="Shared Shelf" decoding="async" fetchPriority="high" width="180" height="64" className="h-16 mx-auto mb-2 object-contain" />
        <p className="text-slate-600 text-center mb-8 text-base font-medium">
          Organize your life, together.
        </p>

        {/* Reset password form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
            <h2 className="text-slate-950 font-semibold text-center mb-2">Set a New Password</h2>
            <div>
              <label className={labelClass} htmlFor="new-password">New Password</label>
              <input
                id="new-password"
                type="password"
                name="new-password"
                autoComplete="new-password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => handleInput('newPassword', e.target.value)}
                className={inputClass}
              />
              {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
            </div>
            {serverError && <p className="text-red-600 text-sm text-center" aria-live="polite">{serverError}</p>}
            {serverSuccess && <p className="text-emerald-700 text-sm text-center" aria-live="polite">{serverSuccess}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signin'); setServerError(''); setServerSuccess(''); }}
              className="w-full text-slate-600 text-sm hover:text-purple-800 transition"
            >
              Back To Sign In
            </button>
          </form>
        )}

        {/* Sign in / Register forms */}
        {mode !== 'reset' && (
          <>
            <div className="flex gap-2 mb-6 rounded-2xl bg-violet-50 p-1.5">
              <button
                onClick={() => { setMode('signin'); setErrors({}); setServerError(''); setServerSuccess(''); }}
                className={`flex-1 rounded-xl border px-3 py-2 font-semibold transition ${mode === 'signin' ? 'bg-[var(--app-primary)] border-[var(--app-primary)] !text-white shadow-sm' : 'border-transparent bg-transparent text-[var(--app-primary)] hover:bg-white'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setErrors({}); setServerError(''); setServerSuccess(''); }}
                className={`flex-1 rounded-xl border px-3 py-2 font-semibold transition ${mode === 'signup' ? 'bg-[var(--app-primary)] border-[var(--app-primary)] !text-white shadow-sm' : 'border-transparent bg-transparent text-[var(--app-primary)] hover:bg-white'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              {mode === 'signup' && (
                <>
                  <div>
                    <label className={labelClass} htmlFor="signup-name">Name</label>
                    <input
                      id="signup-name"
                      type="text"
                      name="name"
                      placeholder="Name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => handleInput('name', e.target.value)}
                      className={inputClass}
                    />
                    {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="signup-username">Username</label>
                    <input
                      id="signup-username"
                      type="text"
                      name="username"
                      placeholder="Username"
                      autoComplete="username"
                      spellCheck={false}
                      value={username}
                      onChange={(e) => handleInput('username', e.target.value)}
                      className={inputClass}
                    />
                    {errors.username && <p className="text-red-400 text-xs mt-1">{errors.username}</p>}
                  </div>
                </>
              )}

              <div>
                <label className={labelClass} htmlFor="login-email">{mode === 'signup' ? 'Email' : 'Email Or Username'}</label>
                <input
                  id="login-email"
                  type="text"
                  name={mode === 'signup' ? 'email' : 'username'}
                  autoComplete={mode === 'signup' ? 'email' : 'username'}
                  spellCheck={false}
                  placeholder={mode === 'signup' ? 'Email' : 'Email or Username'}
                  value={email}
                  onChange={(e) => handleInput('email', e.target.value)}
                  className={inputClass}
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <label className={labelClass} htmlFor="login-password">Password</label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => handleInput('password', e.target.value)}
                  className={inputClass}
                />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              {mode === 'signin' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-slate-700 text-sm">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="rounded accent-purple-600"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    className="text-purple-700 text-sm font-semibold hover:underline"
                    onClick={() => { setForgotEmail(email.includes('@') ? email : ''); setForgotOpen(true); setErrors({}); }}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {serverError && <p className="text-red-600 text-sm text-center" aria-live="polite">{serverError}</p>}
              {serverSuccess && <p className="text-emerald-700 text-sm text-center" aria-live="polite">{serverSuccess}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {loading ? 'Please Wait...' : mode === 'signin' ? 'Login' : 'Create Account'}
              </button>
            </form>

            {forgotOpen && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 p-4">
                <form onSubmit={handleForgotPassword} className="w-full max-w-sm rounded-2xl border border-purple-100 bg-white p-5 shadow-2xl" noValidate>
                  <h2 className="mb-3 text-center text-lg font-semibold text-slate-950">Reset Password</h2>
                  <label className={labelClass} htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="text"
                    name="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="Email"
                    value={forgotEmail}
                    onChange={(event) => { setForgotEmail(event.target.value); setErrors(prev => ({ ...prev, forgotEmail: '' })); }}
                    className={inputClass}
                  />
                  {errors.forgotEmail && <p className="mt-1 text-xs text-red-400">{errors.forgotEmail}</p>}
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setForgotOpen(false); setErrors({}); }}
                      className="flex-1 rounded-lg bg-violet-50 py-2 text-sm font-semibold text-purple-900 transition hover:bg-violet-100"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-lg bg-purple-600 py-2 text-sm font-semibold text-white transition hover:bg-purple-700 disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send Link'}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
