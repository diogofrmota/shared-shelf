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
const MONTH_MAX_CHIPS = 2; // single-day chips per cell in month view
const WEEK_MAX_CHIPS  = 4; // single-day chips per cell in week view

// ── Date helpers ──────────────────────────────────────────────────────────────
const isoDateFromParts = (year, month, day) =>
  `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

const parseIsoDate = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) ? date : null;
};

const formatIsoDate = (date) => isoDateFromParts(date.getFullYear(), date.getMonth(), date.getDate());

const addDays = (date, n) => { const d = new Date(date); d.setDate(d.getDate() + n); return d; };

const daysBetween = (a, b) => Math.round((b - a) / 86400000);

const addMonthsClamped = (d, n) => {
  const t = new Date(d.getFullYear(), d.getMonth() + n, 1);
  t.setDate(Math.min(d.getDate(), new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return t;
};
const addYearsClamped = (d, n) => {
  const t = new Date(d.getFullYear() + n, d.getMonth(), 1);
  t.setDate(Math.min(d.getDate(), new Date(t.getFullYear(), t.getMonth() + 1, 0).getDate()));
  return t;
};

const formatDateDisplay = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const formatDateLong = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} — ${date.toLocaleDateString(undefined, { weekday: 'long' })}`;
};

const getWeekStart = (date) => { const d = new Date(date); d.setDate(d.getDate() - d.getDay()); return d; };

const buildMonthGrid = (year, month) => {
  const startWd = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = Array(startWd).fill(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
};

// ── Recurrence helpers ────────────────────────────────────────────────────────
const RECURRENCE_LABELS = { daily: 'Daily', weekly: 'Weekly', monthly: 'Monthly', yearly: 'Yearly' };

const getEventRecurrence = (event = {}) => {
  const raw = event.recurrence?.frequency || event.recurrence || event.repeat || 'none';
  const freq = RECURRENCE_LABELS[raw] ? raw : 'none';
  if (freq === 'none') return null;
  return { frequency: freq, until: event.recurrence?.until || event.recurrenceUntil || '' };
};

const formatRecurrence = (event) => {
  const r = getEventRecurrence(event);
  if (!r) return '';
  return `${RECURRENCE_LABELS[r.frequency]}${r.until ? ` until ${formatDateDisplay(r.until)}` : ''}`;
};

const getOccurrenceStep = (d, freq, idx) => {
  if (freq === 'daily')   return addDays(d, idx);
  if (freq === 'weekly')  return addDays(d, idx * 7);
  if (freq === 'monthly') return addMonthsClamped(d, idx);
  if (freq === 'yearly')  return addYearsClamped(d, idx);
  return d;
};

const getInitialIdx = (start, lower, freq) => {
  const diff = Math.max(0, daysBetween(start, lower));
  if (freq === 'daily')   return diff;
  if (freq === 'weekly')  return Math.floor(diff / 7);
  if (freq === 'monthly') return Math.max(0, (lower.getFullYear() - start.getFullYear()) * 12 + lower.getMonth() - start.getMonth() - 1);
  if (freq === 'yearly')  return Math.max(0, lower.getFullYear() - start.getFullYear() - 1);
  return 0;
};

const makeOccurrence = (event, occStart, durDays, recurrence) => {
  const occEnd = addDays(occStart, durDays);
  const startIso = formatIsoDate(occStart);
  const endIso   = formatIsoDate(occEnd);
  return {
    ...event,
    date: startIso, startDate: startIso, endDate: endIso,
    recurrence,
    isRecurringOccurrence: Boolean(recurrence),
    sourceEvent: event,
    occurrenceDate: startIso,
    occurrenceKey: `${event.id || event.title}-${startIso}`
  };
};

const expandEventOccurrences = (event, rangeStartIso, rangeEndIso) => {
  const evStartIso = event.startDate || event.date;
  const evStart = parseIsoDate(evStartIso);
  if (!evStart) return [];
  const evEnd = parseIsoDate(event.endDate || evStartIso) || evStart;
  const durDays = Math.max(0, daysBetween(evStart, evEnd));
  const rangeStart = parseIsoDate(rangeStartIso);
  const rangeEnd   = parseIsoDate(rangeEndIso);
  if (!rangeStart || !rangeEnd) return [];

  const recurrence = getEventRecurrence(event);
  if (!recurrence) {
    if (evStart <= rangeEnd && evEnd >= rangeStart) return [makeOccurrence(event, evStart, durDays, null)];
    return [];
  }

  const until = parseIsoDate(recurrence.until);
  const seriesEnd = until && until < rangeEnd ? until : rangeEnd;
  if (evStart > seriesEnd) return [];

  const lower = addDays(rangeStart, -durDays);
  const occs = [];
  let idx = getInitialIdx(evStart, lower, recurrence.frequency);
  let guard = 0;
  while (guard < 450) {
    const occStart = getOccurrenceStep(evStart, recurrence.frequency, idx);
    const occEnd   = addDays(occStart, durDays);
    if (occStart > seriesEnd) break;
    if (occEnd >= rangeStart && occStart <= rangeEnd) occs.push(makeOccurrence(event, occStart, durDays, recurrence));
    idx++; guard++;
  }
  return occs;
};

// ── Multi-day bar computation ─────────────────────────────────────────────────
// weekIsos: 7-item array of ISO strings or null (null = padding cell)
// occurrences: expanded occurrences whose endDate > startDate
const computeMultiDayBars = (weekIsos, occurrences) => {
  const bars = [];

  for (const ev of occurrences) {
    const evStart = ev.startDate || ev.date;
    const evEnd   = ev.endDate   || evStart;
    if (!evEnd || evEnd <= evStart) continue;

    // Find first and last column that falls within [evStart, evEnd]
    let startCol = -1, endCol = -1;
    for (let i = 0; i < 7; i++) {
      const iso = weekIsos[i];
      if (!iso) continue;
      if (iso >= evStart && iso <= evEnd) {
        if (startCol === -1) startCol = i;
        endCol = i;
      }
    }
    if (startCol === -1) continue;

    bars.push({
      ev,
      startCol,
      endCol,
      span: endCol - startCol + 1,
      continuesLeft:  evStart < weekIsos[startCol],
      continuesRight: evEnd   > weekIsos[endCol],
      showTitle: evStart >= weekIsos[startCol],
      key: `${(ev.sourceEvent || ev).id}-${weekIsos[startCol]}`
    });
  }

  // Greedy lane packing
  const laneEnds = [];
  return bars
    .sort((a, b) => a.startCol - b.startCol)
    .map(bar => {
      let lane = laneEnds.findIndex(end => end < bar.startCol);
      if (lane === -1) { lane = laneEnds.length; laneEnds.push(-1); }
      laneEnds[lane] = bar.endCol;
      return { ...bar, lane };
    });
};

// ── Visual style helpers ──────────────────────────────────────────────────────
const getTimedChipStyle   = (color) => ({ backgroundColor: (color || DEFAULT_EVENT_COLOR) + '25', borderLeft: `3px solid ${color || DEFAULT_EVENT_COLOR}`, borderRadius: '3px' });
const getAllDayChipStyle   = (color) => ({ backgroundColor: (color || DEFAULT_EVENT_COLOR) + '38', borderRadius: '99px' });
const getAgendaBadgeStyle = (color) => ({ backgroundColor: (color || DEFAULT_EVENT_COLOR) + '22', borderLeft: `3px solid ${color || DEFAULT_EVENT_COLOR}` });

const getInitial = (name) => (name || '?').trim().charAt(0).toUpperCase();

// ── isMultiDay helper ─────────────────────────────────────────────────────────
const isMultiDayOcc = (ev) => {
  const start = ev.startDate || ev.date;
  const end   = ev.endDate   || start;
  return end > start;
};

// ── CalendarView ──────────────────────────────────────────────────────────────
const CalendarView = ({ events, onDeleteEvent, onEditEvent, onAddClick, onAddForDate, onRescheduleEvent, currentUser }) => {
  const today = new Date();
  const todayIso = isoDateFromParts(today.getFullYear(), today.getMonth(), today.getDate());

  const [viewYear,    setViewYear]    = useState(today.getFullYear());
  const [viewMonth,   setViewMonth]   = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);
  const [calendarView, setCalendarView] = useState('month');
  const [weekStart,   setWeekStart]   = useState(() => getWeekStart(today));
  const [dragOverIso, setDragOverIso] = useState(null);

  // ── Month data ─────────────────────────────────────────────────────────────
  const monthStart = isoDateFromParts(viewYear, viewMonth, 1);
  const monthEnd   = isoDateFromParts(viewYear, viewMonth, new Date(viewYear, viewMonth + 1, 0).getDate());
  const monthOccs  = events.flatMap(ev => expandEventOccurrences(ev, monthStart, monthEnd));
  const monthMultiDay  = monthOccs.filter(isMultiDayOcc);
  const monthSingleDay = monthOccs.filter(ev => !isMultiDayOcc(ev));

  const buildSingleDayMap = (occs) => {
    const map = {};
    for (const ev of occs) {
      const iso = ev.startDate || ev.date;
      if (!map[iso]) map[iso] = [];
      map[iso].push(ev);
    }
    Object.keys(map).forEach(d => map[d].sort((a, b) => (a.time || a.startHour || '').localeCompare(b.time || b.startHour || '')));
    return map;
  };

  const monthSingleByDate = buildSingleDayMap(monthSingleDay);

  // Cells split into week rows
  const cells = buildMonthGrid(viewYear, viewMonth);
  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));

  // ── Week data ─────────────────────────────────────────────────────────────
  const weekDays    = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  const weekIsosFull = weekDays.map(formatIsoDate);
  const weekStartIso = weekIsosFull[0];
  const weekEndIso   = weekIsosFull[6];
  const weekOccs     = events.flatMap(ev => expandEventOccurrences(ev, weekStartIso, weekEndIso));
  const weekMultiDay  = weekOccs.filter(isMultiDayOcc);
  const weekSingleDay = weekOccs.filter(ev => !isMultiDayOcc(ev));
  const weekSingleByDate = buildSingleDayMap(weekSingleDay);
  const weekBars     = computeMultiDayBars(weekIsosFull, weekMultiDay);
  const weekNumLanes = weekBars.length ? Math.max(...weekBars.map(b => b.lane)) + 1 : 0;

  // ── Navigation ─────────────────────────────────────────────────────────────
  const goPrevMonth = () => { if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); } else setViewMonth(m => m - 1); setSelectedDate(null); };
  const goNextMonth = () => { if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); } else setViewMonth(m => m + 1); setSelectedDate(null); };
  const goPrevWeek  = () => { setWeekStart(d => addDays(d, -7)); setSelectedDate(null); };
  const goNextWeek  = () => { setWeekStart(d => addDays(d, 7));  setSelectedDate(null); };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setWeekStart(getWeekStart(today));
    setSelectedDate(todayIso); // scroll agenda to today
  };

  const switchView = (v) => {
    setCalendarView(v);
    setSelectedDate(null);
    if (v === 'week') {
      const base = (viewYear === today.getFullYear() && viewMonth === today.getMonth()) ? today : new Date(viewYear, viewMonth, 1);
      setWeekStart(getWeekStart(base));
    } else {
      setViewYear(weekStart.getFullYear());
      setViewMonth(weekStart.getMonth());
    }
  };

  // ── Drag-and-drop ──────────────────────────────────────────────────────────
  const handleDragStart = (e, ev) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', (ev.sourceEvent || ev).id);
    setTimeout(() => { if (e.target) e.target.style.opacity = '0.4'; }, 0);
  };
  const handleDragEnd = (e) => { e.target.style.opacity = ''; setDragOverIso(null); };
  const handleDragOver = (e, iso) => { e.preventDefault(); e.dataTransfer.dropEffect = 'move'; if (dragOverIso !== iso) setDragOverIso(iso); };
  const handleDragLeave = (e) => { if (!e.currentTarget.contains(e.relatedTarget)) setDragOverIso(null); };
  const handleDrop = (e, iso) => {
    e.preventDefault(); setDragOverIso(null);
    const id = e.dataTransfer.getData('text/plain');
    if (id && onRescheduleEvent) onRescheduleEvent(id, iso);
  };

  // ── Agenda data ─────────────────────────────────────────────────────────────
  const isMonthView = calendarView === 'month';

  // Build all events for the agenda (multi-day + single-day)
  const buildAgendaEvents = (multiDay, singleDay) => {
    const all = [...multiDay, ...singleDay];
    return all.sort((a, b) => {
      const aS = a.startDate || a.date, bS = b.startDate || b.date;
      if (aS !== bS) return aS.localeCompare(bS);
      return (a.time || a.startHour || '').localeCompare(b.time || b.startHour || '');
    });
  };

  // For selected day, show all events (from both maps)
  const getEventsForDate = (iso) => {
    if (!iso) return [];
    const singleDayMap = isMonthView ? monthSingleByDate : weekSingleByDate;
    const multiDayEvs  = isMonthView ? monthMultiDay : weekMultiDay;
    const fromMulti    = multiDayEvs.filter(ev => {
      const s = ev.startDate || ev.date, e = ev.endDate || s;
      return iso >= s && iso <= e;
    });
    return [...fromMulti, ...(singleDayMap[iso] || [])].sort((a, b) =>
      (a.time || a.startHour || '').localeCompare(b.time || b.startHour || ''));
  };

  const allAgendaEvents = buildAgendaEvents(
    isMonthView ? monthMultiDay : weekMultiDay,
    isMonthView ? monthSingleDay : weekSingleDay
  );
  const agendaEvents = selectedDate ? getEventsForDate(selectedDate) : allAgendaEvents;

  const agendaTitle = selectedDate
    ? formatDateLong(selectedDate)
    : isMonthView
      ? `Agenda — ${MONTH_NAMES[viewMonth]} ${viewYear}`
      : `Agenda — Week of ${formatDateDisplay(weekStartIso)}`;

  // ── Icons ──────────────────────────────────────────────────────────────────
  const ChevronLeft  = getCalendarComponent('ChevronLeft');
  const ChevronRight = getCalendarComponent('ChevronRight');
  const CalendarIcon = getCalendarComponent('CalendarIcon');
  const Trash        = getCalendarComponent('Trash');
  const Plus         = getCalendarComponent('Plus');
  const UserIcon     = getCalendarComponent('UserIcon');
  const EmptyState   = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;

  // ── Week month label ───────────────────────────────────────────────────────
  const weekMonthLabel = (() => {
    const sm = weekDays[0].getMonth(), em = weekDays[6].getMonth();
    const sy = weekDays[0].getFullYear(), ey = weekDays[6].getFullYear();
    if (sy !== ey) return `${MONTH_NAMES[sm]} ${sy} – ${MONTH_NAMES[em]} ${ey}`;
    if (sm !== em) return `${MONTH_NAMES[sm]} – ${MONTH_NAMES[em]} ${sy}`;
    return `${MONTH_NAMES[sm]} ${sy}`;
  })();

  // ── Sub-components ─────────────────────────────────────────────────────────

  // Multi-day event bar (used in both month and week grid)
  const MultiDayBar = ({ bar }) => {
    const color     = bar.ev.color || DEFAULT_EVENT_COLOR;
    const evEndDate = bar.ev.endDate || bar.ev.date;
    const isPast    = evEndDate < todayIso;
    const isDraggable = !bar.ev.isRecurringOccurrence && Boolean(onRescheduleEvent);
    return (
      <div
        draggable={isDraggable}
        onDragStart={isDraggable ? (e) => handleDragStart(e, bar.ev) : undefined}
        onDragEnd={isDraggable ? handleDragEnd : undefined}
        onClick={(e) => { e.stopPropagation(); onEditEvent(bar.ev.sourceEvent || bar.ev); }}
        style={{
          gridColumn: `${bar.startCol + 1} / span ${bar.span}`,
          gridRow: bar.lane + 1,
          backgroundColor: color + (isPast ? '1a' : '30'),
          borderLeft: bar.continuesLeft ? 'none' : `3px solid ${color}`,
          borderTopLeftRadius:     bar.continuesLeft  ? 0 : 4,
          borderBottomLeftRadius:  bar.continuesLeft  ? 0 : 4,
          borderTopRightRadius:    bar.continuesRight ? 0 : 4,
          borderBottomRightRadius: bar.continuesRight ? 0 : 4,
          opacity: isPast ? 0.5 : 1,
          cursor: 'pointer',
          minWidth: 0,
        }}
        className={`flex items-center overflow-hidden px-1.5 text-[10px] font-semibold text-[#000000] transition hover:brightness-95 ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        title={bar.ev.title}
      >
        {bar.continuesLeft && <span className="mr-0.5 shrink-0 opacity-50 text-[8px]">◂</span>}
        {(bar.showTitle || bar.continuesLeft) && <span className="truncate">{bar.ev.title}</span>}
        {bar.continuesRight && <span className="ml-0.5 shrink-0 opacity-50 text-[8px]">▸</span>}
      </div>
    );
  };

  // Single-day event chip
  const EventChip = ({ ev }) => {
    const isTimed    = Boolean(ev.time || ev.startHour);
    const color      = ev.color || DEFAULT_EVENT_COLOR;
    const isPast     = (ev.endDate || ev.startDate || ev.date) < todayIso;
    const isDraggable = !ev.isRecurringOccurrence && Boolean(onRescheduleEvent);
    const chipStyle  = isTimed ? getTimedChipStyle(color) : getAllDayChipStyle(color);

    return (
      <div
        draggable={isDraggable}
        onDragStart={isDraggable ? (e) => handleDragStart(e, ev) : undefined}
        onDragEnd={isDraggable ? handleDragEnd : undefined}
        className={`flex items-center truncate px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[#000000] transition-opacity ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
        style={{ ...chipStyle, opacity: isPast ? 0.45 : 1 }}
        title={[ev.title, isTimed ? null : 'All day', formatRecurrence(ev)].filter(Boolean).join(' · ')}
      >
        {isTimed && <span className="mr-1 shrink-0 font-bold tabular-nums">{ev.startHour || ev.time}</span>}
        {ev.isRecurringOccurrence && <span className="mr-0.5 shrink-0 font-black opacity-60">↺</span>}
        <span className="truncate">{ev.title}</span>
        {ev.isPersonal && ev.createdByName && (
          <span
            className="ml-1 shrink-0 inline-flex h-3.5 w-3.5 items-center justify-center rounded-full text-[8px] font-black text-white"
            style={{ backgroundColor: color }}
            title={`Personal — ${ev.createdByName}`}
          >{getInitial(ev.createdByName)}</span>
        )}
      </div>
    );
  };

  // Day cell (for single-day events; multi-day bars rendered separately)
  const DayCell = ({ iso, dayLabel, dayEvents, isToday, isSelected, maxChips }) => {
    const isDragTarget = dragOverIso === iso;
    const visible  = dayEvents.slice(0, maxChips);
    const overflow = dayEvents.length - maxChips;

    return (
      <div
        className={`group relative min-w-0 flex flex-col rounded-lg border p-1 transition sm:p-1.5 ${
          isDragTarget
            ? 'border-[#E63B2E] bg-[#FFF0EE] ring-2 ring-[#E63B2E]/25'
            : isSelected
              ? 'border-[#E63B2E] bg-[#FFDAD4]/60'
              : isToday
                ? 'border-[#FFB4A9] bg-[#FFF8F5]'
                : 'border-[#E1D8D4] bg-white hover:border-[#FFB4A9] hover:bg-[#FFF8F5]'
        }`}
        onDragOver={onRescheduleEvent  ? (e) => handleDragOver(e, iso)  : undefined}
        onDragLeave={onRescheduleEvent ? handleDragLeave                 : undefined}
        onDrop={onRescheduleEvent      ? (e) => handleDrop(e, iso)      : undefined}
      >
        {/* Invisible clickable overlay for day selection */}
        <button
          onClick={() => setSelectedDate(isSelected ? null : iso)}
          className="absolute inset-0 z-0 rounded-lg"
          aria-label={`Select ${iso}`}
        />
        {/* Day number row */}
        <div className="relative z-10 flex items-start justify-between">
          <span className={`text-xs font-bold sm:text-sm ${
            isToday
              ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E63B2E] text-white'
              : isSelected ? 'text-[#E63B2E]' : 'text-[#000000]'
          }`}>{dayLabel}</span>
          {onAddForDate && (
            <button
              onClick={(e) => { e.stopPropagation(); onAddForDate(iso); }}
              className="hidden h-5 w-5 items-center justify-center rounded-full bg-[#E63B2E] text-white group-hover:flex"
              aria-label={`Add event on ${iso}`}
            ><Plus size={10} /></button>
          )}
        </div>
        {/* Desktop: single-day event chips */}
        <div className="relative z-10 mt-0.5 hidden flex-col gap-0.5 sm:flex" style={{ minHeight: 0, overflow: 'hidden' }}>
          {visible.map(ev => <EventChip key={ev.occurrenceKey || ev.id} ev={ev} />)}
        </div>
        {/* Overflow (desktop) — outside the clipping container so it's always visible */}
        {overflow > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); setSelectedDate(iso); }}
            className="relative z-10 mt-0.5 hidden self-start rounded px-1 text-[9px] font-bold text-[#E63B2E] transition hover:bg-[#FFDAD4] sm:block"
          >+{overflow} more</button>
        )}
        {/* Mobile: count badge */}
        {dayEvents.length > 0 && (
          <div className="relative z-10 mt-auto flex items-center justify-center pt-0.5 sm:hidden">
            {dayEvents.length === 1
              ? <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: dayEvents[0].color || DEFAULT_EVENT_COLOR }} />
              : <span className="text-[9px] font-black" style={{ color: dayEvents[0].color || DEFAULT_EVENT_COLOR }}>{dayEvents.length}</span>
            }
          </div>
        )}
      </div>
    );
  };

  // Bars + cells for a given week
  const WeekBarsAndCells = ({ weekIsos, bars, singleDayByDate, maxChips, weekView = false }) => {
    const numLanes = bars.length ? Math.max(...bars.map(b => b.lane)) + 1 : 0;
    return (
      <>
        {numLanes > 0 && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(7, minmax(0, 1fr))',
              gridTemplateRows: `repeat(${numLanes}, 22px)`,
              gap: '2px 4px',
              marginBottom: '2px',
            }}
          >
            {bars.map(bar => <MultiDayBar key={bar.key} bar={bar} />)}
          </div>
        )}
        <div className={`grid grid-cols-7 gap-1 ${weekView ? 'gap-y-0' : ''}`}>
          {weekIsos.map((iso, colIdx) => {
            if (!iso) return (
              <div
                key={`empty-${colIdx}`}
                className={weekView ? 'min-h-[80px] min-w-0 sm:min-h-[120px]' : 'min-h-[52px] min-w-0 sm:min-h-[60px]'}
              />
            );
            const dayNum   = parseInt(iso.split('-')[2], 10);
            const dayEvs   = singleDayByDate[iso] || [];
            const isToday  = iso === todayIso;
            const isSel    = iso === selectedDate;
            return (
              <DayCell
                key={iso}
                iso={iso}
                dayLabel={dayNum}
                dayEvents={dayEvs}
                isToday={isToday}
                isSelected={isSel}
                maxChips={maxChips}
              />
            );
          })}
        </div>
      </>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-2xl font-extrabold text-[#000000] sm:text-3xl">Shared Calendar</h2>
        <button
          type="button"
          onClick={onAddClick}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-xl bg-[#E63B2E] px-4 py-2.5 text-sm font-bold text-white shadow-md shadow-[#E63B2E]/25 transition hover:bg-[#CC302F]"
        >
          <Plus size={16} />
          Add Event
        </button>
      </div>
    <div className="grid min-w-0 w-full gap-4 sm:gap-6 lg:grid-cols-12">

      {/* Calendar section */}
      <section className="min-w-0 overflow-hidden rounded-2xl border border-[#E1D8D4] bg-white p-3 shadow-sm sm:p-6 lg:col-span-8">

        {/* Header */}
        <div className="mb-4 flex min-w-0 flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
          <div className="flex min-w-0 flex-wrap items-center justify-between gap-2 sm:gap-3">
            <h2 className="min-w-0 flex-1 text-xl font-extrabold text-[#000000] sm:flex-none sm:text-2xl">
              {isMonthView ? `${MONTH_NAMES[viewMonth]} ${viewYear}` : weekMonthLabel}
            </h2>
            <div className="flex shrink-0 items-center rounded-lg bg-[#FBF2ED] p-1">
              <button onClick={isMonthView ? goPrevMonth : goPrevWeek} className="flex h-11 w-11 items-center justify-center rounded text-[#000000] transition hover:bg-white hover:text-[#E63B2E]" aria-label={isMonthView ? 'Previous month' : 'Previous week'}>
                <ChevronLeft size={18} />
              </button>
              <button onClick={isMonthView ? goNextMonth : goNextWeek} className="flex h-11 w-11 items-center justify-center rounded text-[#000000] transition hover:bg-white hover:text-[#E63B2E]" aria-label={isMonthView ? 'Next month' : 'Next week'}>
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <div className="flex min-w-0 items-center gap-2">
            <div className="flex min-w-0 flex-1 rounded-lg border border-[#E1D8D4] bg-[#FBF2ED] p-0.5 sm:flex-none">
              <button onClick={() => switchView('month')} className={`min-h-[36px] rounded-md px-3 text-xs font-bold transition ${isMonthView ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#000000] hover:text-[#E63B2E]'}`}>Month</button>
              <button onClick={() => switchView('week')}  className={`min-h-[36px] rounded-md px-3 text-xs font-bold transition ${!isMonthView ? 'bg-white text-[#E63B2E] shadow-sm' : 'text-[#000000] hover:text-[#E63B2E]'}`}>Week</button>
            </div>
            <button onClick={goToday} className="min-h-[44px] rounded-lg border border-[#E1D8D4] bg-white px-3 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]">Today</button>
          </div>
        </div>

        {/* Weekday labels */}
        <div className="mb-2 grid min-w-0 grid-cols-7 gap-1">
          {WEEKDAY_LABELS.map(d => <div key={d} className="py-1 text-center text-xs font-bold uppercase tracking-wider text-[#000000] sm:text-sm">{d}</div>)}
        </div>

        {/* Month view */}
        {isMonthView && (
          <div className="min-w-0 space-y-2">
            {weeks.map((weekCells, wIdx) => {
              const weekIsos = weekCells.map((day, i) => day === null ? null : isoDateFromParts(viewYear, viewMonth, day));
              const validIsos = weekIsos.filter(Boolean);
              if (!validIsos.length) return null;
              const ws = validIsos[0], we = validIsos[validIsos.length - 1];
              // Multi-day events overlapping this week
              const wMulti = monthMultiDay.filter(ev => {
                const s = ev.startDate || ev.date, e = ev.endDate || s;
                return s <= we && e >= ws;
              });
              const wBars = computeMultiDayBars(weekIsos, wMulti);
              return (
                <div key={wIdx} className={wIdx > 0 ? 'border-t border-[#F0EAE7] pt-2' : ''}>
                  <WeekBarsAndCells
                    weekIsos={weekIsos}
                    bars={wBars}
                    singleDayByDate={monthSingleByDate}
                    maxChips={MONTH_MAX_CHIPS}
                  />
                </div>
              );
            })}
          </div>
        )}

        {/* Week view */}
        {!isMonthView && (
          <div>
            <WeekBarsAndCells
              weekIsos={weekIsosFull}
              bars={weekBars}
              singleDayByDate={weekSingleByDate}
              maxChips={WEEK_MAX_CHIPS}
              weekView
            />
          </div>
        )}

        {/* Legend */}
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[#E1D8D4] pt-3">
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#000000]">
            <span className="inline-block h-2.5 w-2.5" style={getTimedChipStyle(DEFAULT_EVENT_COLOR)} />Timed
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#000000]">
            <span className="inline-block h-2.5 w-4 rounded-full" style={getAllDayChipStyle(DEFAULT_EVENT_COLOR)} />All-day
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#000000]">
            <span className="inline-block h-2.5 w-8 rounded-sm" style={{ backgroundColor: DEFAULT_EVENT_COLOR + '30', borderLeft: `3px solid ${DEFAULT_EVENT_COLOR}` }} />Multi-day
          </span>
          <span className="flex items-center gap-1.5 text-[10px] font-medium text-[#000000] opacity-50">
            <span className="inline-block h-2.5 w-4 rounded-sm" style={{ backgroundColor: DEFAULT_EVENT_COLOR + '1a' }} />Past
          </span>
          {onRescheduleEvent && (
            <span className="flex items-center gap-1 text-[10px] font-medium text-[#000000]">
              <span className="text-[10px]">✥</span>Drag to move
            </span>
          )}
        </div>
      </section>

      {/* Agenda panel */}
      <section className="min-w-0 rounded-2xl border border-[#E1D8D4] bg-[#FFF8F5] p-4 shadow-sm sm:p-6 lg:col-span-4">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-[#000000] sm:text-xl">{agendaTitle}</h3>
          {selectedDate && (
            <button onClick={() => setSelectedDate(null)} className="shrink-0 text-xs font-bold text-[#E63B2E] transition hover:text-[#A9372C]">
              {isMonthView ? 'Show month' : 'Show week'}
            </button>
          )}
        </div>

        {agendaEvents.length === 0 ? (
          events.length === 0 ? (
            <EmptyState title="No events yet" message="Add a plan, reminder, or shared date." icon={CalendarIcon} compact />
          ) : (
            <EmptyState
              title={selectedDate ? 'No events this day' : isMonthView ? 'No events this month' : 'No events this week'}
              message="Try another date or add something new."
              icon={CalendarIcon} compact
            />
          )
        ) : (
          <ul className="space-y-3">
            {agendaEvents.map(ev => {
              const color   = ev.color || DEFAULT_EVENT_COLOR;
              const isTimed = Boolean(ev.time || ev.startHour);
              const evEnd   = ev.endDate || ev.startDate || ev.date;
              const isPast  = evEnd < todayIso;
              return (
                <li
                  key={ev.occurrenceKey || ev.id}
                  onClick={() => onEditEvent(ev.sourceEvent || ev)}
                  className={`group flex cursor-pointer gap-3 rounded-xl border border-[#E1D8D4] bg-white p-3 shadow-sm transition hover:border-[#E63B2E]/40 hover:shadow-md sm:p-4 ${isPast ? 'opacity-55' : ''}`}
                >
                  <div className="flex min-w-[60px] flex-col items-center justify-center rounded-lg px-2 py-1.5" style={getAgendaBadgeStyle(color)}>
                    <span className="text-xs font-bold tabular-nums text-[#000000]">{formatDateDisplay(ev.startDate || ev.date)}</span>
                    {ev.endDate && ev.endDate !== (ev.startDate || ev.date) && (
                      <span className="text-[9px] tabular-nums opacity-70 text-[#000000]">→ {formatDateDisplay(ev.endDate)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <h4 className="truncate font-bold text-[#000000]">{ev.title}</h4>
                          {ev.isPersonal && (
                            <span className="shrink-0 inline-flex items-center gap-0.5 rounded-full bg-[#FBF2ED] px-1.5 py-0.5 text-[9px] font-bold text-[#000000]">
                              <UserIcon size={8} />Personal
                            </span>
                          )}
                        </div>
                        {ev.isPersonal && ev.createdByName && (
                          <p className="mt-0.5 text-[10px] font-medium text-[#000000] opacity-60">{ev.createdByName}</p>
                        )}
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); const src = ev.sourceEvent || ev; onDeleteEvent(src.id, src); }}
                        className="shrink-0 flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
                        aria-label="Delete event"
                      ><Trash size={14} /></button>
                    </div>
                    {isTimed ? (
                      <p className="mt-0.5 text-sm font-medium text-[#000000]">
                        {ev.time ? ev.time : `${ev.startHour || ''}${ev.startHour && ev.endHour ? ' – ' : ''}${ev.endHour || ''}`}
                      </p>
                    ) : (
                      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide opacity-40 text-[#000000]">All day</p>
                    )}
                    {formatRecurrence(ev) && <p className="mt-1 text-xs font-bold uppercase tracking-wide text-[#000000] opacity-60">{formatRecurrence(ev)}</p>}
                    {ev.description && <p className="mt-2 whitespace-pre-wrap text-sm text-[#000000]">{ev.description}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
    </div>
  );
};

Object.assign(window, { CalendarView });
