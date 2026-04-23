const React = window.React;
const { useState } = React;

// ============================================================================
// CALENDAR VIEW COMPONENT
// ============================================================================

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

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
  return `${String(d).padStart(2, '0')}/${String(m).padStart(2, '0')}/${y} — ${date.toLocaleDateString(undefined, { weekday: 'long' })}`;
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

const exportEventsToICS = (events) => {
  const pad = (n) => String(n).padStart(2, '0');
  const icsDate = (iso) => iso.replace(/-/g, '');
  const icsDatetime = (iso, time) => {
    const [h, m] = (time || '00:00').split(':');
    return `${icsDate(iso)}T${pad(h)}${pad(m || '0')}00`;
  };
  const escape = (s) => (s || '').replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');

  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0',
    'PRODID:-//SharedShelf//Relationship Calendar//EN',
    'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
  ];

  events.forEach(ev => {
    const startIso = ev.startDate || ev.date;
    const endIso = ev.endDate || startIso;
    const hasTime = ev.time && ev.time !== 'none' && ev.time !== '';
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${ev.id}@shared-shelf`);
    lines.push(`SUMMARY:${escape(ev.title)}`);
    if (hasTime) {
      lines.push(`DTSTART:${icsDatetime(startIso, ev.time)}`);
      lines.push(`DTEND:${icsDatetime(endIso, ev.time)}`);
    } else {
      lines.push(`DTSTART;VALUE=DATE:${icsDate(startIso)}`);
      const endExclusive = new Date(endIso + 'T00:00:00');
      endExclusive.setDate(endExclusive.getDate() + 1);
      const endEx = `${endExclusive.getFullYear()}${pad(endExclusive.getMonth()+1)}${pad(endExclusive.getDate())}`;
      lines.push(`DTEND;VALUE=DATE:${endEx}`);
    }
    if (ev.description) lines.push(`DESCRIPTION:${escape(ev.description)}`);
    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');
  const blob = new Blob([lines.join('\r\n')], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'shared-shelf-calendar.ics';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

const CalendarView = ({ events, onDeleteEvent }) => {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  const cells = buildMonthGrid(viewYear, viewMonth);

  const eventsByDate = events.reduce((acc, ev) => {
    const start = ev.startDate || ev.date;
    const end = ev.endDate || start;
    const cur = new Date(start + 'T00:00:00');
    const endD = new Date(end + 'T00:00:00');
    while (cur <= endD) {
      const iso = cur.toISOString().split('T')[0];
      if (!acc[iso]) acc[iso] = [];
      acc[iso].push(ev);
      cur.setDate(cur.getDate() + 1);
    }
    return acc;
  }, {});

  Object.keys(eventsByDate).forEach(d => {
    eventsByDate[d].sort((a, b) => (a.startHour || '').localeCompare(b.startHour || ''));
  });

  const goPrev = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else { setViewMonth(m => m - 1); }
    setSelectedDate(null);
  };

  const goNext = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else { setViewMonth(m => m + 1); }
    setSelectedDate(null);
  };

  const goToday = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedDate(null);
  };

  const todayIso = isoDateFromParts(today.getFullYear(), today.getMonth(), today.getDate());
  const monthStart = isoDateFromParts(viewYear, viewMonth, 1);
  const monthEnd = isoDateFromParts(viewYear, viewMonth, new Date(viewYear, viewMonth + 1, 0).getDate());

  const monthEvents = events
    .filter(ev => {
      const start = ev.startDate || ev.date;
      const end = ev.endDate || start;
      return start <= monthEnd && end >= monthStart;
    })
    .sort((a, b) => {
      const aStart = a.startDate || a.date;
      const bStart = b.startDate || b.date;
      if (aStart !== bStart) return aStart.localeCompare(bStart);
      return (a.startHour || '').localeCompare(b.startHour || '');
    });

  const agendaEvents = selectedDate ? (eventsByDate[selectedDate] || []) : monthEvents;
  const agendaTitle = selectedDate
    ? formatDateLong(selectedDate)
    : `Agenda — ${MONTH_NAMES[viewMonth]} ${viewYear}`;

  return (
    <div>
      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 sm:p-6 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <button onClick={goPrev} className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors" aria-label="Previous month">
              <ChevronLeft size={20} />
            </button>
            <h3 className="text-lg sm:text-xl font-semibold text-white min-w-[180px] text-center">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h3>
            <button onClick={goNext} className="p-2 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors" aria-label="Next month">
              <ChevronRight size={20} />
            </button>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={goToday} className="px-3 py-1.5 text-sm bg-slate-800/60 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors">
              Today
            </button>
            <button
              onClick={() => exportEventsToICS(events)}
              className="px-3 py-1.5 text-sm bg-slate-800/60 hover:bg-slate-700 text-slate-200 rounded-lg transition-colors flex items-center gap-1.5"
              title="Export all events to Google Calendar / iCal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
              Export
            </button>
          </div>
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="text-center text-xs sm:text-sm font-medium text-slate-400 py-1">{day}</div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square sm:aspect-auto sm:min-h-[88px]" />;
            }
            const iso = isoDateFromParts(viewYear, viewMonth, day);
            const dayEvents = eventsByDate[iso] || [];
            const isToday = iso === todayIso;
            const isSelected = iso === selectedDate;
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(isSelected ? null : iso)}
                className={`text-left aspect-square sm:aspect-auto sm:min-h-[88px] p-1 sm:p-2 rounded-lg border transition-colors flex flex-col ${
                  isSelected ? 'border-purple-500 bg-purple-500/10' :
                  isToday ? 'border-purple-500/60 bg-slate-800/40 hover:bg-slate-800/70' :
                  'border-slate-700/60 bg-slate-800/20 hover:bg-slate-800/50'
                }`}
              >
                <span className={`text-xs sm:text-sm font-semibold ${isToday ? 'text-purple-300' : 'text-slate-200'}`}>{day}</span>
                <div className="mt-1 flex-1 overflow-hidden space-y-1 hidden sm:block">
                  {dayEvents.slice(0, 2).map(ev => (
                    <div key={ev.id} className="text-[10px] leading-tight px-1.5 py-0.5 rounded bg-purple-500/30 text-purple-100 truncate" title={ev.title}>
                      {(ev.startHour || ev.time) && <span className="font-medium mr-1">{ev.startHour || ev.time}</span>}
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && <div className="text-[10px] text-slate-400">+{dayEvents.length - 2} more</div>}
                </div>
                {dayEvents.length > 0 && (
                  <div className="sm:hidden flex justify-center mt-auto">
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="bg-slate-900/50 border border-slate-700 rounded-2xl p-4 sm:p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-white">{agendaTitle}</h3>
          {selectedDate && (
            <button onClick={() => setSelectedDate(null)} className="text-sm text-slate-400 hover:text-white transition-colors">
              Show month
            </button>
          )}
        </div>

        {agendaEvents.length === 0 ? (
          <p className="text-slate-500 text-sm py-6 text-center">
            No activities {selectedDate ? 'for this day' : 'for this month'}.
          </p>
        ) : (
          <ul className="space-y-3">
            {agendaEvents.map(ev => (
              <li key={ev.id} className="flex gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-slate-800/40 border border-slate-700/50">
                <div className="flex flex-col items-center justify-center min-w-[64px] px-2 py-1 rounded-lg bg-purple-500/20 border border-purple-500/30">
                  <span className="text-xs text-purple-300 font-medium tabular-nums">{formatDateDisplay(ev.startDate || ev.date)}</span>
                  {ev.endDate && ev.endDate !== (ev.startDate || ev.date) && (
                    <span className="text-xs text-purple-400 tabular-nums">→ {formatDateDisplay(ev.endDate)}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-semibold text-white truncate">{ev.title}</h4>
                    <button
                      onClick={() => onDeleteEvent(ev.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-slate-700/50 transition-colors"
                      aria-label="Delete event"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  {(ev.time || ev.startHour || ev.endHour) && (
                    <p className="text-sm text-slate-400 mt-0.5">
                      {ev.time ? ev.time : `${formatTime(ev.startHour)}${ev.startHour && ev.endHour ? ' – ' : ''}${formatTime(ev.endHour)}`}
                    </p>
                  )}
                  {ev.description && <p className="text-sm text-slate-300 mt-2 whitespace-pre-wrap">{ev.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

Object.assign(window, { CalendarView });
