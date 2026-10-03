import React from 'react';

const getInitials = (name = '') =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('') || '?';

const sizeClasses = {
  xs: 'h-5 w-5 text-[10px]',
  sm: 'h-7 w-7 text-xs',
  md: 'h-9 w-9 text-sm',
  lg: 'h-12 w-12 text-base',
  xl: 'h-24 w-24 text-3xl',
};

const API_ORIGIN = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '');

const Avatar = ({ user, size = 'sm', ring = false, className = '' }) => {
  if (!user) {
    return (
      <div
        className={`flex items-center justify-center rounded-full border-2 border-dashed border-ink-300 text-ink-400 ${sizeClasses[size]} ${className}`}
        title="Unassigned"
      >
        ?
      </div>
    );
  }

  const avatarUrl = user.avatarUrl
    ? (/^(https?:\/\/|blob:|data:)/i.test(user.avatarUrl) ? user.avatarUrl : `${API_ORIGIN}${user.avatarUrl}`)
    : '';

  return (
    <div
      title={user.name}
      className={`relative flex items-center justify-center overflow-hidden rounded-full font-semibold text-white ${sizeClasses[size]} ${
        ring ? 'ring-2 ring-white' : ''
      } ${className}`}
      style={{ backgroundColor: user.avatarColor || '#5B6B80' }}
    >
      {avatarUrl && (
        <img
          src={avatarUrl}
          alt={`${user.name}'s profile`}
          className="absolute inset-0 h-full w-full object-cover"
          onError={(event) => {
            event.currentTarget.style.display = 'none';
          }}
        />
      )}
      <span>{getInitials(user.name)}</span>
    </div>
  );
};

export default Avatar;
