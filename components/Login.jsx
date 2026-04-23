const React = window.React;
const { useState } = React;

function LoginScreen({ onLogin }) {
  const [mode, setMode] = useState('signin'); // 'signin' | 'signup'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [loading, setLoading] = useState(false);

  // Real‑time validation
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
    }
    setErrors(newErrors);
  };

  const handleInput = (field, value) => {
    switch (field) {
      case 'name': setName(value); break;
      case 'email': setEmail(value); break;
      case 'password': setPassword(value); break;
    }
    validateField(field, value);
  };

  const handleForgotPassword = async () => {
    // Check if the user actually typed an email before clicking
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setServerError('Please enter a valid email address first to reset your password.');
      return;
    }

    setLoading(true);
    setServerError('');
    
    try {
      const response = await window.forgotPassword(email);
      // We are using setServerError here just to display the feedback message in the UI easily
      setServerError(response.message || 'If the email exists, a reset link has been sent.');
    } catch (err) {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setLoading(true);

    // Client‑side validation
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
      let success = false;
      if (mode === 'signin') {
        success = await loginUser(email, password, rememberMe);
      } else {
        success = await registerUser(email, password, name);
      }
      if (success) {
        onLogin();
      } else {
        setServerError('Invalid credentials or registration failed.');
      }
    } catch (err) {
      setServerError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOAuth = async (provider) => {
    setLoading(true);
    setServerError('');
    try {
      // For a real implementation you'd use Google/Apple sign‑in libraries.
      // Here we assume a backend endpoint that receives the id_token/code.
      // Simulate: open a popup (or redirect) – placeholder.
      alert(`${provider} SSO is not fully implemented in this demo.`);
      // After obtaining the token, call the appropriate function:
      // const success = await authenticateWithGoogle(idToken, rememberMe);
      // if (success) onLogin();
    } catch (err) {
      setServerError('OAuth login failed.');
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

        {/* Mode Tabs */}
        <div className="flex mb-6 bg-slate-800 rounded-lg p-1">
          <button
            onClick={() => { setMode('signin'); setErrors({}); setServerError(''); }}
            className={`flex-1 py-2 rounded-md font-medium transition ${mode === 'signin' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
          >
            Sign In
          </button>
          <button
            onClick={() => { setMode('signup'); setErrors({}); setServerError(''); }}
            className={`flex-1 py-2 rounded-md font-medium transition ${mode === 'signup' ? 'bg-purple-600 text-white' : 'text-slate-400'}`}
          >
            Register
          </button>
        </div>

        {/* Form */}
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
              >
                Forgot password?
              </button>
            </div>
          )}

          {serverError && <p className="text-red-400 text-sm text-center">{serverError}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-semibold rounded-lg transition"
          >
            {loading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        {/* SSO Buttons */}
        <div className="mt-6">
          <div className="relative text-center text-slate-500 text-sm mb-4">
            <span className="bg-slate-900/80 px-3">or continue with</span>
            <div className="absolute inset-x-0 top-1/2 h-px bg-slate-800 -z-10"></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleOAuth('google')}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white transition"
            >
              <svg width="20" height="20" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.25-.164-1.84H9v3.48h4.844a4.14 4.14 0 01-1.797 2.717v2.258h2.908c1.702-1.566 2.685-3.875 2.685-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.836.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A9 9 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.36 5.36 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957a8.97 8.97 0 000 8.084l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.696 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
              Google
            </button>
            <button
              onClick={() => handleOAuth('apple')}
              className="flex items-center justify-center gap-2 py-2.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-white transition"
            >
              <svg width="20" height="20" viewBox="0 0 18 21"><path fill="#FFF" d="M15.16 11.21c-.06 2.79 2.44 3.72 2.47 3.73-.02.06-.38 1.31-1.27 2.59-.76 1.11-1.55 2.22-2.81 2.24-1.22.03-1.62-.72-3.03-.72-1.4 0-1.84.72-3 .75-1.2.03-2.12-1.21-2.89-2.32C3.1 15.4 1.76 11.7 3.55 9.35c.88-1.53 2.46-2.5 4.17-2.53 1.3-.02 2.53.88 3.33.88.79 0 2.28-1.08 3.84-.92.65.03 2.49.26 3.67 1.99-.09.06-2.19 1.28-2.17 3.8h-.23zM12.11 3.68c.7-.84 1.17-2.02 1.04-3.18-1.01.04-2.22.67-2.94 1.52-.65.75-1.22 1.95-1.07 3.1 1.12.09 2.27-.57 2.97-1.44z"/></svg>
              Apple
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

window.LoginScreen = LoginScreen;