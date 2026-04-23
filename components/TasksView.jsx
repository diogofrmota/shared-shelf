const React = window.React;
const { useState } = React;

// ============================================================================
// TASKS VIEW COMPONENT
// ============================================================================

const TasksView = ({ tasks, onToggleTask, onDeleteTask, onUpdateTask, onReorderTasks, onAddClick, profile }) => {
  const [filter, setFilter] = useState('all');
  const [editingTask, setEditingTask] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);
  const [editForm, setEditForm] = useState({ title: '', description: '' });
  const [draggedIndex, setDraggedIndex] = useState(null);

  const users = profile?.users || [];
  const getUserById = (id) => users.find(u => u.id === id);

  const sortedTasks = [...tasks].sort((a, b) => {
    if (a.completed === b.completed) return 0;
    return a.completed ? 1 : -1;
  });

  const filteredTasks = sortedTasks.filter(task => {
    if (filter === 'active') return !task.completed;
    if (filter === 'completed') return task.completed;
    return true;
  });

  const activeCnt = tasks.filter(t => !t.completed).length;

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

  const handleMoveTask = (index, direction) => {
    const currentTasks = [...sortedTasks];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= currentTasks.length) return;
    const task = currentTasks[index];
    const targetTask = currentTasks[newIndex];
    if (task.completed !== targetTask.completed) return;
    [currentTasks[index], currentTasks[newIndex]] = [currentTasks[newIndex], currentTasks[index]];
    onReorderTasks?.(currentTasks);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.target.style.opacity = '0.5';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, dropIndex) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) return;
    const currentTasks = [...sortedTasks];
    const draggedTask = currentTasks[draggedIndex];
    const targetTask = currentTasks[dropIndex];
    if (draggedTask.completed !== targetTask.completed) return;
    currentTasks.splice(draggedIndex, 1);
    currentTasks.splice(dropIndex, 0, draggedTask);
    onReorderTasks?.(currentTasks);
    setDraggedIndex(null);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '';
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Tasks</h2>
          {tasks.length > 0 && (
            <p className="text-slate-400 text-sm mt-0.5">
              {activeCnt} remaining · {tasks.length - activeCnt} done
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <FilterButton label="All"       isActive={filter === 'all'}       onClick={() => setFilter('all')} />
          <FilterButton label="Active"    isActive={filter === 'active'}    onClick={() => setFilter('active')} />
          <FilterButton label="Completed" isActive={filter === 'completed'} onClick={() => setFilter('completed')} />
        </div>
      </div>

      {filteredTasks.length === 0 ? (
        tasks.length === 0 ? (
          <EmptyState onAddClick={onAddClick} />
        ) : (
          <div className="text-center py-12 text-slate-500 bg-slate-900/30 border border-slate-800 rounded-2xl">
            No tasks match this filter.
          </div>
        )
      ) : (
        <div className="space-y-2">
          {filteredTasks.map((task, index) => {
            const assignedUser = getUserById(task.assignedTo);
            const isSelected = selectedTask === task.id;
            const isOverdue = task.dueDate && !task.completed && task.dueDate < new Date().toISOString().split('T')[0];
            return (
              <div
                key={task.id}
                draggable={editingTask !== task.id}
                onDragStart={(e) => handleDragStart(e, index)}
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                className={`rounded-xl border transition-all duration-200 ${
                  task.completed
                    ? 'bg-slate-900/30 border-slate-800'
                    : isSelected
                      ? 'bg-slate-800/70 border-purple-500 shadow-lg shadow-purple-900/20'
                      : 'bg-slate-800/50 border-slate-700 hover:border-purple-500/50'
                } ${draggedIndex === index ? 'opacity-50' : ''}`}
              >
                <div
                  className={`flex items-start gap-3 p-4 ${!task.completed ? 'cursor-pointer' : ''}`}
                  onClick={() => !task.completed && editingTask !== task.id && setSelectedTask(isSelected ? null : task.id)}
                >
                  {editingTask === task.id ? (
                    <div className="flex-1 space-y-3">
                      <input
                        type="text"
                        value={editForm.title}
                        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        placeholder="Task title"
                        autoFocus
                      />
                      <textarea
                        value={editForm.description}
                        onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-purple-500"
                        placeholder="Description (optional)"
                        rows="2"
                      />
                      <div className="flex gap-2">
                        <button onClick={(e) => { e.stopPropagation(); handleSaveEdit(task.id); }} className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors">Save</button>
                        <button onClick={(e) => { e.stopPropagation(); handleCancelEdit(); }} className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-sm font-medium transition-colors">Cancel</button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        type="checkbox"
                        checked={task.completed || false}
                        onChange={(e) => { e.stopPropagation(); onToggleTask(task.id); }}
                        onClick={(e) => e.stopPropagation()}
                        className="mt-1 w-4 h-4 rounded border-slate-600 accent-purple-500 cursor-pointer shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold leading-snug ${task.completed ? 'text-slate-500 line-through' : 'text-white'}`}>
                          {task.title}
                        </p>
                        {task.description && (
                          <p className={`text-sm mt-1 whitespace-pre-wrap ${task.completed ? 'text-slate-600' : 'text-slate-400'}`}>
                            {task.description}
                          </p>
                        )}
                        {(assignedUser || task.dueDate) && (
                          <div className="flex items-center gap-3 mt-2 flex-wrap">
                            {assignedUser && (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: assignedUser.color }}>
                                <span className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: assignedUser.color }}>
                                  {assignedUser.name.charAt(0)}
                                </span>
                                {assignedUser.name}
                              </span>
                            )}
                            {task.dueDate && (
                              <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-red-400' : 'text-slate-400'}`}>
                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                                {isOverdue ? 'Overdue · ' : ''}{task.dueDate.split('-').reverse().join('/')}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1 shrink-0" onClick={e => e.stopPropagation()}>
                        {!task.completed && (
                          <>
                            <button onClick={() => handleMoveTask(index, 'up')} disabled={index === 0 || filteredTasks[index - 1]?.completed} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500" aria-label="Move up">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" /></svg>
                            </button>
                            <button onClick={() => handleMoveTask(index, 'down')} disabled={index === filteredTasks.length - 1 || filteredTasks[index + 1]?.completed} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-slate-500" aria-label="Move down">
                              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                            </button>
                          </>
                        )}
                        <button onClick={() => handleEditTask(task)} className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-700/50 transition-colors" aria-label="Edit task">
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                        </button>
                        <button onClick={() => onDeleteTask(task.id)} className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-slate-700/50 transition-colors" aria-label="Delete task">
                          <Trash size={15} />
                        </button>
                      </div>
                    </>
                  )}
                </div>

                {isSelected && !task.completed && editingTask !== task.id && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={(e) => { e.stopPropagation(); onToggleTask(task.id); setSelectedTask(null); }}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                      Mark as Completed
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

Object.assign(window, { TasksView });
