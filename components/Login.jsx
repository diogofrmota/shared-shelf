const React = window.React;
const { useState, useEffect } = React;

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup' | 'reset'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Activate reset-password form when URL contains ?reset_token=
  const [resetToken, setResetToken] = useState(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('reset_token');
    if (token) {
      setResetToken(token);
      setMode('reset');
    }
  }, []);

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    switch (field) {
      case 'name':
        if (mode === 'signup' && value.length < 4) {
          newErrors.name = 'Username must be at least 4 characters';
        } else {
          delete newErrors.name;
        }
        break;
      case 'email':
        if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          newErrors.email = 'Please enter a valid email';
        } else {
          delete newErrors.email;
        }
        break;
      case 'password':
        if (value.length < 6) {
          newErrors.password = 'Password must be at least 6 characters';
        } else {
          delete newErrors.password;
        }
        break;
      case 'newPassword':
        if (value.length < 6) {
          newErrors.newPassword = 'Password must be at least 6 characters';
        } else {
          delete newErrors.newPassword;
        }
        break;
    }
    setErrors(newErrors);
  };

  const handleInput = (field, value) => {
    switch (field) {
      case 'name': setName(value); break;
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
      case 'newPassword': setNewPassword(value); break;
    }
    validateField(field, value);
  };

  const handleForgotPassword = async () => {
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setServerError('Please enter your email address above first.');
      return;
    }
    setLoading(true);
    setServerError('');
    setServerSuccess('');
    try {
      const response = await forgotPassword(email);
      setServerSuccess(response.message || 'If that email is registered, a reset link has been sent.');
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
    if (newPassword.length < 6) {
      setErrors({ newPassword: 'Password must be at least 6 characters' });
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
    if (mode === 'signup' && name.length < 4) allErrors.name = 'Username must be at least 4 characters';
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) allErrors.email = 'Please enter a valid email';
    if (password.length < 6) allErrors.password = 'Password must be at least 6 characters';
    if (Object.keys(allErrors).length > 0) {
      setErrors(allErrors);
      setLoading(false);
      return;
    }

    try {
      let user = null;
      if (mode === 'signin') {
        user = await loginUser(email, password, rememberMe);
      } else {
        user = await registerUser(email, password, name);
      }
      if (user) {
        onLogin(user);
      } else {
        setServerError('Authentication failed. Please try again.');
      }
    } catch (err) {
      setServerError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900/80 backdrop-blur-xl rounded-2xl p-8 shadow-2xl border border-slate-800">
        <h1 className="text-3xl font-bold text-white mb-2 text-center">Shared Shelf</h1>
        <p className="text-slate-400 text-center mb-8 text-sm">
          Organize your life, together. Create your shared calendar, mark your favourite dating spots, favourite recipes and track your movies, TV shows and books.
        </p>

        {/* Reset password form */}
        {mode === 'reset' && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <h2 className="text-white font-semibold text-center mb-2">Set a new password</h2>
            <div>
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => handleInput('newPassword', e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              {errors.newPassword && <p className="text-red-400 text-xs mt-1">{errors.newPassword}</p>}
            </div>
            {serverError && <p className="text-red-400 text-sm text-center">{serverError}</p>}
            {serverSuccess && <p className="text-green-400 text-sm text-center">{serverSuccess}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('signin'); setServerError(''); setServerSuccess(''); }}
              className="w-full text-slate-400 text-sm hover:text-white transition"
            >
              Back to sign in
            </button>
          </form>
        )}

        {/* Sign in / Register forms */}
        {mode !== 'reset' && (
          <>
            <div className="flex mb-6 bg-slate-800 rounded-lg p-1">
              <button
                onClick={() => { setMode('signin'); setErrors({}); setServerError(''); setServerSuccess(''); }}
                className={`flex-1 py-2 rounded-md font-medium transition ${mode === 'signin' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
              >
                Sign In
              </button>
              <button
                onClick={() => { setMode('signup'); setErrors({}); setServerError(''); setServerSuccess(''); }}
                className={`flex-1 py-2 rounded-md font-medium transition ${mode === 'signup' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
              >
                Register
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <div>
                  <input
                    type="text"
                    placeholder="Username"
                    value={name}
                    onChange={(e) => handleInput('name', e.target.value)}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                  />
                  {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
                </div>
              )}

              <div>
                <input
                  type="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => handleInput('email', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
              </div>

              <div>
                <input
                  type="password"
                  placeholder="Password"
                  value={password}
                  onChange={(e) => handleInput('password', e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password}</p>}
              </div>

              {mode === 'signin' && (
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-slate-300 text-sm">
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
                    className="text-purple-400 text-sm hover:underline"
                    onClick={handleForgotPassword}
                    disabled={loading}
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {serverError && <p className="text-red-400 text-sm text-center">{serverError}</p>}
              {serverSuccess && <p className="text-green-400 text-sm text-center">{serverSuccess}</p>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
              >
                {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;
