"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import ChatBubble from "@/components/chat/ChatBubble";
import { useChat } from "@/lib/chat-context";
import { useAuth } from "@/lib/auth-context";

export default function MessageThread() {
  const { messages, sendMessage, closeChat } = useChat();
  const { user } = useAuth();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    const trimmed = input.trim();
    if (!trimmed || sending) return;

    setSending(true);
    setInput("");
    try {
      await sendMessage(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Back button bar */}
      <div className="flex items-center px-2 py-2 border-b border-gray-100">
        <button
          onClick={closeChat}
          className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900 transition-colors px-2 py-1 rounded-lg hover:bg-gray-100"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Retour</span>
        </button>
      </div>

      {/* Messages area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-3 py-3">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-gray-400">
              Commencez la conversation...
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <ChatBubble
              key={msg.id}
              content={msg.content}
              isSelf={msg.sender_id === user?.id}
              timestamp={msg.created_at}
            />
          ))
        )}
      </div>

      {/* Input area */}
      <div className="border-t border-gray-100 px-3 py-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Votre message..."
            className="flex-1 text-sm px-3 py-2 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-green-600 focus:border-transparent"
            disabled={sending}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || sending}
            className="flex items-center justify-center h-9 w-9 rounded-full bg-green-700 text-white hover:bg-green-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            aria-label="Envoyer"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
