"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import ShinyText from "@/components/react-bits/ShinyText";

export default function SplashScreen() {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Increment progress bar
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsVisible(false), 200); // Small delay before hiding
          return 100;
        }
        return prev + 4;
      });
    }, 40);

    return () => clearInterval(interval);
  }, []);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-zinc-50 dark:bg-[#0f121d] select-none"
        >
          <div className="flex flex-col items-center space-y-6 max-w-xs w-full px-6">
            
            {/* Pulsing Glowing Logo */}
            <motion.div
              animate={{
                scale: [1, 1.03, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-20 h-20 shadow-2xl z-10"
            >
              <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
              <img
                src="/logo.png"
                alt="Notela Logo"
                className="w-full h-full object-cover rounded-2xl relative z-10 border border-white/10"
              />
            </motion.div>

            {/* Title */}
            <div className="text-center">
              <ShinyText
                text="Notela"
                className="font-extrabold text-3xl tracking-tight"
                speed={3}
              />
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 uppercase tracking-widest font-bold mt-1">
                Academic Workspace OS
              </p>
            </div>

            {/* Custom Progress Bar */}
            <div className="w-full h-[3px] bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden relative">
              <motion.div
                className="h-full bg-gradient-to-r from-indigo-500 to-purple-600"
                style={{ width: `${progress}%` }}
                transition={{ ease: "easeInOut" }}
              />
            </div>

            <span className="text-[10px] font-semibold text-neutral-400 dark:text-neutral-500">
              {progress}% Loaded
            </span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
