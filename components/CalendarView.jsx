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

const CalendarView = ({ events, onDeleteEvent, onEditEvent }) => {
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
    : `Agenda - ${MONTH_NAMES[viewMonth]} ${viewYear}`;

  return (
    <div className="grid w-full gap-6 lg:grid-cols-12">
      {/* Calendar grid */}
      <section className="rounded-2xl border border-[#E1D8D4] bg-white p-4 shadow-sm sm:p-6 lg:col-span-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-extrabold text-[#410001] sm:text-2xl">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </h2>
            <div className="flex items-center rounded-lg bg-[#FBF2ED] p-1">
              <button onClick={goPrev} className="rounded p-1.5 text-[#534340] transition hover:bg-white hover:text-[#E63B2E]" aria-label="Previous month">
                <ChevronLeft size={18} />
              </button>
              <button onClick={goNext} className="rounded p-1.5 text-[#534340] transition hover:bg-white hover:text-[#E63B2E]" aria-label="Next month">
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
          <button
            onClick={goToday}
            className="rounded-lg border border-[#E1D8D4] bg-white px-3 py-1.5 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]"
          >
            Today
          </button>
        </div>

        {/* Weekday labels */}
        <div className="mb-2 grid grid-cols-7 gap-1 sm:gap-2">
          {WEEKDAY_LABELS.map(day => (
            <div key={day} className="py-1 text-center text-xs font-bold uppercase tracking-wider text-[#857370] sm:text-sm">{day}</div>
          ))}
        </div>

        {/* Day grid */}
        <div className="grid grid-cols-7 gap-1 sm:gap-2">
          {cells.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="aspect-square sm:aspect-auto sm:min-h-[88px]" />;
            }
            const iso = isoDateFromParts(viewYear, viewMonth, day);
            const dayEvents = eventsByDate[iso] || [];
            const isToday = iso === todayIso;
            const isSelected = iso === selectedDate;

            const handleDayClick = () => {
              if (isSelected) setSelectedDate(null);
              else setSelectedDate(iso);
            };

            return (
              <button
                key={iso}
                onClick={handleDayClick}
                className={`flex aspect-square flex-col rounded-lg border p-1.5 text-left transition sm:aspect-auto sm:min-h-[88px] sm:p-2 ${
                  isSelected
                    ? 'border-[#E63B2E] bg-[#FFDAD4]'
                    : isToday
                      ? 'border-[#FFB4A9] bg-[#FFF8F5]'
                      : 'border-[#E1D8D4] bg-white hover:border-[#FFB4A9] hover:bg-[#FFF8F5]'
                }`}
              >
                <span className={`text-xs font-bold sm:text-sm ${
                  isToday
                    ? 'inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#E63B2E] text-white'
                    : isSelected
                      ? 'text-[#410001]'
                      : 'text-[#241A18]'
                }`}>
                  {day}
                </span>
                <div className="mt-1 hidden flex-1 space-y-0.5 overflow-hidden sm:block">
                  {dayEvents.slice(0, 2).map(ev => (
                    <div
                      key={ev.id}
                      className="truncate rounded bg-[#FFDAD4] px-1.5 py-0.5 text-[10px] font-semibold leading-tight text-[#410001]"
                      title={ev.title}
                    >
                      {(ev.startHour || ev.time) && <span className="mr-1 font-bold">{ev.startHour || ev.time}</span>}
                      {ev.title}
                    </div>
                  ))}
                  {dayEvents.length > 2 && (
                    <div className="text-[10px] font-semibold text-[#857370]">+{dayEvents.length - 2} more</div>
                  )}
                </div>
                {dayEvents.length > 0 && (
                  <div className="mt-auto flex justify-center sm:hidden">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#E63B2E]"></span>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </section>

      {/* Agenda */}
      <section className="rounded-2xl border border-[#E1D8D4] bg-[#FFF8F5] p-4 shadow-sm sm:p-6 lg:col-span-4">
        <div className="mb-5 flex items-center justify-between gap-2">
          <h3 className="text-lg font-extrabold text-[#410001] sm:text-xl">{agendaTitle}</h3>
          {selectedDate && (
            <button
              onClick={() => setSelectedDate(null)}
              className="text-xs font-bold text-[#E63B2E] transition hover:text-[#A9372C]"
            >
              Show month
            </button>
          )}
        </div>

        {agendaEvents.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E1D8D4] bg-white py-10 text-center text-sm text-[#534340]">
            No activities {selectedDate ? 'for this day' : 'for this month'}.
          </div>
        ) : (
          <ul className="space-y-3">
            {agendaEvents.map(ev => (
              <li
                key={ev.id}
                onClick={() => onEditEvent(ev)}
                className="group flex cursor-pointer gap-3 rounded-xl border border-[#E1D8D4] bg-white p-3 shadow-sm transition hover:border-[#E63B2E]/40 hover:shadow-md sm:p-4"
              >
                <div className="flex min-w-[64px] flex-col items-center justify-center rounded-lg bg-[#FFDAD4] px-2 py-1.5 text-[#410001]">
                  <span className="text-xs font-bold tabular-nums">{formatDateDisplay(ev.startDate || ev.date)}</span>
                  {ev.endDate && ev.endDate !== (ev.startDate || ev.date) && (
                    <span className="text-[10px] tabular-nums opacity-80">→ {formatDateDisplay(ev.endDate)}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="truncate font-bold text-[#410001]">{ev.title}</h4>
                    <button
                      onClick={(e) => { e.stopPropagation(); onDeleteEvent(ev.id); }}
                      className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]"
                      aria-label="Delete event"
                    >
                      <Trash size={14} />
                    </button>
                  </div>
                  {(ev.time || ev.startHour || ev.endHour) && (
                    <p className="mt-0.5 text-sm font-medium text-[#534340]">
                      {ev.time ? ev.time : `${formatTime(ev.startHour)}${ev.startHour && ev.endHour ? ' – ' : ''}${formatTime(ev.endHour)}`}
                    </p>
                  )}
                  {ev.description && <p className="mt-2 whitespace-pre-wrap text-sm text-[#534340]">{ev.description}</p>}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

Object.assign(window, { CalendarView });
