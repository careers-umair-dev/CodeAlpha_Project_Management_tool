import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, LogOut, UserRound, ChevronDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import NotificationBell from './NotificationBell';

const Navbar = ({ onMenuClick, title }) => {
  const { user, logout } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-ink-100/80 bg-white/90 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="rounded-md p-1.5 text-ink-500 hover:bg-ink-100 lg:hidden"
          aria-label="Open menu"
        >
          <Menu size={20} />
        </button>
        <h1 className="font-display text-lg font-semibold text-ink-900">{title}</h1>
      </div>

      <div className="flex items-center gap-1.5">
      <NotificationBell />
      <div className="relative" ref={menuRef}>
        <button
          onClick={() => setMenuOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-transparent py-1 pl-1 pr-2 transition-colors hover:border-ink-100 hover:bg-ink-50"
        >
          <Avatar user={user} size="sm" />
          <span className="hidden text-sm font-medium text-ink-700 sm:inline">{user?.name}</span>
          <ChevronDown size={14} className="text-ink-400" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-48 rounded-lg border border-ink-100 bg-white py-1.5 shadow-raised animate-fade-in">
            <button
              onClick={() => {
                setMenuOpen(false);
                navigate('/profile');
              }}
              className="flex w-full items-center gap-2 px-3.5 py-2 text-sm text-ink-600 hover:bg-ink-100"
            >
              <UserRound size={15} /> Profile
            </button>
            <button
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
