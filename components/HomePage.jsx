const React = window.React;
const { BrandLogo } = window;
const {
  CalendarIcon,
  CheckSquare,
  MapPin,
  Film,
  ChefHat,
  Tv
} = window;

const FEATURES = [
  {
    icon: CalendarIcon,
    title: 'Shared calendar',
    description: 'Plan dates, anniversaries, and recurring routines on one calendar that both of you see.',
    bg: '#FFE4E0',
    border: '#F5ADA5',
    accent: '#D8271C'
  },
  {
    icon: CheckSquare,
    title: 'Tasks together',
    description: 'Split chores and errands, assign tasks to either of you, set due dates, and repeat the ones that come back every week.',
    bg: '#E1F5EE',
    border: '#91D7BF',
    accent: '#00845F'
  },
  {
    icon: MapPin,
    title: 'Places to go',
    description: 'Save restaurants, bars, and date ideas on a shared map with categories, photos, ratings, and notes.',
    bg: '#FFE8D7',
    border: '#F2B27A',
    accent: '#D65A00'
  },
  {
    icon: Film,
    title: 'Trip planning',
    bg: '#E4EEFF',
    border: '#9CBFF4',
    accent: '#1D6BDA',
    description: 'Keep itineraries, bookings, packing lists, and notes for your upcoming and past trips together — all in one place.'
  },
  {
    icon: ChefHat,
    title: 'Recipe collection',
    description: 'Build a shared recipe book with ingredients, instructions, photos, prep time, and source links for the meals you cook together.',
    bg: '#FFE4F6',
    border: '#EAA3D6',
    accent: '#B8329B'
  },
  {
    icon: Tv,
    title: 'Watchlist & reading',
    description: 'Track the movies, TV shows, and books you want to watch and read together, with statuses, ratings, and season progress.',
    bg: '#ECE8FF',
    border: '#B9ADF2',
    accent: '#6B52D9'
  }
];

const AUDIENCES = [
  {
    title: 'Living together',
    description: 'Coordinate the calendar, split chores, save the recipes you cook on weeknights, and keep date plans in one place.',
    bg: '#FFE3DD',
    border: '#F2A69B'
  },
  {
    title: 'Long-distance',
    description: 'Stay in sync across schedules and time zones. Plan visits, save the trips you want to take, and queue what to watch on the next call.',
    bg: '#E3EEFF',
    border: '#9CBFF4'
  },
  {
    title: 'Newly dating',
    bg: '#FFE2F3',
    border: '#E89BC7',
    description: 'Keep a running list of restaurants to try, films to watch, and weekend ideas — without losing them in a chat thread.'
  },
  {
    title: 'Married & busy',
    bg: '#E3F5EA',
    border: '#95D3AC',
    description: 'Anniversaries, recurring errands, family trips, and the watchlist you never get to. Everything in one shared, private space.'
  }
];

const HERO_SHARED_ITEMS = [
  { icon: CalendarIcon, label: 'Calendar', color: '#D8271C' },
  { icon: CheckSquare, label: 'Tasks', color: '#00845F' },
  { icon: MapPin, label: 'Places', color: '#D65A00' },
  { icon: Film, label: 'Trips', color: '#1D6BDA', strokeWidth: 2.8 },
  { icon: ChefHat, label: 'Recipes', color: '#B8329B' },
  { icon: Tv, label: 'Watchlist', color: '#6B52D9', strokeWidth: 2.8 }
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

  const scrollToId = (id) => (event) => {
    if (event) event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const SiteFooter = window.SiteFooter;

  const navLinks = [
    { id: 'what-it-is', label: 'What it is' },
    { id: 'who-it-is-for', label: 'Who it is for' },
    { id: 'features', label: 'Features' }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#FBF2ED]">
      <a href="#main-content" className="skip-link">Skip to content</a>

      <header className="sticky top-0 z-30 border-b border-[#E1D8D4]/70 bg-[#FFF8F5]/95 backdrop-blur">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
          <a href="/" onClick={goTo('/')} className="flex items-center gap-2">
            <BrandLogo />
          </a>
          <nav className="hidden items-center gap-1 md:flex">
            {navLinks.map((link) => (
              <a
                key={link.id}
                href={`#${link.id}`}
                onClick={scrollToId(link.id)}
                className="rounded-xl px-3 py-2 text-sm font-bold text-[#534340] transition hover:bg-[#FFDAD4]/50 hover:text-[#A9372C]"
              >
                {link.label}
              </a>
            ))}
          </nav>
          <nav className="flex items-center gap-2 sm:gap-3">
            <a
              href="/login"
              onClick={goTo('/login')}
              className="hidden rounded-xl border border-[#E63B2E]/40 bg-white px-4 py-2 text-sm font-bold text-[#A9372C] transition hover:border-[#E63B2E] hover:bg-[#FFDAD4]/40 sm:inline-flex"
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
              <span className="ss-tag mb-5 bg-white/20 text-white">For the two of you</span>
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Plan your life,<br />together.
              </h1>
              <p className="mt-5 max-w-xl text-base font-medium text-white/90 sm:text-lg">
                Couple Planner is a private, shared space just for you and your partner. One calendar, one task list,
                one map of saved places, your trips planner, recipes book, and the movies and shows you want to watch. Everything synced in one place,
                to manage your relashionship.
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
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-transparent px-6 py-3 text-base font-bold text-white transition hover:bg-white hover:text-[#A9372C]"
                >
                  Sign in
                </a>
              </div>
            </div>
            <div className="w-full max-w-md flex-1 lg:max-w-lg">
              <div className="rounded-3xl border border-white/30 bg-white/95 p-6 text-[#241A18] shadow-2xl shadow-black/30 sm:p-8">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-[#A9372C]">Create a Shared Dashboard</p>
                  <span className="ss-tag">Private</span>
                </div>
                <h2 className="mt-2 text-2xl font-extrabold text-[#410001]">Couple Planner</h2>
                <p className="mt-1 text-sm text-[#534340]">Everything the two of you are planning, in one place.</p>
                <ul className="mt-5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                  {HERO_SHARED_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.label}
                        className="flex min-h-[76px] items-center gap-3 rounded-xl p-3 text-white shadow-md shadow-black/10"
                        style={{ backgroundColor: item.color }}
                      >
                        <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
                          <Icon size={20} strokeWidth={item.strokeWidth || 2} />
                        </span>
                        <p className="min-w-0 text-sm font-extrabold">{item.label}</p>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section id="what-it-is" className="scroll-mt-24 bg-[#FFF8F5] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <span className="ss-tag mb-4">What it is</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
              A private shared space, just for the two of you.
            </h2>
            <p className="mt-5 text-base text-[#534340] sm:text-lg">
              Couple Planner gathers everything couples try to coordinate, such as
              your calendar, your tasks, the places you want to go on dates, the trips you are planning, the recipes
              you cook, and the films and shows you are watching or books you are reading together into one private, shared space.
              Both of you read and write the same content, so nothing slips between apps or threads.
            </p>
          </div>
        </section>

        <section id="who-it-is-for" className="scroll-mt-24 bg-[#FBF2ED] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <span className="ss-tag mb-4">Who it is for</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                Built for couples, at every stage.
              </h2>
              <p className="mt-3 text-base text-[#534340] sm:text-lg">
                However the two of you are doing life right now, Couple Planner adapts to it.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {AUDIENCES.map((audience) => (
                <div
                  key={audience.title}
                  className="ss-card p-6"
                  style={{ backgroundColor: audience.bg, borderColor: audience.border }}
                >
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
              <span className="ss-tag mb-4">Private by design</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                Your space, your two, your data.
              </h2>
            </div>
            <ol className="space-y-5">
              <li className="ss-card flex items-start gap-4 p-5 sm:p-6">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">1</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#410001]">Create your space and invite your partner</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Each space has a unique ID and a one-time join code that expires after seven days. Send both to
                    your partner and you are connected. The owner can regenerate the code at any time.
                  </p>
                </div>
              </li>
              <li className="ss-card flex items-start gap-4 p-5 sm:p-6">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">2</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#410001]">Choose what your space includes</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Turn calendar, tasks, locations, trips, recipes, and watchlist on or off per space. Hide what you
                    don't use so your shared home screen stays focused on what actually matters to you both.
                  </p>
                </div>
              </li>
              <li className="ss-card flex items-start gap-4 p-5 sm:p-6">
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">3</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#410001]">Both of you see and edit the same space</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Only the two of you can see what's inside. Every change is shared instantly, and an offline cache
                    keeps the app useful even when the connection drops.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-[#FBF2ED] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-10 text-center sm:mb-12">
              <span className="ss-tag mb-4">Features</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                Everything the two of you need to plan, synced in one place.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="ss-card p-6 transition ss-card-hover"
                    style={{ backgroundColor: feature.bg, borderColor: feature.border }}
                  >
                    <span
                      className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-white/70"
                      style={{ color: feature.accent }}
                    >
                      <Icon size={20} />
                    </span>
                    <h3 className="text-lg font-extrabold text-[#410001]">{feature.title}</h3>
                    <p className="mt-2 text-sm text-[#534340]">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#FFF8F5] py-16 sm:py-20">
          <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[#E1D8D4] bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#410001] sm:text-3xl">
              Ready to start your space, together?
            </h2>
            <p className="mt-3 text-base text-[#534340]">
              Sign in if you already have an account, or create one to start planning with your partner in minutes.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/login?mode=signup"
                onClick={goTo('/login?mode=signup')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-6 py-3 text-base font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] hover:text-white"
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
      </main>

      {SiteFooter ? <SiteFooter onNavigate={onNavigate} /> : null}
    </div>
  );
}

window.HomePage = HomePage;
