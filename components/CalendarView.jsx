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

// Max chips shown before "+N more" in each view
const MONTH_MAX_CHIPS = 3;
const WEEK_MAX_CHIPS = 5;

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

// ── Event chip visual helpers ─────────────────────────────────────────────────

// Timed event: left accent border
const getTimedChipStyle = (color) => {
  const c = color || DEFAULT_EVENT_COLOR;
  return { backgroundColor: c + '25', borderLeft: `3px solid ${c}`, borderRadius: '3px' };
};

// All-day event: pill shape, no border, slightly more opaque bg
const getAllDayChipStyle = (color) => {
  const c = color || DEFAULT_EVENT_COLOR;
  return { backgroundColor: c + '38', borderRadius: '99px' };
};

// Agenda date badge (left side)
const getAgendaBadgeStyle = (color) => {
  const c = color || DEFAULT_EVENT_COLOR;
  return { backgroundColor: c + '22', borderLeft: `3px solid ${c}` };
};

// Returns first letter of a name as the initials
const getInitial = (name) => (name || '?').trim().charAt(0).toUpperCase();

// Returns the Sunday of the week containing `date`
const getWeekStart = (date) => {
  const d = new Date(date);
  d.setDate(d.getDate() - d.getDay());
  return d;
};

const CalendarView = ({ events, onDeleteEvent, onEditEvent, onAddClick, onAddForDate, onRescheduleEvent, currentUser }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarView, setCalendarView] = useState('month');
  const [weekStart, setWeekStart] = useState(() => getWeekStart(today));
  const [dragOverIso, setDragOverIso] = useState(null);

  const todayIso = isoDateFromParts(today.getFullYear(), today.getMonth(), today.getDate());

  // ── Month view data ─────────────────────────────────────────────────────────
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

  // ── Week view data ──────────────────────────────────────────────────────────
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekStartIso = formatIsoDate(weekStart);
  const weekEndIso = formatIsoDate(weekDays[6]);
  const weekOccurrences = events.flatMap(ev => expandEventOccurrences(ev, weekStartIso, weekEndIso));
  const weekEventsByDate = buildEventsByDate(weekOccurrences);

  // ── Navigation ──────────────────────────────────────────────────────────────
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
  const goPrevWeek = () => { setWeekStart(d => addDays(d, -7)); setSelectedDate(null); };
  const goNextWeek = () => { setWeekStart(d => addDays(d, 7)); setSelectedDate(null); };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setWeekStart(getWeekStart(today));
    setSelectedDate(null);
  };

  const switchView = (v) => {
    setCalendarView(v);
    setSelectedDate(null);
    if (v === 'week') {
      const base = (viewYear === today.getFullYear() && viewMonth === today.getMonth())
        ? today
        : new Date(viewYear, viewMonth, 1);
      setWeekStart(getWeekStart(base));
    } else {
      setViewYear(weekStart.getFullYear());
      setViewMonth(weekStart.getMonth());
    }
  };

  // ── Drag-and-drop ───────────────────────────────────────────────────────────
  const handleDragStart = (e, ev) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', (ev.sourceEvent || ev).id);
    setTimeout(() => { if (e.target) e.target.style.opacity = '0.45'; }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDragOverIso(null);
  };

  const handleDragOver = (e, iso) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIso !== iso) setDragOverIso(iso);
  };

  const handleDragLeave = (e) => {
    if (!e.currentTarget.contains(e.relatedTarget)) setDragOverIso(null);
  };

  const handleDrop = (e, iso) => {
    e.preventDefault();
    setDragOverIso(null);
    const eventId = e.dataTransfer.getData('text/plain');
    if (eventId && onRescheduleEvent) onRescheduleEvent(eventId, iso);
  };

  // ── Agenda ──────────────────────────────────────────────────────────────────
  const isMonthView = calendarView === 'month';
  const activeEventsByDate = isMonthView ? monthEventsByDate : weekEventsByDate;
  const activeOccurrences = isMonthView ? monthOccurrences : weekOccurrences;

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
      ? `Agenda — ${MONTH_NAMES[viewMonth]} ${viewYear}`
      : `Agenda — Week of ${formatDateDisplay(weekStartIso)}`;

  // ── Icons ───────────────────────────────────────────────────────────────────
  const ChevronLeft = getCalendarComponent('ChevronLeft');
  const ChevronRight = getCalendarComponent('ChevronRight');
  const CalendarIcon = getCalendarComponent('CalendarIcon');
  const Trash = getCalendarComponent('Trash');
  const Plus = getCalendarComponent('Plus');
  const UserIcon = getCalendarComponent('UserIcon');
  const EmptyState = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;

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

  // ── Event chip ──────────────────────────────────────────────────────────────
  const EventChip = ({ ev, compact = false }) => {
    const src = ev.sourceEvent || ev;
    const isDraggable = !ev.isRecurringOccurrence && Boolean(onRescheduleEvent);
    const isTimed = Boolean(ev.time || ev.startHour);
    const chipStyle = isTimed ? getTimedChipStyle(ev.color) : getAllDayChipStyle(ev.color);

    return (
      <div
        draggable={isDraggable}
        onDragStart={isDraggable ? (e) => handleDragStart(e, ev) : undefined}
        onDragEnd={isDraggable ? handleDragEnd : undefined}
        className={`flex items-center truncate px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[#000000] ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={chipStyle}
        title={[ev.title, isTimed ? null : 'All day', formatRecurrence(ev)].filter(Boolean).join(' · ')}
      >
        {isTimed && (
          <span className="mr-1 shrink-0 font-bold tabular-nums">{ev.startHour || ev.time}</span>
        )}
        {ev.isRecurringOccurrence && <span className="mr-0.5 shrink-0 font-black opacity-60">↺</span>}
        {ev.isPersonal && <span className="mr-0.5 shrink-0 opacity-70">·</span>}
        <span className="truncate">{ev.title}</span>
        {ev.isPersonal && ev.createdByName && !compact && (
          <span
            className="ml-1 shrink-0 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black text-white"
            style={{ backgroundColor: ev.color || DEFAULT_EVENT_COLOR }}
            title={`Personal — ${ev.createdByName}`}
          >
            {getInitial(ev.createdByName)}
          </span>
        )}
      </div>
    );
  };

  // ── Shared day-cell renderer ─────────────────────────────────────────────────
  const DayCell = ({ iso, dayLabel, dayEvents, isToday, isSelected, isWeekView = false }) => {
    const isDragTarget = dragOverIso === iso;
    const maxChips = isWeekView ? WEEK_MAX_CHIPS : MONTH_MAX_CHIPS;
    const visibleEvents = dayEvents.slice(0, maxChips);
    const overflow = dayEvents.length - maxChips;

    return (
      <div
        className={`group relative flex flex-col rounded-lg border p-1.5 text-left transition select-none sm:p-2 ${
          isWeekView ? 'min-h-[120px] sm:min-h-[160px]' : 'aspect-square sm:aspect-auto sm:min-h-[88px]'
        } ${
          isDragTarget
            ? 'border-[#E63B2E] bg-[#FFF0EE] ring-2 ring-[#E63B2E]/30'
            : isSelected
              ? 'border-[#E63B2E] bg-[#FFDAD4]'
              : isToday
                ? 'border-[#FFB4A9] bg-[#FFF8F5]'
                : 'border-[#E1D8D4] bg-white hover:border-[#FFB4A9] hover:bg-[#FFF8F5]'
        }`}
        onDragOver={onRescheduleEvent ? (e) => handleDragOver(e, iso) : undefined}
        onDragLeave={onRescheduleEvent ? handleDragLeave : undefined}
        onDrop={onRescheduleEvent ? (e) => handleDrop(e, iso) : undefined}
      >
        {/* Clickable overlay for day selection */}
        <button
          onClick={() => setSelectedDate(isSelected ? null : iso)}
          className="absolute inset-0 z-0 rounded-lg"
          aria-label={`Select ${iso}`}
        />

        {/* Day number + add button */}
        <div className="relative z-10 flex items-start justify-between">
          <span className={`text-xs font-bold sm:text-sm ${
            isToday
              ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E63B2E] text-white'
              : 'text-[#000000]'
          }`}>
            {dayLabel}
          </span>
          {onAddForDate && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddForDate(iso); }}
              className="hidden h-5 w-5 items-center justify-center rounded-full bg-[#E63B2E] text-white transition group-hover:flex"
              aria-label={`Add event on ${iso}`}
            >
              <Plus size={10} />
            </button>
          )}
        </div>

        {/* Desktop: event chips */}
        <div className="relative z-10 mt-1 hidden flex-1 flex-col gap-0.5 sm:flex" style={{ minHeight: 0 }}>
          {visibleEvents.map(ev => (
            <EventChip key={ev.occurrenceKey || ev.id} ev={ev} compact />
          ))}
          {overflow > 0 && (
            <button
              onClick={(e) => { e.stopPropagation(); setSelectedDate(iso); }}
              className="self-start rounded px-1 text-[9px] font-bold text-[#E63B2E] transition hover:bg-[#FFDAD4]"
            >
              +{overflow} more
            </button>
          )}
        </div>

        {/* Mobile: count badge */}
        {dayEvents.length > 0 && (
          <div className="relative z-10 mt-auto flex items-center justify-center gap-0.5 pt-0.5 sm:hidden">
            {dayEvents.length === 1 ? (
              <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dayEvents[0].color || DEFAULT_EVENT_COLOR }} />
            ) : (
              <span className="text-[9px] font-black" style={{ color: dayEvents[0].color || DEFAULT_EVENT_COLOR }}>
                {dayEvents.length}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="grid w-full gap-6 lg:grid-cols-12">
      {/* Calendar section */}
      <section className="rounded-2xl border border-[#E1D8D4] bg-white p-4 shadow-sm sm:p-6 lg:col-span-8">
        {/* Header */}
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

        {/* Month grid */}
        {isMonthView && (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {cells.map((day, idx) => {
              if (day === null) return <div key={`empty-${idx}`} className="aspect-square sm:aspect-auto sm:min-h-[88px]" />;
              const iso = isoDateFromParts(viewYear, viewMonth, day);
              return (
                <DayCell
                  key={iso}
                  iso={iso}
                  dayLabel={day}
                  dayEvents={monthEventsByDate[iso] || []}
                  isToday={iso === todayIso}
                  isSelected={iso === selectedDate}
                />
              );
            })}
          </div>
        )}

        {/* Week grid */}
        {!isMonthView && (
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {weekDays.map((dayDate) => {
              const iso = formatIsoDate(dayDate);
              return (
                <DayCell
                  key={iso}
                  iso={iso}
                  dayLabel={dayDate.getDate()}
                  dayEvents={weekEventsByDate[iso] || []}
                  isToday={iso === todayIso}
                  isSelected={iso === selectedDate}
                  isWeekView
                />
              );
            })}
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#E1D8D4] pt-3">
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#000000]">
            <span className="inline-block h-2.5 w-2.5 rounded-sm" style={getTimedChipStyle(DEFAULT_EVENT_COLOR)} />
            Timed
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#000000]">
            <span className="inline-block h-2.5 w-4 rounded-full" style={getAllDayChipStyle(DEFAULT_EVENT_COLOR)} />
            All-day
          </span>
          <span className="flex items-center gap-1 text-[10px] font-medium text-[#000000]">
            <span className="mr-0.5 font-black opacity-60 text-[10px]">↺</span>
            Recurring
          </span>
          {onRescheduleEvent && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-[#000000]">
              <span className="text-[10px]">✥</span>
              Drag to reschedule
            </span>
          )}
        </div>
      </section>

      {/* Agenda panel */}
      <section className="rounded-2xl border border-[#E1D8D4] bg-[#FFF8F5] p-4 shadow-sm sm:p-6 lg:col-span-4">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-[#000000] sm:text-xl">{agendaTitle}</h3>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="shrink-0 text-xs font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
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
              const isTimed = Boolean(ev.time || ev.startHour);
              return (
                <li
                  key={ev.occurrenceKey || ev.id}
                  onClick={() => onEditEvent(ev.sourceEvent || ev)}
                  className="group flex cursor-pointer gap-3 rounded-xl border border-[#E1D8D4] bg-white p-3 shadow-sm transition hover:border-[#E63B2E]/40 hover:shadow-md sm:p-4"
                >
                  {/* Date badge */}
                  <div
                    className="flex min-w-[60px] flex-col items-center justify-center rounded-lg px-2 py-1.5"
                    style={getAgendaBadgeStyle(accentColor)}
                  >
                    <span className="text-xs font-bold tabular-nums text-[#000000]">{formatDateDisplay(ev.startDate || ev.date)}</span>
                    {ev.endDate && ev.endDate !== (ev.startDate || ev.date) && (
                      <span className="text-[9px] tabular-nums opacity-70 text-[#000000]">→ {formatDateDisplay(ev.endDate)}</span>
                    )}
                  </div>

                  {/* Event details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="truncate font-bold text-[#000000]">{ev.title}</h4>
                          {ev.isPersonal && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-[#FBF2ED] px-1.5 py-0.5 text-[9px] font-bold text-[#000000]">
                              <UserIcon size={8} />
                              Personal
                            </span>
                          )}
                        </div>
                        {ev.isPersonal && ev.createdByName && (
                          <p className="mt-0.5 text-[10px] font-medium text-[#000000] opacity-60">{ev.createdByName}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          const sourceEvent = ev.sourceEvent || ev;
                          onDeleteEvent(sourceEvent.id, sourceEvent);
                        }}
                        className="shrink-0 flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
                        aria-label="Delete event"
                      >
                        <Trash size={14} />
                      </button>
                    </div>

                    {/* Time */}
                    {isTimed ? (
                      <p className="mt-0.5 text-sm font-medium text-[#000000]">
                        {ev.time ? ev.time : `${formatTime(ev.startHour)}${ev.startHour && ev.endHour ? ' – ' : ''}${formatTime(ev.endHour)}`}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide opacity-50 text-[#000000]">All day</p>
                    )}

                    {formatRecurrence(ev) && (
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#000000] opacity-60">{formatRecurrence(ev)}</p>
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
