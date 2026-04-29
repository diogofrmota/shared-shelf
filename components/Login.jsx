const React = window.React;
const { useState, useEffect } = React;

function LoginScreen({ onLogin, onNavigate }) {
  const initialMode = (() => {
    if (typeof window === 'undefined') return 'signin';
    const params = new URLSearchParams(window.location.search);
    const requested = params.get('mode');
    if (requested === 'signup' || requested === 'register') return 'signup';
    return 'signin';
  })();
  const [mode, setMode] = useState(initialMode); // 'signin' | 'signup' | 'reset'
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
  const [linkIssue, setLinkIssue] = useState(null);
  const [loading, setLoading] = useState(false);
  const [usernameStatus, setUsernameStatus] = useState(null); // null | 'checking' | 'available' | 'taken'
  const usernameCheckRef = React.useRef(null);
  const usernameCheckSeqRef = React.useRef(0);

  const resetLinkIssue = linkIssue?.type === 'reset';
  const confirmationLinkIssue = linkIssue?.type === 'confirm';
  const BrandMark = window.getWindowComponent?.('BrandMark', window.MissingComponent) || window.MissingComponent;
  const ModalShell = window.getWindowComponent?.('ModalShell', window.MissingComponent) || window.MissingComponent;

  const handleHomeNavigation = (event) => {
    if (event) event.preventDefault();
    if (typeof onNavigate === 'function') {
      onNavigate('/');
    } else {
      window.location.href = '/';
    }
  };

  // Activate reset-password form when URL contains ?reset_token=
  const [resetToken, setResetToken] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const reset = params.get('reset_token');
    const confirmation = params.get('confirm_token');
    const requestedMode = params.get('mode');
    if (reset) {
      setResetToken(reset);
      setMode('reset');
      setLoading(true);
      validateResetToken(reset)
        .then((result) => {
          if (!result.success) {
            setLinkIssue({
              type: 'reset',
              status: result.linkStatus || 'invalid',
              nextAction: result.nextAction || { label: 'Request a new reset link', target: 'forgot-password' }
            });
            setServerError(result.message || 'This password reset link is not valid. Please request a new reset email.');
          }
        })
        .catch(() => {
          setLinkIssue({
            type: 'reset',
            status: 'network',
            nextAction: { label: 'Return to sign in', target: 'signin' }
          });
          setServerError('Something went wrong checking this reset link. Please try again.');
        })
        .finally(() => setLoading(false));
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
            setLinkIssue({
              type: 'confirm',
              status: result.linkStatus || 'invalid',
              nextAction: result.nextAction || { label: 'Return to sign in', target: 'signin' }
            });
            setServerError(result.message || 'Confirmation link has expired or is invalid.');
          }
        })
        .catch(() => {
          setLinkIssue({
            type: 'confirm',
            status: 'network',
            nextAction: { label: 'Return to sign in', target: 'signin' }
          });
          setServerError('Something went wrong confirming your account. Please try again.');
        })
        .finally(() => setLoading(false));
      return;
    }
    const emailChangeToken = params.get('confirm_email_change');
    if (emailChangeToken) {
      setLoading(true);
      confirmEmailChange(emailChangeToken)
        .then((result) => {
          window.history.replaceState({}, '', window.location.pathname);
          if (result.success) {
            setServerSuccess(result.message || 'Email address updated. You can now sign in with your new email.');
          } else {
            setLinkIssue({
              type: 'emailChange',
              status: result.linkStatus || 'invalid',
              nextAction: { label: 'Return to sign in', target: 'signin' }
            });
            setServerError(result.message || 'This confirmation link is not valid.');
          }
        })
        .catch(() => {
          setLinkIssue({
            type: 'emailChange',
            status: 'network',
            nextAction: { label: 'Return to sign in', target: 'signin' }
          });
          setServerError('Something went wrong confirming your email change. Please try again.');
        })
        .finally(() => setLoading(false));
      return;
    }

    if (requestedMode === 'signup' || requestedMode === 'register') {
      // Strip the mode param from the URL after consuming it.
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  useEffect(() => () => {
    if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
    usernameCheckSeqRef.current += 1;
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

    if (field === 'username' && mode === 'signup') {
      const trimmed = value.trim();
      if (usernameCheckRef.current) clearTimeout(usernameCheckRef.current);
      usernameCheckSeqRef.current += 1;
      if (!trimmed || !/^[A-Za-z0-9]+$/.test(trimmed) || trimmed.length > 20) {
        setUsernameStatus(null);
        return;
      }
      setUsernameStatus('checking');
      const requestId = usernameCheckSeqRef.current;
      usernameCheckRef.current = setTimeout(async () => {
        try {
          const result = await window.checkUsernameAvailable?.(trimmed);
          if (requestId !== usernameCheckSeqRef.current) return;
          if (!result || result.available === null) { setUsernameStatus(null); return; }
          setUsernameStatus(result.available ? 'available' : 'taken');
        } catch {
          if (requestId !== usernameCheckSeqRef.current) return;
          setUsernameStatus(null);
        }
      }, 450);
    }
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
    setLinkIssue(null);
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

  const handleLinkAction = (issue) => {
    const target = issue?.nextAction?.target;
    window.history.replaceState({}, '', window.location.pathname);
    setServerError('');
    setServerSuccess('');
    setErrors({});
    setLinkIssue(null);

    if (target === 'forgot-password') {
      setMode('signin');
      setResetToken(null);
      setForgotOpen(true);
      return;
    }

    if (target === 'signup') {
      setMode('signup');
      setResetToken(null);
      return;
    }

    setMode('signin');
    setResetToken(null);
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
        window.history.replaceState({}, '', window.location.pathname);
        setResetToken(null);
        setLinkIssue(null);
        setTimeout(() => setMode('signin'), 2000);
      } else {
        setLinkIssue({
          type: 'reset',
          status: result.linkStatus || 'invalid',
          nextAction: result.nextAction || { label: 'Request a new reset link', target: 'forgot-password' }
        });
        setServerError(result.message || 'Failed to reset password. The link may have expired.');
      }
    } catch {
      setLinkIssue({
        type: 'reset',
        status: 'network',
        nextAction: { label: 'Return to sign in', target: 'signin' }
      });
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');
    setLinkIssue(null);
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
          await Promise.resolve(onLogin(user));
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

  const inputClass = "w-full rounded-xl border border-[#E1D8D4] bg-white px-4 py-3 text-[#241A18] placeholder-[#857370] shadow-sm transition focus:border-[#E63B2E] focus:outline-none focus:ring-4 focus:ring-[#FFB4A9]/40";
  const labelClass = "mb-1.5 block text-sm font-bold text-[#241A18]";

  return (
    <div className="app-auth-bg flex min-h-screen flex-col items-center justify-center p-4 sm:p-6">
      <div className="mb-4 w-full max-w-md text-left">
        <a
          href="/"
          onClick={handleHomeNavigation}
          className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-4 py-2 text-sm font-bold text-white/90 transition hover:bg-white/25"
        >
          <span aria-hidden="true">&larr;</span>
          Back to homepage
        </a>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-white/40 bg-[#FFF8F5] p-7 shadow-[0_24px_60px_rgba(65,0,1,0.32)] sm:p-9 animate-scale-in">
        <div className="mb-7 flex flex-col items-center text-center">
          <a href="/" onClick={handleHomeNavigation} className="mb-4 inline-flex" aria-label="Couple Planner homepage">
            <BrandMark className="h-14 w-14" rounded="rounded-2xl" />
          </a>
          <h1 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">Couple Planner</h1>
          <p className="mt-2 text-sm font-medium text-[#534340]">
            Organize your life, together.
          </p>
        </div>

        {/* Reset password form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4" noValidate>
            <h2 className="mb-2 text-center text-lg font-semibold text-[#410001]">Set a new password</h2>
            {!resetLinkIssue && (
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
                {errors.newPassword && <p className="mt-1 text-xs font-semibold text-[#C1121F]">{errors.newPassword}</p>}
              </div>
            )}
            {serverError && <p className="text-center text-sm font-semibold text-[#C1121F]" aria-live="polite">{serverError}</p>}
            {serverSuccess && <p className="text-center text-sm font-semibold text-[#2F855A]" aria-live="polite">{serverSuccess}</p>}
            {resetLinkIssue && (
              <div className="rounded-xl border border-[#FFDAD4] bg-white px-4 py-3 text-center text-sm text-[#534340]">
                <p>
                  {linkIssue.status === 'used'
                    ? 'This reset link has already been used.'
                    : linkIssue.status === 'expired'
                      ? 'This reset link has expired.'
                      : 'This reset link cannot be used.'}
                </p>
                <button
                  type="button"
                  onClick={() => handleLinkAction(linkIssue)}
                  className="mt-2 font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
                >
                  {linkIssue.nextAction?.label || 'Request a new link'}
                </button>
              </div>
            )}
            {!resetLinkIssue && (
              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E63B2E] py-3 font-semibold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Update Password'}
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                window.history.replaceState({}, '', window.location.pathname);
                setMode('signin');
                setResetToken(null);
                setServerError('');
                setServerSuccess('');
                setLinkIssue(null);
              }}
              className="w-full text-sm font-medium text-[#534340] transition hover:text-[#E63B2E]"
            >
              Back to sign in
            </button>
          </form>
        )}

        {/* Sign in / Register forms */}
        {mode !== 'reset' && (
          <>
            <div className="mb-6 flex gap-1.5 rounded-xl bg-[#FBF2ED] p-1.5">
              <button
                type="button"
                onClick={() => { setMode('signin'); setErrors({}); setServerError(''); setServerSuccess(''); setLinkIssue(null); setUsernameStatus(null); }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${mode === 'signin' ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#534340] hover:text-[#410001]'}`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => { setMode('signup'); setErrors({}); setServerError(''); setServerSuccess(''); setLinkIssue(null); setUsernameStatus(null); }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-bold transition ${mode === 'signup' ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#534340] hover:text-[#410001]'}`}
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
                      placeholder="Your name"
                      autoComplete="name"
                      value={name}
                      onChange={(e) => handleInput('name', e.target.value)}
                      className={inputClass}
                    />
                    {errors.name && <p className="mt-1 text-xs font-semibold text-[#C1121F]">{errors.name}</p>}
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
                    {errors.username
                      ? <p className="mt-1 text-xs font-semibold text-[#C1121F]">{errors.username}</p>
                      : usernameStatus === 'checking'
                        ? <p className="mt-1 text-xs text-[#857370]">Checking availability…</p>
                        : usernameStatus === 'available'
                          ? <p className="mt-1 text-xs font-semibold text-[#2F855A]">Username is available</p>
                          : usernameStatus === 'taken'
                            ? <p className="mt-1 text-xs font-semibold text-[#C1121F]">Username already taken</p>
                            : null}
                  </div>
                </>
              )}

              <div>
                <label className={labelClass} htmlFor="login-email">{mode === 'signup' ? 'Email' : 'Email or Username'}</label>
                <input
                  id="login-email"
                  type="text"
                  name={mode === 'signup' ? 'email' : 'username'}
                  autoComplete={mode === 'signup' ? 'email' : 'username'}
                  spellCheck={false}
                  placeholder={mode === 'signup' ? 'you@example.com' : 'Email or username'}
                  value={email}
                  onChange={(e) => handleInput('email', e.target.value)}
                  className={inputClass}
                />
                {errors.email && <p className="mt-1 text-xs font-semibold text-[#C1121F]">{errors.email}</p>}
              </div>

              <div>
                <div className="mb-1.5 flex items-center justify-between">
                  <label className="text-sm font-bold text-[#241A18]" htmlFor="login-password">Password</label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      className="text-xs font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
                      onClick={() => { setForgotEmail(email.includes('@') ? email : ''); setForgotOpen(true); setErrors({}); }}
                      disabled={loading}
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => handleInput('password', e.target.value)}
                  className={inputClass}
                />
                {errors.password && <p className="mt-1 text-xs font-semibold text-[#C1121F]">{errors.password}</p>}
              </div>

              {mode === 'signin' && (
                <label className="flex items-center gap-2 text-sm font-medium text-[#534340]">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]"
                  />
                  Remember me
                </label>
              )}

              {serverError && <p className="text-center text-sm font-semibold text-[#C1121F]" aria-live="polite">{serverError}</p>}
              {serverSuccess && <p className="text-center text-sm font-semibold text-[#2F855A]" aria-live="polite">{serverSuccess}</p>}
              {confirmationLinkIssue && (
                <div className="rounded-xl border border-[#FFDAD4] bg-white px-4 py-3 text-center text-sm text-[#534340]">
                  <p>
                    {linkIssue.status === 'used'
                      ? 'This confirmation link has already been used.'
                      : linkIssue.status === 'expired'
                        ? 'This confirmation link has expired.'
                        : 'This confirmation link cannot be used.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => handleLinkAction(linkIssue)}
                    className="mt-2 font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
                  >
                    {linkIssue.nextAction?.label || 'Return to sign in'}
                  </button>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#E63B2E] py-3.5 text-base font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] disabled:opacity-50"
              >
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create account'}
                {!loading && (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12"></line>
                    <polyline points="12 5 19 12 12 19"></polyline>
                  </svg>
                )}
              </button>
            </form>

            <p className="mt-6 border-t border-[#E1D8D4]/70 pt-5 text-center text-sm text-[#534340]">
              {mode === 'signin' ? 'New to Couple Planner?' : 'Already have an account?'}
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrors({}); setServerError(''); setServerSuccess(''); setLinkIssue(null); setUsernameStatus(null); }}
                className="ml-1 font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
              >
                {mode === 'signin' ? 'Register here' : 'Sign in'}
              </button>
            </p>

            {forgotOpen && (
              <ModalShell
                isOpen={forgotOpen}
                onClose={() => { setForgotOpen(false); setErrors({}); }}
                zClass="z-[300]"
                ariaLabel="Reset password"
                dialogClassName="w-full max-w-sm rounded-2xl border border-[#E1D8D4] bg-white p-6 shadow-2xl"
              >
                <form onSubmit={handleForgotPassword} noValidate>
                  <h2 className="mb-3 text-center text-lg font-bold text-[#410001]">Reset password</h2>
                  <p className="mb-4 text-center text-sm text-[#534340]">We'll send a reset link to your email.</p>
                  <label className={labelClass} htmlFor="forgot-email">Email</label>
                  <input
                    id="forgot-email"
                    type="text"
                    name="email"
                    autoComplete="email"
                    spellCheck={false}
                    placeholder="you@example.com"
                    value={forgotEmail}
                    onChange={(event) => { setForgotEmail(event.target.value); setErrors(prev => ({ ...prev, forgotEmail: '' })); }}
                    className={inputClass}
                  />
                  {errors.forgotEmail && <p className="mt-1 text-xs font-semibold text-[#C1121F]">{errors.forgotEmail}</p>}
                  <div className="mt-4 flex gap-3">
                    <button
                      type="button"
                      onClick={() => { setForgotOpen(false); setErrors({}); }}
                      className="flex-1 rounded-xl border border-[#E1D8D4] bg-white py-2.5 text-sm font-bold text-[#410001] transition hover:bg-[#FBF2ED]"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 rounded-xl bg-[#E63B2E] py-2.5 text-sm font-bold text-white transition hover:bg-[#CC302F] disabled:opacity-50"
                    >
                      {loading ? 'Sending...' : 'Send link'}
                    </button>
                  </div>
                </form>
              </ModalShell>
            )}
          </>
        )}
      </div>

      <nav aria-label="Footer" className="mt-6 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm font-semibold text-white/85">
        <a href="/privacy-policy" onClick={(event) => { event.preventDefault(); if (typeof onNavigate === 'function') onNavigate('/privacy-policy'); else window.location.href = '/privacy-policy'; }} className="transition hover:text-white">
          Privacy Policy
        </a>
        <a href="/terms-of-service" onClick={(event) => { event.preventDefault(); if (typeof onNavigate === 'function') onNavigate('/terms-of-service'); else window.location.href = '/terms-of-service'; }} className="transition hover:text-white">
          Terms of Service
        </a>
        <a href="/report-a-bug" onClick={(event) => { event.preventDefault(); if (typeof onNavigate === 'function') onNavigate('/report-a-bug'); else window.location.href = '/report-a-bug'; }} className="transition hover:text-white">
          Report a Bug
        </a>
      </nav>
    </div>
  );
}

window.LoginScreen = LoginScreen;
