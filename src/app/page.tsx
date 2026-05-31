"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, ArrowRight, BookOpen, CheckSquare, Timer, BarChart2 } from "lucide-react";
import ShinyText from "@/components/react-bits/ShinyText";
import BorderGlow from "@/components/react-bits/BorderGlow";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 md:px-8 relative overflow-hidden select-none">
      {/* Landing Container */}
      <div className="w-full max-w-4xl flex flex-col items-center space-y-12 py-16 relative z-10">
        
        {/* Logo Icon */}
        <div className="flex items-center space-x-3">
          <div className="relative w-14 h-14 shadow-lg">
            <div className="absolute inset-0 bg-indigo-500/20 blur-xl rounded-full" />
            <img
              src="/logo.png"
              alt="Notela Logo"
              className="w-full h-full object-cover rounded-2xl relative z-10 border border-white/10"
            />
          </div>
          <span className="font-extrabold text-4xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Notela
          </span>
        </div>

        {/* Hero Section */}
        <div className="text-center max-w-2xl space-y-4">
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight">
            The Personal{" "}
            <ShinyText text="Academic Workspace" speed={4} />
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-base md:text-lg leading-relaxed">
            Organize subjects, format notion-style notes, track tasks, run Pomodoro focus timers, and monitor study analytics in one beautiful, calm dashboard.
          </p>
        </div>

        {/* Feature Cards Grid wrapped in BorderGlow */}
        <div className="w-full max-w-3xl grid grid-cols-1 md:grid-cols-2 gap-4">
          <BorderGlow glowColor="from-indigo-500/20 via-purple-500/20 to-pink-500/20" duration={6}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-indigo-500">
                <BookOpen className="w-5 h-5" />
                <span className="font-semibold text-sm">Subject Workspaces</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Centralize files, notes, and tasks mapped to academic subjects like Math, Physics, or Computer Science.
              </p>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="from-emerald-500/20 via-teal-500/20 to-cyan-500/20" duration={6}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-emerald-500">
                <CheckSquare className="w-5 h-5" />
                <span className="font-semibold text-sm">Lightweight Tasks</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Create and filter checklists with high/medium/low priority tags, subjects, and due dates.
              </p>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="from-amber-500/20 via-orange-500/20 to-rose-500/20" duration={6}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-amber-500">
                <Timer className="w-5 h-5" />
                <span className="font-semibold text-sm">Focus Pomodoro</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Start structured study slots, customize short/long break timers, and hear soft synthesized audio ticks.
              </p>
            </div>
          </BorderGlow>

          <BorderGlow glowColor="from-violet-500/20 via-fuchsia-500/20 to-pink-500/20" duration={6}>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-violet-500">
                <BarChart2 className="w-5 h-5" />
                <span className="font-semibold text-sm">Productivity Insights</span>
              </div>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                Review study trends, completed tasks count, and your consecutive focus streak in sleek Recharts.
              </p>
            </div>
          </BorderGlow>
        </div>

        {/* CTA Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-4 z-10">
          {user ? (
            <Link href="/dashboard">
              <button className="flex items-center space-x-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer">
                <span>Go to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
          ) : (
            <>
              <Link href="/signup">
                <button className="flex items-center space-x-2 px-6 py-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer">
                  <span>Get Started for Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
              <Link href="/login">
                <button className="px-6 py-3 rounded-full bg-white/10 dark:bg-neutral-900/40 hover:bg-white/20 dark:hover:bg-neutral-800/40 text-neutral-800 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-800 font-medium text-sm transition-all cursor-pointer">
                  <span>Sign In</span>
                </button>
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
