"use client";

import React, { useState, useEffect, useRef } from "react";
import { useAppState } from "@/context/AppStateContext";
import { Play, Pause, RotateCcw, Volume2, VolumeX, Sparkles, BookOpen, Clock, Settings, Save, Plus, Minus } from "lucide-react";
import BorderGlow from "@/components/react-bits/BorderGlow";
import Dropdown from "@/components/ui/Dropdown";

type TimerMode = "focus" | "shortBreak" | "longBreak";

export default function FocusPage() {
  const { subjects, addFocusSession, focusSessions, pomodoroConfig, updatePomodoroConfig } = useAppState();

  // Dropdown options
  const subjectOptions = [
    { value: "uncategorized", label: "No Subject" },
    ...subjects.map((sub) => ({
      value: sub.id,
      label: sub.name,
      color: sub.color,
    })),
  ];

  const [mode, setMode] = useState<TimerMode>("focus");
  const [secondsRemaining, setSecondsRemaining] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState("uncategorized");
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Synchronized edit states
  const [focusInput, setFocusInput] = useState(25);
  const [shortInput, setShortInput] = useState(5);
  const [longInput, setLongInput] = useState(15);

  const [quoteIndex, setQuoteIndex] = useState(0);

  // Daily focus states for hydration safety
  const [todayFocusMinutes, setTodayFocusMinutes] = useState(0);
  const [todaySessionsCount, setTodaySessionsCount] = useState(0);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const todaySessions = focusSessions.filter((s) => s.date === todayStr);
    const todayFocus = todaySessions.reduce((acc, s) => acc + s.durationMinutes, 0);
    setTodayFocusMinutes(todayFocus);
    setTodaySessionsCount(todaySessions.length);
  }, [focusSessions]);

  const studentQuotes = [
    { text: "Your limit is only your imagination.", author: "Unknown" },
    { text: "Push yourself, because no one else is going to do it for you.", author: "Unknown" },
    { text: "Great things never come from comfort zones.", author: "Unknown" },
    { text: "Dream it. Wish it. Do it.", author: "Unknown" },
    { text: "Success doesn't just find you. You have to go out and get it.", author: "Unknown" },
    { text: "The harder you work for something, the greater you'll feel when you achieve it.", author: "Unknown" },
    { text: "Dream bigger. Do bigger.", author: "Unknown" },
    { text: "Don't stop when you're tired. Stop when you're done.", author: "Unknown" },
    { text: "Wake up with determination. Go to bed with satisfaction.", author: "Unknown" },
    { text: "Do something today that your future self will thank you for.", author: "Unknown" },
    { text: "It's going to be hard, but hard does not mean impossible.", author: "Unknown" },
    { text: "Learning is the only thing the mind never exhausts, never fears, and never regrets.", author: "Leonardo da Vinci" }
  ];

  // Rotate quotes every 8 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % studentQuotes.length);
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  const modeDurations = {
    focus: pomodoroConfig.focus,
    shortBreak: pomodoroConfig.shortBreak,
    longBreak: pomodoroConfig.longBreak,
  };

  const modeLabels = {
    focus: "Focus Session",
    shortBreak: "Short Break",
    longBreak: "Long Break",
  };

  const modeColors = {
    focus: "#6366f1",
    shortBreak: "#10b981",
    longBreak: "#3b82f6",
  };

  const modeMotivations = {
    focus: "Stay focused, you're doing great! 🧠",
    shortBreak: "Time to stretch and rest your eyes. ☕",
    longBreak: "Grab a snack and recharge. 🔋",
  };

  const totalSeconds = modeDurations[mode] * 60;
  const progressPercent = totalSeconds > 0 ? ((totalSeconds - secondsRemaining) / totalSeconds) * 100 : 0;

  // Load configs on mount or updates
  useEffect(() => {
    setFocusInput(pomodoroConfig.focus);
    setShortInput(pomodoroConfig.shortBreak);
    setLongInput(pomodoroConfig.longBreak);
  }, [pomodoroConfig]);

  // Sync mode duration on mode switch or config change
  useEffect(() => {
    setIsActive(false);
    setSecondsRemaining(modeDurations[mode] * 60);
  }, [mode, pomodoroConfig]);

  // Auto-save edited values
  const handleDurationEdit = (type: TimerMode, value: number) => {
    const val = Math.max(1, Math.min(180, value));
    
    let f = pomodoroConfig.focus;
    let s = pomodoroConfig.shortBreak;
    let l = pomodoroConfig.longBreak;

    if (type === "focus") {
      setFocusInput(val);
      f = val;
    } else if (type === "shortBreak") {
      setShortInput(val);
      s = val;
    } else if (type === "longBreak") {
      setLongInput(val);
      l = val;
    }

    updatePomodoroConfig(f, s, l);
  };

  const playSynthesizedChime = () => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gainNode = ctx.createGain();

      osc.type = "sine";
      const now = ctx.currentTime;
      
      osc.frequency.setValueAtTime(523.25, now);
      osc.frequency.setValueAtTime(659.25, now + 0.15);
      osc.frequency.setValueAtTime(783.99, now + 0.30);
      osc.frequency.setValueAtTime(1046.50, now + 0.45);

      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.3, now + 0.05);
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

      osc.connect(gainNode);
      gainNode.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn("Failed to synthesize focus chime:", e);
    }
  };

  useEffect(() => {
    if (isActive) {
      timerRef.current = setInterval(() => {
        setSecondsRemaining((prev) => {
          if (prev <= 1) {
            setIsActive(false);
            if (timerRef.current) clearInterval(timerRef.current);
            playSynthesizedChime();

            if (mode === "focus") {
              addFocusSession(modeDurations.focus, selectedSubjectId);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isActive, mode, selectedSubjectId, pomodoroConfig]);

  const handleStartPause = () => {
    setIsActive(!isActive);
  };

  const handleReset = () => {
    setIsActive(false);
    setSecondsRemaining(modeDurations[mode] * 60);
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${remainder.toString().padStart(2, "0")}`;
  };


  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
          Focus Session Timer
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          Eliminate digital distractions, tag subjects, and work in deep concentration slots.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Pomodoro Circle Timer (Span 2) */}
        <div className="lg:col-span-2 flex flex-col items-center justify-center p-6 md:p-8 glass-panel rounded-2xl relative overflow-hidden">
          
          {/* Sound configuration */}
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className="absolute top-4 right-4 p-2 rounded-xl bg-black/5 dark:bg-white/5 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer transition-colors"
            title={soundEnabled ? "Disable Chime" : "Enable Chime"}
          >
            {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>

          {/* Mode configuration selector */}
          <div className="flex bg-black/10 dark:bg-white/5 p-1 rounded-xl w-fit mb-8 z-10">
            {(["focus", "shortBreak", "longBreak"] as TimerMode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-4 py-2 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-colors ${
                  mode === m
                    ? "bg-indigo-600 text-white"
                    : "text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200"
                }`}
              >
                {m === "shortBreak" ? "Short Break" : m === "longBreak" ? "Long Break" : "Focus"}
              </button>
            ))}
          </div>

          {/* Circle progress countdown */}
          <div className="relative w-56 h-56 flex items-center justify-center mb-6">
            <svg className="absolute w-full h-full transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="96"
                className="stroke-neutral-200 dark:stroke-neutral-800 fill-none"
                strokeWidth="8"
              />
              <circle
                cx="112"
                cy="112"
                r="96"
                className="fill-none transition-all duration-300 ease-linear"
                stroke={modeColors[mode]}
                strokeWidth="8"
                strokeDasharray={2 * Math.PI * 96}
                strokeDashoffset={2 * Math.PI * 96 * (1 - progressPercent / 100)}
                strokeLinecap="round"
              />
            </svg>

            {/* Central Clock */}
            <div className="flex flex-col items-center justify-center z-10">
              <span className="text-4xl font-extrabold tracking-tighter tabular-nums text-neutral-800 dark:text-neutral-100">
                {formatTime(secondsRemaining)}
              </span>
              <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-bold mt-1">
                {modeLabels[mode]}
              </span>
            </div>
          </div>

          {/* Action buttons controls */}
          <div className="flex items-center space-x-4 z-10 mb-6">
            <button
              onClick={handleStartPause}
              className="flex items-center justify-center w-14 h-14 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg hover:shadow-indigo-500/20 cursor-pointer transition-all transform hover:scale-105"
            >
              {isActive ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center justify-center w-11 h-11 rounded-full bg-black/5 dark:bg-white/5 border border-white/5 dark:border-neutral-800 hover:bg-black/10 dark:hover:bg-white/10 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer transition-all hover:scale-105"
              title="Reset Timer"
            >
              <RotateCcw className="w-5 h-5" />
            </button>
          </div>

          {/* Motivational Quote Block */}
          <div className="w-full max-w-sm px-4 py-3 bg-indigo-500/5 dark:bg-indigo-500/10 rounded-2xl border border-indigo-500/10 dark:border-indigo-500/25 z-10 mb-6 text-center min-h-[5.5rem] flex flex-col justify-center transition-all duration-300">
            <p className="text-xs md:text-sm italic text-neutral-700 dark:text-neutral-200 font-semibold leading-relaxed">
              "{studentQuotes[quoteIndex].text}"
            </p>
            {studentQuotes[quoteIndex].author !== "Unknown" && (
              <p className="text-[10px] text-neutral-400 dark:text-neutral-500 mt-1 font-bold tracking-wider uppercase">
                — {studentQuotes[quoteIndex].author}
              </p>
            )}
          </div>

          {/* Professional Time Editor Inputs integrated directly on Timer Card */}
          <div className="w-full max-w-sm pt-5 border-t border-neutral-200 dark:border-neutral-800/60 z-10">
            <h3 className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400 text-center mb-4">
              Configure Timer Durations (mins)
            </h3>
            <div className="grid grid-cols-3 gap-3 md:gap-4">
              {/* Focus Time */}
              <div className="flex flex-col items-center space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Focus</span>
                <div className="flex items-center space-x-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-neutral-200/50 dark:border-neutral-800/80 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleDurationEdit("focus", focusInput - 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white cursor-pointer flex items-center justify-center shadow-sm border border-neutral-200/30 dark:border-neutral-700/50 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={focusInput}
                    onChange={(e) => handleDurationEdit("focus", Number(e.target.value))}
                    className="w-10 text-sm text-center font-extrabold bg-transparent border-0 focus:outline-none focus:ring-0 text-neutral-800 dark:text-neutral-200 p-0"
                  />
                  <button
                    type="button"
                    onClick={() => handleDurationEdit("focus", focusInput + 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white cursor-pointer flex items-center justify-center shadow-sm border border-neutral-200/30 dark:border-neutral-700/50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Short Break */}
              <div className="flex flex-col items-center space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Short</span>
                <div className="flex items-center space-x-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-neutral-200/50 dark:border-neutral-800/80 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleDurationEdit("shortBreak", shortInput - 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white cursor-pointer flex items-center justify-center shadow-sm border border-neutral-200/30 dark:border-neutral-700/50 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={shortInput}
                    onChange={(e) => handleDurationEdit("shortBreak", Number(e.target.value))}
                    className="w-10 text-sm text-center font-extrabold bg-transparent border-0 focus:outline-none focus:ring-0 text-neutral-800 dark:text-neutral-200 p-0"
                  />
                  <button
                    type="button"
                    onClick={() => handleDurationEdit("shortBreak", shortInput + 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white cursor-pointer flex items-center justify-center shadow-sm border border-neutral-200/30 dark:border-neutral-700/50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Long Break */}
              <div className="flex flex-col items-center space-y-1.5">
                <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-wider">Long</span>
                <div className="flex items-center space-x-1.5 bg-black/5 dark:bg-white/5 p-1 rounded-xl border border-neutral-200/50 dark:border-neutral-800/80 shadow-inner">
                  <button
                    type="button"
                    onClick={() => handleDurationEdit("longBreak", longInput - 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white cursor-pointer flex items-center justify-center shadow-sm border border-neutral-200/30 dark:border-neutral-700/50 transition-colors"
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </button>
                  <input
                    type="number"
                    value={longInput}
                    onChange={(e) => handleDurationEdit("longBreak", Number(e.target.value))}
                    className="w-10 text-sm text-center font-extrabold bg-transparent border-0 focus:outline-none focus:ring-0 text-neutral-800 dark:text-neutral-200 p-0"
                  />
                  <button
                    type="button"
                    onClick={() => handleDurationEdit("longBreak", longInput + 1)}
                    className="w-7 h-7 rounded-lg bg-white dark:bg-neutral-800/80 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-600 dark:text-neutral-300 hover:text-neutral-800 dark:hover:text-white cursor-pointer flex items-center justify-center shadow-sm border border-neutral-200/30 dark:border-neutral-700/50 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Settings & Today's focus details */}
        <div className="space-y-6">
          {/* Subject tag selector */}
          <div className="glass-panel rounded-2xl p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
              <BookOpen className="w-4 h-4" />
              <span>Tag Subject</span>
            </h2>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Select an academic subject to log your logged minutes under.
            </p>
            <Dropdown
              value={selectedSubjectId}
              onChange={setSelectedSubjectId}
              options={subjectOptions}
              className="w-full"
            />
          </div>

          {/* Daily focus details */}
          <BorderGlow glowColor="from-amber-500/20 via-orange-500/20 to-rose-500/20" duration={6}>
            <div className="space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-neutral-400 flex items-center space-x-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span>Today's Progress</span>
              </h2>
              <div className="space-y-2">
                <div className="flex justify-between items-end">
                  <span className="text-xs text-neutral-500">Mins Focus</span>
                  <span className="text-xl font-extrabold">{todayFocusMinutes} mins</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-xs text-neutral-500">Completed Sessions</span>
                  <span className="text-sm font-semibold">{todaySessionsCount} slots</span>
                </div>
              </div>
            </div>
          </BorderGlow>
        </div>
      </div>
    </div>
  );
}
