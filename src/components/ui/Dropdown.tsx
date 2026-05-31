"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface DropdownOption {
  value: string;
  label: string;
  icon?: React.ReactNode;
  color?: string;
}

interface DropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: DropdownOption[];
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  placeholder?: string;
  align?: "left" | "right";
  variant?: "default" | "transparent";
}

export default function Dropdown({
  value,
  onChange,
  options,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  placeholder = "Select option",
  align = "left",
  variant = "default",
}: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const selectedOption = options.find((opt) => opt.value === value);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  const isTransparent = variant === "transparent";
  const buttonStyles = isTransparent
    ? `w-full flex items-center justify-between px-1.5 py-1 text-xs font-semibold text-neutral-700 dark:text-neutral-300 hover:text-neutral-950 dark:hover:text-white hover:bg-neutral-500/10 rounded-lg cursor-pointer transition-all`
    : `w-full flex items-center justify-between px-3.5 py-2.5 text-xs font-medium rounded-xl glass-input text-neutral-800 dark:text-neutral-200 transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer ${
        isOpen ? "border-indigo-500/50 dark:border-indigo-400/50 bg-white/90 dark:bg-neutral-900/60" : ""
      }`;

  return (
    <div ref={containerRef} className={`relative inline-block ${className}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${buttonStyles} ${buttonClassName}`}
      >
        <span className="flex items-center space-x-2 truncate">
          {selectedOption?.color && (
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {selectedOption?.icon && (
            <span className="shrink-0 text-neutral-400 dark:text-neutral-500">
              {selectedOption.icon}
            </span>
          )}
          <span className="truncate">
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 ml-2 text-neutral-400 dark:text-neutral-500 transition-transform duration-200 shrink-0 ${
            isOpen ? "transform rotate-180 text-indigo-500" : ""
          }`}
        />
      </button>

      {/* Flyout Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className={`absolute z-50 mt-1.5 min-w-[180px] w-full max-h-[240px] overflow-y-auto rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl p-1.5 shadow-xl shadow-black/5 dark:shadow-black/20 ${
              align === "right" ? "right-0" : "left-0"
            } ${menuClassName}`}
          >
            <div className="space-y-0.5">
              {options.map((option) => {
                const isSelected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs rounded-lg transition-all cursor-pointer ${
                      isSelected
                        ? "bg-indigo-500 text-white font-semibold"
                        : "text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-white/5"
                    }`}
                  >
                    <span className="flex items-center space-x-2 truncate">
                      {option.color && (
                        <span
                          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            isSelected ? "border border-white/20" : ""
                          }`}
                          style={{ backgroundColor: option.color }}
                        />
                      )}
                      {option.icon && (
                        <span
                          className={`shrink-0 ${
                            isSelected ? "text-white" : "text-neutral-400 dark:text-neutral-500"
                          }`}
                        >
                          {option.icon}
                        </span>
                      )}
                      <span className="truncate">{option.label}</span>
                    </span>
                    {isSelected && (
                      <Check className="w-3.5 h-3.5 ml-2 shrink-0 text-white" />
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
