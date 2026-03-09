"use client";

import { motion } from "framer-motion";
import type { ButtonHTMLAttributes, ReactNode } from "react";

interface AnimatedButtonProps
  extends Omit<
    ButtonHTMLAttributes<HTMLButtonElement>,
    "onAnimationStart" | "onDragStart" | "onDrag" | "onDragEnd"
  > {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  loading?: boolean;
  children: ReactNode;
  color?: string;
}

const baseClasses =
  "inline-flex items-center justify-center gap-2 font-medium rounded-xl px-5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

const variantClasses: Record<string, string> = {
  primary:
    "bg-green-700 text-white hover:bg-green-800 focus:ring-green-600 shadow-sm",
  secondary:
    "border-2 border-green-700 text-green-700 hover:bg-green-50 focus:ring-green-600",
  danger:
    "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-sm",
  ghost:
    "text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-400",
};

export default function AnimatedButton({
  variant = "primary",
  loading = false,
  children,
  color,
  style,
  className = "",
  disabled,
  ...props
}: AnimatedButtonProps) {
  const dynamicStyle =
    color && variant === "primary"
      ? { backgroundColor: color, ...style }
      : style;

  return (
    <motion.button
      whileHover={{ scale: disabled || loading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || loading ? 1 : 0.97 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      disabled={disabled || loading}
      style={dynamicStyle}
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
          <span>Chargement...</span>
        </>
      ) : (
        children
      )}
    </motion.button>
  );
}
