const React = window.React;
const { useState, useMemo } = React;
const getTaskComponent = (name) => window.getWindowComponent?.(name, window.MissingIcon) || window.MissingIcon;

const todayLocalIso = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const TASK_RECURRENCE_OPTIONS = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

const TASK_RECURRENCE_LABELS = TASK_RECURRENCE_OPTIONS.reduce((labels, option) => ({
  ...labels,
  [option.value]: option.label
}), {});

const getTaskRecurrenceFrequency = (task = {}) => {
  const frequency = task.taskRecurrenceFrequency || task.recurrence?.frequency || task.recurrence || 'weekly';
  return TASK_RECURRENCE_LABELS[frequency] ? frequency : 'weekly';
};

const isRecurringTask = (task = {}) => Boolean(task.recurrence);

const isSameLocalDay = (isoDate) => {
  if (!isoDate) return false;
  const date = new Date(isoDate);
  if (Number.isNaN(date.getTime())) return false;
  const today = new Date();
  return date.getFullYear() === today.getFullYear()
    && date.getMonth() === today.getMonth()
    && date.getDate() === today.getDate();
};

const formatTaskDate = (value) => {
  if (!value) return '';
  const datePart = String(value).split('T')[0];
  return datePart.split('-').reverse().join('/');
};

// ============================================================================
// TASKS VIEW COMPONENT
// ============================================================================

const TasksView = ({ tasks, onToggleTask, onDeleteTask, onUpdateTask, onReorderTasks, onAddClick, profile }) => {
  const [filter, setFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '', isRecurring: false, taskRecurrenceFrequency: 'weekly' });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const users = profile?.users || [];
  const getUserById = (id) => users.find(u => u.id === id);

  const sortedTasks = useMemo(() => [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  }), [tasks]);

  const sortedIndexById = useMemo(() => {
    const map = new Map();
    sortedTasks.forEach((task, idx) => map.set(task.id, idx));
    return map;
  }, [sortedTasks]);

  const activeTasks = useMemo(() => sortedTasks.filter(t => !t.completed), [sortedTasks]);
  const completedTasks = useMemo(() => sortedTasks.filter(t => t.completed), [sortedTasks]);
  const activeCnt = activeTasks.length;
  const todayIso = todayLocalIso();
  const FilterButton = window.getWindowComponent?.('FilterButton', window.MissingComponent) || window.MissingComponent;
  const EmptyState = window.getWindowComponent?.('EmptyState', window.MissingComponent) || window.MissingComponent;
  const CheckSquare = getTaskComponent('CheckSquare');
  const Trash = getTaskComponent('Trash');

  const handleEditTask = (task) => {
    setEditingTask(task.id);
    setEditForm({
      title: task.title,
      description: task.description || '',
      isRecurring: isRecurringTask(task),
      taskRecurrenceFrequency: getTaskRecurrenceFrequency(task)
    });
  };

  const handleSaveEdit = (taskId) => {
    if (!editForm.title.trim()) return;
    onUpdateTask?.(taskId, {
      title: editForm.title.trim(),
      description: editForm.description.trim(),
      recurrence: editForm.isRecurring ? { frequency: getTaskRecurrenceFrequency(editForm) } : null,
      ...(editForm.isRecurring ? {} : { lastCompletedAt: null, completionCount: 0 })
    });
    setEditingTask(null);
    setEditForm({ title: '', description: '', isRecurring: false, taskRecurrenceFrequency: 'weekly' });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditForm({ title: '', description: '', isRecurring: false, taskRecurrenceFrequency: 'weekly' });
  };

  // Reorders operate on the original `tasks` array (source order),
  // not the display-sorted copy, so completed tasks aren't pushed to the bottom of source state.
  const swapById = (idA, idB) => {
    const next = [...tasks];
    const a = next.findIndex(t => t.id === idA);
    const b = next.findIndex(t => t.id === idB);
    if (a < 0 || b < 0) return;
    [next[a], next[b]] = [next[b], next[a]];
    onReorderTasks?.(next);
  };

  const moveBeforeById = (sourceId, targetId) => {
    const next = [...tasks];
    const from = next.findIndex(t => t.id === sourceId);
    if (from < 0) return;
    const [moved] = next.splice(from, 1);
    const to = next.findIndex(t => t.id === targetId);
    if (to < 0) { next.splice(from, 0, moved); return; }
    next.splice(to, 0, moved);
    onReorderTasks?.(next);
  };

  const handleMoveTask = (indexInSorted, direction) => {
    const newIndex = direction === 'up' ? indexInSorted - 1 : indexInSorted + 1;
    if (newIndex < 0 || newIndex >= sortedTasks.length) return;
    const task = sortedTasks[indexInSorted];
    const targetTask = sortedTasks[newIndex];
    if (task.completed !== targetTask.completed) return;
    swapById(task.id, targetTask.id);
  };

  const handleDragStart = (e, indexInSorted) => {
    setDraggedIndex(indexInSorted);
    e.dataTransfer.effectAllowed = 'move';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndexInSorted) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndexInSorted) return;
    const draggedTask = sortedTasks[draggedIndex];
    const targetTask = sortedTasks[dropIndexInSorted];
    if (!draggedTask || !targetTask) { setDraggedIndex(null); return; }
    if (draggedTask.completed !== targetTask.completed) { setDraggedIndex(null); return; }
    moveBeforeById(draggedTask.id, targetTask.id);
    setDraggedIndex(null);
  };

  const handleDragEnd = (e) => {
    if (e.currentTarget && e.currentTarget.style) e.currentTarget.style.opacity = '';
    setDraggedIndex(null);
  };

  const renderTaskItem = (task, indexInSorted) => {
    const assignedUser = getUserById(task.assignedTo);
    const assignedUserName = assignedUser?.name || assignedUser?.username || 'User';
    const isOverdue = task.dueDate && !task.completed && task.dueDate < todayIso;
    const taskIsRecurring = isRecurringTask(task);
    const completedThisOccurrence = taskIsRecurring ? isSameLocalDay(task.lastCompletedAt) : Boolean(task.completed);
    const recurrenceLabel = taskIsRecurring ? `Repeats ${TASK_RECURRENCE_LABELS[getTaskRecurrenceFrequency(task)].toLowerCase()}` : '';
    const lastCompletedLabel = taskIsRecurring && task.lastCompletedAt
      ? (completedThisOccurrence ? 'Done today' : `Last done ${formatTaskDate(task.lastCompletedAt)}`)
      : '';

    return (
      <div
        key={task.id}
        draggable={editingTask !== task.id}
        onDragStart={(e) => handleDragStart(e, indexInSorted)}
        onDragOver={handleDragOver}
        onDrop={(e) => handleDrop(e, indexInSorted)}
        onDragEnd={handleDragEnd}
        className={`group rounded-2xl border bg-white shadow-sm transition ${
          task.completed
            ? 'border-[#E1D8D4] opacity-70'
            : 'border-[#E1D8D4] hover:border-[#FFB4A9] hover:shadow-md'
        } ${draggedIndex === indexInSorted ? 'opacity-50' : ''}`}
      >
        <div className="flex items-start gap-3 p-4">
          {editingTask === task.id ? (
            <div className="flex-1 space-y-3">
              <input
                type="text"
                value={editForm.title}
                onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#000000] placeholder-[#000000] outline-none transition focus:border-[#E63B2E]"
                placeholder="Task title"
                autoFocus
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#000000] placeholder-[#000000] outline-none transition focus:border-[#E63B2E]"
                placeholder="Description (optional)"
                rows="2"
              />
              <div className="space-y-3 rounded-xl border border-[#E1D8D4] bg-[#FFF8F5] p-3">
                <label className="flex min-h-[44px] items-center gap-2 text-sm font-bold text-[#000000]">
                  <input
                    type="checkbox"
                    checked={editForm.isRecurring}
                    onChange={(e) => setEditForm({
                      ...editForm,
                      isRecurring: e.target.checked,
                      taskRecurrenceFrequency: e.target.checked ? getTaskRecurrenceFrequency(editForm) : 'weekly'
                    })}
                    className="h-4 w-4 rounded border-[#D8C2BE] accent-[#E63B2E]"
                  />
                  Recurring task
                </label>
                {editForm.isRecurring && (
                  <>
                    <div className="space-y-1.5">
                      <label className="block text-xs font-bold uppercase tracking-wide text-[#000000]">Repeat every</label>
                      <select
                        value={getTaskRecurrenceFrequency(editForm)}
                        onChange={(e) => setEditForm({ ...editForm, taskRecurrenceFrequency: e.target.value })}
                        className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#000000] outline-none transition focus:border-[#E63B2E]"
                      >
                        {TASK_RECURRENCE_OPTIONS.map(option => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </div>
                    <p className="text-xs font-medium text-[#000000]">
                      Checking a recurring task records one completed occurrence and keeps it active.
                    </p>
                  </>
                )}
              </div>
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(task.id); }} className="min-h-[44px] rounded-lg bg-[#E63B2E] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#CC302F]">Save</button>
                <button onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} className="min-h-[44px] rounded-lg border border-[#E1D8D4] bg-white px-4 py-2 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5]">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <label className="mt-0.5 flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center">
                <span className="sr-only">{taskIsRecurring ? 'Mark current recurring task occurrence complete' : 'Mark task complete'}</span>
                <input
                  type="checkbox"
                  checked={completedThisOccurrence}
                  onChange={(e) => { e.stopPropagation(); onToggleTask(task.id, e.target.checked); }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 cursor-pointer rounded border-[#D8C2BE] accent-[#E63B2E]"
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className={`line-clamp-2 font-bold leading-snug ${task.completed ? 'text-[#000000] line-through' : 'text-[#000000]'}`} title={task.title}>
                  {task.title}
                </p>
                {task.description && (
                  <p className={`mt-1 line-clamp-3 whitespace-pre-wrap break-words text-sm ${task.completed ? 'text-[#A89A95]' : 'text-[#000000]'}`} title={task.description}>
                    {task.description}
                  </p>
                )}
                {(assignedUser || task.dueDate) && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {assignedUser && (
                      <span className="inline-flex min-w-0 max-w-full items-center gap-1.5 text-xs font-bold" style={{ color: assignedUser.color }} title={assignedUserName}>
                        <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: assignedUser.color }}>
                          {assignedUserName.charAt(0)}
                        </span>
                        <span className="truncate">{assignedUserName}</span>
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-[#C1121F]' : 'text-[#000000]'}`}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {isOverdue ? 'Overdue · ' : ''}{task.dueDate.split('-').reverse().join('/')}
                      </span>
                    )}
                  </div>
                )}
                {(recurrenceLabel || lastCompletedLabel) && (
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {recurrenceLabel && (
                      <span className="inline-flex items-center rounded-full bg-[#FFF0EE] px-2 py-1 text-xs font-bold text-[#A9372C]">
                        {recurrenceLabel}
                      </span>
                    )}
                    {lastCompletedLabel && (
                      <span className="inline-flex items-center rounded-full bg-[#EAF7EF] px-2 py-1 text-xs font-bold text-[#2F6B47]">
                        {lastCompletedLabel}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 flex-col items-center gap-1 opacity-100 transition sm:flex-row sm:opacity-0 sm:group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                {!task.completed && (
                  <>
                    <button
                      onClick={() => handleMoveTask(indexInSorted, 'up')}
                      disabled={indexInSorted === 0 || sortedTasks[indexInSorted - 1]?.completed}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label="Move up"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      onClick={() => handleMoveTask(indexInSorted, 'down')}
                      disabled={indexInSorted === sortedTasks.length - 1 || sortedTasks[indexInSorted + 1]?.completed}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label="Move down"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </>
                )}
                <button onClick={() => handleEditTask(task)} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Edit task">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => onDeleteTask(task.id)} className="flex h-11 w-11 items-center justify-center rounded-lg text-[#000000] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]" aria-label="Delete task">
                  <Trash size={16} />
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-extrabold text-[#000000] sm:text-3xl">Tasks</h2>
          {tasks.length > 0 && (
            <p className="mt-1 text-sm font-medium text-[#000000]">
              {activeCnt} remaining · {tasks.length - activeCnt} done
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <FilterButton label="All"       isActive={filter === 'all'}       onClick={() => setFilter('all')} />
          <FilterButton label="Active"    isActive={filter === 'active'}    onClick={() => setFilter('active')} />
          <FilterButton label="Completed" isActive={filter === 'completed'} onClick={() => setFilter('completed')} />
        </div>
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          title="No tasks yet"
          message="Capture the next shared to-do."
          actionLabel="Add task"
          icon={CheckSquare}
          onAddClick={onAddClick}
        />
      ) : (
        <>
          {filter !== 'completed' && activeTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E1D8D4] bg-white py-10 text-center text-sm text-[#000000]">
              No active tasks.
            </div>
          )}

          {filter !== 'completed' && activeTasks.length > 0 && (
            <div className="space-y-2">
              {activeTasks.map(task => {
                const idx = sortedIndexById.get(task.id);
                return renderTaskItem(task, idx);
              })}
            </div>
          )}

          {(filter === 'all' || filter === 'completed') && completedTasks.length > 0 && (
            <div className="space-y-2">
              {filter === 'all' ? (
                <>
                  <button
                    onClick={() => setShowCompleted(!showCompleted)}
                    className="flex min-h-[44px] w-full items-center justify-between rounded-2xl border border-[#E1D8D4] bg-white px-4 py-2.5 text-sm font-bold text-[#000000] transition hover:bg-[#FFF8F5] hover:text-[#000000]"
                  >
                    <span>Completed ({completedTasks.length})</span>
                    <svg
                      className={`h-5 w-5 transition-transform ${showCompleted ? 'rotate-180' : ''}`}
                      fill="none" viewBox="0 0 24 24" stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                  {showCompleted && (
                    <div className="space-y-2">
                      {completedTasks.map(task => {
                        const idx = sortedIndexById.get(task.id);
                        return renderTaskItem(task, idx);
                      })}
                    </div>
                  )}
                </>
              ) : (
                completedTasks.map(task => {
                  const idx = sortedIndexById.get(task.id);
                  return renderTaskItem(task, idx);
                })
              )}
            </div>
          )}

          {filter === 'completed' && completedTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E1D8D4] bg-white py-10 text-center text-sm text-[#000000]">
              No completed tasks.
            </div>
          )}
        </>
      )}
    </div>
  );
};

Object.assign(window, { TasksView });
