"use client";

import { motion } from "framer-motion";
import AnimatedCounter from "@/components/motion/AnimatedCounter";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  color?: string;
  delay?: number;
  suffix?: string;
}

export default function StatCard({
  label,
  value,
  icon: Icon,
  color = "#15803d",
  delay = 0,
  suffix = "",
}: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay, ease: "easeOut" }}
      className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-shadow"
    >
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ backgroundColor: color + "15" }}
        >
          <Icon className="w-4.5 h-4.5" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-gray-900">
        <AnimatedCounter to={value} suffix={suffix} />
      </p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </motion.div>
  );
}
