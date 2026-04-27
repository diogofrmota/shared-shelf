const React = window.React;
const { useState } = React;

// ============================================================================
// TASKS VIEW COMPONENT
// ============================================================================

const TasksView = ({ tasks, onToggleTask, onDeleteTask, onUpdateTask, onReorderTasks, onAddClick, profile }) => {
  const [filter, setFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showCompleted, setShowCompleted] = useState(false);

  const users = profile?.users || [];
  const getUserById = (id) => users.find(u => u.id === id);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const activeTasks = sortedTasks.filter(t => !t.completed);
  const completedTasks = sortedTasks.filter(t => t.completed);
  const activeCnt = activeTasks.length;

  const handleEditTask = (task) => {
    setEditingTask(task.id);
    setEditForm({ title: task.title, description: task.description || '' });
  };

  const handleSaveEdit = (taskId) => {
    if (!editForm.title.trim()) return;
    onUpdateTask?.(taskId, editForm.title.trim(), editForm.description.trim());
    setEditingTask(null);
    setEditForm({ title: '', description: '' });
  };

  const handleCancelEdit = () => {
    setEditingTask(null);
    setEditForm({ title: '', description: '' });
  };

  const handleMoveTask = (indexInSorted, direction) => {
    const currentTasks = [...sortedTasks];
    const newIndex = direction === 'up' ? indexInSorted - 1 : indexInSorted + 1;
    if (newIndex < 0 || newIndex >= currentTasks.length) return;
    const task = currentTasks[indexInSorted];
    const targetTask = currentTasks[newIndex];
    if (task.completed !== targetTask.completed) return;
    [currentTasks[indexInSorted], currentTasks[newIndex]] = [currentTasks[newIndex], currentTasks[indexInSorted]];
    onReorderTasks?.(currentTasks);
  };

  const handleDragStart = (e, indexInSorted) => {
    setDraggedIndex(indexInSorted);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndexInSorted) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndexInSorted) return;
    const currentTasks = [...sortedTasks];
    const draggedTask = currentTasks[draggedIndex];
    const targetTask = currentTasks[dropIndexInSorted];
    if (draggedTask.completed !== targetTask.completed) return;
    currentTasks.splice(draggedIndex, 1);
    currentTasks.splice(dropIndexInSorted, 0, draggedTask);
    onReorderTasks?.(currentTasks);
    setDraggedIndex(null);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDraggedIndex(null);
  };

  const renderTaskItem = (task, indexInSorted) => {
    const assignedUser = getUserById(task.assignedTo);
    const isOverdue = task.dueDate && !task.completed && task.dueDate < new Date().toISOString().split('T')[0];

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
                className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]"
                placeholder="Task title"
                autoFocus
              />
              <textarea
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="w-full rounded-lg border border-[#E1D8D4] bg-white px-3 py-2 text-[#241A18] placeholder-[#857370] outline-none transition focus:border-[#E63B2E]"
                placeholder="Description (optional)"
                rows="2"
              />
              <div className="flex gap-2">
                <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(task.id); }} className="rounded-lg bg-[#E63B2E] px-4 py-2 text-sm font-bold text-white transition hover:bg-[#A9372C]">Save</button>
                <button onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} className="rounded-lg border border-[#E1D8D4] bg-white px-4 py-2 text-sm font-bold text-[#410001] transition hover:bg-[#FFF8F5]">Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <label className="mt-0.5 flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center">
                <span className="sr-only">Mark task complete</span>
                <input
                  type="checkbox"
                  checked={task.completed || false}
                  onChange={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="h-5 w-5 cursor-pointer rounded border-[#D8C2BE] accent-[#E63B2E]"
                />
              </label>
              <div className="min-w-0 flex-1">
                <p className={`font-bold leading-snug ${task.completed ? 'text-[#857370] line-through' : 'text-[#410001]'}`}>
                  {task.title}
                </p>
                {task.description && (
                  <p className={`mt-1 whitespace-pre-wrap text-sm ${task.completed ? 'text-[#A89A95]' : 'text-[#534340]'}`}>
                    {task.description}
                  </p>
                )}
                {(assignedUser || task.dueDate) && (
                  <div className="mt-2 flex flex-wrap items-center gap-3">
                    {assignedUser && (
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold" style={{ color: assignedUser.color }}>
                        <span className="flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold text-white" style={{ backgroundColor: assignedUser.color }}>
                          {assignedUser.name.charAt(0)}
                        </span>
                        {assignedUser.name}
                      </span>
                    )}
                    {task.dueDate && (
                      <span className={`flex items-center gap-1 text-xs font-medium ${isOverdue ? 'text-[#C1121F]' : 'text-[#534340]'}`}>
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        {isOverdue ? 'Overdue · ' : ''}{task.dueDate.split('-').reverse().join('/')}
                      </span>
                    )}
                  </div>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1 opacity-0 transition group-hover:opacity-100" onClick={e => e.stopPropagation()}>
                {!task.completed && (
                  <>
                    <button
                      onClick={() => handleMoveTask(indexInSorted, 'up')}
                      disabled={indexInSorted === 0 || sortedTasks[indexInSorted - 1]?.completed}
                      className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label="Move up"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                    </button>
                    <button
                      onClick={() => handleMoveTask(indexInSorted, 'down')}
                      disabled={indexInSorted === sortedTasks.length - 1 || sortedTasks[indexInSorted + 1]?.completed}
                      className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                      aria-label="Move down"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                  </>
                )}
                <button onClick={() => handleEditTask(task)} className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFF8F5] hover:text-[#E63B2E]" aria-label="Edit task">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                </button>
                <button onClick={() => onDeleteTask(task.id)} className="rounded-lg p-1.5 text-[#857370] transition hover:bg-[#FFDAD4] hover:text-[#C1121F]" aria-label="Delete task">
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
          <h2 className="text-2xl font-extrabold text-[#410001] sm:text-3xl">Tasks</h2>
          {tasks.length > 0 && (
            <p className="mt-1 text-sm font-medium text-[#534340]">
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
        <EmptyState onAddClick={onAddClick} />
      ) : (
        <>
          {filter !== 'completed' && activeTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E1D8D4] bg-white py-10 text-center text-sm text-[#534340]">
              No active tasks.
            </div>
          )}

          {filter !== 'completed' && activeTasks.length > 0 && (
            <div className="space-y-2">
              {activeTasks.map(task => {
                const idx = sortedTasks.indexOf(task);
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
                    className="flex w-full items-center justify-between rounded-2xl border border-[#E1D8D4] bg-white px-4 py-2.5 text-sm font-bold text-[#534340] transition hover:bg-[#FFF8F5] hover:text-[#410001]"
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
                        const idx = sortedTasks.indexOf(task);
                        return renderTaskItem(task, idx);
                      })}
                    </div>
                  )}
                </>
              ) : (
                completedTasks.map(task => {
                  const idx = sortedTasks.indexOf(task);
                  return renderTaskItem(task, idx);
                })
              )}
            </div>
          )}

          {filter === 'completed' && completedTasks.length === 0 && (
            <div className="rounded-2xl border border-dashed border-[#E1D8D4] bg-white py-10 text-center text-sm text-[#534340]">
              No completed tasks.
            </div>
          )}
        </>
      )}
    </div>
  );
};

Object.assign(window, { TasksView });
