"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  FileText,
  BookOpen,
  CheckSquare,
  Timer,
  BarChart2,
  Settings,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Sparkles,
  Activity,
} from "lucide-react";
import ShinyText from "../react-bits/ShinyText";

const navItems = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Subjects", href: "/subjects", icon: BookOpen },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Activities", href: "/activities", icon: Activity },
  { name: "Focus Timer", href: "/focus", icon: Timer },
  { name: "Analytics", href: "/analytics", icon: BarChart2 },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleSidebar = () => setIsCollapsed(!isCollapsed);
  const toggleMobile = () => setIsMobileOpen(!isMobileOpen);

  return (
    <>
      {/* Mobile Top Header (only visible on mobile/tablet) */}
      <div className="lg:hidden flex items-center justify-between px-6 h-16 glass-navbar w-full shrink-0 z-30 select-none">
        <div className="flex items-center space-x-2.5">
          <img src="/logo.png" className="w-8 h-8 rounded-xl object-cover" alt="logo" />
          <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent">
            Notela
          </span>
        </div>
        <button
          onClick={toggleMobile}
          className="p-2 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 text-neutral-600 dark:text-neutral-300"
        >
          {isMobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Desktop Sidebar (hidden on mobile) */}
      <motion.aside
        animate={{ width: isCollapsed ? 76 : 240 }}
        className="hidden lg:flex flex-col h-screen glass-panel border-r border-white/10 dark:border-neutral-900/40 relative z-30 shrink-0 select-none"
      >
        {/* Sidebar Header / Logo */}
        <div className="h-16 flex items-center px-6 border-b border-white/10 dark:border-neutral-900/20">
          <div className="flex items-center space-x-3 overflow-hidden">
            <img
              src="/logo.png"
              className={`object-cover shrink-0 border border-black/5 dark:border-white/5 transition-all duration-300 ${
                isCollapsed ? "w-7 h-7 rounded-lg" : "w-9 h-9 rounded-xl"
              }`}
              alt="logo"
            />
            {!isCollapsed && (
              <ShinyText
                text="Notela"
                className="font-extrabold text-2xl tracking-tight"
              />
            )}
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 py-6 space-y-2 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link key={item.name} href={item.href}>
                <div
                  className={`flex items-center space-x-3 px-3 py-3 rounded-xl transition-all duration-200 cursor-pointer ${
                    isActive
                      ? "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 font-semibold"
                      : "text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/5"
                  }`}
                >
                  <Icon className="w-5 h-5 shrink-0" />
                  {!isCollapsed && <span className="text-sm">{item.name}</span>}
                </div>
              </Link>
            );
          })}
        </nav>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 bottom-8 w-6 h-6 rounded-full bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 flex items-center justify-center text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 shadow-md cursor-pointer"
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>
      </motion.aside>

      {/* Mobile Drawer (visible when isMobileOpen is true) */}
      <AnimatePresence>
        {isMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={toggleMobile}
              className="lg:hidden fixed inset-0 bg-black z-55"
            />

            {/* Sidebar drawer content */}
            <motion.div
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed inset-y-0 left-0 w-64 glass-panel border-r border-white/20 dark:border-neutral-800/20 z-60 flex flex-col select-none"
            >
              <div className="h-16 flex items-center justify-between px-6 border-b border-white/10 dark:border-neutral-800/10">
                <div className="flex items-center space-x-2.5">
                  <img src="/logo.png" className="w-8 h-8 rounded-xl object-cover" alt="logo" />
                  <span className="font-bold text-xl text-neutral-800 dark:text-neutral-200">
                    Notela
                  </span>
                </div>
                <button
                  onClick={toggleMobile}
                  className="p-1 rounded-md text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                  const isActive = pathname.startsWith(item.href);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setIsMobileOpen(false)}
                    >
                      <div
                        className={`flex items-center space-x-3 px-4 py-3 rounded-xl cursor-pointer ${
                          isActive
                            ? "bg-indigo-600/15 text-indigo-600 dark:bg-indigo-500/25 dark:text-indigo-400 font-semibold"
                            : "text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-900"
                        }`}
                      >
                        <Icon className="w-5 h-5 shrink-0" />
                        <span className="text-sm">{item.name}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
