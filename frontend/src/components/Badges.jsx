import React from 'react';
import { formatDistanceToNow, isPast, isToday, format } from 'date-fns';

export const priorityStyles = {
  Low: 'bg-moss-100 text-moss-700',
  Medium: 'bg-amber-100 text-amber-600',
  High: 'bg-clay-100 text-clay-600',
};

export const statusStyles = {
  'To Do': 'bg-ink-100 text-ink-600',
  'In Progress': 'bg-blue-50 text-blue-600',
  Review: 'bg-amber-100 text-amber-600',
  Completed: 'bg-moss-100 text-moss-700',
};

export const PriorityBadge = ({ priority }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${priorityStyles[priority] || priorityStyles.Medium}`}>
    {priority}
  </span>
);

export const StatusBadge = ({ status }) => (
  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${statusStyles[status] || statusStyles['To Do']}`}>
    {status}
  </span>
);

export const DueDateLabel = ({ date, status }) => {
  if (!date) return null;
  const d = new Date(date);
  const overdue = status !== 'Completed' && isPast(d) && !isToday(d);
  const dueToday = isToday(d);

  return (
    <span
      className={`text-xs font-medium ${
        overdue ? 'text-clay-600' : dueToday ? 'text-amber-600' : 'text-ink-400'
      }`}
    >
      {overdue ? 'Overdue · ' : ''}
      {dueToday ? 'Due today' : format(d, 'MMM d')}
    </span>
  );
};

export const timeAgo = (date) => {
  if (!date) return '';
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};
