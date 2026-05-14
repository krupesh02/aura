"use client";

import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface Props {
  title: string;
  value: string | number;
  icon: LucideIcon;
  color?: string;
  trend?: string;
}

export function StatsCard({ title, value, icon: Icon, color = "#6B8BA4", trend }: Props) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-8 rounded-[2rem] border border-[#E8E2D6] transition-all hover:shadow-xl group"
      style={{
        background: "white",
      }}
    >
      <div className="flex items-start justify-between mb-8">
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
          style={{ background: `${color}15` }}
        >
          <Icon className="w-5 h-5" style={{ color: color }} />
        </div>
        {trend && (
          <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full bg-[#F5F1E1] text-[#D2A078]">
            {trend}
          </span>
        )}
      </div>
      <p className="text-4xl font-medium tracking-tighter text-[#4A443A] mb-2">
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-[#827A6E]">
        {title}
      </p>
    </motion.div>
  );
}
