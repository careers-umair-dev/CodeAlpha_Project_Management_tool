import React from 'react';
import { MessageSquare } from 'lucide-react';
import { isPast, isToday } from 'date-fns';
import Avatar from './Avatar';
import { PriorityBadge, DueDateLabel } from './Badges';

const TaskCard = ({ task, onClick, onDragStart, commentCount }) => {
  const isOverdue =
    task.dueDate && task.status !== 'Completed' && isPast(new Date(task.dueDate)) && !isToday(new Date(task.dueDate));

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task)}
      onClick={() => onClick(task)}
      className={`card cursor-grab select-none border-l-[3px] p-3.5 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised active:translate-y-0 active:cursor-grabbing ${
        isOverdue ? 'border-l-clay-500' : 'border-l-transparent'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-ink-800">{task.title}</p>
      </div>

      {task.description && (
        <p className="mt-1.5 line-clamp-2 text-xs text-ink-500">{task.description}</p>
      )}

      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PriorityBadge priority={task.priority} />
          {typeof commentCount === 'number' && commentCount > 0 && (
            <span className="flex items-center gap-1 text-xs text-ink-400">
              <MessageSquare size={12} /> {commentCount}
            </span>
          )}
        </div>
        <Avatar user={task.assignee} size="xs" />
      </div>

      {task.dueDate && (
        <div className="mt-2">
          <DueDateLabel date={task.dueDate} status={task.status} />
        </div>
      )}
    </div>
  );
};

export default TaskCard;
