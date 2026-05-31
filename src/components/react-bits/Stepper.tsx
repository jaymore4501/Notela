"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";

interface Step {
  label: string;
  description?: string;
  content: React.ReactNode;
}

interface StepperProps {
  steps: Step[];
  activeStep: number;
  onStepChange?: (step: number) => void;
  className?: string;
}

export default function Stepper({
  steps,
  activeStep,
  className = "",
}: StepperProps) {
  return (
    <div className={`w-full flex flex-col space-y-6 ${className}`}>
      {/* Header step progress */}
      <div className="flex items-center justify-between w-full px-2">
        {steps.map((step, index) => {
          const isCompleted = activeStep > index;
          const isActive = activeStep === index;

          return (
            <React.Fragment key={index}>
              {/* Step circle */}
              <div className="flex flex-col items-center space-y-1.5 z-10">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center border-2 text-sm font-semibold transition-all duration-300 ${
                    isCompleted
                      ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                      : isActive
                      ? "bg-indigo-50 dark:bg-indigo-950/30 border-indigo-600 dark:border-indigo-500 text-indigo-600 dark:text-indigo-400 ring-4 ring-indigo-500/10"
                      : "bg-neutral-100 dark:bg-white/5 border-neutral-200 dark:border-white/10 text-neutral-400 dark:text-neutral-500"
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:inline transition-colors duration-300 ${
                    isActive
                      ? "text-indigo-600 dark:text-indigo-400"
                      : isCompleted
                      ? "text-neutral-700 dark:text-neutral-300"
                      : "text-neutral-400 dark:text-neutral-600"
                  }`}
                >
                  {step.label}
                </span>
              </div>

              {/* Connecting line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-[2px] bg-neutral-200 dark:bg-neutral-800 mx-2 relative -translate-y-2">
                  <motion.div
                    className="absolute top-0 left-0 h-full bg-indigo-600"
                    initial={{ width: "0%" }}
                    animate={{
                      width: isCompleted ? "100%" : "0%",
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Content panel with slide transitions */}
      <div className="relative min-h-[220px] overflow-hidden p-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="w-full h-full"
          >
            {steps[activeStep].content}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
