import React from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutGrid, FolderKanban, UserRound, Mountain, ListTodo, CalendarDays, X } from 'lucide-react';

const navItems = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutGrid },
  { to: '/my-tasks', label: 'My Tasks', icon: ListTodo },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays },
  { to: '/projects', label: 'Projects', icon: FolderKanban },
  { to: '/profile', label: 'Profile', icon: UserRound },
];

const Sidebar = ({ open, onClose }) => {
  return (
    <>
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-30 cursor-default bg-ink-950/45 backdrop-blur-[2px] lg:hidden"
          onClick={onClose}
          aria-label="Close navigation menu"
        />
      )}
      <aside
        aria-label="Main navigation"
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-white/10 bg-ink-900 text-white transition-transform duration-200 lg:static lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center gap-2.5 border-b border-white/10 px-4 sm:px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 text-ink-900 shadow-sm">
            <Mountain size={18} />
          </div>
          <span className="font-display text-lg font-semibold text-white">Ridgeline</span>
          <button
            type="button"
            onClick={onClose}
            className="ml-auto rounded-lg p-2 text-white/55 transition-colors hover:bg-white/10 hover:text-white lg:hidden"
            aria-label="Close navigation menu"
          >
            <X size={17} />
          </button>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              onClick={onClose}
              className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-white/10 text-white ring-1 ring-inset ring-white/10' : 'text-white/65 hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <Icon size={17} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-white/10 px-5 py-4 text-xs text-white/45">
          Ridgeline <span className="mx-1 text-amber-400">/</span> Made for focused teams
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
