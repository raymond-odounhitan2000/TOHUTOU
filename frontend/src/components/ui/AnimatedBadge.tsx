"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedBadgeProps {
  variant?: "success" | "warning" | "danger" | "info" | "default";
  children: ReactNode;
  className?: string;
  color?: string;
}

const variantClasses: Record<string, string> = {
  success: "bg-green-50 text-green-700 border-green-200",
  warning: "bg-yellow-50 text-yellow-700 border-yellow-200",
  danger: "bg-red-50 text-red-700 border-red-200",
  info: "bg-blue-50 text-blue-700 border-blue-200",
  default: "bg-gray-50 text-gray-700 border-gray-200",
};

export default function AnimatedBadge({
  variant = "default",
  children,
  className = "",
  color,
}: AnimatedBadgeProps) {
  return (
    <motion.span
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 25 }}
      style={
        color
          ? { backgroundColor: color + "15", color, borderColor: color + "30" }
          : undefined
      }
      className={`inline-flex items-center text-xs font-medium px-2.5 py-0.5 rounded-full border ${
        color ? "" : variantClasses[variant]
      } ${className}`}
    >
      {children}
    </motion.span>
  );
}
