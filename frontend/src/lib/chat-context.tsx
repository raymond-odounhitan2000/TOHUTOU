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
import type { Conversation, Message } from "@/types";

interface ChatContextType {
  totalUnread: number;
  conversations: Conversation[];
  activeConversationId: number | null;
  messages: Message[];
  openChat: (conversationId: number) => void;
  closeChat: () => void;
  sendMessage: (content: string) => Promise<void>;
  fetchConversations: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [totalUnread, setTotalUnread] = useState(0);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<
    number | null
  >(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const unreadPollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const messagePollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get("/conversations/unread-count");
      setTotalUnread(res.data.count);
    } catch {
      // Silently ignore polling errors
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await api.get("/conversations");
      setConversations(res.data);
    } catch {
      // Silently ignore fetch errors
    }
  }, []);

  const fetchMessages = useCallback(async (conversationId: number) => {
    try {
      const res = await api.get(`/conversations/${conversationId}/messages`);
      setMessages(res.data);
    } catch {
      // Silently ignore fetch errors
    }
  }, []);

  const openChat = useCallback(
    (conversationId: number) => {
      setActiveConversationId(conversationId);
      fetchMessages(conversationId);
    },
    [fetchMessages]
  );

  const closeChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
  }, []);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!activeConversationId) return;
      try {
        const res = await api.post(
          `/conversations/${activeConversationId}/messages`,
          { content }
        );
        setMessages((prev) => [...prev, res.data]);
        // Refresh conversations to update last_message_preview
        fetchConversations();
      } catch {
        // Silently ignore send errors
      }
    },
    [activeConversationId, fetchConversations]
  );

  // Poll unread count every 30s when authenticated
  useEffect(() => {
    let immediateUnreadFetch: ReturnType<typeof setTimeout> | null = null;

    if (user) {
      immediateUnreadFetch = setTimeout(() => {
        void fetchUnreadCount();
      }, 0);
      unreadPollingRef.current = setInterval(() => {
        void fetchUnreadCount();
      }, 30000);
    } else {
      queueMicrotask(() => {
        setTotalUnread(0);
        setConversations([]);
        setActiveConversationId(null);
        setMessages([]);
      });
    }

    return () => {
      if (immediateUnreadFetch) {
        clearTimeout(immediateUnreadFetch);
        immediateUnreadFetch = null;
      }
      if (unreadPollingRef.current) {
        clearInterval(unreadPollingRef.current);
        unreadPollingRef.current = null;
      }
    };
  }, [user, fetchUnreadCount]);

  // Poll messages every 5s when a conversation is active
  useEffect(() => {
    if (activeConversationId) {
      messagePollingRef.current = setInterval(() => {
        fetchMessages(activeConversationId);
      }, 5000);
    }

    return () => {
      if (messagePollingRef.current) {
        clearInterval(messagePollingRef.current);
        messagePollingRef.current = null;
      }
    };
  }, [activeConversationId, fetchMessages]);

  return (
    <ChatContext.Provider
      value={{
        totalUnread,
        conversations,
        activeConversationId,
        messages,
        openChat,
        closeChat,
        sendMessage,
        fetchConversations,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}
