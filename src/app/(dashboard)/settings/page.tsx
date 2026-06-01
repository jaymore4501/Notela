"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { useAppState } from "@/context/AppStateContext";
import { useTheme } from "next-themes";
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
  AlertTriangle,
  Loader2,
} from "lucide-react";
import BorderGlow from "@/components/react-bits/BorderGlow";

const COLOR_OPTIONS = [
  "#ef4444", // Red
  "#f97316", // Orange
  "#eab308", // Yellow
  "#10b981", // Green
  "#3b82f6", // Blue
  "#6366f1", // Indigo
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#14b8a6", // Teal
];

export default function SettingsPage() {
  const { user, updateProfile } = useAuth();
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

  // Notifications
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // Delete account modal states
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [confirmEmail, setConfirmEmail] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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
    setDeleteError("");

    if (confirmEmail.trim().toLowerCase() !== user?.email.toLowerCase()) {
      setDeleteError("Confirmation email address does not match your account.");
      return;
    }

    setDeleteLoading(true);

    try {
      const res = await fetch("/api/auth/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: confirmEmail.trim().toLowerCase(),
          password: deletePassword,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setDeleteError(data.error || "Incorrect password. Account deletion failed.");
        return;
      }

      // Deletion successful: clean local storage cache keys prefixed with notela_
      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("notela_")) {
          localStorage.removeItem(key);
        }
      });

      setIsDeleteModalOpen(false);
      window.location.href = "/login?deleted=success";
    } catch (err) {
      setDeleteError("An unexpected connection error occurred.");
    } finally {
      setDeleteLoading(false);
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
                className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left text-xs font-semibold cursor-pointer transition-all ${
                  isActive
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
                    className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                      theme === "light"
                        ? "border-indigo-600 bg-indigo-600/10 text-indigo-500 font-semibold"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <Monitor className="w-5 h-5" />
                    <span className="text-xs">Light Theme Mode</span>
                  </button>
                  <button
                    onClick={() => setTheme("dark")}
                    className={`flex-1 p-4 rounded-xl border flex flex-col items-center justify-center space-y-2 cursor-pointer transition-all ${
                      theme === "dark"
                        ? "border-indigo-600 bg-indigo-600/10 text-indigo-500 font-semibold"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200"
                    }`}
                  >
                    <Eye className="w-5 h-5" />
                    <span className="text-xs">Dark theme (Slate Navy)</span>
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border border-rose-500/20 bg-rose-500/5 dark:bg-rose-950/10 rounded-2xl p-6 mt-6">
                <h2 className="text-sm font-bold uppercase tracking-wider text-rose-500 flex items-center space-x-2">
                  <AlertTriangle className="w-4.5 h-4.5" />
                  <span>Danger Zone (Irreversible)</span>
                </h2>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 leading-relaxed">
                  Permanently delete your Notela account and all associated workspaces, notebooks, checklists, Pomodoro stats, and habits history.
                </p>
                <div className="mt-4 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setIsDeleteModalOpen(true)}
                    className="px-4 py-2 text-xs bg-rose-600 hover:bg-rose-500 rounded-xl text-white font-semibold cursor-pointer shadow-md transition-colors"
                  >
                    Delete Account Permanently
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
                          className={`w-8 h-8 rounded-lg cursor-pointer border-2 transition-all ${
                            newSubColor === color ? "border-neutral-800 dark:border-white scale-110 shadow-lg" : "border-transparent"
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

      {/* Delete Account Confirmation Modal Overlay */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-md glass-panel rounded-2xl border border-rose-500/20 p-6 space-y-6 shadow-2xl animate-scale-up">
            <div className="flex items-center space-x-3 text-rose-500">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="text-lg font-bold">Delete Account Permanently?</h3>
            </div>
            
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              This action is <strong className="text-rose-500">irreversible</strong>. All your notes, workspaces, subjects, tasks, and study records will be permanently deleted from our database.
            </p>

            {deleteError && (
              <div className="p-3 text-xs text-rose-500 bg-rose-500/10 rounded-xl border border-rose-500/20 font-medium">
                ⚠️ {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccount} className="space-y-4">
              {/* Email confirmation input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Confirm email (<strong>{user?.email}</strong>)
                </label>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  value={confirmEmail}
                  onChange={(e) => setConfirmEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200 border border-white/10"
                />
              </div>

              {/* Password confirmation input */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block">
                  Enter Password
                </label>
                <input
                  type="password"
                  required
                  placeholder="Enter your password"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200 border border-white/10"
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setConfirmEmail("");
                    setDeletePassword("");
                    setDeleteError("");
                  }}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-neutral-200 dark:bg-white/10 text-neutral-800 dark:text-neutral-200 hover:bg-neutral-300 dark:hover:bg-white/20 transition-all cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleteLoading || confirmEmail.trim().toLowerCase() !== user?.email.toLowerCase() || !deletePassword}
                  className="flex-1 py-2.5 text-xs font-semibold rounded-xl bg-rose-600 hover:bg-rose-500 disabled:bg-rose-600/40 text-white cursor-pointer transition-all shadow-lg hover:shadow-rose-500/20 flex items-center justify-center space-x-2"
                >
                  {deleteLoading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <span>Confirm Delete</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
