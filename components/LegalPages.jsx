const React = window.React;
const { Tv } = window;

function LegalPageShell({ title, lastUpdated, onNavigate, children }) {
  const SiteFooter = window.SiteFooter;

  const goTo = (path) => (event) => {
    if (event) event.preventDefault();
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF2ED]">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <header className="sticky top-0 z-30 border-b border-[#E1D8D4]/70 bg-[#FFF8F5]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" onClick={goTo('/')} className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#E63B2E] text-white shadow-sm shadow-[#E63B2E]/30">
              <Tv size={18} />
            </span>
            <span className="text-lg font-extrabold tracking-tight text-[#410001]">Shared Shelf</span>
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
              href="/login"
              onClick={goTo('/login')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]"
            >
              Sign in
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex="-1" className="flex-1">
        <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8">
          <div className="rounded-3xl border border-[#E1D8D4] bg-white p-6 shadow-sm sm:p-10">
            <h1 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">{title}</h1>
            {lastUpdated && (
              <p className="mt-2 text-sm font-medium text-[#857370]">Last updated: {lastUpdated}</p>
            )}
            <div className="mt-6 space-y-5 text-[#241A18]">
              {children}
            </div>
          </div>
        </div>
      </main>

      {SiteFooter ? <SiteFooter onNavigate={onNavigate} /> : null}
    </div>
  );
}

const sectionHeadingClass = "mt-2 text-xl font-extrabold text-[#410001]";
const paragraphClass = "text-sm leading-relaxed text-[#241A18] sm:text-base";
const listClass = "ml-5 list-disc space-y-1.5 text-sm leading-relaxed text-[#241A18] sm:text-base";

function PrivacyPolicyPage({ onNavigate }) {
  return (
    <LegalPageShell title="Privacy Policy" lastUpdated="April 2026" onNavigate={onNavigate}>
      <p className={paragraphClass}>
        This Privacy Policy describes what Shared Shelf collects, why, and how it is stored. Shared Shelf is a small
        side-project app, so the policy below intentionally stays short and direct.
      </p>

      <h2 className={sectionHeadingClass}>What we collect</h2>
      <ul className={listClass}>
        <li>Account information you provide: name, username, email, and a hashed password.</li>
        <li>Shelf content you create: calendar activities, tasks, locations, trips, recipes, and watchlist items.</li>
        <li>
          Technical data needed to run the app: session tokens stored in your browser, basic request logs from the
          hosting platform, and database records for your shelves and memberships.
        </li>
      </ul>

      <h2 className={sectionHeadingClass}>How we use it</h2>
      <ul className={listClass}>
        <li>To sign you in and let you read and write the shelves you belong to.</li>
        <li>To send transactional email such as account confirmation and password reset links.</li>
        <li>To keep the app available, debug failures, and prevent abuse.</li>
      </ul>

      <h2 className={sectionHeadingClass}>What we do not do</h2>
      <ul className={listClass}>
        <li>We do not sell or rent your personal data.</li>
        <li>We do not run advertising or third-party tracking on the app.</li>
        <li>
          Shelf content is only visible to invited shelf members. We do not share private shelf content with anyone
          else.
        </li>
      </ul>

      <h2 className={sectionHeadingClass}>Third-party services</h2>
      <p className={paragraphClass}>
        Shared Shelf relies on a small set of third parties to operate. By using the app, your data may be processed by
        these services in line with their own privacy policies:
      </p>
      <ul className={listClass}>
        <li>Vercel for hosting the website and serverless API.</li>
        <li>Vercel Postgres / Neon for storing your account, shelf metadata, and shelf content.</li>
        <li>Resend for sending account confirmation and password reset emails when configured.</li>
        <li>TMDB, Open Library, Jikan, and OpenStreetMap Nominatim for media and location lookups you trigger.</li>
      </ul>

      <h2 className={sectionHeadingClass}>Your choices</h2>
      <ul className={listClass}>
        <li>You can update your name and username from the account modal.</li>
        <li>You can leave a shelf at any time from the shelf selection page.</li>
        <li>
          To delete your account or any shelf you own, contact us through the bug report page and ask. We will respond
          and act on the request manually.
        </li>
      </ul>

      <h2 className={sectionHeadingClass}>Contact</h2>
      <p className={paragraphClass}>
        Questions about privacy? Use the <a href="/report-a-bug" onClick={(event) => { event.preventDefault(); onNavigate?.('/report-a-bug'); }} className="font-bold text-[#E63B2E] hover:text-[#A9372C]">Report a Bug</a> page to reach us.
      </p>
    </LegalPageShell>
  );
}

function TermsOfServicePage({ onNavigate }) {
  return (
    <LegalPageShell title="Terms of Service" lastUpdated="April 2026" onNavigate={onNavigate}>
      <p className={paragraphClass}>
        These terms describe the basic rules for using Shared Shelf. By creating an account or using the app, you
        agree to them.
      </p>

      <h2 className={sectionHeadingClass}>Your account</h2>
      <ul className={listClass}>
        <li>You are responsible for keeping your account credentials safe.</li>
        <li>You confirm that the information you provide at sign-up is accurate and that you are old enough to use the app where you live.</li>
        <li>You are responsible for the activity that happens under your account.</li>
      </ul>

      <h2 className={sectionHeadingClass}>Your content</h2>
      <ul className={listClass}>
        <li>You keep ownership of the content you add to your shelves.</li>
        <li>You give Shared Shelf the limited permission needed to store, display, and back up that content for shelf members.</li>
        <li>You confirm that your content does not break the law and does not violate other people's rights.</li>
      </ul>

      <h2 className={sectionHeadingClass}>Acceptable use</h2>
      <ul className={listClass}>
        <li>Do not abuse the service, attempt to break authentication, or scrape it.</li>
        <li>Do not use the app to harass other people or to store illegal content.</li>
        <li>Do not attempt to overload the API or work around rate-limits and quotas.</li>
      </ul>

      <h2 className={sectionHeadingClass}>Service availability</h2>
      <p className={paragraphClass}>
        Shared Shelf is provided as-is and may be unavailable from time to time. The app runs on a free hosting plan
        and may be paused, throttled, or change behavior at any time. We do our best to preserve your data, but you
        should not rely on Shared Shelf as the only place where critical information lives.
      </p>

      <h2 className={sectionHeadingClass}>Termination</h2>
      <p className={paragraphClass}>
        You can stop using Shared Shelf at any time. We may suspend or remove accounts that break these terms or that
        threaten the safety or stability of the service.
      </p>

      <h2 className={sectionHeadingClass}>Changes</h2>
      <p className={paragraphClass}>
        These terms may change as the app evolves. The date at the top reflects the most recent update. Continued use
        of the app after a change means you accept the updated terms.
      </p>

      <h2 className={sectionHeadingClass}>Contact</h2>
      <p className={paragraphClass}>
        Questions or concerns? Use the <a href="/report-a-bug" onClick={(event) => { event.preventDefault(); onNavigate?.('/report-a-bug'); }} className="font-bold text-[#E63B2E] hover:text-[#A9372C]">Report a Bug</a> page to reach us.
      </p>
    </LegalPageShell>
  );
}

window.PrivacyPolicyPage = PrivacyPolicyPage;
window.TermsOfServicePage = TermsOfServicePage;
