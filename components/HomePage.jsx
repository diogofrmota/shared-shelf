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
    title: 'Shared Calendar',
    description: 'Plan dates, anniversaries, and recurring routines on one calendar that both of you see.',
    bg: '#FFE4E0',
    border: '#F5ADA5',
    accent: '#D8271C'
  },
  {
    icon: CheckSquare,
    title: 'Tasks List',
    description: 'Split chores and errands, assign tasks to either of you, set due dates, and repeat the ones that come back every week.',
    bg: '#E1F5EE',
    border: '#91D7BF',
    accent: '#00845F'
  },
  {
    icon: MapPin,
    title: 'Favourite Locations',
    description: 'Save restaurants, bars, and date ideas on a shared map with categories, ratings, and notes.',
    bg: '#FFE8D7',
    border: '#F2B27A',
    accent: '#D65A00'
  },
  {
    icon: Film,
    title: 'Plan Your Next Trip',
    bg: '#E4EEFF',
    border: '#9CBFF4',
    accent: '#1D6BDA',
    description: 'Keep itineraries, bookings, packing lists, and notes for your upcoming and past trips together.'
  },
  {
    icon: ChefHat,
    title: 'Recipe Collection',
    description: 'Build a shared recipe book with ingredients, instructions, prep time, and source links for the meals you cook together.',
    bg: '#FFE4F6',
    border: '#EAA3D6',
    accent: '#B8329B'
  },
  {
    icon: Tv,
    title: 'Watchlist & Reading',
    description: 'Track the movies, TV shows and books you want to watch and read together, with statuses, ratings, and season progress.',
    bg: '#ECE8FF',
    border: '#B9ADF2',
    accent: '#6B52D9'
  }
];

const AudienceHomeIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="m3 10 9-7 9 7"></path>
    <path d="M5 10v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V10"></path>
    <path d="M9 21v-6h6v6"></path>
  </svg>
);

const AudiencePlaneIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3.5S18.5 3 17 4.5L13.5 8 5.3 6.2 4 7.5l6.5 3.5L7 14.5l-3-.5-1 1 4 2 2 4 1-1-.5-3 3.5-3.5 3.5 6.5z"></path>
  </svg>
);

const AudienceHeartIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8z"></path>
  </svg>
);

const AudienceUsersIcon = ({ size = 20, className = '' }) => (
  <svg width={size} height={size} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24" className={className}>
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path>
    <circle cx="9" cy="7" r="4"></circle>
    <path d="M22 21v-2a4 4 0 0 0-3-3.87"></path>
    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
  </svg>
);

const AUDIENCES = [
  {
    icon: AudienceHomeIcon,
    title: 'Living Together',
    description: 'Coordinate the calendar, split chores, save the recipes you cook on weeknights, and keep date plans in one place.',
    bg: '#FFE3DD',
    border: '#F2A69B',
    accent: '#D8271C'
  },
  {
    icon: AudiencePlaneIcon,
    title: 'Long-distance',
    description: 'Stay in sync across the world. Plan visits, save the trips you want to take, and queue what to watch on the next call.',
    bg: '#E3EEFF',
    border: '#9CBFF4',
    accent: '#1D6BDA'
  },
  {
    icon: AudienceHeartIcon,
    title: 'Newly Dating',
    bg: '#FFE2F3',
    border: '#E89BC7',
    accent: '#B8329B',
    description: 'Keep a running list of restaurants to try, films to watch, and weekend ideas.'
  },
  {
    icon: AudienceUsersIcon,
    title: 'Married',
    bg: '#E3F5EA',
    border: '#95D3AC',
    accent: '#00845F',
    description: 'Anniversaries, recurring errands, family trips, and the watchlist of movies you want to watch.'
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
              Sign In
            </a>
            <a
              href="/login?mode=signup"
              onClick={goTo('/login?mode=signup')}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C]"
            >
              Create Account
            </a>
          </nav>
        </div>
      </header>

      <main id="main-content" tabIndex="-1" className="flex-1">
        <section className="app-auth-bg">
          <div className="mx-auto flex w-full max-w-7xl flex-col items-start gap-8 px-4 py-10 text-white sm:px-6 sm:py-12 lg:flex-row lg:items-center lg:gap-12 lg:px-8 lg:py-14">
            <div className="flex-1">
              <h1 className="text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
                Couple Planner
              </h1>
              <p className="mt-4 text-2xl font-extrabold leading-tight text-white sm:text-3xl">
                Plan your life, together.
              </p>
              <p className="mt-5 max-w-xl text-base font-medium text-white/90 sm:text-lg">
                Couple Planner is a private, shared space just for you and your partner. Have a shared calendar, task list,
                saved locations, trips planner, recipes book, and track movies, tv shows and books. Everything synced in one place.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <a
                  href="/login?mode=signup"
                  onClick={goTo('/login?mode=signup')}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-base font-bold text-[#A9372C] shadow-lg shadow-black/20 transition hover:bg-[#FFF8F5]"
                >
                  Create Account
                </a>
                <a
                  href="/login"
                  onClick={goTo('/login')}
                  className="inline-flex items-center gap-2 rounded-xl border-2 border-white bg-transparent px-6 py-3 text-base font-bold text-white transition hover:bg-white hover:text-[#A9372C]"
                >
                  Sign In
                </a>
              </div>
            </div>
            <div className="w-full max-w-md flex-1 lg:max-w-lg">
              <div className="rounded-3xl border border-white/30 bg-white/95 p-6 text-[#241A18] shadow-2xl shadow-black/30 sm:p-8">
                <h2 className="text-2xl font-extrabold text-[#410001]">Main Features</h2>
                <p className="mt-1 text-sm text-[#534340]">Couple Planner lets you manage your relashionship in one app.</p>
                <ul className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {HERO_SHARED_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <li
                        key={item.label}
                        className="flex min-h-[58px] items-center gap-2.5 rounded-xl px-3 py-2 text-white shadow-md shadow-black/10"
                        style={{ backgroundColor: item.color }}
                      >
                        <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-white/20">
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

        <section id="what-it-is" className="scroll-mt-24 bg-[#FFF8F5] py-10 sm:py-12">
          <div className="mx-auto w-full max-w-5xl px-4 text-center sm:px-6 lg:px-8">
            <span className="ss-tag mb-4">What it is</span>
            <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
              A private shared space, just for the two of you.
            </h2>
            <p className="mt-5 text-base text-[#534340] sm:text-lg">
              Couple Planner brings together everything you coordinate as a couple, including 
              your calendar, tasks, date ideas, trips, recipes, and shared entertainment, into 
              one private space. Both partners can read and update the same content, so nothing 
              gets lost across apps or messages.
            </p>
          </div>
        </section>

        <section id="who-it-is-for" className="scroll-mt-24 bg-[#FBF2ED] py-10 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center sm:mb-10">
              <span className="ss-tag mb-4">Who it is for</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                Built for couples, at every stage.
              </h2>
              <p className="mt-3 text-base text-[#534340] sm:text-lg">
                However the two of you are doing life right now, Couple Planner adapts to it.
              </p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
              {AUDIENCES.map((audience) => {
                const Icon = audience.icon;
                return (
                  <div
                    key={audience.title}
                    className="ss-card p-6"
                    style={{ borderWidth: '3px' }}
                  >
                    <div className="mb-3 flex items-center gap-3">
                      <span
                        className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/70"
                        style={{ color: audience.accent }}
                      >
                        <Icon size={19} />
                      </span>
                      <h3 className="text-lg font-extrabold text-[#410001]">{audience.title}</h3>
                    </div>
                    <p className="text-sm text-[#534340]">{audience.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="features" className="scroll-mt-24 bg-[#FFF8F5] py-10 sm:py-12">
          <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center sm:mb-10">
              <span className="ss-tag mb-4">Features</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                Plan your relationship, synced in one place.
              </h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
              {FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={feature.title}
                    className="ss-card p-6 transition ss-card-hover"
                    style={{ backgroundColor: feature.bg, borderColor: feature.border, borderWidth: '3px' }}
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

        <section className="bg-[#FBF2ED] py-10 sm:py-12">
          <div className="mx-auto w-full max-w-5xl px-4 sm:px-6 lg:px-8">
            <div className="mb-8 text-center sm:mb-10">
              <span className="ss-tag mb-4">Private by design</span>
              <h2 className="text-3xl font-extrabold tracking-tight text-[#410001] sm:text-4xl">
                Secure your data privately, only share with your partner.
              </h2>
            </div>
            <ol className="space-y-4">
              <li
                className="ss-card flex items-start gap-4 p-5 sm:p-6"
                style={{ borderWidth: '3px' }}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">1</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#410001]">Create your space and invite your partner</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Each space has a unique ID and a one-time join code. Send both to
                    your partner and you are connected. The owner can regenerate the code at any time.
                  </p>
                </div>
              </li>
              <li
                className="ss-card flex items-start gap-4 p-5 sm:p-6"
                style={{ borderWidth: '3px' }}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">2</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#410001]">Choose what your space includes</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Turn calendar, tasks, locations, trips, recipes, and watchlist on or off per space, you decide. Hide what you
                    don't use so your shared home screen stays focused on what actually matters to you both.
                  </p>
                </div>
              </li>
              <li
                className="ss-card flex items-start gap-4 p-5 sm:p-6"
                style={{ borderWidth: '3px' }}
              >
                <span className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-[#E63B2E] text-base font-extrabold text-white">3</span>
                <div>
                  <h3 className="text-lg font-extrabold text-[#410001]">Both of you see and edit the same information</h3>
                  <p className="mt-1 text-sm text-[#534340]">
                    Only the two of you can see what's inside. Every change is shared instantly.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </section>

        <section className="bg-[#FFF8F5] py-10 sm:py-12">
          <div className="mx-auto w-full max-w-3xl rounded-3xl border border-[#E1D8D4] bg-white px-6 py-10 text-center shadow-sm sm:px-10 sm:py-12">
            <h2 className="text-2xl font-extrabold tracking-tight text-[#410001] sm:text-3xl">
              Ready to manage your relationship, together?
            </h2>
            <p className="mt-3 text-base text-[#534340]">
              Sign in if you already have an account, or create one to start planning with your partner.
            </p>
            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <a
                href="/login?mode=signup"
                onClick={goTo('/login?mode=signup')}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E63B2E] px-6 py-3 text-base font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#A9372C] hover:text-white"
              >
                Create Account
              </a>
              <a
                href="/login"
                onClick={goTo('/login')}
                className="inline-flex items-center gap-2 rounded-xl border border-[#E1D8D4] bg-white px-6 py-3 text-base font-bold text-[#410001] transition hover:bg-[#FBF2ED]"
              >
                Sign In
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
