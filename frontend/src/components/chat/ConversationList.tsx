"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { useChat } from "@/lib/chat-context";

function timeAgo(dateString: string | null): string {
  if (!dateString) return "";
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "A l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}j`;
  return date.toLocaleDateString("fr-FR");
}

function getInitials(firstName: string, lastName: string): string {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
}

export default function ConversationList() {
  const { conversations, fetchConversations, openChat } = useChat();

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  if (conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-4 py-8 text-center">
        <p className="text-sm text-gray-500">Aucune conversation</p>
      </div>
    );
  }

  return (
    <div className="overflow-y-auto h-full divide-y divide-gray-50">
      {conversations.map((conversation, index) => (
        <motion.div
          key={conversation.id}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: index * 0.03 }}
          onClick={() => openChat(conversation.id)}
          className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        >
          {/* Avatar */}
          <div className="flex-shrink-0 h-10 w-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-semibold">
            {getInitials(
              conversation.other_participant.first_name,
              conversation.other_participant.last_name
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate">
                {conversation.other_participant.first_name}{" "}
                {conversation.other_participant.last_name}
              </p>
              <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                {timeAgo(conversation.last_message_at)}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {conversation.last_message_preview || "Nouvelle conversation"}
            </p>
          </div>

          {/* Unread indicator */}
          {conversation.unread_count > 0 && (
            <span className="flex-shrink-0 h-5 w-5 rounded-full bg-green-600 text-white text-[10px] font-bold flex items-center justify-center">
              {conversation.unread_count > 9
                ? "9+"
                : conversation.unread_count}
            </span>
          )}
        </motion.div>
      ))}
    </div>
  );
}
