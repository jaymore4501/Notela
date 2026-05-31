"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppState } from "@/context/AppStateContext";
import { useTheme } from "next-themes";
import { Search, Sun, Moon, LogOut, Settings, BookOpen, CheckSquare, FileText } from "lucide-react";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const { user, logout } = useAuth();
  const { notes, tasks, subjects } = useAppState();
  const { theme, setTheme } = useTheme();
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close menus when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Keyboard shortcut listener to focus search input on Cmd+K or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        if (input) {
          input.focus();
          setShowResults(true);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const handleResultClick = (type: "note" | "task" | "subject", id: string) => {
    setShowResults(false);
    setSearchQuery("");
    if (type === "note") {
      router.push(`/notes?id=${id}`);
    } else if (type === "task") {
      router.push(`/tasks`);
    } else if (type === "subject") {
      router.push(`/subjects?id=${id}`);
    }
  };

  // Filter search results
  const filteredNotes = searchQuery
    ? notes.filter(
        (n) =>
          n.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          n.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : [];

  const filteredTasks = searchQuery
    ? tasks.filter((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const filteredSubjects = searchQuery
    ? subjects.filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const hasResults = filteredNotes.length > 0 || filteredTasks.length > 0 || filteredSubjects.length > 0;

  if (!user) return null;

  return (
    <header className="glass-navbar sticky top-0 z-50 w-full h-16 flex items-center justify-between px-6 select-none">
      {/* Search Container */}
      <div ref={searchRef} className="relative w-full max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-neutral-400" />
          <input
            type="text"
            placeholder="Search notes, tasks, subjects... (Cmd+K)"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
            className="w-full pl-10 pr-4 py-2 text-sm rounded-full glass-input text-neutral-800 dark:text-neutral-200 placeholder-neutral-400"
          />
        </div>

        {/* Search Results Dropdown */}
        {showResults && searchQuery && (
          <div className="absolute top-12 left-0 w-full dropdown-panel rounded-2xl shadow-2xl p-2 max-h-96 overflow-y-auto z-50">
            {!hasResults ? (
              <div className="p-4 text-center text-sm text-neutral-400">
                No results found for "{searchQuery}"
              </div>
            ) : (
              <div className="space-y-3 p-1">
                {/* Notes */}
                {filteredNotes.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase px-2 mb-1">
                      Notes
                    </h3>
                    <div className="space-y-1">
                      {filteredNotes.slice(0, 3).map((note) => (
                        <button
                          key={note.id}
                          onClick={() => handleResultClick("note", note.id)}
                          className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200"
                        >
                          <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                          <span className="truncate">{note.title || "Untitled Note"}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tasks */}
                {filteredTasks.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase px-2 mb-1">
                      Tasks
                    </h3>
                    <div className="space-y-1">
                      {filteredTasks.slice(0, 3).map((task) => (
                        <button
                          key={task.id}
                          onClick={() => handleResultClick("task", task.id)}
                          className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200"
                        >
                          <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                          <span className="truncate">{task.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Subjects */}
                {filteredSubjects.length > 0 && (
                  <div>
                    <h3 className="text-[10px] font-bold tracking-wider text-neutral-400 uppercase px-2 mb-1">
                      Subjects
                    </h3>
                    <div className="space-y-1">
                      {filteredSubjects.slice(0, 3).map((sub) => (
                        <button
                          key={sub.id}
                          onClick={() => handleResultClick("subject", sub.id)}
                          className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-left text-sm hover:bg-black/5 dark:hover:bg-white/5 text-neutral-800 dark:text-neutral-200"
                        >
                          <BookOpen className="w-4 h-4 text-blue-400 shrink-0" />
                          <span className="truncate">{sub.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Right controls */}
      <div className="flex items-center space-x-4">
        {/* Theme Toggle */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/5 text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-100 transition-colors"
          aria-label="Toggle Theme"
        >
          {theme === "dark" ? (
            <Sun className="h-5 w-5" />
          ) : (
            <Moon className="h-5 w-5" />
          )}
        </button>

        {/* Profile Dropdown */}
        <div ref={profileMenuRef} className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center space-x-2 p-1.5 rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors text-left"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-sm font-semibold shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>
            <span className="hidden md:inline text-sm font-medium text-neutral-700 dark:text-neutral-300">
              {user.name}
            </span>
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-48 dropdown-panel rounded-2xl shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2 duration-100">
              <div className="px-4 py-2 border-b border-white/10 dark:border-neutral-800/10">
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-neutral-400 truncate">{user.email}</p>
              </div>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  router.push("/settings");
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-neutral-700 dark:text-neutral-300 hover:bg-black/5 dark:hover:bg-white/5 text-left"
              >
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </button>

              <button
                onClick={() => {
                  setShowProfileMenu(false);
                  logout();
                }}
                className="w-full flex items-center space-x-2 px-4 py-2 text-sm text-rose-500 hover:bg-rose-500/10 text-left"
              >
                <LogOut className="w-4 h-4" />
                <span>Log Out</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
