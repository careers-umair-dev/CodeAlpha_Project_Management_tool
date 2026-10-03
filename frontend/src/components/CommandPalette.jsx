import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  CalendarDays,
  Command,
  FolderKanban,
  LayoutGrid,
  ListTodo,
  LoaderCircle,
  Search,
  UserRound,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { getErrorMessage, projectApi, taskApi } from '../services/api';

const navigationItems = [
  { label: 'Dashboard', detail: 'Workspace overview', path: '/dashboard', icon: LayoutGrid, keywords: 'home overview' },
  { label: 'My Tasks', detail: 'Your assigned work', path: '/my-tasks', icon: ListTodo, keywords: 'assigned tasks' },
  { label: 'Calendar', detail: 'Plan task deadlines', path: '/calendar', icon: CalendarDays, keywords: 'dates schedule' },
  { label: 'Projects', detail: 'Browse all projects', path: '/projects', icon: FolderKanban, keywords: 'boards' },
  { label: 'Profile & settings', detail: 'Manage your account', path: '/profile', icon: UserRound, keywords: 'account settings' },
];

const CommandPalette = ({ open, onClose }) => {
  const [query, setQuery] = useState('');
  const [projects, setProjects] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [loadingTasks, setLoadingTasks] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return undefined;
    setQuery('');
    setTasks([]);
    setActiveIndex(0);
    requestAnimationFrame(() => inputRef.current?.focus());
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    setLoadingProjects(true);
    projectApi
      .list()
      .then(({ data }) => {
        if (active) setProjects(data.projects);
      })
      .catch((error) => {
        if (active) toast.error(getErrorMessage(error));
      })
      .finally(() => {
        if (active) setLoadingProjects(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  useEffect(() => {
    const searchTerm = query.trim();
    if (!open || searchTerm.length < 2) {
      setTasks([]);
      setLoadingTasks(false);
      return undefined;
    }

    let active = true;
    const timeout = window.setTimeout(() => {
      setLoadingTasks(true);
      taskApi
        .search(searchTerm)
        .then(({ data }) => {
          if (active) setTasks(data.tasks);
        })
        .catch((error) => {
          if (active) toast.error(getErrorMessage(error));
        })
        .finally(() => {
          if (active) setLoadingTasks(false);
        });
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timeout);
    };
  }, [open, query]);

  const items = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const commands = navigationItems
      .filter((item) => !normalized || `${item.label} ${item.detail} ${item.keywords}`.toLowerCase().includes(normalized))
      .map((item) => ({ ...item, type: 'navigation' }));
    const matchingProjects = normalized
      ? projects
          .filter((project) => `${project.title} ${project.description || ''}`.toLowerCase().includes(normalized))
          .slice(0, 5)
          .map((project) => ({
            label: project.title,
            detail: `Project · ${project.members?.length || 0} team member${project.members?.length === 1 ? '' : 's'}`,
            path: `/projects/${project._id}`,
            icon: FolderKanban,
            type: 'project',
            color: project.color,
          }))
      : [];
    const matchingTasks = tasks.map((task) => ({
      label: task.title,
      detail: `Task · ${task.project?.title || 'Project'} · ${task.status}`,
      path: task.project?._id ? `/projects/${task.project._id}` : '/my-tasks',
      icon: ListTodo,
      type: 'task',
      color: task.project?.color,
    }));
    return [...commands, ...matchingProjects, ...matchingTasks];
  }, [projects, query, tasks]);

  useEffect(() => setActiveIndex(0), [query]);

  const selectItem = useCallback(
    (item) => {
      navigate(item.path);
      onClose();
    },
    [navigate, onClose]
  );

  const handleKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((current) => (items.length ? (current + 1) % items.length : 0));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((current) => (items.length ? (current - 1 + items.length) % items.length : 0));
    } else if (event.key === 'Enter' && items[activeIndex]) {
      event.preventDefault();
      selectItem(items[activeIndex]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center bg-ink-900/45 px-3 pt-[12vh] backdrop-blur-sm sm:px-6"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        onKeyDown={(event) => {
          if (event.key !== 'Tab') return;
          const focusable = event.currentTarget.querySelectorAll('input:not(:disabled), button:not(:disabled)');
          const first = focusable[0];
          const last = focusable[focusable.length - 1];
          if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last?.focus();
          } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first?.focus();
          }
        }}
        role="dialog"
        aria-modal="true"
        aria-label="Search projects, tasks, and pages"
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-ink-100 bg-white shadow-modal animate-fade-in"
      >
        <div className="flex items-center gap-3 border-b border-ink-100 px-4 sm:px-5">
          <Search size={19} className="shrink-0 text-ink-400" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search pages, projects, and tasks..."
            className="h-14 min-w-0 flex-1 border-0 bg-transparent text-sm text-ink-900 outline-none placeholder:text-ink-400 focus:ring-0"
            aria-label="Search pages, projects, and tasks"
            aria-controls="command-results"
            aria-activedescendant={items[activeIndex] ? `command-item-${activeIndex}` : undefined}
            autoComplete="off"
            spellCheck="false"
          />
          {(loadingProjects || loadingTasks) && <LoaderCircle size={16} className="animate-spin text-ink-400" />}
          <button type="button" onClick={onClose} className="rounded-md p-1.5 text-ink-400 hover:bg-ink-100" aria-label="Close search">
            <X size={16} />
          </button>
        </div>

        <div id="command-results" role="listbox" className="max-h-[min(55vh,440px)] overflow-y-auto p-2">
          {items.length === 0 ? (
            <div className="px-4 py-10 text-center">
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-ink-50 text-ink-400">
                {query.trim().length < 2 ? <Command size={18} /> : <Search size={18} />}
              </div>
              <p className="mt-3 text-sm font-medium text-ink-700">
                {query.trim().length < 2 ? 'Jump anywhere in Ridgeline' : 'No matching results'}
              </p>
              <p className="mt-1 text-xs text-ink-400">
                {query.trim().length < 2 ? 'Try searching by page, project, or task title.' : 'Try another search term.'}
              </p>
            </div>
          ) : (
            items.map((item, index) => {
              const Icon = item.icon;
              return (
                <button
                  id={`command-item-${index}`}
                  key={`${item.type}-${item.path}-${item.label}`}
                  type="button"
                  role="option"
                  aria-selected={activeIndex === index}
                  onMouseEnter={() => setActiveIndex(index)}
                  onClick={() => selectItem(item)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition ${
                    activeIndex === index ? 'bg-ink-50' : 'hover:bg-ink-50'
                  }`}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white"
                    style={{ backgroundColor: item.color || '#263342' }}
                  >
                    <Icon size={16} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-ink-800">{item.label}</span>
                    <span className="mt-0.5 block truncate text-xs text-ink-400">{item.detail}</span>
                  </span>
                  {activeIndex === index && <ArrowRight size={15} className="shrink-0 text-ink-400" />}
                </button>
              );
            })
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-ink-100 bg-ink-50/70 px-4 py-2.5 text-[11px] text-ink-400 sm:px-5">
          <span>Search across your workspace</span>
          <span className="flex items-center gap-3">
            <span><kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>↵</kbd> to open</span>
            <span><kbd>esc</kbd> to close</span>
          </span>
        </footer>
      </section>
    </div>
  );
};

export default CommandPalette;
