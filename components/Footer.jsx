const React = window.React;

function SiteFooter({ onNavigate }) {
  const year = new Date().getFullYear();

  const handleNavigate = (path) => (event) => {
    if (typeof onNavigate === 'function') {
      event.preventDefault();
      onNavigate(path);
    }
  };

  const linkClass = "text-[#534340] transition hover:text-[#E63B2E]";

  return (
    <footer className="border-t border-[#E1D8D4] bg-[#FFF8F5]">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-start justify-between gap-3 px-4 py-6 sm:flex-row sm:items-center sm:px-6 lg:px-8">
        <p className="text-sm font-semibold text-[#534340]">
          © {year} Couple Planner
        </p>
        <nav aria-label="Footer" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm font-semibold">
          <a href="/privacy-policy" onClick={handleNavigate('/privacy-policy')} className={linkClass}>
            Privacy Policy
          </a>
          <a href="/terms-of-service" onClick={handleNavigate('/terms-of-service')} className={linkClass}>
            Terms of Service
          </a>
          <a href="/report-a-bug" onClick={handleNavigate('/report-a-bug')} className={linkClass}>
            Report a Bug
          </a>
        </nav>
      </div>
    </footer>
  );
}

window.SiteFooter = SiteFooter;
