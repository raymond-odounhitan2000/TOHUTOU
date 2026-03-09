"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { MessageCircle, X } from "lucide-react";
import AnimatedBadge from "@/components/ui/AnimatedBadge";
import ConversationList from "@/components/chat/ConversationList";
import MessageThread from "@/components/chat/MessageThread";
import { useChat } from "@/lib/chat-context";

export default function ChatPanel() {
  const { totalUnread, activeConversationId, closeChat, conversations } =
    useChat();
  const [isExpanded, setIsExpanded] = useState(false);

  const togglePanel = () => {
    setIsExpanded((prev) => !prev);
    if (isExpanded) {
      closeChat();
    }
  };

  // Find active conversation to display participant name
  const activeConversation = conversations.find(
    (c) => c.id === activeConversationId
  );
  const headerTitle = activeConversation
    ? `${activeConversation.other_participant.first_name} ${activeConversation.other_participant.last_name}`
    : "Messages";

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end">
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="mb-3 w-[380px] h-[500px] bg-white rounded-xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-green-700">
              <h3 className="text-sm font-semibold text-white">
                {headerTitle}
              </h3>
              <button
                onClick={togglePanel}
                className="p-1 rounded-full hover:bg-green-600 transition-colors"
                aria-label="Fermer"
              >
                <X className="h-4 w-4 text-white" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {activeConversationId ? <MessageThread /> : <ConversationList />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle button */}
      <button
        onClick={togglePanel}
        className="relative flex items-center justify-center h-14 w-14 rounded-full bg-green-700 text-white shadow-lg hover:bg-green-800 transition-colors"
        aria-label="Messages"
      >
        <MessageCircle className="h-6 w-6" />
        {totalUnread > 0 && (
          <AnimatedBadge
            variant="danger"
            className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-bold px-1"
          >
            {totalUnread > 99 ? "99+" : totalUnread}
          </AnimatedBadge>
        )}
      </button>
    </div>
  );
}
