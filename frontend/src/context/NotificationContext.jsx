import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import { UserPlus2, MessageSquare, CheckCircle2, Bell } from 'lucide-react';
import { useAuth } from './AuthContext';
import { getSocket } from '../services/socket';

const NotificationContext = createContext(null);

const MAX_NOTIFICATIONS = 30;

export const notificationIcon = (type) => {
  switch (type) {
    case 'task_assigned':
      return UserPlus2;
    case 'task_completed':
      return CheckCircle2;
    case 'comment_added':
      return MessageSquare;
    case 'project_member_added':
      return UserPlus2;
    default:
      return Bell;
  }
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    const socket = getSocket();
    if (!socket) return;

    const onNotification = (notification) => {
      setNotifications((prev) => [{ ...notification, read: false }, ...prev].slice(0, MAX_NOTIFICATIONS));
      setUnreadCount((c) => c + 1);
      toast(notification.message, { icon: '🔔' });
    };

    socket.on('notification', onNotification);
    return () => socket.off('notification', onNotification);
  }, [user]);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAllRead, clearAll }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error('useNotifications must be used within a NotificationProvider');
  return ctx;
};
