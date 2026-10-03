import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  GitBranch,
  ListTodo,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from 'date-fns';
import toast from 'react-hot-toast';
import EmptyState from '../components/EmptyState';
import Layout from '../components/Layout';
import Spinner from '../components/Spinner';
import { PriorityBadge, StatusBadge } from '../components/Badges';
import { getErrorMessage, projectApi, taskApi } from '../services/api';

const STATUSES = ['To Do', 'In Progress', 'Review', 'Completed'];
const PRIORITIES = ['Low', 'Medium', 'High'];
const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const dateKey = (value) => (value ? value.slice(0, 10) : '');

const MyTasks = ({ calendarView = false }) => {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    q: '',
    status: '',
    priority: '',
    projectId: '',
    from: '',
    to: '',
  });
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  useEffect(() => {
    let active = true;
    projectApi
      .list()
      .then(({ data }) => {
        if (active) setProjects(data.projects);
      })
      .catch((error) => {
        if (active) toast.error(getErrorMessage(error));
      });
    return () => {
      active = false;
    };
  }, []);

  const calendarRange = useMemo(() => {
    const firstDay = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const lastDay = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return {
      from: format(firstDay, 'yyyy-MM-dd'),
      to: format(lastDay, 'yyyy-MM-dd'),
    };
  }, [month]);

  const calendarDays = useMemo(() => {
    const firstDay = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const lastDay = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    const days = [];
    for (let day = firstDay; day <= lastDay; day = new Date(day.getFullYear(), day.getMonth(), day.getDate() + 1)) {
      days.push(day);
    }
    return days;
  }, [month]);

  const sortedTasks = useMemo(
    () =>
      [...tasks].sort((a, b) => {
        const dueA = dateKey(a.dueDate);
        const dueB = dateKey(b.dueDate);
        if (!dueA) return dueB ? 1 : 0;
        if (!dueB) return -1;
        return dueA.localeCompare(dueB);
      }),
    [tasks]
  );

  const tasksByDay = useMemo(() => {
    const grouped = new Map();
    tasks.forEach((task) => {
      const key = dateKey(task.dueDate);
      if (!key) return;
      const dayTasks = grouped.get(key) || [];
      dayTasks.push(task);
      grouped.set(key, dayTasks);
    });
    return grouped;
  }, [tasks]);

  const query = useMemo(() => {
    const params = {};
    if (filters.q.trim()) params.q = filters.q.trim();
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.projectId) params.projectId = filters.projectId;

    if (calendarView) {
      params.from = calendarRange.from;
      params.to = calendarRange.to;
    } else {
      if (filters.from) params.from = filters.from;
      if (filters.to) params.to = filters.to;
    }
    return params;
  }, [calendarRange.from, calendarRange.to, calendarView, filters]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    taskApi
      .listMine(query)
      .then(({ data }) => {
        if (active) setTasks(data.tasks);
      })
      .catch((error) => {
        if (active) toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  const updateFilter = (field) => (event) => {
    const value = event.target.value;
    setFilters((current) => ({ ...current, [field]: value }));
  };

  const filterBar = (
    <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-6">
      <label className="relative sm:col-span-2 lg:col-span-2">
        <span className="sr-only">Search tasks</span>
        <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-400" />
        <input
          value={filters.q}
          onChange={updateFilter('q')}
          placeholder="Search task titles..."
          className="input pl-9"
          maxLength={100}
        />
      </label>
      <label>
        <span className="sr-only">Filter by status</span>
        <select value={filters.status} onChange={updateFilter('status')} className="input">
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
      </label>
      <label>
        <span className="sr-only">Filter by priority</span>
        <select value={filters.priority} onChange={updateFilter('priority')} className="input">
          <option value="">All priorities</option>
          {PRIORITIES.map((priority) => (
            <option key={priority} value={priority}>{priority}</option>
          ))}
        </select>
      </label>
      <label className="lg:col-span-2">
        <span className="sr-only">Filter by project</span>
        <select value={filters.projectId} onChange={updateFilter('projectId')} className="input">
          <option value="">All projects</option>
          {projects.map((project) => (
            <option key={project._id} value={project._id}>{project.title}</option>
          ))}
        </select>
      </label>
      {!calendarView && (
        <>
          <label>
            <span className="label">Due from</span>
            <input
              type="date"
              value={filters.from}
              max={filters.to || undefined}
              onChange={updateFilter('from')}
              className="input"
            />
          </label>
          <label>
            <span className="label">Due to</span>
            <input
              type="date"
              value={filters.to}
              min={filters.from || undefined}
              onChange={updateFilter('to')}
              className="input"
            />
          </label>
        </>
      )}
    </div>
  );

  return (
    <Layout title={calendarView ? 'Calendar' : 'My Tasks'}>
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-moss-600">
            <SlidersHorizontal size={12} /> Personal work queue
          </p>
          <h2 className="font-display text-2xl font-semibold text-ink-900">
            {calendarView ? 'Task calendar' : 'My Tasks'}
          </h2>
          <p className="mt-1 text-sm text-ink-500">
            {calendarView
              ? 'Plan your assigned work across the month.'
              : 'A single view of tasks assigned to you across every project.'}
          </p>
        </div>
        <div className="flex rounded-lg border border-ink-200 bg-white p-1">
          <Link
            to="/my-tasks"
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              !calendarView ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50'
            }`}
          >
            <ListTodo size={15} /> List
          </Link>
          <Link
            to="/calendar"
            className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${
              calendarView ? 'bg-ink-900 text-white' : 'text-ink-500 hover:bg-ink-50'
            }`}
          >
            <CalendarDays size={15} /> Calendar
          </Link>
        </div>
      </div>

      {filterBar}

      {calendarView && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setMonth((current) => subMonths(current, 1))}
              className="btn-ghost !min-h-9 !px-2.5"
              aria-label="Previous month"
            >
              <ChevronLeft size={17} />
            </button>
            <h3 className="min-w-36 text-center font-display text-lg font-semibold text-ink-900">
              {format(month, 'MMMM yyyy')}
            </h3>
            <button
              type="button"
              onClick={() => setMonth((current) => addMonths(current, 1))}
              className="btn-ghost !min-h-9 !px-2.5"
              aria-label="Next month"
            >
              <ChevronRight size={17} />
            </button>
          </div>
          <button type="button" onClick={() => setMonth(startOfMonth(new Date()))} className="btn-ghost !min-h-9">
            Today
          </button>
        </div>
      )}

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size={26} />
        </div>
      ) : calendarView ? (
        <div className="card overflow-x-auto">
          <div className="min-w-[560px] sm:min-w-0">
          <div className="grid grid-cols-7 border-b border-ink-100 bg-ink-50">
            {WEEKDAYS.map((day) => (
              <div key={day} className="px-2 py-3 text-center text-xs font-semibold text-ink-500 sm:px-3">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {calendarDays.map((day) => {
                const key = format(day, 'yyyy-MM-dd');
                const dayTasks = tasksByDay.get(key) || [];
                return (
                  <div
                    key={key}
                    className={`min-h-24 border-b border-r border-ink-100 p-1.5 sm:min-h-32 sm:p-2 ${
                      isSameMonth(day, month) ? 'bg-white' : 'bg-ink-50/60'
                    }`}
                  >
                    <div className="mb-1 flex justify-end">
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-full text-xs ${
                          isToday(day) ? 'bg-ink-900 font-semibold text-white' : 'text-ink-500'
                        } ${!isSameMonth(day, month) ? 'opacity-40' : ''}`}
                      >
                        {format(day, 'd')}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {dayTasks.slice(0, 3).map((task) => (
                        <button
                          key={task._id}
                          type="button"
                          title={`${task.title} · ${task.project?.title || 'Project'}${
                            task.blockedBy?.some((dependency) => dependency.status !== 'Completed')
                              ? ' · Blocked by an unfinished task'
                              : ''
                          }`}
                          onClick={() => task.project?._id && navigate(`/projects/${task.project._id}`)}
                          className="block w-full truncate rounded px-1.5 py-1 text-left text-[10px] font-medium text-ink-700 hover:brightness-95 sm:text-xs"
                          style={{ backgroundColor: `${task.project?.color || '#8695A7'}20`, borderLeft: `2px solid ${task.project?.color || '#8695A7'}` }}
                        >
                          {task.title}
                        </button>
                      ))}
                      {dayTasks.length > 3 && (
                        <p className="px-1 text-[10px] font-medium text-ink-400">+{dayTasks.length - 3} more</p>
                      )}
                    </div>
                  </div>
                );
              })}
          </div>
          {tasks.length === 0 && (
            <div className="border-t border-ink-100 px-4 py-5 text-center text-sm text-ink-400">
              No assigned tasks due in this date range.
            </div>
          )}
          </div>
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={ListTodo}
          title="No matching tasks"
          description="Tasks assigned to you will appear here. Try changing the filters or ask a project owner to assign you work."
        />
      ) : (
        <div className="space-y-2">
          {sortedTasks.map((task) => {
            const projectId = task.project?._id;
            const dueKey = dateKey(task.dueDate);
            const overdue = dueKey && dueKey < format(new Date(), 'yyyy-MM-dd') && task.status !== 'Completed';
            const openDependencies = (task.blockedBy || []).filter((dependency) => dependency.status !== 'Completed');
            return (
              <button
                key={task._id}
                type="button"
                onClick={() => projectId && navigate(`/projects/${projectId}`)}
                className="card flex w-full flex-wrap items-center gap-3 p-4 text-left transition hover:-translate-y-px hover:shadow-raised sm:flex-nowrap"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                  style={{ backgroundColor: task.project?.color || '#8695A7' }}
                >
                  <ListTodo size={17} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-800">{task.title}</p>
                  <p className="mt-0.5 truncate text-xs text-ink-400">{task.project?.title || 'Project'}</p>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                  <StatusBadge status={task.status} />
                  <PriorityBadge priority={task.priority} />
                  {openDependencies.length > 0 && (
                    <span
                      className="flex items-center gap-1 rounded-full bg-amber-100 px-2 py-1 text-xs font-medium text-amber-700"
                      title={openDependencies.map((dependency) => dependency.title).join(', ')}
                    >
                      <GitBranch size={12} /> Blocked
                    </span>
                  )}
                  <span className={`flex items-center gap-1 text-xs ${overdue ? 'font-semibold text-clay-600' : 'text-ink-400'}`}>
                    <Clock3 size={13} />
                    {dueKey
                      ? `${overdue ? 'Overdue · ' : ''}${format(new Date(`${dueKey}T12:00:00`), 'MMM d, yyyy')}`
                      : 'No due date'}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {!loading && !calendarView && tasks.length > 0 && (
        <p className="mt-4 text-center text-xs text-ink-400">
          Showing {tasks.length} assigned task{tasks.length !== 1 ? 's' : ''}
        </p>
      )}
    </Layout>
  );
};

export default MyTasks;
