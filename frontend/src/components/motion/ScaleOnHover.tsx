"use client";

import { motion } from "framer-motion";
import type { ReactNode } from "react";

interface ScaleOnHoverProps {
  children: ReactNode;
  scale?: number;
  className?: string;
}

export default function ScaleOnHover({
  children,
  scale = 1.03,
  className,
}: ScaleOnHoverProps) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
