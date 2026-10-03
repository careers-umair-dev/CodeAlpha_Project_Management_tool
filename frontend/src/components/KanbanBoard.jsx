import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import TaskCard from './TaskCard';

const COLUMNS = ['To Do', 'In Progress', 'Review', 'Completed'];

const columnAccent = {
  'To Do': 'bg-ink-300',
  'In Progress': 'bg-blue-400',
  Review: 'bg-amber-400',
  Completed: 'bg-moss-500',
};

const QuickAddRow = ({ status, onSubmit, onCancel }) => {
  const [title, setTitle] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onSubmit(status, title.trim());
    setTitle('');
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-lg border border-ink-200 bg-white p-2.5">
      <input
        autoFocus
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Escape') onCancel();
        }}
        placeholder="Task title…"
        className="w-full border-none bg-transparent text-sm text-ink-800 outline-none placeholder-ink-400"
        maxLength={150}
      />
      <div className="mt-2 flex items-center gap-2">
        <button type="submit" className="btn-primary !px-2.5 !py-1 text-xs" disabled={!title.trim()}>
          Add
        </button>
        <button type="button" onClick={onCancel} className="btn-ghost !px-2.5 !py-1 text-xs">
          <X size={13} />
        </button>
      </div>
    </form>
  );
};

const KanbanBoard = ({ tasks, onTaskClick, onAddTask, onQuickAdd, onStatusChange, commentCounts = {} }) => {
  const [dragOverColumn, setDragOverColumn] = useState(null);
  const [quickAddColumn, setQuickAddColumn] = useState(null);

  const tasksByStatus = COLUMNS.reduce((acc, col) => {
    acc[col] = tasks
      .filter((t) => t.status === col)
      .sort((a, b) => a.order - b.order);
    return acc;
  }, {});

  const handleDragStart = (e, task) => {
    e.dataTransfer.setData('taskId', task._id);
    e.dataTransfer.setData('fromStatus', task.status);
  };

  const handleDrop = (e, status) => {
    e.preventDefault();
    setDragOverColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    const fromStatus = e.dataTransfer.getData('fromStatus');
    if (taskId && fromStatus !== status) {
      onStatusChange(taskId, status);
    }
  };

  const handleQuickAdd = (status, title) => {
    onQuickAdd(status, title);
    setQuickAddColumn(null);
  };

  return (
    <div className="grid snap-x snap-mandatory auto-cols-[minmax(0,86vw)] grid-flow-col gap-3 overflow-x-auto overscroll-x-contain pb-3 sm:grid-flow-row sm:auto-cols-auto sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:pb-0 sm:snap-none xl:grid-cols-4">
      {COLUMNS.map((column) => (
        <div
          key={column}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOverColumn(column);
          }}
          onDragLeave={() => setDragOverColumn(null)}
          onDrop={(e) => handleDrop(e, column)}
          className={`flex snap-center flex-col rounded-xl border bg-ink-100/60 p-3 transition-all duration-200 ${
            dragOverColumn === column ? 'border-moss-500 bg-moss-100/50 shadow-card' : 'border-transparent'
          }`}
        >
          <div className="mb-3 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className={`h-2 w-2 rounded-full ${columnAccent[column]}`} />
              <h3 className="text-sm font-semibold text-ink-700">{column}</h3>
              <span className="rounded-full bg-white px-1.5 py-0.5 text-xs text-ink-400">
                {tasksByStatus[column].length}
              </span>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setQuickAddColumn((c) => (c === column ? null : column))}
                className="rounded-md p-1 text-ink-400 hover:bg-white hover:text-ink-700"
                aria-label={`Quick add task to ${column}`}
                title="Quick add"
              >
                <Plus size={15} />
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-2.5 overflow-y-auto" style={{ minHeight: '60px' }}>
            {quickAddColumn === column && (
              <QuickAddRow status={column} onSubmit={handleQuickAdd} onCancel={() => setQuickAddColumn(null)} />
            )}
            {tasksByStatus[column].length === 0 && quickAddColumn !== column ? (
              <button
                onClick={() => onAddTask(column)}
                className="w-full rounded-lg border border-dashed border-ink-200 py-8 text-center text-xs text-ink-400 hover:border-ink-300 hover:text-ink-500"
              >
                No tasks yet · click to add one
              </button>
            ) : (
              tasksByStatus[column].map((task) => (
                <TaskCard
                  key={task._id}
                  task={task}
                  onClick={onTaskClick}
                  onDragStart={handleDragStart}
                  commentCount={commentCounts[task._id]}
                />
              ))
            )}
          </div>

          {tasksByStatus[column].length > 0 && (
            <button
              onClick={() => onAddTask(column)}
              className="mt-2.5 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-ink-200 py-2 text-xs font-medium text-ink-400 hover:border-ink-300 hover:bg-white hover:text-ink-600"
            >
              <Plus size={13} /> Add task
            </button>
          )}
        </div>
      ))}
    </div>
  );
};

export default KanbanBoard;
