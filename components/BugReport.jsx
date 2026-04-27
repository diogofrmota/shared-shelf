const React = window.React;
const { useState, useMemo } = React;
const { Tv } = window;

const SUPPORT_EMAIL = 'couple-planner-support@proton.me';

function BugReportPage({ onNavigate, currentUser }) {
  const SiteFooter = window.SiteFooter;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [contact, setContact] = useState(currentUser?.email || '');
  const [submitted, setSubmitted] = useState(false);
  const [copyStatus, setCopyStatus] = useState('idle');

  const goTo = (path) => (event) => {
    if (event) event.preventDefault();
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const reportBody = useMemo(() => {
    const lines = [
      `Title: ${title || '(no title)'}`,
      '',
      'Description:',
      description || '(none)',
      '',
      'Steps to reproduce:',
      steps || '(none)',
      '',
      `Reporter: ${contact || '(not provided)'}`,
      `Reported at: ${new Date().toISOString()}`
    ];
    if (typeof navigator !== 'undefined' && navigator.userAgent) {
      lines.push(`User agent: ${navigator.userAgent}`);
    }
    return lines.join('\n');
  }, [title, description, steps, contact]);

  const isSubmittable = title.trim().length > 0 && description.trim().length > 0;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!isSubmittable) return;

    const subject = `Couple Planner bug: ${title.trim()}`;
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(reportBody)}`;
    setSubmitted(true);
    window.location.href = mailto;
  };

  const handleCopy = async () => {
    if (!navigator.clipboard) {
      setCopyStatus('unavailable');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
      return;
    }
    try {
      await navigator.clipboard.writeText(reportBody);
      setCopyStatus('copied');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    } catch {
      setCopyStatus('error');
      window.setTimeout(() => setCopyStatus('idle'), 2000);
    }
  };

  const inputClass = "w-full rounded-xl border border-[#E1D8D4] bg-white px-4 py-3 text-[#241A18] placeholder-[#857370] shadow-sm transition focus:border-[#E63B2E] focus:outline-none focus:ring-4 focus:ring-[#FFB4A9]/40";
  const labelClass = "mb-1.5 block text-sm font-bold text-[#241A18]";

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF2ED]">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <header className="sticky top-0 z-30 border-b border-[#E1D8D4]/70 bg-[#FFF8F5]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" onClick={goTo('/')} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E63B2E] text-white shadow-sm shadow-[#E63B2E]/30">
              <Tv size={18} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[#410001]">Couple Planner</span>
          </a>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="/"
              onClick={goTo('/')}
              className="rounded-xl px-3 py-2 text-sm font-bold text-[#534340] transition hover:text-[#E63B2E]"
            >
              Home
            </a>
            <a
              href={currentUser ? '/space-selection/' : '/login'}
              onClick={goTo(currentUser ? '/space-selection/' : '/login')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]"
            >
              {currentUser ? 'Open Couple Planner' : 'Sign in'}
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex="-1" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-3xl border border-[#E1D8D4] bg-white p-6 shadow-sm sm:p-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">Report a bug</h1>
            <p className="mt-3 text-sm text-[#534340] sm:text-base">
              Found something broken or confusing? Tell us what happened and we will take a look. Submitting opens
              your email client with a pre-filled message. If that does not work, copy the report and email it
              manually.
            </p>

            <form onSubmit={handleSubmit} className="mt-8 space-y-5" noValidate>
              <div>
                <label className={labelClass} htmlFor="bug-title">What went wrong?</label>
                <input
                  id="bug-title"
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Short summary, e.g. Calendar event will not save"
                  className={inputClass}
                  required
                  maxLength={120}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="bug-description">What were you trying to do?</label>
                <textarea
                  id="bug-description"
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Describe the bug and what you expected to happen instead."
                  className={`${inputClass} min-h-[120px]`}
                  required
                  rows={5}
                  maxLength={4000}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="bug-steps">Steps to reproduce (optional)</label>
                <textarea
                  id="bug-steps"
                  value={steps}
                  onChange={(event) => setSteps(event.target.value)}
                  placeholder={'1. Go to ...\n2. Click ...\n3. See error ...'}
                  className={`${inputClass} min-h-[120px]`}
                  rows={5}
                  maxLength={4000}
                />
              </div>

              <div>
                <label className={labelClass} htmlFor="bug-contact">Email to reply to (optional)</label>
                <input
                  id="bug-contact"
                  type="email"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputClass}
                  maxLength={200}
                />
              </div>

              <div className="rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-4">
                <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#857370]">Preview</p>
                <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap text-xs leading-relaxed text-[#241A18]">{reportBody}</pre>
              </div>

              {submitted && (
                <p className="rounded-xl bg-[#FFDAD4] px-4 py-3 text-sm font-semibold text-[#410001]">
                  Your email client should have opened with the report. If nothing happened, copy the report and email
                  it to {SUPPORT_EMAIL}.
                </p>
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="submit"
                  disabled={!isSubmittable}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Send bug report
                </button>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-5 py-3 text-sm font-bold text-[#410001] transition hover:bg-[#FBF2ED]"
                >
                  {copyStatus === 'copied' ? 'Copied!' : copyStatus === 'error' ? 'Copy failed' : copyStatus === 'unavailable' ? 'Clipboard unavailable' : 'Copy report'}
                </button>
                <a
                  href={`mailto:${SUPPORT_EMAIL}`}
                  className="text-sm font-semibold text-[#534340] transition hover:text-[#E63B2E]"
                >
                  Or email {SUPPORT_EMAIL}
                </a>
              </div>
            </form>
          </div>
        </div>
      </main>

      {SiteFooter ? <SiteFooter onNavigate={onNavigate} /> : null}
    </div>
  );
}

window.BugReportPage = BugReportPage;
