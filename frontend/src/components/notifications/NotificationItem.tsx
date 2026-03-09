"use client";

import { motion } from "framer-motion";
import { Bell, CheckCircle, XCircle } from "lucide-react";
import type { Notification } from "@/types";
import { useNotifications } from "@/lib/notification-context";

interface NotificationItemProps {
  notification: Notification;
}

function getNotificationIcon(type: string) {
  if (type.includes("approved")) {
    return <CheckCircle className="h-5 w-5 text-green-600" />;
  }
  if (type.includes("rejected")) {
    return <XCircle className="h-5 w-5 text-red-600" />;
  }
  return <Bell className="h-5 w-5 text-blue-600" />;
}

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "A l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR");
}

export default function NotificationItem({
  notification,
}: NotificationItemProps) {
  const { markAsRead } = useNotifications();

  const handleClick = () => {
    if (!notification.is_read) {
      markAsRead(notification.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      onClick={handleClick}
      className={`flex items-start gap-3 p-3 cursor-pointer transition-colors hover:bg-gray-50 ${
        !notification.is_read
          ? "border-l-4 border-l-green-600 bg-green-50/50"
          : "border-l-4 border-l-transparent"
      }`}
    >
      <div className="flex-shrink-0 mt-0.5">
        {getNotificationIcon(notification.type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {notification.title}
        </p>
        <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">
          {notification.message}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          {timeAgo(notification.created_at)}
        </p>
      </div>
      {!notification.is_read && (
        <span className="flex-shrink-0 h-2 w-2 rounded-full bg-green-600 mt-2" />
      )}
    </motion.div>
  );
}
