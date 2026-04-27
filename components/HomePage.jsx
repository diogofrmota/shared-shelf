const React = window.React;
const {
  CalendarIcon,
  CheckSquare,
  MapPin,
  Film,
  ChefHat,
  Tv,
  Book
} = window;

const RELEASE_NOTES = [
  {
    version: 'v1.4',
    date: 'April 2026',
    title: 'Public homepage and bug reports',
    items: [
      'New public homepage that explains Shared Shelf before you sign in.',
      'Authentication moved to a dedicated /login page.',
      'Privacy Policy and Terms of Service pages.',
      'Simple bug report form at /report-a-bug.',
      'Global footer with copyright and legal links.'
    ]
  },
  {
    version: 'v1.3',
    date: 'February 2026',
    title: 'Recurring activities and tasks',
    items: [
      'Daily, weekly, monthly, and yearly recurrence for calendar activities.',
      'Recurring tasks track last-done time and stay active after completion.'
    ]
  },
  {
    version: 'v1.2',
    date: 'December 2025',
    title: 'Trip planning details',
    items: [
      'Trips support itinerary, bookings, notes, and packing lists.',
      'Older trips render with safe defaults so existing data keeps working.'
    ]
  },
  {
    version: 'v1.1',
    date: 'October 2025',
    title: 'Email confirmation and password reset',
    items: [
      'New accounts confirm with an emailed link before signing in.',
      'Forgot password sends a one-time reset link.'
    ]
  },
  {
    version: 'v1.0',
    date: 'July 2025',
    title: 'Shared Shelf launch',
    items: [
      'Private shelves with calendar, tasks, locations, trips, recipes, and watchlist.',
      'Invite shelf members with a one-time, seven-day join code.'
    ]
  }
];

const FEATURES = [
  {
    icon: CalendarIcon,
    title: 'Shared calendar',
    description: 'Plan dates, anniversaries, and recurring routines on one calendar that everyone in the shelf sees.'
  },
  {
    icon: CheckSquare,
    title: 'Tasks together',
    description: 'Assign tasks, set due dates, repeat chores, and reorder priorities without losing track of what is done.'
  },
  {
    icon: MapPin,
    title: 'Places to go',
    description: 'Save restaurants, bars, and date ideas on a shared map with categories, photos, ratings, and notes.'
  },
  {
    icon: Film,
    title: 'Trips planning',
    description: 'Keep itineraries, bookings, packing lists, and notes for upcoming and past trips in one place.'
  },
  {
    icon: ChefHat,
    title: 'Recipe collection',
    description: 'Build a shared recipe book with ingredients, instructions, photos, prep time, and source links.'
  },
  {
    icon: Tv,
    title: 'Watchlist & reading',
    description: 'Track movies, TV shows, and books with statuses, ratings, and TV show season progress.'
  }
];

const AUDIENCES = [
  {
    title: 'Couples',
    description: 'Plan your week, weekend trips, restaurants to try, and the shows you want to watch together.'
  },
  {
    title: 'Families',
    description: 'Coordinate calendars, recurring chores, packing lists, and family movie nights.'
  },
  {
    title: 'Roommates',
    description: 'Share grocery runs, cleaning rotations, and bookmarked recipes without bouncing between apps.'
  },
  {
    title: 'Friend groups',
    description: 'Keep a running list of places to visit, books to swap, and trip ideas you want to commit to.'
  }
];

function HomePage({ onNavigate }) {
  const goTo = (path) => (event) => {
    if (event) event.preventDefault();
    if (typeof onNavigate === 'function') {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  const SiteFooter = window.SiteFooter;

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
              href="/login"
              onClick={goTo('/login')}
              className="hidden rounded-xl px-3 py-2 text-sm font-bold text-[#534340] transition hover:text-[#E63B2E] sm:inline-flex"
            >
              Sign in
            </a>
            <a
              href="/login?mode=signup"
              onClick={goTo('/login?mode=signup')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]"
            >
              Create account
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex="-1" className="flex-1">
        <section className="app-auth-bg">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-4 py-16 text-white sm:px-6 sm:py-20 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:py-24">
            <div className="flex-1">
              <span className="ss-tag mb-5 bg-white/20 text-white">Plan together</span>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Organize your life,<br />together.
              </h1>
              <p className="mt-5 max-w-xl text-base font-medium text-white/90 sm:text-lg">
                Shared Shelf is a private shared space for the people you plan with. Calendar, tasks, places, trips,
                recipes, and watchlists for couples, families, roommates, and friend groups.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="/login?mode=signup"
                  onClick={goTo('/login?mode=signup')}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-[#A9372C] shadow-lg shadow-black/20 transition hover:bg-[#FFF8F5]"
                >
                  Create your account
                </a>
                <a
                  href="/login"
                  onClick={goTo('/login')}
                  className="inline-flex items-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 py-3 text-base font-bold text-white transition hover:bg-white/20"
                >
                  Sign in
                </a>
              </div>
            </div>
            <div className="w-full max-w-md flex-1 lg:max-w-lg">
              <div className="rounded-3xl border border-white/30 bg-white/95 p-6 text-[#241A18] shadow-2xl shadow-black/30 sm:p-8">
                <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#A9372C]">This week, together</p>
                <h2 className="mt-2 text-2xl font-extrabold text-[#410001]">Lisbon getaway</h2>
                <ul className="mt-5 space-y-3 text-sm">
                  <li className="flex items-start gap-3 rounded-xl bg-[#FFF8F5] p-3">
                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFDAD4] text-[#A9372C]">
                      <CalendarIcon size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-[#410001]">Friday: train to Lisbon, 18:30</p>
                      <p className="text-[#534340]">Calendar event shared with both of you.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl bg-[#FFF8F5] p-3">
                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFDAD4] text-[#A9372C]">
                      <CheckSquare size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-[#410001]">Pack swimsuits — Mónica</p>
                      <p className="text-[#534340]">Task assigned, due Friday morning.</p>
                    </div>
                  </li>
                  <li className="flex items-start gap-3 rounded-xl bg-[#FFF8F5] p-3">
                    <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#FFDAD4] text-[#A9372C]">
                      <MapPin size={16} />
                    </span>
                    <div>
                      <p className="font-bold text-[#410001]">Saved: Time Out Market</p>
                      <p className="text-[#534340]">Pinned on the shared map for Saturday.</p>
                    </div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#FFF8F5] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <span className="ss-tag mb-4">What it is</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
              A small shared space, just for the people who share your plans.
            </h2>
            <p className="mt-5 text-base text-[#534340] sm:text-lg">
              Shared Shelf gathers the things couples, families, roommates, and friends try to coordinate over chats and
              screenshots — calendars, tasks, places, trips, recipes, and watchlists — into one private shared shelf.
              Everyone in the shelf reads and writes the same content, so nothing gets lost between apps.
            </p>
          </div>
        </section>

        <section className="bg-[#FBF2ED] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <span className="ss-tag mb-4">Who it is for</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                Made for the people you plan with most.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {AUDIENCES.map((audience) => (
                <div key={audience.title} className="ss-card p-6">
                  <h3 className="text-lg font-extrabold text-[#410001]">{audience.title}</h3>
                  <p className="mt-2 text-sm text-[#534340]">{audience.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#FFF8F5] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <span className="ss-tag mb-4">Private shelves</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                Your shelf, your people, your data.
              </h2>
            </div>
            <ol className="space-y-5">
              <li className="ss-card flex items-start gap-4 p-5 sm:p-6">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">1</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#410001]">Create or join a shelf</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Each shelf has a unique shelf ID and a one-time join code that expires after seven days. Share both
                    with the people you want to invite. Owners can regenerate the code at any time.
                  </p>
                </div>
              </li>
              <li className="ss-card flex items-start gap-4 p-5 sm:p-6">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">2</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#410001]">Choose what the shelf includes</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Turn on calendar, tasks, locations, trips, recipes, and watchlist per shelf. Disabled sections stay
                    out of the way so each shelf stays focused on what its members actually use.
                  </p>
                </div>
              </li>
              <li className="ss-card flex items-start gap-4 p-5 sm:p-6">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">3</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#410001]">Members read and write the same shelf</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Only invited members can see a shelf's content. Everyone in a shelf works against the same shared
                    document, with offline cache so the app stays useful when the connection drops.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="bg-[#FBF2ED] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <span className="ss-tag mb-4">Features</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                Everything a shared shelf can hold.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="ss-card p-6 transition ss-card-hover">
                    <span className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#FFDAD4] text-[#E63B2E]">
                      <Icon size={20} />
                    </span>
                    <h3 className="text-lg font-extrabold text-[#410001]">{feature.title}</h3>
                    <p className="mt-2 text-sm text-[#534340]">{feature.description}</p>
                  </div>
                );
              })}
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              <div className="ss-card flex items-center gap-3 p-4">
                <Tv size={18} className="text-[#E63B2E]" />
                <p className="text-sm font-semibold text-[#410001]">TV shows with progress</p>
              </div>
              <div className="ss-card flex items-center gap-3 p-4">
                <Film size={18} className="text-[#E63B2E]" />
                <p className="text-sm font-semibold text-[#410001]">Movies you want to watch</p>
              </div>
              <div className="ss-card flex items-center gap-3 p-4">
                <Book size={18} className="text-[#E63B2E]" />
                <p className="text-sm font-semibold text-[#410001]">Books, reading and read</p>
              </div>
              <div className="ss-card flex items-center gap-3 p-4">
                <MapPin size={18} className="text-[#E63B2E]" />
                <p className="text-sm font-semibold text-[#410001]">Places saved on a map</p>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-[#FFF8F5] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[#E1D8D4] bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#410001] sm:text-3xl">
              Ready to start a shelf?
            </h2>
            <p className="mt-3 text-base text-[#534340]">
              Sign in if you already have an account, or create one to start your first shelf in a couple of minutes.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/login?mode=signup"
                onClick={goTo('/login?mode=signup')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-6 py-3 text-base font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]"
              >
                Create account
              </a>
              <a
                href="/login"
                onClick={goTo('/login')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-6 py-3 text-base font-bold text-[#410001] transition hover:bg-[#FBF2ED]"
              >
                Sign in
              </a>
            </div>
          </div>
        </section>

        <section className="bg-[#FBF2ED] py-16 sm:py-20" id="release-notes">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <span className="ss-tag mb-4">Release notes</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                What is new on Shared Shelf.
              </h2>
              <p className="mt-3 text-base text-[#534340]">
                A short log of recent changes, in order from newest to oldest.
              </p>
            </div>
            <ol className="space-y-4">
              {RELEASE_NOTES.map((note) => (
                <li key={note.version} className="ss-card p-5 sm:p-6">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <span className="text-sm font-extrabold uppercase tracking-[0.14em] text-[#E63B2E]">{note.version}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[#857370]">{note.date}</span>
                  </div>
                  <h3 className="mt-1 text-lg font-extrabold text-[#410001]">{note.title}</h3>
                  <ul className="mt-3 space-y-1.5 text-sm text-[#534340]">
                    {note.items.map((item, index) => (
                      <li key={index} className="flex gap-2">
                        <span aria-hidden="true" className="mt-1 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#E63B2E]"></span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      {SiteFooter ? <SiteFooter onNavigate={onNavigate} /> : null}
    </div>
  );
}

window.HomePage = HomePage;
