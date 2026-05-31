"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppState } from "@/context/AppStateContext";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Flame,
  Plus,
  BookOpen,
  FileText,
  CheckSquare,
  Timer,
  CheckCircle,
  Clock,
  ArrowRight,
  TrendingUp,
} from "lucide-react";
import ShinyText from "@/components/react-bits/ShinyText";
import BorderGlow from "@/components/react-bits/BorderGlow";
import Dropdown from "@/components/ui/Dropdown";

export default function DashboardPage() {
  const { user } = useAuth();
  const {
    subjects,
    notes,
    tasks,
    focusSessions,
    streak,
    addNote,
    addTask,
    toggleTask,
  } = useAppState();
  const router = useRouter();

  // Hydration safety mount state
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState("Hello");

  // Task creation local state
  const [quickTaskTitle, setQuickTaskTitle] = useState("");
  const [quickTaskPriority, setQuickTaskPriority] = useState<"low" | "medium" | "high">("medium");
  const [quickTaskSubject, setQuickTaskSubject] = useState("");
  const [showQuickTaskForm, setShowQuickTaskForm] = useState(false);

  // Dropdown options
  const priorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  const subjectOptions = [
    { value: "", label: "No Subject" },
    ...subjects.map((s) => ({
      value: s.id,
      label: s.name,
      color: s.color,
    })),
  ];

  useEffect(() => {
    setMounted(true);
    // Greeting based on time of day on client side only
    const hours = new Date().getHours();
    if (hours < 12) setGreeting("Good morning");
    else if (hours < 18) setGreeting("Good afternoon");
    else setGreeting("Good evening");
  }, []);

  // Quick Action: Create Note and redirect
  const handleQuickCreateNote = () => {
    const defaultSubject = subjects[0]?.id || "uncategorized";
    const newNote = addNote("Untitled Note", "", defaultSubject);
    router.push(`/notes?id=${newNote.id}`);
  };

  // Quick Action: Add Task
  const handleQuickAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTaskTitle.trim()) return;

    addTask(quickTaskTitle, quickTaskPriority, undefined, quickTaskSubject || "uncategorized");
    setQuickTaskTitle("");
    setShowQuickTaskForm(false);
  };

  // Calculate Focus Stats
  const totalFocusMinutes = focusSessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const totalFocusHours = (totalFocusMinutes / 60).toFixed(1);
  const sessionsCount = focusSessions.length;

  const completedTasksCount = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed);

  return (
    <div className="space-y-8 select-none">
      {/* Welcome Hero Grid */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
            <span>{greeting},</span>
            <ShinyText text={user?.name || "Student"} speed={4} className="font-extrabold" />
            <span className="inline-block animate-bounce">👋</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Welcome to your academic cockpit. Here is your productivity summary for today.
          </p>
        </div>

        {/* Study Streak Badge */}
        <div className="flex items-center space-x-3 px-4 py-2.5 rounded-full bg-orange-500/10 border border-orange-500/25 text-orange-600 dark:text-orange-400 w-fit">
          <Flame className="w-5 h-5 fill-current animate-pulse" />
          <span className="text-sm font-bold tracking-tight">
            {streak} Day Study Streak
          </span>
        </div>
      </div>

      {/* Metrics Row (4 cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <BorderGlow glowColor="from-indigo-500/20 via-purple-500/20 to-pink-500/20" duration={6} className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:shadow-indigo-500/5 dark:hover:shadow-violet-500/10">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400/85 dark:text-neutral-500">Focus Hours</p>
                <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-neutral-800 dark:text-neutral-100">{totalFocusHours} hrs</h3>
              </div>
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all duration-300 shadow-inner">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
              <span>{sessionsCount} sessions</span>
              <span className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold">
                {sessionsCount > 0 ? "⚡ Great focus!" : "🎯 Ready?"}
              </span>
            </div>
          </div>
        </BorderGlow>

        <BorderGlow glowColor="from-emerald-500/20 via-teal-500/20 to-cyan-500/20" duration={6} className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:shadow-emerald-500/5 dark:hover:shadow-emerald-500/10">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400/85 dark:text-neutral-500">Completed Tasks</p>
                <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-neutral-800 dark:text-neutral-100">{completedTasksCount} / {tasks.length}</h3>
              </div>
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 group-hover:scale-110 group-hover:bg-emerald-500/20 transition-all duration-300 shadow-inner">
                <CheckCircle className="w-5 h-5" />
              </div>
            </div>
            
            <div className="mt-3">
              <div className="w-full bg-neutral-200/50 dark:bg-neutral-800/80 h-1.5 rounded-full overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500" 
                  style={{ width: `${tasks.length ? (completedTasksCount / tasks.length) * 100 : 0}%` }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-neutral-400">
                <span>{pendingTasks.length} pending</span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                  {tasks.length && completedTasksCount === tasks.length ? "✨ All done!" : "📈 Keep going"}
                </span>
              </div>
            </div>
          </div>
        </BorderGlow>

        <BorderGlow glowColor="from-blue-500/20 via-sky-500/20 to-indigo-500/20" duration={6} className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:shadow-blue-500/5 dark:hover:shadow-blue-500/10">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400/85 dark:text-neutral-500">Subjects Enrolled</p>
                <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-neutral-800 dark:text-neutral-100">{subjects.length}</h3>
              </div>
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-500/10 text-blue-500 border border-blue-500/20 group-hover:scale-110 group-hover:bg-blue-500/20 transition-all duration-300 shadow-inner">
                <BookOpen className="w-5 h-5" />
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
              <div className="flex -space-x-1.5 overflow-hidden">
                {subjects.slice(0, 4).map((s) => (
                  <span
                    key={s.id}
                    className="w-2.5 h-2.5 rounded-full border border-white dark:border-neutral-900 shadow-sm"
                    style={{ backgroundColor: s.color }}
                    title={s.name}
                  />
                ))}
                {subjects.length > 4 && (
                  <span className="text-[8px] font-bold text-neutral-400 pl-1.5 flex items-center">
                    +{subjects.length - 4}
                  </span>
                )}
                {subjects.length === 0 && <span>No subjects</span>}
              </div>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold">Workspaces</span>
            </div>
          </div>
        </BorderGlow>

        <BorderGlow glowColor="from-rose-500/20 via-pink-500/20 to-violet-500/20" duration={6} className="hover:-translate-y-1 hover:shadow-lg transition-all duration-300 hover:shadow-rose-500/5 dark:hover:shadow-rose-500/10">
          <div className="flex flex-col h-full justify-between">
            <div className="flex items-center justify-between w-full">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-neutral-400/85 dark:text-neutral-500">Notes Created</p>
                <h3 className="text-2xl font-extrabold tracking-tight mt-1 text-neutral-800 dark:text-neutral-100">{notes.length}</h3>
              </div>
              <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-rose-500/10 text-rose-500 border border-rose-500/20 group-hover:scale-110 group-hover:bg-rose-500/20 transition-all duration-300 shadow-inner">
                <FileText className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between text-xs text-neutral-400">
              <span>Total notes</span>
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold">
                {notes.length > 0 ? "✍️ Review" : "📝 Empty"}
              </span>
            </div>
          </div>
        </BorderGlow>
      </div>

      {/* Main Grid: Left column (Quick actions + Tasks), Right column (Notes + Focus Promo) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Quick Actions & Pending Tasks (Span 2) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Quick Actions Panel */}
          <div className="glass-panel rounded-2xl p-6">
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4 flex items-center space-x-2">
              <Sparkles className="w-5 h-5 text-indigo-500" />
              <span>Quick Actions</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <button
                onClick={handleQuickCreateNote}
                className="relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/55 hover:border-indigo-500/40 dark:hover:border-violet-500/40 hover:bg-white/80 dark:hover:bg-neutral-900/80 transition-all duration-300 text-center group cursor-pointer hover:shadow-lg hover:-translate-y-1"
              >
                {/* Subtle Hover Gradient Glow */}
                <div className="absolute -inset-px bg-gradient-to-r from-indigo-500/5 to-purple-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 p-3 bg-indigo-500/10 group-hover:bg-indigo-500/20 group-hover:scale-110 rounded-xl text-indigo-500 mb-2.5 transition-all duration-300 shadow-inner">
                  <Plus className="w-5 h-5" />
                </div>
                <span className="relative z-10 text-sm font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">Create Note</span>
                <span className="relative z-10 text-[10px] text-neutral-400 mt-1 font-medium">Notion-style page</span>
              </button>

              <button
                onClick={() => setShowQuickTaskForm(!showQuickTaskForm)}
                className="relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/55 hover:border-emerald-500/40 dark:hover:border-emerald-500/40 hover:bg-white/80 dark:hover:bg-neutral-900/80 transition-all duration-300 text-center group cursor-pointer hover:shadow-lg hover:-translate-y-1"
              >
                {/* Subtle Hover Gradient Glow */}
                <div className="absolute -inset-px bg-gradient-to-r from-emerald-500/5 to-teal-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 p-3 bg-emerald-500/10 group-hover:bg-emerald-500/20 group-hover:scale-110 rounded-xl text-emerald-500 mb-2.5 transition-all duration-300 shadow-inner">
                  <CheckSquare className="w-5 h-5" />
                </div>
                <span className="relative z-10 text-sm font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">Add Task</span>
                <span className="relative z-10 text-[10px] text-neutral-400 mt-1 font-medium">Quick checklist</span>
              </button>

              <button
                onClick={() => router.push("/focus")}
                className="relative overflow-hidden flex flex-col items-center justify-center p-5 rounded-2xl bg-neutral-50/50 dark:bg-neutral-900/40 border border-neutral-200/50 dark:border-neutral-800/55 hover:border-amber-500/40 dark:hover:border-orange-500/40 hover:bg-white/80 dark:hover:bg-neutral-900/80 transition-all duration-300 text-center group cursor-pointer hover:shadow-lg hover:-translate-y-1"
              >
                {/* Subtle Hover Gradient Glow */}
                <div className="absolute -inset-px bg-gradient-to-r from-amber-500/5 to-orange-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="relative z-10 p-3 bg-amber-500/10 group-hover:bg-amber-500/20 group-hover:scale-110 rounded-xl text-amber-500 mb-2.5 transition-all duration-300 shadow-inner">
                  <Timer className="w-5 h-5" />
                </div>
                <span className="relative z-10 text-sm font-bold text-neutral-800 dark:text-neutral-200 tracking-tight">Start Focus</span>
                <span className="relative z-10 text-[10px] text-neutral-400 mt-1 font-medium">Pomodoro timer</span>
              </button>
            </div>

            {/* Quick Task Creation Popover Form */}
            {showQuickTaskForm && (
              <form onSubmit={handleQuickAddTask} className="mt-5 p-5 rounded-2xl bg-neutral-50/60 dark:bg-neutral-900/50 border border-neutral-200/50 dark:border-neutral-800/55 backdrop-blur-md space-y-4 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    required
                    placeholder="What needs to be done?"
                    value={quickTaskTitle}
                    onChange={(e) => setQuickTaskTitle(e.target.value)}
                    className="flex-1 px-4 py-2.5 text-xs rounded-xl glass-input text-neutral-800 dark:text-neutral-200 focus:ring-2 focus:ring-indigo-500/20 outline-none"
                  />
                  <div className="flex gap-2">
                    <Dropdown
                      value={quickTaskPriority}
                      onChange={(val) => setQuickTaskPriority(val as any)}
                      options={priorityOptions}
                      className="w-full sm:w-28"
                      buttonClassName="py-2.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 text-xs font-semibold"
                    />
                    <Dropdown
                      value={quickTaskSubject}
                      onChange={setQuickTaskSubject}
                      options={subjectOptions}
                      className="w-full sm:w-36"
                      buttonClassName="py-2.5 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 text-xs font-semibold"
                    />
                  </div>
                </div>
                <div className="flex justify-end space-x-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowQuickTaskForm(false)}
                    className="px-4 py-2 text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-95 rounded-xl text-white font-semibold cursor-pointer transition-all"
                  >
                    Add Task
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Pending Tasks Panel */}
          <div className="glass-panel rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
                <CheckSquare className="w-5 h-5 text-emerald-500" />
                <span>Pending Checklist</span>
              </h2>
              <button
                onClick={() => router.push("/tasks")}
                className="text-xs text-indigo-500 hover:underline flex items-center font-semibold"
              >
                <span>View all</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            {pendingTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-center bg-neutral-50/20 dark:bg-neutral-900/10 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl">
                <CheckCircle className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">All caught up!</p>
                <p className="text-xs text-neutral-400 mt-0.5">Enjoy your day! 🎉</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pendingTasks.slice(0, 4).map((task) => {
                  const taskSub = subjects.find((s) => s.id === task.subjectId);

                  return (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 rounded-xl bg-neutral-50/40 dark:bg-neutral-900/20 border border-neutral-200/40 dark:border-neutral-800/20 hover:bg-white/70 dark:hover:bg-neutral-900/60 hover:shadow-sm hover:border-indigo-500/20 transition-all duration-200"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={task.completed}
                          onChange={() => toggleTask(task.id)}
                          className="cursor-pointer shrink-0"
                        />
                        <span className="text-sm font-medium text-neutral-800 dark:text-neutral-200">{task.title}</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        {taskSub && (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold border flex items-center gap-1"
                            style={{
                              borderColor: `${taskSub.color}25`,
                              backgroundColor: `${taskSub.color}10`,
                              color: taskSub.color,
                            }}
                          >
                            {taskSub.name}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center ${
                            task.priority === "high"
                              ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                              : task.priority === "medium"
                              ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                          }`}
                        >
                          <span className={`w-1 h-1 rounded-full mr-1 inline-block shrink-0 ${
                            task.priority === "high"
                              ? "bg-rose-500"
                              : task.priority === "medium"
                              ? "bg-amber-500"
                              : "bg-blue-500"
                          }`} />
                          {task.priority}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Recent Notes */}
        <div className="space-y-6">
          <div className="glass-panel rounded-2xl p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                <span>Recent Notes</span>
              </h2>
              <button
                onClick={() => router.push("/notes")}
                className="text-xs text-indigo-500 hover:underline flex items-center font-semibold"
              >
                <span>Write</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-neutral-50/20 dark:bg-neutral-900/10 border border-neutral-200/50 dark:border-neutral-800/40 rounded-2xl">
                <FileText className="w-8 h-8 text-neutral-300 dark:text-neutral-700 mb-2" />
                <p className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">No notes yet</p>
                <p className="text-xs text-neutral-400 mt-0.5">Click 'Create Note' to start writing.</p>
              </div>
            ) : (
              <div className="flex-1 space-y-3">
                {notes.slice(0, 3).map((note) => {
                  const noteSub = subjects.find((s) => s.id === note.subjectId);

                  return (
                    <div
                      key={note.id}
                      onClick={() => router.push(`/notes?id=${note.id}`)}
                      className="p-4 rounded-xl bg-neutral-50/40 dark:bg-neutral-900/20 border border-neutral-200/40 dark:border-neutral-800/20 hover:bg-white/70 dark:hover:bg-neutral-900/60 hover:shadow-md hover:border-indigo-500/20 hover:translate-x-1.5 transition-all duration-300 cursor-pointer"
                    >
                      <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200 truncate flex items-center gap-1.5">
                        <FileText className="w-3.5 h-3.5 text-neutral-400 dark:text-neutral-500 shrink-0" />
                        <span>{note.title || "Untitled Note"}</span>
                      </h4>
                      <p className="text-xs text-neutral-400 dark:text-neutral-500 line-clamp-2 mt-1.5 leading-relaxed">
                        {note.content.replace(/<[^>]*>/g, " ").trim() || "Empty note content..."}
                      </p>
                      <div className="flex items-center justify-between mt-4 pt-3 border-t border-neutral-800/10 dark:border-white/5">
                        <span className="text-[10px] text-neutral-400/80 font-medium">
                          {mounted
                            ? new Date(note.lastModified).toLocaleDateString(undefined, {
                                month: "short",
                                day: "numeric",
                              })
                            : ""}
                        </span>
                        {noteSub && (
                          <span
                            className="text-[9px] px-2 py-0.5 rounded-full font-bold border"
                            style={{
                              borderColor: `${noteSub.color}25`,
                              backgroundColor: `${noteSub.color}10`,
                              color: noteSub.color,
                            }}
                          >
                            {noteSub.name}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
