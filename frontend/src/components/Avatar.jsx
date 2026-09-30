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
};

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

  return (
    <div
      title={user.name}
      className={`flex items-center justify-center rounded-full font-semibold text-white ${sizeClasses[size]} ${
        ring ? 'ring-2 ring-white' : ''
      } ${className}`}
      style={{ backgroundColor: user.avatarColor || '#5B6B80' }}
    >
      {getInitials(user.name)}
    </div>
  );
};

export default Avatar;
