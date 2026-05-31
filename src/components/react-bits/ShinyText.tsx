"use client";

import React from "react";

interface ShinyTextProps {
  text: string;
  className?: string;
  speed?: number; // in seconds
}

export default function ShinyText({ text, className = "", speed = 4 }: ShinyTextProps) {
  return (
    <span
      className={`inline-block relative overflow-hidden bg-clip-text text-transparent bg-gradient-to-r from-neutral-800 via-neutral-100 to-neutral-800 dark:from-neutral-400 dark:via-white dark:to-neutral-400 bg-[length:200%_auto] animate-shiny ${className}`}
      style={{
        animationDuration: `${speed}s`,
        animationIterationCount: "infinite",
        animationTimingFunction: "linear",
      }}
    >
      {text}
    </span>
  );
}
