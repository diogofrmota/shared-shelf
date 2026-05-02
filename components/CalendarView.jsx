const React = window.React;
const { useState } = React;
const getCalendarComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

// ============================================================================
// CALENDAR VIEW COMPONENT
// ============================================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const DEFAULT_EVENT_COLOR = '#E63B2E';

const formatTime = (time) => time || '';

const formatDateDisplay = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  return `${d}/${m}/${y}`;
};

const formatDateLong = (isoDate) => {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} - ${date.toLocaleDateString(undefined, { weekday: 'long' })}`;
};

const buildMonthGrid = (year, month) => {
  const firstDay = new Date(year, month, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

const isoDateFromParts = (year, month, day) => {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
};

const parseIsoDate = (isoDate) => {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return null;
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) return null;
  return date;
};

const formatIsoDate = (date) => isoDateFromParts(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, days) => {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
};

const daysBetween = (startDate, endDate) => Math.round((endDate - startDate) / 86400000);

const addMonthsClamped = (startDate, monthsToAdd) => {
  const targetMonth = startDate.getMonth() + monthsToAdd;
  const target = new Date(startDate.getFullYear(), targetMonth, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(startDate.getDate(), lastDay));
  return target;
};

const addYearsClamped = (startDate, yearsToAdd) => {
  const target = new Date(startDate.getFullYear() + yearsToAdd, startDate.getMonth(), 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(startDate.getDate(), lastDay));
  return target;
};

const RECURRENCE_LABELS = {
  daily: 'Daily',
  weekly: 'Weekly',
  monthly: 'Monthly',
  yearly: 'Yearly'
};

const getEventRecurrence = (event = {}) => {
  const rawFrequency = event.recurrence?.frequency || event.recurrence || event.repeat || 'none';
  const frequency = RECURRENCE_LABELS[rawFrequency] ? rawFrequency : 'none';
  if (frequency === 'none') return null;
  return {
    frequency,
    until: event.recurrence?.until || event.recurrenceUntil || ''
  };
};

const getOccurrenceStep = (startDate, frequency, index) => {
  if (frequency === 'daily') return addDays(startDate, index);
  if (frequency === 'weekly') return addDays(startDate, index * 7);
  if (frequency === 'monthly') return addMonthsClamped(startDate, index);
  if (frequency === 'yearly') return addYearsClamped(startDate, index);
  return startDate;
};

const getInitialOccurrenceIndex = (startDate, lowerBound, frequency) => {
  const diffDays = Math.max(0, daysBetween(startDate, lowerBound));
  if (frequency === 'daily') return diffDays;
  if (frequency === 'weekly') return Math.floor(diffDays / 7);
  if (frequency === 'monthly') {
    return Math.max(0, (lowerBound.getFullYear() - startDate.getFullYear()) * 12 + lowerBound.getMonth() - startDate.getMonth() - 1);
  }
  if (frequency === 'yearly') return Math.max(0, lowerBound.getFullYear() - startDate.getFullYear() - 1);
  return 0;
};

const createOccurrence = (event, occurrenceStart, durationDays, recurrence) => {
  const occurrenceEnd = addDays(occurrenceStart, durationDays);
  const occurrenceStartIso = formatIsoDate(occurrenceStart);
  const occurrenceEndIso = formatIsoDate(occurrenceEnd);

  return {
    ...event,
    date: occurrenceStartIso,
    startDate: occurrenceStartIso,
    endDate: occurrenceEndIso,
    recurrence,
    isRecurringOccurrence: Boolean(recurrence),
    sourceEvent: event,
    occurrenceDate: occurrenceStartIso,
    occurrenceKey: `${event.id || event.title}-${occurrenceStartIso}`
  };
};

const expandEventOccurrences = (event, rangeStartIso, rangeEndIso) => {
  const eventStartIso = event.startDate || event.date;
  const eventStart = parseIsoDate(eventStartIso);
  if (!eventStart) return [];

  const eventEnd = parseIsoDate(event.endDate || eventStartIso) || eventStart;
  const durationDays = Math.max(0, daysBetween(eventStart, eventEnd));
  const rangeStart = parseIsoDate(rangeStartIso);
  const rangeEnd = parseIsoDate(rangeEndIso);
  if (!rangeStart || !rangeEnd) return [];

  const recurrence = getEventRecurrence(event);
  if (!recurrence) {
    if (eventStart <= rangeEnd && eventEnd >= rangeStart) {
      return [createOccurrence(event, eventStart, durationDays, null)];
    }
    return [];
  }

  const recurrenceUntil = parseIsoDate(recurrence.until);
  const seriesEnd = recurrenceUntil && recurrenceUntil < rangeEnd ? recurrenceUntil : rangeEnd;
  if (eventStart > seriesEnd) return [];

  const lowerBound = addDays(rangeStart, -durationDays);
  const occurrences = [];
  let index = getInitialOccurrenceIndex(eventStart, lowerBound, recurrence.frequency);
  let guard = 0;

  while (guard < 450) {
    const occurrenceStart = getOccurrenceStep(eventStart, recurrence.frequency, index);
    const occurrenceEnd = addDays(occurrenceStart, durationDays);
    if (occurrenceStart > seriesEnd) break;
    if (occurrenceEnd >= rangeStart && occurrenceStart <= rangeEnd) {
      occurrences.push(createOccurrence(event, occurrenceStart, durationDays, recurrence));
    }
    index += 1;
    guard += 1;
  }

  return occurrences;
};

const formatRecurrence = (event) => {
  const recurrence = getEventRecurrence(event);
  if (!recurrence) return '';
  return `${RECURRENCE_LABELS[recurrence.frequency]}${recurrence.until ? ` until ${formatDateDisplay(recurrence.until)}` : ''}`;
};

// Returns a hex color for event chip background (light tint) given the event color
const getEventChipStyle = (color) => {
  const c = color || DEFAULT_EVENT_COLOR;
  return { backgroundColor: c + '28', borderLeft: `3px solid ${c}` };
};

// Returns the Sunday of the week containing `date`
const getWeekStart = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

const CalendarView = ({ events, onDeleteEvent, onEditEvent, onAddClick, onAddForDate }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarView, setCalendarView] = useState('month');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));

  const todayIso = isoDateFromParts(today.getFullYear(), today.getMonth(), today.getDate());

  // ── Month view helpers ──────────────────────────────────────────────────────
  const cells = buildMonthGrid(viewYear, viewMonth);
  const monthStart = isoDateFromParts(viewYear, viewMonth, 1);
  const monthEnd = isoDateFromParts(viewYear, viewMonth, new Date(viewYear, viewMonth + 1, 0).getDate());
  const monthOccurrences = events.flatMap(ev => expandEventOccurrences(ev, monthStart, monthEnd));

  const buildEventsByDate = (occurrences) => {
    const map = occurrences.reduce((acc, ev) => {
      const start = ev.startDate || ev.date;
      const end = ev.endDate || start;
      const startDate = parseIsoDate(start);
      if (!startDate) return acc;
      const parsedEndDate = parseIsoDate(end);
      const cur = new Date(startDate);
      const endD = parsedEndDate && parsedEndDate >= startDate ? parsedEndDate : startDate;
      while (cur <= endD) {
        const iso = formatIsoDate(cur);
        if (!acc[iso]) acc[iso] = [];
        acc[iso].push(ev);
        cur.setDate(cur.getDate() + 1);
      }
      return acc;
    }, {});
    Object.keys(map).forEach(d => {
      map[d].sort((a, b) => (a.startHour || a.time || '').localeCompare(b.startHour || b.time || ''));
    });
    return map;
  };

  const monthEventsByDate = buildEventsByDate(monthOccurrences);

  // ── Week view helpers ───────────────────────────────────────────────────────
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStartIso = formatIsoDate(weekStart);
  const weekEndIso = formatIsoDate(weekDays[6]);
  const weekOccurrences = events.flatMap(ev => expandEventOccurrences(ev, weekStartIso, weekEndIso));
  const weekEventsByDate = buildEventsByDate(weekOccurrences);

  // ── Month navigation ────────────────────────────────────────────────────────
  const goPrevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else { setViewMonth(m => m - 1); }
    setSelectedDate(null);
  };

  const goNextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
    setSelectedDate(null);
  };

  // ── Week navigation ─────────────────────────────────────────────────────────
  const goPrevWeek = () => { setWeekStart(d => addDays(d, -7)); setSelectedDate(null); };
  const goNextWeek = () => { setWeekStart(d => addDays(d, 7)); setSelectedDate(null); };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setWeekStart(getWeekStart(today));
    setSelectedDate(null);
  };

  // ── View switch ─────────────────────────────────────────────────────────────
  const switchView = (v) => {
    setCalendarView(v);
    setSelectedDate(null);
    if (v === 'week') {
      // When switching to week, show the week containing the 1st of the current month (or today if same month)
      const base = (viewYear === today.getFullYear() && viewMonth === today.getMonth())
        ? today
        : new Date(viewYear, viewMonth, 1);
      setWeekStart(getWeekStart(base));
    } else {
      // When switching to month, sync month to the week being viewed
      setViewYear(weekStart.getFullYear());
      setViewMonth(weekStart.getMonth());
    }
  };

  // ── Agenda data ─────────────────────────────────────────────────────────────
  const isMonthView = calendarView === 'month';
  const activeOccurrences = isMonthView ? monthOccurrences : weekOccurrences;
  const activeEventsByDate = isMonthView ? monthEventsByDate : weekEventsByDate;

  const sortedOccurrences = [...activeOccurrences].sort((a, b) => {
    const aStart = a.startDate || a.date;
    const bStart = b.startDate || b.date;
    if (aStart !== bStart) return aStart.localeCompare(bStart);
    return (a.startHour || a.time || '').localeCompare(b.startHour || b.time || '');
  });

  const agendaEvents = selectedDate ? (activeEventsByDate[selectedDate] || []) : sortedOccurrences;
  const agendaTitle = selectedDate
    ? formatDateLong(selectedDate)
    : isMonthView
      ? `Agenda - ${MONTH_NAMES[viewMonth]} ${viewYear}`
      : `Agenda - Week of ${formatDateDisplay(weekStartIso)}`;

  // ── Icons ───────────────────────────────────────────────────────────────────
  const ChevronLeft = getCalendarComponent('ChevronLeft');
  const ChevronRight = getCalendarComponent('ChevronRight');
  const CalendarIcon = getCalendarComponent('CalendarIcon');
  const Trash = getCalendarComponent('Trash');
  const Plus = getCalendarComponent('Plus');
  const EmptyState = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;

  // ── Shared day-cell "+" button ──────────────────────────────────────────────
  const AddDayButton = ({ iso }) => {
    if (!onAddForDate) return null;
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onAddForDate(iso); }}
        className="absolute right-1 top-1 hidden h-5 w-5 items-center justify-center rounded-full bg-[#E63B2E] text-white opacity-0 transition group-hover:flex group-hover:opacity-100 focus:flex focus:opacity-100"
        aria-label={`Add event on ${iso}`}
        title="Add event for this day"
      >
        <Plus size={10} />
      </button>
    );
  };

  // ── Week header label ───────────────────────────────────────────────────────
  const weekMonthLabel = (() => {
    const sm = weekDays[0].getMonth();
    const em = weekDays[6].getMonth();
    const sy = weekDays[0].getFullYear();
    const ey = weekDays[6].getFullYear();
    if (sy !== ey) return `${MONTH_NAMES[sm]} ${sy} – ${MONTH_NAMES[em]} ${ey}`;
    if (sm !== em) return `${MONTH_NAMES[sm]} – ${MONTH_NAMES[em]} ${sy}`;
    return `${MONTH_NAMES[sm]} ${sy}`;
  })();

  return (
    <div className="grid w-full gap-6 lg:grid-cols-12">
      {/* Calendar grid */}
      <section className="rounded-2xl border border-[#E1D8D4] bg-white p-4 shadow-sm sm:p-6 lg:col-span-8">
        {/* Header row */}
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-[#000000] sm:text-2xl">
              {isMonthView ? `${MONTH_NAMES[viewMonth]} ${viewYear}` : weekMonthLabel}
            </h2>
            <div className="flex items-center rounded-lg bg-[#FBF2ED] p-1">
              <button
                onClick={isMonthView ? goPrevMonth : goPrevWeek}
                className="flex h-11 w-11 items-center justify-center rounded text-[#000000] transition hover:bg-white hover:text-[#E63B2E]"
                aria-label={isMonthView ? 'Previous month' : 'Previous week'}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={isMonthView ? goNextMonth : goNextWeek}
                className="flex h-11 w-11 items-center justify-center rounded text-[#000000] transition hover:bg-white hover:text-[#E63B2E]"
                aria-label={isMonthView ? 'Next month' : 'Next week'}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* View toggle */}
            <div className="flex rounded-lg border border-[#E1D8D4] bg-[#FBF2ED] p-0.5">
              <button
                onClick={() => switchView('month')}
                className={`min-h-[36px] rounded-md px-3 text-xs font-bold transition ${isMonthView ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#000000] hover:text-[#E63B2E]'}`}
              >
                Month
              </button>
              <button
                onClick={() => switchView('week')}
                className={`min-h-[36px] rounded-md px-3 text-xs font-bold transition ${!isMonthView ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#000000] hover:text-[#E63B2E]'}`}
              >
                Week
              </button>
            </div>
            <button
              onClick={goToday}
              className="min-h-[44px] rounded-lg border border-[#E1D8D4] bg-white px-3 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
            >
              Today
            </button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="py-1 text-center text-xs font-bold uppercase tracking-wider text-[#000000] sm:text-sm">{day}</div>
          ))}
        </div>

        {/* ── Month view grid ── */}
        {isMonthView && (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((day, idx) => {
              if (day === null) {
                return <div key={`empty-${idx}`} className="aspect-square sm:aspect-auto sm:min-h-[88px]" />;
              }
              const iso = isoDateFromParts(viewYear, viewMonth, day);
              const dayEvents = monthEventsByDate[iso] || [];
              const isToday = iso === todayIso;
              const isSelected = iso === selectedDate;

              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(isSelected ? null : iso)}
                  className={`group relative flex aspect-square flex-col rounded-lg border p-1.5 text-left transition sm:aspect-auto sm:min-h-[88px] sm:p-2 ${
                    isSelected
                      ? 'border-[#E63B2E] bg-[#FFDAD4]'
                      : isToday
                        ? 'border-[#FFB4A9] bg-[#FFF8F5]'
                        : 'border-[#E1D8D4] bg-white hover:border-[#FFB4A9] hover:bg-[#FFF8F5]'
                  }`}
                >
                  <AddDayButton iso={iso} />
                  <span className={`text-xs font-bold sm:text-sm ${
                    isToday
                      ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E63B2E] text-white'
                      : 'text-[#000000]'
                  }`}>
                    {day}
                  </span>
                  <div className="mt-1 hidden flex-1 space-y-0.5 overflow-hidden sm:block">
                    {dayEvents.slice(0, 2).map(ev => {
                      const chipColor = ev.color || DEFAULT_EVENT_COLOR;
                      return (
                        <div
                          key={ev.occurrenceKey || ev.id}
                          className="truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[#000000]"
                          style={getEventChipStyle(chipColor)}
                          title={[ev.title, formatRecurrence(ev)].filter(Boolean).join(' - ')}
                        >
                          {(ev.startHour || ev.time) && <span className="mr-1 font-bold">{ev.startHour || ev.time}</span>}
                          {ev.isRecurringOccurrence && <span className="mr-1 font-black">R</span>}
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 2 && (
                      <div className="text-[10px] font-semibold text-[#000000]">+{dayEvents.length - 2} more</div>
                    )}
                  </div>
                  {dayEvents.length > 0 && (
                    <div className="mt-auto flex justify-center sm:hidden">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dayEvents[0].color || DEFAULT_EVENT_COLOR }}></span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* ── Week view grid ── */}
        {!isMonthView && (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map((dayDate) => {
              const iso = formatIsoDate(dayDate);
              const dayEvents = weekEventsByDate[iso] || [];
              const isToday = iso === todayIso;
              const isSelected = iso === selectedDate;
              const dayNum = dayDate.getDate();

              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(isSelected ? null : iso)}
                  className={`group relative flex min-h-[120px] flex-col rounded-lg border p-1.5 text-left transition sm:min-h-[160px] sm:p-2 ${
                    isSelected
                      ? 'border-[#E63B2E] bg-[#FFDAD4]'
                      : isToday
                        ? 'border-[#FFB4A9] bg-[#FFF8F5]'
                        : 'border-[#E1D8D4] bg-white hover:border-[#FFB4A9] hover:bg-[#FFF8F5]'
                  }`}
                >
                  <AddDayButton iso={iso} />
                  <span className={`mb-1 text-xs font-bold sm:text-sm ${
                    isToday
                      ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E63B2E] text-white'
                      : 'text-[#000000]'
                  }`}>
                    {dayNum}
                  </span>
                  <div className="flex flex-1 flex-col space-y-0.5 overflow-hidden">
                    {dayEvents.slice(0, 4).map(ev => {
                      const chipColor = ev.color || DEFAULT_EVENT_COLOR;
                      return (
                        <div
                          key={ev.occurrenceKey || ev.id}
                          className="truncate rounded px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[#000000]"
                          style={getEventChipStyle(chipColor)}
                          title={[ev.title, formatRecurrence(ev)].filter(Boolean).join(' - ')}
                        >
                          {(ev.startHour || ev.time) && <span className="mr-1 font-bold">{ev.startHour || ev.time}</span>}
                          {ev.isRecurringOccurrence && <span className="mr-1 font-black">R</span>}
                          {ev.title}
                        </div>
                      );
                    })}
                    {dayEvents.length > 4 && (
                      <div className="text-[10px] font-semibold text-[#000000]">+{dayEvents.length - 4} more</div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* Agenda */}
      <section className="rounded-2xl border border-[#E1D8D4] bg-[#FFF8F5] p-4 shadow-sm sm:p-6 lg:col-span-4">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-[#000000] sm:text-xl">{agendaTitle}</h3>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
            >
              {isMonthView ? 'Show month' : 'Show week'}
            </button>
          )}
        </div>

        {agendaEvents.length === 0 ? (
          events.length === 0 ? (
            <EmptyState
              title="No activities yet"
              message="Add a plan, reminder, or shared date."
              actionLabel="Add activity"
              icon={CalendarIcon}
              compact
              onAddClick={onAddClick}
            />
          ) : (
            <EmptyState
              title={selectedDate ? 'No activities this day' : isMonthView ? 'No activities this month' : 'No activities this week'}
              message="Try another date or add something new."
              icon={CalendarIcon}
              compact
              onAddClick={onAddClick}
              actionLabel="Add activity"
            />
          )
        ) : (
          <ul className="space-y-3">
            {agendaEvents.map(ev => {
              const accentColor = ev.color || DEFAULT_EVENT_COLOR;
              return (
                <li
                  key={ev.occurrenceKey || ev.id}
                  onClick={() => onEditEvent(ev.sourceEvent || ev)}
                  className="group flex cursor-pointer gap-3 rounded-xl border border-[#E1D8D4] bg-white p-3 shadow-sm transition hover:border-[#E63B2E]/40 hover:shadow-md sm:p-4"
                >
                  <div
                    className="flex min-w-[64px] flex-col items-center justify-center rounded-lg px-2 py-1.5 text-[#000000]"
                    style={{ backgroundColor: accentColor + '22', borderLeft: `3px solid ${accentColor}` }}
                  >
                    <span className="text-xs font-bold tabular-nums">{formatDateDisplay(ev.startDate || ev.date)}</span>
                    {ev.endDate && ev.endDate !== (ev.startDate || ev.date) && (
                      <span className="text-[10px] tabular-nums opacity-80">→ {formatDateDisplay(ev.endDate)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="truncate font-bold text-[#000000]">{ev.title}</h4>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const sourceEvent = ev.sourceEvent || ev;
                          onDeleteEvent(sourceEvent.id, sourceEvent);
                        }}
                        className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
                        aria-label="Delete event"
                      >
                        <Trash size={14} />
                      </button>
                    </div>
                    {(ev.time || ev.startHour || ev.endHour) && (
                      <p className="mt-0.5 text-sm font-medium text-[#000000]">
                        {ev.time ? ev.time : `${formatTime(ev.startHour)}${ev.startHour && ev.endHour ? ' – ' : ''}${formatTime(ev.endHour)}`}
                      </p>
                    )}
                    {formatRecurrence(ev) && (
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#000000]">{formatRecurrence(ev)}</p>
                    )}
                    {ev.description && <p className="mt-2 whitespace-pre-wrap text-sm text-[#000000]">{ev.description}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

Object.assign(window, { CalendarView });
