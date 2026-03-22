import { useState, useEffect, useCallback } from 'react';
import type { Notification } from '@/lib/api';
import { notificationsAPI } from '@/lib/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const fetchNotifications = useCallback(async (reset = false) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const currentPage = reset ? 1 : page;
      const response = await notificationsAPI.getNotifications(currentPage, 20);
      const newNotifications = response.data.notifications;
      
      if (reset) {
        setNotifications(newNotifications);
        setPage(2);
      } else {
        setNotifications((prev) => [...prev, ...newNotifications]);
        setPage((p) => p + 1);
      }
      
      setHasMore(newNotifications.length === 20);
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [page, isLoading]);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await notificationsAPI.getUnreadCount();
      setUnreadCount(response.data.unread_count);
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  const markAsRead = useCallback(async (id: number) => {
    try {
      await notificationsAPI.markAsRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsAPI.markAllAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, []);

  const deleteNotification = useCallback(async (id: number) => {
    try {
      await notificationsAPI.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      const deleted = notifications.find((n) => n.id === id);
      if (deleted && !deleted.is_read) {
        setUnreadCount((c) => Math.max(0, c - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [notifications]);

  const addNotification = useCallback((notification: Notification) => {
    setNotifications((prev) => [notification, ...prev]);
    if (!notification.is_read) {
      setUnreadCount((c) => c + 1);
    }
  }, []);

  useEffect(() => {
    fetchNotifications(true);
    fetchUnreadCount();
  }, []);

  return {
    notifications,
    unreadCount,
    isLoading,
    hasMore,
    fetchNotifications,
    fetchUnreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    addNotification,
  };
}
