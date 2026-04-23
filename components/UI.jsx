const React = window.React;
const { useState } = React;

// ============================================================================
// UI COMPONENTS
// ============================================================================

const FilterButton = ({ label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 sm:px-4 py-2 rounded-lg font-medium text-sm sm:text-base transition-all duration-300 ${
      isActive
        ? 'bg-purple-600 text-white shadow-lg shadow-purple-900/30'
        : 'bg-slate-800/50 text-slate-400 hover:bg-slate-700/50 hover:text-white border border-slate-700'
    }`}
  >
    {label}
  </button>
);

const FilterBar = ({ label, children }) => (
  <div className="mb-6 sm:mb-8 flex flex-wrap gap-2 sm:gap-3">
    {label && (
      <span className="text-slate-400 font-medium self-center text-sm sm:text-base">
        {label}
      </span>
    )}
    {children}
  </div>
);

const EmptyState = ({ onAddClick }) => (
  <div className="text-center py-12 sm:py-20">
    <div className="inline-flex items-center justify-center w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-slate-800/50 mb-4 sm:mb-6">
      <Search size={24} />
    </div>
    <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">No items found</h3>
    <p className="text-sm sm:text-base text-slate-400 mb-4 sm:mb-6">
      Add some items to your list to get started
    </p>
    <button
      onClick={onAddClick}
      className="px-4 sm:px-6 py-2 sm:py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg sm:rounded-xl font-semibold transition-colors inline-flex items-center gap-2 text-sm sm:text-base"
    >
      <Plus size={18} />
      Add Your First Item
    </button>
  </div>
);

const MediaGrid = ({ items, renderItem, emptyComponent }) => (
  <>
    {items.length === 0 ? (
      emptyComponent
    ) : (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-2 sm:gap-3 md:gap-4 animate-fade-in">
        {items.map(renderItem)}
      </div>
    )}
  </>
);

const LoadingScreen = () => (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950">
    <div className="text-center">
      <div className="inline-block w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-4"></div>
      <p className="text-white text-lg">Loading ...</p>
    </div>
  </div>
);

const LoginScreen = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const success = await authenticate(username, password);
      if (success) {
        onLogin();
      } else {
        setError('Invalid username or password');
      }
    } catch (err) {
      setError('Authentication failed. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-slate-900/60 border border-slate-700 rounded-2xl p-8 backdrop-blur-sm"
      >
        <h1 className="text-2xl font-bold text-white text-center mb-1">Shared Shelf</h1>
        <p className="text-slate-400 text-sm text-center mb-6">Sign in to your shared space.</p>

        <label className="block text-slate-300 text-sm mb-2" htmlFor="login-username">Username</label>
        <input
          id="login-username"
          type="text"
          autoComplete="username"
          autoFocus
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full px-4 py-3 mb-4 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
        />

        <label className="block text-slate-300 text-sm mb-2" htmlFor="login-password">Password</label>
        <div className="relative mb-4">
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 pr-12 bg-slate-900/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors [&::-ms-reveal]:hidden [&::-webkit-contacts-auto-fill-button]:hidden"
          />
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
            tabIndex={-1}
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {error && <p className="text-red-400 text-sm mb-4 text-center">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Authenticating ...' : 'Sign in'}
        </button>
      </form>
    </div>
  );
};

Object.assign(window, {
  FilterButton, FilterBar, EmptyState, MediaGrid, LoadingScreen, LoginScreen
});
