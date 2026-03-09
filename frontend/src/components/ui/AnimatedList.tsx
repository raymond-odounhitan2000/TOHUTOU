"use client";

import { motion, AnimatePresence } from "framer-motion";
import type { ReactNode } from "react";

interface AnimatedListProps {
  children: ReactNode[];
  className?: string;
}

export default function AnimatedList({
  children,
  className = "",
}: AnimatedListProps) {
  return (
    <div className={`space-y-3 ${className}`}>
      <AnimatePresence mode="popLayout">
        {children.map((child, i) => (
          <motion.div
            key={(child as React.ReactElement)?.key ?? i}
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
            transition={{ duration: 0.35, delay: i * 0.06, ease: "easeOut" }}
            layout
          >
            {child}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
