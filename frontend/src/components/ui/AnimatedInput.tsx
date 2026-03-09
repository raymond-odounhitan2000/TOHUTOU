"use client";

import { motion } from "framer-motion";
import type { InputHTMLAttributes } from "react";

interface AnimatedInputProps
  extends Omit<
    InputHTMLAttributes<HTMLInputElement>,
    "onAnimationStart" | "onDragStart" | "onDrag" | "onDragEnd"
  > {
  label: string;
  error?: string;
  color?: string;
  required?: boolean;
}

export default function AnimatedInput({
  label,
  error,
  color,
  required,
  id,
  className = "",
  ...props
}: AnimatedInputProps) {
  return (
    <div>
      <label
        htmlFor={id}
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <motion.input
        whileFocus={{ scale: 1.01 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        id={id}
        className={`w-full border rounded-xl px-3.5 py-2.5 text-sm transition-colors focus:outline-none focus:ring-2 focus:border-transparent ${
          error
            ? "border-red-400 bg-red-50 focus:ring-red-400"
            : "border-gray-300 focus:ring-green-600"
        } ${className}`}
        style={
          color && !error
            ? ({ "--tw-ring-color": color } as React.CSSProperties)
            : undefined
        }
        {...props}
      />
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-red-500 mt-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
