"use client";

import React from "react";
import { motion } from "framer-motion";

interface BorderGlowProps {
  children: React.ReactNode;
  className?: string;
  glowColor?: string; // Tailwind color class, e.g., 'from-indigo-500 via-purple-500 to-pink-500'
  hexColor?: string; // Raw hex color value, e.g. '#ef4444'
  duration?: number;
  animate?: boolean;
}

export default function BorderGlow({
  children,
  className = "",
  glowColor = "from-indigo-500/50 via-purple-500/50 to-pink-500/50",
  hexColor,
  duration = 4,
  animate = true,
}: BorderGlowProps) {
  const cleanHex = hexColor ? (hexColor.startsWith("#") ? hexColor : `#${hexColor}`) : "";
  const inlineGradient = cleanHex
    ? `linear-gradient(to right, ${cleanHex}20, ${cleanHex}60, ${cleanHex}20)`
    : undefined;

  return (
    <div className={`relative group rounded-2xl overflow-hidden p-[1px] ${className}`}>
      {/* Background glowing layer */}
      <motion.div
        className={`absolute inset-0 opacity-40 blur-sm rounded-2xl group-hover:opacity-100 transition-opacity ${
          hexColor ? "" : `bg-gradient-to-r ${glowColor}`
        }`}
        animate={
          animate
            ? {
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }
            : {}
        }
        transition={
          animate
            ? {
                duration,
                repeat: Infinity,
                ease: "linear",
              }
            : {}
        }
        style={{
          backgroundSize: "200% 200%",
          backgroundImage: inlineGradient,
        }}
      />

      {/* Border overlay layer */}
      <div
        className={`absolute inset-0 rounded-2xl opacity-10 group-hover:opacity-50 transition-opacity ${
          hexColor ? "" : `bg-gradient-to-r ${glowColor}`
        }`}
        style={{
          backgroundSize: "200% 200%",
          backgroundImage: inlineGradient,
        }}
      />

      {/* Main card content container */}
      <div className="relative bg-white/70 dark:bg-neutral-900/70 backdrop-blur-xl rounded-[15px] p-6 h-full w-full text-neutral-800 dark:text-neutral-100">
        {children}
      </div>
    </div>
  );
}
