"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import api from "@/lib/api";
import { useAuth } from "@/lib/auth-context";
import type { Notification } from "@/types";

interface NotificationContextType {
  unreadCount: number;
  notifications: Notification[];
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export function NotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch {
      // Silently ignore polling errors
    }
  }, []);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data);
    } catch {
      // Silently ignore fetch errors
    }
  }, []);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await api.put(`/notifications/${id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch {
        // Silently ignore errors
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch {
      // Silently ignore errors
    }
  }, []);

  useEffect(() => {
    let immediateUnreadFetch: ReturnType<typeof setTimeout> | null = null;

    if (user) {
      immediateUnreadFetch = setTimeout(() => {
        void fetchUnreadCount();
      }, 0);
      pollingRef.current = setInterval(() => {
        void fetchUnreadCount();
      }, 30000);
    } else {
      queueMicrotask(() => {
        setUnreadCount(0);
        setNotifications([]);
      });
    }

    return () => {
      if (immediateUnreadFetch) {
        clearTimeout(immediateUnreadFetch);
        immediateUnreadFetch = null;
      }
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [user, fetchUnreadCount]);

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        fetchNotifications,
        markAsRead,
        markAllRead,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
}
