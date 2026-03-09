"use client";

import { motion } from "framer-motion";

interface ChatBubbleProps {
  content: string;
  isSelf: boolean;
  timestamp: string;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ChatBubble({
  content,
  isSelf,
  timestamp,
}: ChatBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.15 }}
      className={`flex ${isSelf ? "justify-end" : "justify-start"} mb-2`}
    >
      <div
        className={`max-w-[75%] px-3 py-2 ${
          isSelf
            ? "bg-green-700 text-white rounded-2xl rounded-br-md"
            : "bg-gray-100 text-gray-900 rounded-2xl rounded-bl-md"
        }`}
      >
        <p className="text-sm whitespace-pre-wrap break-words">{content}</p>
        <p
          className={`text-[10px] mt-1 text-right ${
            isSelf ? "text-green-200" : "text-gray-400"
          }`}
        >
          {formatTime(timestamp)}
        </p>
      </div>
    </motion.div>
  );
}
