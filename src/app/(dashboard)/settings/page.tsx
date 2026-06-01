"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppState } from "@/context/AppStateContext";
import { useTheme } from "next-themes";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  Monitor,
  Eye,
  CheckCircle2,
  Lock,
  Timer,
  BookOpen,
  Database,
  Plus,
  Trash2,
  Download,
  RotateCcw,
  Sparkles,
  Upload,
} from "lucide-react";
import BorderGlow from "@/components/react-bits/BorderGlow";

const COLOR_OPTIONS = [
  "#ef4444", // Red
  "#22c55e", // Green
  "#3b82f6", // Blue
  "#f59e0b", // Amber
  "#a855f7", // Purple
  "#06b6d4", // Cyan
  "#ec4899", // Pink
  "#84cc16", // Lime
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#eab308", // Yellow
  "#dc2626", // Crimson
  "#0ea5e9", // Sky Blue
  "#d946ef", // Fuchsia
  "#65a30d", // Olive
  "#7c3aed", // Violet
  "#0891b2", // Dark Cyan
  "#ea580c", // Dark Orange
  "#16a34a", // Forest Green
];

export default function SettingsPage() {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { theme, setTheme } = useTheme();
  const {
    subjects,
    addSubject,
    deleteSubject,
    pomodoroConfig,
    updatePomodoroConfig,
    resetDatabase,
    notes,
    tasks,
    focusSessions,
    importJSONData,
  } = useAppState();

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Active settings tab
  const [activeTab, setActiveTab] = useState<"profile" | "pomodoro" | "subjects" | "database">("profile");

  // Profile preferences state
  const [name, setName] = useState(user?.name || "");
  const [focusGoal, setFocusGoal] = useState(user?.focusGoal || 60);

  // Password state
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Pomodoro config state
  const [pomoFocus, setPomoFocus] = useState(pomodoroConfig.focus);
  const [pomoShort, setPomoShort] = useState(pomodoroConfig.shortBreak);
  const [pomoLong, setPomoLong] = useState(pomodoroConfig.longBreak);

  // Subject manager state
  const [newSubName, setNewSubName] = useState("");
  const [newSubDesc, setNewSubDesc] = useState("");
  const [newSubColor, setNewSubColor] = useState(COLOR_OPTIONS[0]);

  // Delete account confirmation states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmEmailInput, setConfirmEmailInput] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Synchronize inputs with context on load/change
  useEffect(() => {
    if (user) {
      setName(user.name);
      setFocusGoal(user.focusGoal);
    }
  }, [user]);

  useEffect(() => {
    setPomoFocus(pomodoroConfig.focus);
    setPomoShort(pomodoroConfig.shortBreak);
    setPomoLong(pomodoroConfig.longBreak);
  }, [pomodoroConfig]);

  const showNotification = (type: "success" | "error", text: string) => {
    if (type === "success") {
      setSuccessMsg(text);
      setTimeout(() => setSuccessMsg(""), 3500);
    } else {
      setErrorMsg(text);
      setTimeout(() => setErrorMsg(""), 3500);
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    updateProfile(name, Number(focusGoal));
    showNotification("success", "Profile preferences saved successfully!");
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (newPassword !== confirmPassword) {
      showNotification("error", "New passwords do not match.");
      return;
    }

    try {
      const res = await fetch("/api/auth/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          oldPassword,
          newPassword,
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        showNotification("error", data.error || "Failed to update password.");
        return;
      }

      showNotification("success", "Password updated successfully!");
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      showNotification("error", "An unexpected connection error occurred.");
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (confirmEmailInput !== user?.email) {
      showNotification("error", "Email verification does not match.");
      return;
    }

    setIsDeleting(true);
    try {
      // 1. Clear all user local storage items
      if (user) {
        const userPrefix = `notela_${user.email.replace(/[@.]/g, "_")}_`;
        const keysToRemove = [
          `${userPrefix}subjects`,
          `${userPrefix}notes`,
          `${userPrefix}tasks`,
          `${userPrefix}sessions`,
          `${userPrefix}pomodoro_config`,
          `${userPrefix}activities`,
          `${userPrefix}activity_log`
        ];
        keysToRemove.forEach((key) => localStorage.removeItem(key));
      }

      // 2. Call AuthContext delete account
      const result = await deleteAccount();
      if (!result.success) {
        showNotification("error", result.error || "Failed to delete account.");
        setIsDeleting(false);
      } else {
        setIsDeleteModalOpen(false);
      }
    } catch (err) {
      showNotification("error", "An unexpected error occurred during deletion.");
      setIsDeleting(false);
    }
  };

  const handleSavePomodoro = (e: React.FormEvent) => {
    e.preventDefault();
    updatePomodoroConfig(Number(pomoFocus), Number(pomoShort), Number(pomoLong));
    showNotification("success", "Pomodoro default timers updated!");
  };

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubName.trim()) return;

    addSubject(newSubName, newSubColor, newSubDesc || undefined);
    setNewSubName("");
    setNewSubDesc("");
    setNewSubColor(COLOR_OPTIONS[0]);
    showNotification("success", `Subject "${newSubName}" added to academic workspaces!`);
  };

  const handleExportData = () => {
    const backupData = {
      user,
      subjects,
      notes,
      tasks,
      focusSessions,
      pomodoroConfig,
    };
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `notela_backup_${user?.email.replace(/[@.]/g, "_")}.json`;
    link.click();
    showNotification("success", "Data backup JSON exported successfully!");
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const result = importJSONData(json);
        if (result.success) {
          showNotification("success", result.message);
        } else {
          showNotification("error", result.message);
        }
      } catch (err) {
        showNotification("error", "Invalid JSON file structure.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
          Workspace Settings
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          Configure profile accounts, pomodoro intervals, manual subjects, and database backups.
        </p>
      </div>

      {/* Action alerts */}
      {successMsg && (
        <div className="flex items-center space-x-2 p-3 text-xs text-emerald-500 bg-emerald-500/10 rounded-xl border border-emerald-500/20 font-semibold animate-fade-in">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="flex items-center space-x-2 p-3 text-xs text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20 font-semibold animate-fade-in">
          <span>⚠️ {errorMsg}</span>
        </div>
      )}

      {/* Settings layout grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

        {/* Navigation Tabs on Left */}
        <div className="md:col-span-1 space-y-1">
          {[
            { id: "profile", label: "Account Profile", icon: User },
            { id: "pomodoro", label: "Pomodoro Timers", icon: Timer },
            { id: "subjects", label: "Subject Workspaces", icon: BookOpen },
            { id: "database", label: "Database Management", icon: Database },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all ${isActive
                    ? "bg-indigo-600/10 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400"
                    : "text-neutral-500 hover:bg-black/5 dark:text-neutral-400 dark:hover:bg-white/5"
                  }`}
              >
                <Icon className="w-4.5 h-4.5 shrink-0" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Configurations Forms on Right */}
        <div className="md:col-span-3 space-y-6">

          {/* 1. Profile settings */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              <BorderGlow glowColor="from-indigo-500/20 via-purple-500/20 to-pink-500/20" duration={6}>
                <form onSubmit={handleSaveProfile} className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                    <User className="w-4.5 h-4.5" />
                    <span>Personal Profile Settings</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Full Name</label>
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Daily Focus Target (minutes)</label>
                      <input
                        type="number"
                        required
                        min="5"
                        max="480"
                        value={focusGoal}
                        onChange={(e) => setFocusGoal(Number(e.target.value))}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-white/5">
                    <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold cursor-pointer shadow-md">
                      Save Account Details
                    </button>
                  </div>
                </form>
              </BorderGlow>

              {/* Password update section */}
              <div className="glass-panel rounded-2xl p-6">
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                    <Lock className="w-4.5 h-4.5" />
                    <span>Change Account Password</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Old Password</label>
                      <input
                        type="password"
                        required
                        value={oldPassword}
                        onChange={(e) => setOldPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">New Password</label>
                      <input
                        type="password"
                        required
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Confirm New Password</label>
                      <input
                        type="password"
                        required
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-white/5">
                    <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold cursor-pointer shadow-md">
                      Update Password
                    </button>
                  </div>
                </form>
              </div>

              {/* Theme toggle panel */}
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                  <Eye className="w-4.5 h-4.5" />
                  <span>Appearance theme Mode</span>
                </h2>
                <div className="flex gap-4">
                  <button
                    onClick={() => setTheme("light")}
                    className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${theme === "light"
                        ? "border-indigo-600 bg-indigo-600/10 text-indigo-500 font-semibold"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-xs">Light Theme Mode</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${theme === "dark"
                        ? "border-indigo-600 bg-indigo-600/10 text-indigo-500 font-semibold"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                      }`}
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-xs">Dark theme (Slate Navy)</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone Panel */}
              <div className="rounded-2xl p-6 border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
                    <Trash2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold tracking-tight text-neutral-800 dark:text-neutral-200">
                      Danger Zone: Delete Account Permanently
                    </h2>
                    <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1 leading-relaxed">
                      Once you delete your account, there is no going back. This will immediately erase your profile, all subjects, notes, checklists, habits, and study analytics.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-rose-500/10 dark:border-rose-950/30">
                  <button
                    type="button"
                    onClick={() => {
                      setConfirmEmailInput("");
                      setIsDeleteModalOpen(true);
                    }}
                    className="px-4 py-2.5 text-xs bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl cursor-pointer shadow-lg shadow-rose-600/10 transition-colors"
                  >
                    Delete My Account...
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 2. Pomodoro configuration */}
          {activeTab === "pomodoro" && (
            <BorderGlow glowColor="from-amber-500/20 via-orange-500/20 to-rose-500/20" duration={6}>
              <form onSubmit={handleSavePomodoro} className="space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                  <Timer className="w-4.5 h-4.5" />
                  <span>Pomodoro Default Durations (Minutes)</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">
                  Update default session lengths loaded when navigating to focus pages.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Focus Duration</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="180"
                      value={pomoFocus}
                      onChange={(e) => setPomoFocus(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Short Break</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="60"
                      value={pomoShort}
                      onChange={(e) => setPomoShort(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Long Break</label>
                    <input
                      type="number"
                      required
                      min="1"
                      max="120"
                      value={pomoLong}
                      onChange={(e) => setPomoLong(Number(e.target.value))}
                      className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-3 border-t border-white/5">
                  <button type="submit" className="px-4 py-2 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold cursor-pointer shadow-md">
                    Apply Timer Defaults
                  </button>
                </div>
              </form>
            </BorderGlow>
          )}

          {/* 3. Subjects list and creation */}
          {activeTab === "subjects" && (
            <div className="space-y-6 animate-in fade-in duration-200">

              {/* Subject creator */}
              <div className="glass-panel rounded-2xl p-6">
                <form onSubmit={handleAddSubject} className="space-y-4">
                  <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                    <Sparkles className="w-4.5 h-4.5 text-indigo-500" />
                    <span>Create Subject Workspace Manually</span>
                  </h2>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Subject Name</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Organic Chemistry, Real Analysis"
                        value={newSubName}
                        onChange={(e) => setNewSubName(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Description (Optional)</label>
                      <input
                        type="text"
                        placeholder="e.g. Homework schedules & lab notes"
                        value={newSubDesc}
                        onChange={(e) => setNewSubDesc(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">Accent Color</label>
                    <div className="flex flex-wrap gap-2 pt-1">
                      {COLOR_OPTIONS.map((color) => (
                        <button
                          key={color}
                          type="button"
                          onClick={() => setNewSubColor(color)}
                          className={`w-8 h-8 rounded-lg cursor-pointer border-2 transition-all ${newSubColor === color ? "border-neutral-800 dark:border-white scale-110 shadow-lg" : "border-transparent"
                            }`}
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end pt-3 border-t border-white/5">
                    <button type="submit" className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md">
                      <Plus className="w-4 h-4" />
                      <span>Manually Add Subject</span>
                    </button>
                  </div>
                </form>
              </div>

              {/* Current Subjects management directory */}
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                  <BookOpen className="w-4.5 h-4.5" />
                  <span>Subject Workspace Directory</span>
                </h2>
                <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                  {subjects.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between p-3 rounded-xl bg-black/5 dark:bg-white/5 border border-white/5 dark:border-neutral-900/50">
                      <div className="flex items-center space-x-3">
                        <span className="w-3.5 h-3.5 rounded-full inline-block" style={{ backgroundColor: sub.color }} />
                        <div>
                          <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{sub.name}</span>
                          {sub.description && <p className="text-[10px] text-neutral-400 mt-0.5">{sub.description}</p>}
                        </div>
                      </div>
                      <button
                        onClick={() => deleteSubject(sub.id)}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 cursor-pointer transition-colors"
                        title="Delete Workspace"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* 4. Database controls */}
          {activeTab === "database" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                  <Database className="w-4.5 h-4.5" />
                  <span>Notela System Database Manager</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                  Export complete backups of your notebooks, checklists, and subject spaces to a JSON text file. Reset database clears all custom settings and restores 10 initial academic templates.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  {/* Export */}
                  <button
                    onClick={handleExportData}
                    className="flex flex-col items-center justify-center p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-indigo-500 hover:bg-indigo-500/5 transition-all text-center group cursor-pointer"
                  >
                    <Download className="w-8 h-8 text-indigo-500 mb-2 group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Export JSON Backup</span>
                    <span className="text-[10px] text-neutral-400 mt-1">Download local cache payload</span>
                  </button>

                  {/* Import */}
                  <button
                    onClick={handleImportClick}
                    className="flex flex-col items-center justify-center p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-emerald-500 hover:bg-emerald-500/5 transition-all text-center group cursor-pointer"
                  >
                    <Upload className="w-8 h-8 text-emerald-500 mb-2 group-hover:scale-105 transition-transform" />
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Import JSON File</span>
                    <span className="text-[10px] text-neutral-400 mt-1">Upload backup or shared note</span>
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleImportFile}
                    accept=".json"
                    className="hidden"
                  />

                  {/* Reset */}
                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to clear your local database? All notes and tasks will be permanently deleted!")) {
                        resetDatabase();
                      }
                    }}
                    className="flex flex-col items-center justify-center p-6 rounded-xl border border-neutral-200 dark:border-neutral-800 hover:border-rose-500 hover:bg-rose-500/5 transition-all text-center group cursor-pointer"
                  >
                    <RotateCcw className="w-8 h-8 text-rose-500 mb-2 group-hover:rotate-45 transition-transform" />
                    <span className="text-xs font-bold text-neutral-800 dark:text-neutral-200">Reset Local Database</span>
                    <span className="text-[10px] text-neutral-400 mt-1">Restore 10 default subjects</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Account Confirmation Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                if (!isDeleting) setIsDeleteModalOpen(false);
              }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md overflow-hidden rounded-2xl border border-rose-500/20 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-xl p-6 shadow-2xl space-y-4"
            >
              <div className="flex items-center space-x-3 text-rose-500">
                <Trash2 className="w-6 h-6 shrink-0 animate-pulse" />
                <h3 className="text-lg font-bold text-neutral-800 dark:text-neutral-100">
                  Delete Account Permanently?
                </h3>
              </div>

              <div className="space-y-2 text-xs leading-relaxed text-neutral-500 dark:text-neutral-400">
                <p className="font-semibold text-rose-600 dark:text-rose-400 bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                  ⚠️ Warning: This action is absolute and irreversible. All your notes, workspaces, checksheets, timers, and telemetry metrics will be deleted from our servers forever.
                </p>
                <p>
                  To confirm, please type your email address <strong className="text-neutral-750 dark:text-neutral-200 font-bold selection:bg-indigo-500/30">{user?.email}</strong> below:
                </p>
              </div>

              <form onSubmit={handleDeleteAccount} className="space-y-4">
                <input
                  type="text"
                  required
                  placeholder={user?.email || "Verify your email"}
                  value={confirmEmailInput}
                  onChange={(e) => setConfirmEmailInput(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-none"
                  disabled={isDeleting}
                />

                <div className="flex space-x-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(false)}
                    className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl text-neutral-500 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition-colors"
                    disabled={isDeleting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={confirmEmailInput !== user?.email || isDeleting}
                    className="flex-1 px-4 py-2.5 text-xs font-bold rounded-xl text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/15 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {isDeleting ? (
                      <>
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <span>Permanently Delete</span>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
