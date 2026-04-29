const React = window.React;
const { useState, useMemo } = React;

const SUPPORT_EMAIL = 'couple-planner-support@proton.me';

function BugReportPage({ onNavigate, currentUser, onUpdateUser, onLogout }) {
  const LegalPageShell = window.getWindowComponent?.('LegalPageShell', window.MissingComponent) || window.MissingComponent;
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState('');
  const [contact, setContact] = useState(currentUser?.email || '');
  const [submitted, setSubmitted] = useState(false);

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

  const inputClass = "w-full rounded-xl border border-[#E1D8D4] bg-white px-4 py-3 text-[#241A18] placeholder-[#857370] shadow-sm transition focus:border-[#E63B2E] focus:outline-none focus:ring-4 focus:ring-[#FFB4A9]/40";
  const labelClass = "mb-1.5 block text-sm font-bold text-[#241A18]";

  return (
    <LegalPageShell
      title="Report a bug"
      onNavigate={onNavigate}
      currentUser={currentUser}
      onUpdateUser={onUpdateUser}
      onLogout={onLogout}
    >
      <p className="text-sm text-[#534340] sm:text-base">
        Found something broken or confusing? Tell us what happened and we will take a look. Submitting opens
        your email client with a pre-filled message.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
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

        {submitted && (
          <p className="rounded-xl bg-[#FFDAD4] px-4 py-3 text-sm font-semibold text-[#410001]">
            Your email client should have opened with the report.
          </p>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={!isSubmittable}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-5 py-3 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F] disabled:cursor-not-allowed disabled:opacity-60"
          >
            Send bug report
          </button>
        </div>
      </form>
    </LegalPageShell>
  );
}

window.BugReportPage = BugReportPage;
