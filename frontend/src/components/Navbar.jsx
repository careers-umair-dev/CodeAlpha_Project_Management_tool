import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, UserRound, ChevronDown, Search, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';

const Navbar = ({ onMenuClick, onOpenSearch, title }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const shortcutLabel = /Mac|iPhone|iPad/.test(navigator.platform) ? '⌘ K' : 'Ctrl K';

  useEffect(() => {
    const handler = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-100/80 bg-white/90 px-3 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="truncate font-display text-lg font-semibold text-ink-900">{title}</h1>
      </div>

      <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">
        <button
          type="button"
          onClick={onOpenSearch}
          className="group flex h-9 items-center gap-2 rounded-lg border border-ink-100 bg-ink-50/70 px-2.5 text-ink-400 transition hover:border-ink-200 hover:bg-ink-50 hover:text-ink-600 sm:w-52 sm:justify-between sm:px-3"
          aria-label="Search workspace"
        >
          <span className="flex items-center gap-2">
            <Search size={15} />
            <span className="hidden text-xs sm:inline">Search anything...</span>
          </span>
          <kbd className="hidden rounded border border-ink-200 bg-white px-1.5 py-0.5 text-[10px] text-ink-400 sm:inline">{shortcutLabel}</kbd>
        </button>
        <button
          type="button"
          onClick={toggleTheme}
          className="rounded-full p-2 text-ink-500 transition hover:bg-ink-100"
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
        >
          {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        </button>
        <NotificationBell />
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen((value) => !value)}
            className="flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-1 transition-colors hover:border-ink-100 hover:bg-ink-50 sm:pr-2"
            aria-expanded={menuOpen}
            aria-haspopup="menu"
          >
            <Avatar user={user} size="sm" />
            <span className="hidden text-sm font-medium text-ink-700 sm:inline">{user?.name}</span>
            <ChevronDown size={14} className="hidden text-ink-400 sm:block" />
          </button>

          {menuOpen && (
            <div role="menu" className="absolute right-0 mt-2 w-48 rounded-lg border border-ink-100 bg-white py-1.5 shadow-raised animate-fade-in">
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/profile');
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-600 hover:bg-ink-100"
              >
                <UserRound size={15} /> Profile
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                  navigate('/login');
                }}
                className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-clay-600 hover:bg-ink-100"
              >
                <LogOut size={15} /> Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
