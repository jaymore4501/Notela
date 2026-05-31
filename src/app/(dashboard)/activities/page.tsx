"use client";

import React, { useState, useMemo } from "react";
import { useAppState, Activity as ActivityType } from "@/context/AppStateContext";
import {
  ResponsiveContainer,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip as ChartTooltip,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  Activity,
  Plus,
  Trash2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  BookOpen,
  Dumbbell,
  Moon,
  Users,
  Utensils,
  Award,
  Sparkles,
  Check,
  CheckSquare,
  BarChart2,
  Clock,
  PieChart as PieIcon,
  Smile,
  Edit2
} from "lucide-react";
import BorderGlow from "@/components/react-bits/BorderGlow";

// List of premium emojis for selection
const PREMIUM_EMOJIS = ["📱", "📚", "🏋️", "🥗", "😴", "👥", "💻", "🎨", "🎵", "💧", "🚶", "🧘", "📝", "🎯", "🥑", "💡"];

// Duration options in minutes
const DURATION_OPTIONS = [
  { label: "0m", value: 0 },
  { label: "15m", value: 15 },
  { label: "30m", value: 30 },
  { label: "45m", value: 45 },
  { label: "1h", value: 60 },
  { label: "1.5h", value: 90 },
  { label: "2h", value: 120 },
  { label: "3h", value: 180 },
  { label: "4h", value: 240 },
  { label: "6h", value: 360 },
  { label: "8h", value: 480 },
];

const COLORS = ["#4f46e5", "#7c3aed", "#10b981", "#f59e0b", "#f43f5e", "#06b6d4", "#ec4899", "#8b5cf6"];

const getActivityColor = (index: number) => {
  return COLORS[(index * 5) % COLORS.length];
};

// Helper to format minutes into human readable text
const formatMinutes = (minutes: number) => {
  if (minutes === 0) return "0m";
  if (minutes < 60) return `${minutes}m`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hrs}h ${mins}m` : `${hrs}h`;
};

// Auto-assign emoji based on keywords if none is selected
const autoResolveEmoji = (name: string) => {
  const normalized = name.toLowerCase();
  if (normalized.includes("gym") || normalized.includes("workout") || normalized.includes("exercise") || normalized.includes("fitness") || normalized.includes("run")) return "🏋️";
  if (normalized.includes("read") || normalized.includes("book") || normalized.includes("study") || normalized.includes("code")) return "📚";
  if (normalized.includes("sleep") || normalized.includes("rest") || normalized.includes("bed")) return "😴";
  if (normalized.includes("friend") || normalized.includes("family") || normalized.includes("social") || normalized.includes("meet")) return "👥";
  if (normalized.includes("diet") || normalized.includes("protein") || normalized.includes("eat") || normalized.includes("meal") || normalized.includes("salad")) return "🥗";
  if (normalized.includes("limit") || normalized.includes("screen") || normalized.includes("phone") || normalized.includes("media") || normalized.includes("social media")) return "📱";
  return "📝";
};

export default function ActivitiesPage() {
  const {
    activities,
    activityLog,
    addActivity,
    updateActivity,
    deleteActivity,
    toggleActivityCompletion,
  } = useAppState();

  // Selected date is used as focus day and base day for week calculations
  const [baseDate, setBaseDate] = useState<Date>(new Date());
  
  // Dashboard view toggle: "spreadsheet" vs "reports"
  const [currentView, setCurrentView] = useState<"spreadsheet" | "reports">("spreadsheet");
  
  // Tab control inside reports view
  const [activeReportTab, setActiveReportTab] = useState<"daily" | "weekly" | "monthly" | "yearly">("weekly");

  // State for print layout content
  const [printData, setPrintData] = useState<{
    type: string;
    title: string;
    dateInfo: string;
    stats: { label: string; value: string | number; subtext?: string }[];
    content: React.ReactNode;
  } | null>(null);

  // Inline activity additions/edits
  const [newActivityName, setNewActivityName] = useState("");
  const [newActivityEmoji, setNewActivityEmoji] = useState("📝");
  const [newActivityGoal, setNewActivityGoal] = useState<number>(60);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [editingEmoji, setEditingEmoji] = useState("📝");
  const [editingGoal, setEditingGoal] = useState(60);
  const [showEmojiPickerForId, setShowEmojiPickerForId] = useState<string | null>(null);

  // Monday-to-Sunday calculation for baseDate's week
  const weekDates = useMemo(() => {
    const d = new Date(baseDate);
    const day = d.getDay();
    // Shift date back to Monday
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const startOfWeek = new Date(d.setDate(diff));

    const dates = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + i);
      dates.push(dayDate);
    }
    return dates;
  }, [baseDate]);

  // Format active week display range
  const formattedWeekRange = useMemo(() => {
    const start = weekDates[0];
    const end = weekDates[6];
    return `${start.toLocaleDateString(undefined, { month: "short", day: "numeric" })} – ${end.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}`;
  }, [weekDates]);

  // 2. Monthly Dates (moved up so it can be referenced early)
  const monthlyDates = useMemo(() => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();
    const totalDays = new Date(year, month + 1, 0).getDate();
    const dates = [];
    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      dates.push(date.toISOString().split("T")[0]);
    }
    return dates;
  }, [baseDate]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() - 7);
    setBaseDate(nextDate);
  };

  const handleNextWeek = () => {
    const nextDate = new Date(baseDate);
    nextDate.setDate(nextDate.getDate() + 7);
    setBaseDate(nextDate);
  };

  const handleResetToCurrent = () => {
    setBaseDate(new Date());
  };

  const handleDayClickInHeatmap = (dateStr: string) => {
    setBaseDate(new Date(dateStr));
  };


  // Helper to fetch completion record
  const getLogEntry = (activityId: string, dateStr: string) => {
    return activityLog.find((log) => log.date === dateStr && log.activityId === activityId);
  };

  // Checkbox logging toggle
  const handleToggleCheck = (dateStr: string, activityId: string) => {
    toggleActivityCompletion(dateStr, activityId);
  };

  // Toggle all activities for a specific day
  const handleToggleAllDay = (dateStr: string) => {
    if (activities.length === 0) return;
    
    // Check if all activities are currently completed on this day
    const allCompleted = activities.every((act) => {
      const log = getLogEntry(act.id, dateStr);
      return log && log.completed;
    });

    activities.forEach((act) => {
      const log = getLogEntry(act.id, dateStr);
      const isCompleted = log ? log.completed : false;

      // If we want to check all (because not all are completed) and this one is NOT completed:
      if (!allCompleted && !isCompleted) {
        toggleActivityCompletion(dateStr, act.id);
      }
      // If we want to uncheck all (because all are completed) and this one IS completed:
      else if (allCompleted && isCompleted) {
        toggleActivityCompletion(dateStr, act.id);
      }
    });
  };

  // Dropdown duration modification handler
  const handleDurationSelect = (dateStr: string, activityId: string, minutes: number) => {
    const existing = getLogEntry(activityId, dateStr);
    if (minutes === 0) {
      // If setting duration to 0, mark as incomplete
      if (existing && existing.completed) {
        toggleActivityCompletion(dateStr, activityId);
      }
    } else {
      // If setting duration > 0, set as complete with that duration
      if (!existing || !existing.completed || existing.durationMinutes !== minutes) {
        toggleActivityCompletion(dateStr, activityId, minutes);
      }
    }
  };

  // 0. Today's metrics (daily consistency)
  const todayStats = useMemo(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    const total = activities.length;
    if (total === 0) return { rate: 0, completed: 0, remaining: 0 };
    const completed = activities.filter((act) => {
      const log = getLogEntry(act.id, todayStr);
      return log && log.completed;
    }).length;
    return {
      rate: Math.round((completed / total) * 100),
      completed,
      remaining: total - completed,
    };
  }, [activities, activityLog]);

  // Daily stats for selected baseDate
  const dailyStats = useMemo(() => {
    const dateStr = baseDate.toISOString().split("T")[0];
    const total = activities.length;
    if (total === 0) return { rate: 0, completed: 0, remaining: 0 };
    const completed = activities.filter((act) => {
      const log = getLogEntry(act.id, dateStr);
      return log && log.completed;
    }).length;
    return {
      rate: Math.round((completed / total) * 100),
      completed,
      remaining: total - completed,
    };
  }, [activities, activityLog, baseDate]);

  // Logged time duration metrics for selected baseDate
  const dailyDurationStats = useMemo(() => {
    const dateStr = baseDate.toISOString().split("T")[0];
    let totalTarget = 0;
    let totalActual = 0;
    activities.forEach(act => {
      totalTarget += act.targetMinutes || 0;
      const log = getLogEntry(act.id, dateStr);
      if (log && log.completed) {
        totalActual += log.durationMinutes || act.targetMinutes || 0;
      }
    });
    return {
      targetHours: (totalTarget / 60).toFixed(1),
      actualHours: (totalActual / 60).toFixed(1),
      efficiency: totalTarget > 0 ? Math.round((totalActual / totalTarget) * 100) : 0
    };
  }, [activities, activityLog, baseDate]);

  // 1. Weekly performance math for the selected week
  const weeklyStats = useMemo(() => {
    if (activities.length === 0) return { completionRate: 0, completedCount: 0, totalPossible: 0, remaining: 0 };
    let completedCount = 0;
    
    activities.forEach((act) => {
      weekDates.forEach((day) => {
        const dateStr = day.toISOString().split("T")[0];
        const log = getLogEntry(act.id, dateStr);
        if (log && log.completed) {
          completedCount++;
        }
      });
    });

    const totalPossible = activities.length * 7;
    return {
      completionRate: Math.round((completedCount / totalPossible) * 100),
      completedCount,
      totalPossible,
      remaining: totalPossible - completedCount,
    };
  }, [activities, activityLog, weekDates]);

  // Overall database log score
  const overallConsistencyScore = useMemo(() => {
    const uniqueDates = Array.from(new Set(activityLog.map((l) => l.date)));
    if (uniqueDates.length === 0 || activities.length === 0) return 0;

    let totalScore = 0;
    uniqueDates.forEach((date) => {
      const completed = activities.filter((act) => {
        const log = getLogEntry(act.id, date);
        return log && log.completed;
      }).length;
      totalScore += (completed / activities.length);
    });

    return Math.round((totalScore / uniqueDates.length) * 100);
  }, [activities, activityLog]);

  // Overall expected completions (for total completed activities out of expected)
  const overallExpectedCompletions = useMemo(() => {
    const uniqueDates = Array.from(new Set(activityLog.map((l) => l.date)));
    return uniqueDates.length * activities.length;
  }, [activities, activityLog]);

  // Total completions in historical DB (ticks)
  const lifetimeCompletions = useMemo(() => {
    return activityLog.filter((log) => log.completed).length;
  }, [activityLog]);

  // 2. Monthly performance math for the selected month
  const monthlyStats = useMemo(() => {
    if (activities.length === 0) return { rate: 0, completed: 0, total: 0, remaining: 0 };
    let completed = 0;
    monthlyDates.forEach((dateStr) => {
      activities.forEach((act) => {
        const log = getLogEntry(act.id, dateStr);
        if (log && log.completed) {
          completed++;
        }
      });
    });
    const total = activities.length * monthlyDates.length;
    return {
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
      remaining: total - completed,
    };
  }, [activities, activityLog, monthlyDates]);

  // 3. Yearly performance math YTD
  const yearlyStats = useMemo(() => {
    if (activities.length === 0) return { rate: 0, completed: 0, total: 0, remaining: 0 };
    const year = baseDate.getFullYear();
    const now = new Date();
    const isCurrentYear = now.getFullYear() === year;
    const end = isCurrentYear ? now : new Date(year, 11, 31);
    const start = new Date(year, 0, 1);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const daysInYearYTD = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    let completed = 0;
    activityLog.forEach((log) => {
      const logYear = new Date(log.date).getFullYear();
      if (logYear === year && log.completed) {
        const act = activities.find(a => a.id === log.activityId);
        if (act) {
          completed++;
        }
      }
    });

    const total = activities.length * daysInYearYTD;
    return {
      rate: total > 0 ? Math.round((completed / total) * 100) : 0,
      completed,
      total,
      remaining: Math.max(total - completed, 0),
    };
  }, [activities, activityLog, baseDate]);


  // 1. Weekly Charts Data
  const weeklyChartData = useMemo(() => {
    return weekDates.map((day) => {
      const dateStr = day.toISOString().split("T")[0];
      const dayLabel = day.toLocaleDateString(undefined, { weekday: "short" });

      const completed = activities.filter((act) => {
        const log = getLogEntry(act.id, dateStr);
        return log && log.completed;
      }).length;

      const completionPct = activities.length > 0 ? Math.round((completed / activities.length) * 100) : 0;

      return {
        name: dayLabel,
        date: dateStr,
        completions: completed,
        rate: completionPct,
      };
    });
  }, [activities, activityLog, weekDates]);

  const weeklyPieData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    activities.forEach((act, idx) => {
      const completions = weekDates.filter((day) => {
        const dateStr = day.toISOString().split("T")[0];
        const log = getLogEntry(act.id, dateStr);
        return log && log.completed;
      }).length;
      if (completions > 0) {
        data.push({
          name: act.name,
          value: completions,
          color: getActivityColor(idx),
        });
      }
    });
    return data.sort((a, b) => b.value - a.value);
  }, [activities, activityLog, weekDates]);

  const weeklyProgressBars = useMemo(() => {
    return activities.map((act) => {
      const completions = weekDates.filter((day) => {
        const dateStr = day.toISOString().split("T")[0];
        const log = getLogEntry(act.id, dateStr);
        return log && log.completed;
      }).length;
      const pct = Math.round((completions / 7) * 100);
      return {
        id: act.id,
        name: act.name,
        emoji: act.emoji || "📝",
        completed: completions,
        total: 7,
        percentage: pct,
      };
    });
  }, [activities, activityLog, weekDates]);

  // 2. Monthly Charts Data

  const monthlyChartData = useMemo(() => {
    return monthlyDates.map((dateStr) => {
      const dayNum = new Date(dateStr).getDate();
      const completed = activities.filter((act) => {
        const log = getLogEntry(act.id, dateStr);
        return log && log.completed;
      }).length;
      const rate = activities.length > 0 ? Math.round((completed / activities.length) * 100) : 0;
      return {
        name: dayNum.toString(),
        date: dateStr,
        completions: completed,
        rate,
      };
    });
  }, [activities, activityLog, monthlyDates]);

  const monthlyPieData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    activities.forEach((act, idx) => {
      const completions = monthlyDates.filter((dateStr) => {
        const log = getLogEntry(act.id, dateStr);
        return log && log.completed;
      }).length;
      if (completions > 0) {
        data.push({
          name: act.name,
          value: completions,
          color: getActivityColor(idx),
        });
      }
    });
    return data.sort((a, b) => b.value - a.value);
  }, [activities, activityLog, monthlyDates]);

  const monthlyProgressBars = useMemo(() => {
    const totalDays = Math.max(monthlyDates.length, 1);
    return activities.map((act) => {
      const completions = monthlyDates.filter((dateStr) => {
        const log = getLogEntry(act.id, dateStr);
        return log && log.completed;
      }).length;
      const pct = Math.round((completions / totalDays) * 100);
      return {
        id: act.id,
        name: act.name,
        emoji: act.emoji || "📝",
        completed: completions,
        total: totalDays,
        percentage: pct,
      };
    });
  }, [activities, activityLog, monthlyDates]);

  const monthlyHeatmap = useMemo(() => {
    const year = baseDate.getFullYear();
    const month = baseDate.getMonth();

    const firstDayIndex = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];
    for (let i = 0; i < firstDayIndex; i++) {
      days.push({ pad: true });
    }

    for (let day = 1; day <= totalDays; day++) {
      const date = new Date(year, month, day);
      const dateStr = date.toISOString().split("T")[0];

      const completed = activities.filter((act) => {
        const log = getLogEntry(act.id, dateStr);
        return log && log.completed;
      }).length;

      const pct = activities.length > 0 ? Math.round((completed / activities.length) * 100) : 0;

      days.push({
        dayNumber: day,
        dateStr,
        percentage: pct,
        completed,
        total: activities.length,
        pad: false,
      });
    }
    return days;
  }, [baseDate, activities, activityLog]);

  const monthlyName = useMemo(() => {
    return baseDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  }, [baseDate]);

  // 3. Yearly Charts Data
  const yearlyChartData = useMemo(() => {
    const year = baseDate.getFullYear();
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    return months.map((monthName, idx) => {
      const totalDays = new Date(year, idx + 1, 0).getDate();
      let completedTicks = 0;
      let totalExpected = 0;
      
      for (let day = 1; day <= totalDays; day++) {
        const date = new Date(year, idx, day);
        const dateStr = date.toISOString().split("T")[0];
        
        activities.forEach((act) => {
          totalExpected++;
          const log = getLogEntry(act.id, dateStr);
          if (log && log.completed) {
            completedTicks++;
          }
        });
      }
      
      const rate = totalExpected > 0 ? Math.round((completedTicks / totalExpected) * 100) : 0;
      return { name: monthName, rate };
    });
  }, [activities, activityLog, baseDate]);

  const yearlyPieData = useMemo(() => {
    const data: { name: string; value: number; color: string }[] = [];
    const year = baseDate.getFullYear();
    
    activities.forEach((act, idx) => {
      const completions = activityLog.filter((log) => {
        if (log.activityId !== act.id || !log.completed) return false;
        const logYear = new Date(log.date).getFullYear();
        return logYear === year;
      }).length;
      
      if (completions > 0) {
        data.push({
          name: act.name,
          value: completions,
          color: getActivityColor(idx),
        });
      }
    });
    return data.sort((a, b) => b.value - a.value);
  }, [activities, activityLog, baseDate]);

  const yearlyProgressBars = useMemo(() => {
    const year = baseDate.getFullYear();
    const uniqueYearDates = Array.from(new Set(
      activityLog
        .filter((log) => new Date(log.date).getFullYear() === year)
        .map((log) => log.date)
    ));
    const totalDays = Math.max(uniqueYearDates.length, 1);

    return activities.map((act) => {
      const completions = activityLog.filter((log) => {
        if (log.activityId !== act.id || !log.completed) return false;
        const logYear = new Date(log.date).getFullYear();
        return logYear === year;
      }).length;
      
      const pct = Math.round((completions / totalDays) * 100);
      return {
        id: act.id,
        name: act.name,
        emoji: act.emoji || "📝",
        completed: completions,
        total: totalDays,
        percentage: pct,
      };
    });
  }, [activities, activityLog, baseDate]);

  // Consistency Leaderboard (radial stats)
  const activityConsistency = useMemo(() => {
    const uniqueDates = Array.from(new Set(activityLog.map((l) => l.date)));
    const totalLoggedDays = Math.max(uniqueDates.length, 1);

    return activities.map((act) => {
      const completedDays = activityLog.filter(
        (log) => log.activityId === act.id && log.completed
      ).length;

      return {
        id: act.id,
        name: act.name,
        emoji: act.emoji || "📝",
        completedDays,
        totalLoggedDays,
        rate: Math.round((completedDays / totalLoggedDays) * 100),
      };
    }).sort((a, b) => b.rate - a.rate);
  }, [activities, activityLog]);

  // Report export handler to generate and trigger PDF printing
  const handleExportPDF = (type: "daily" | "weekly" | "monthly" | "yearly" | "total") => {
    let title = "";
    let dateInfo = "";
    let stats: { label: string; value: string | number; subtext?: string }[] = [];
    let content: React.ReactNode = null;

    if (type === "daily") {
      const todayStr = baseDate.toISOString().split("T")[0];
      title = "Daily Routine Performance Analysis";
      dateInfo = baseDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
      stats = [
        { label: "Completion Rate", value: `${dailyStats.rate}%` },
        { label: "Completed Habits", value: `${dailyStats.completed} / ${activities.length}` },
        { label: "Efficiency Rating", value: `${dailyDurationStats.efficiency}%`, subtext: `${dailyDurationStats.actualHours} hrs logged / ${dailyDurationStats.targetHours} hrs target` }
      ];

      // Construct trailing 7 days consistency trend leading to baseDate
      const getPast7DaysData = () => {
        const data = [];
        for (let i = 6; i >= 0; i--) {
          const day = new Date(baseDate);
          day.setDate(baseDate.getDate() - i);
          const dateStr = day.toISOString().split("T")[0];
          const dayLabel = day.toLocaleDateString(undefined, { weekday: "short" });
          
          const completed = activities.filter((act) => {
            const log = getLogEntry(act.id, dateStr);
            return log && log.completed;
          }).length;
          const rate = activities.length > 0 ? Math.round((completed / activities.length) * 100) : 0;
          data.push({
            name: dayLabel,
            rate,
          });
        }
        return data;
      };
      const dailyTrendData = getPast7DaysData();

      content = (
        <div className="space-y-6 text-neutral-900">
          {/* Page 1: Summary & Main Checklist */}
          <div className="print-avoid-break space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                I. Daily Performance Metrics & Completion Log
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Detailed routine checklists and time metrics tracked for the active focus date.
              </p>
            </div>

            <table className="w-full text-left border-collapse border border-neutral-200 shadow-sm">
              <thead>
                <tr className="bg-indigo-600 text-white font-bold text-[9px] uppercase border-b border-indigo-700">
                  <th className="p-2.5 border border-indigo-700 text-center w-24">Status</th>
                  <th className="p-2.5 border border-indigo-700">Routine Habit Name</th>
                  <th className="p-2.5 border border-indigo-700 text-center w-24">Target Goal</th>
                  <th className="p-2.5 border border-indigo-700 text-center w-24">Actual Logged</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act, index) => {
                  const log = getLogEntry(act.id, todayStr);
                  const completed = log ? log.completed : false;
                  return (
                    <tr key={act.id} className="text-xs border-b border-neutral-100 odd:bg-neutral-50/50">
                      <td className="p-2.5 border border-neutral-200 text-center font-bold">
                        {completed ? (
                          <span className="text-emerald-600">✓ Completed</span>
                        ) : (
                          <span className="text-neutral-400">— Pending</span>
                        )}
                      </td>
                      <td className="p-2.5 border border-neutral-200 font-semibold text-neutral-800">
                        <span className="mr-1 text-sm">{act.emoji}</span> {act.name}
                      </td>
                      <td className="p-2.5 border border-neutral-200 text-center text-neutral-500">{formatMinutes(act.targetMinutes || 0)}</td>
                      <td className="p-2.5 border border-neutral-200 text-center font-bold text-neutral-700">
                        {log && log.durationMinutes ? formatMinutes(log.durationMinutes) : "0m"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clean Page Break */}
          <div className="print-page-break h-0" />

          {/* Page 2: Visualizations */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                II. Performance Data Visualizations
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Completions ratio allocation and trailing 7-day consistency progress logs.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 print-avoid-break">
              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">Daily Completion Ratio</h4>
                <div className="w-[280px] h-[180px] flex items-center justify-center relative">
                  <PieChart width={280} height={180}>
                    <Pie
                      data={[
                        { name: "Completed", value: dailyStats.completed, color: "#4f46e5" },
                        { name: "Pending", value: dailyStats.remaining, color: "#e2e8f0" }
                      ].filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={65}
                      paddingAngle={4}
                      dataKey="value"
                      isAnimationActive={false}
                    >
                      {[
                        { name: "Completed", value: dailyStats.completed, color: "#4f46e5" },
                        { name: "Pending", value: dailyStats.remaining, color: "#e2e8f0" }
                      ].filter(d => d.value > 0).map((entry, idx) => (
                        <Cell key={`cell-${idx}`} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-lg font-black text-neutral-800">{dailyStats.rate}%</span>
                    <span className="text-[9px] text-neutral-400 font-bold uppercase">Done</span>
                  </div>
                </div>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">7-Day Consistency Trend (%)</h4>
                <AreaChart width={280} height={180} data={dailyTrendData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="printDailyTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#4f46e5"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#printDailyTrend)"
                    dot={{ r: 2.5, stroke: "#4f46e5", strokeWidth: 1, fill: "#ffffff" }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </div>
            </div>

            {/* Daily Routine Goal Progression Bars */}
            <div className="print-avoid-break border border-neutral-200 rounded-xl p-5 bg-white space-y-4">
              <div>
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase">Individual Routine Goal Completion Rates</h4>
                <p className="text-[8px] text-neutral-400 mt-0.5">Compares actual logged minutes against daily duration goals.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {activities.map((act, index) => {
                  const log = getLogEntry(act.id, todayStr);
                  const actualMinutes = log && log.completed ? log.durationMinutes || act.targetMinutes || 0 : 0;
                  const targetMinutes = act.targetMinutes || 60;
                  const progressPct = Math.min(Math.round((actualMinutes / targetMinutes) * 100), 100);
                  const actColor = getActivityColor(index);

                  return (
                    <div key={act.id} className="p-3 rounded-lg bg-neutral-50/50 border border-neutral-100 flex flex-col justify-between space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                          <span>{act.emoji}</span>
                          <span className="truncate">{act.name}</span>
                        </span>
                        <span className="text-[9px] font-bold text-neutral-500">
                          {formatMinutes(actualMinutes)} / {formatMinutes(targetMinutes)} ({progressPct}%)
                        </span>
                      </div>
                      <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ 
                            width: `${progressPct}%`,
                            backgroundColor: actColor
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (type === "weekly") {
      title = "Weekly Routine Performance Analysis";
      dateInfo = `${formattedWeekRange}`;
      stats = [
        { label: "Completion Rate", value: `${weeklyStats.completionRate}%` },
        { label: "Completed Habits", value: `${weeklyStats.completedCount} / ${weeklyStats.totalPossible} expected` },
        { label: "Remaining Tasks", value: `${weeklyStats.remaining} Weekly` }
      ];

      content = (
        <div className="space-y-6 text-neutral-900">
          {/* Page 1: Summary & Main Checklist */}
          <div className="print-avoid-break space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                I. Weekly Routine Completion Matrix
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Summary of complete and pending habits from Monday to Sunday across the active week.
              </p>
            </div>

            <table className="w-full text-left border-collapse border border-neutral-200 shadow-sm">
              <thead>
                <tr className="bg-indigo-600 text-white font-bold text-[9px] uppercase border-b border-indigo-700">
                  <th className="p-2.5 border border-indigo-700">Routine Habit Name</th>
                  <th className="p-2.5 border border-indigo-700 text-center w-16">Goal</th>
                  {weekDates.map((day, idx) => (
                    <th key={idx} className="p-2 border border-indigo-700 text-center text-[9px] w-14">
                      <div>{day.toLocaleDateString(undefined, { weekday: "short" })}</div>
                      <div className="text-[8px] text-indigo-100">{day.getDate()}</div>
                    </th>
                  ))}
                  <th className="p-2.5 border border-indigo-700 text-center w-24">Completed</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act, index) => {
                  const completedInWeek = weekDates.filter((day) => {
                     const dateStr = day.toISOString().split("T")[0];
                     const log = getLogEntry(act.id, dateStr);
                     return log && log.completed;
                  }).length;
                  const pct = Math.round((completedInWeek / 7) * 100);

                  return (
                    <tr key={act.id} className="text-xs border-b border-neutral-100 odd:bg-neutral-50/30">
                      <td className="p-2.5 border border-neutral-200 font-semibold text-neutral-800">
                        <span className="mr-1 text-sm">{act.emoji}</span> {act.name}
                      </td>
                      <td className="p-2.5 border border-neutral-200 text-center text-neutral-500 text-[10px]">{formatMinutes(act.targetMinutes || 0)}</td>
                      {weekDates.map((day, idx) => {
                        const dateStr = day.toISOString().split("T")[0];
                        const log = getLogEntry(act.id, dateStr);
                        const completed = log ? log.completed : false;
                        return (
                          <td key={idx} className={`p-2 border border-neutral-200 text-center font-bold text-xs ${completed ? "text-indigo-600 bg-indigo-50/50" : "text-neutral-300"}`}>
                            {completed ? "✓" : "—"}
                          </td>
                        );
                      })}
                      <td className="p-2.5 border border-neutral-200 text-center font-bold text-neutral-700 text-[10px]">
                        {completedInWeek}/7 ({pct}%)
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Clean Page Break */}
          <div className="print-page-break h-0" />

          {/* Page 2: Visualizations */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                II. Performance Data Visualizations
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Visualizing completion rate trend day-by-day and the completions distribution across routines this week.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 print-avoid-break">
              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">Weekly Completion Trend (%)</h4>
                <AreaChart width={280} height={180} data={weeklyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="printWeeklyTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#4f46e5"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#printWeeklyTrend)"
                    dot={{ r: 2.5, stroke: "#4f46e5", strokeWidth: 1, fill: "#ffffff" }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">Weekly Habit Contribution</h4>
                {weeklyPieData.length === 0 ? (
                  <div className="text-[10px] text-neutral-400 my-auto">No completions logged.</div>
                ) : (
                  <div className="w-[280px] h-[180px] flex items-center justify-center relative">
                    <PieChart width={280} height={180}>
                      <Pie
                        data={weeklyPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {weeklyPieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                )}
              </div>
            </div>

            {/* Weekly Habit Consistency Progress */}
            <div className="print-avoid-break border border-neutral-200 rounded-xl p-5 bg-white space-y-4">
              <div>
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase">Weekly Habit Consistency Progress</h4>
                <p className="text-[8px] text-neutral-400 mt-0.5">Success rates for all routines over this 7-day period.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {weeklyProgressBars.map((item, index) => (
                  <div key={item.id} className="p-3 rounded-lg bg-neutral-50/50 border border-neutral-100 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <span>{item.emoji}</span>
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="text-[9px] font-bold text-neutral-500">
                        {item.completed} / {item.total} days ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: getActivityColor(index)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (type === "monthly") {
      title = "Monthly Routine Performance Analysis";
      dateInfo = `${monthlyName}`;
      stats = [
        { label: "Completion Rate", value: `${monthlyStats.rate}%` },
        { label: "Completed Habits", value: `${monthlyStats.completed} / ${monthlyStats.total} expected` },
        { label: "Remaining Tasks", value: `${monthlyStats.remaining} Monthly` }
      ];

      content = (
        <div className="space-y-6 text-neutral-900">
          {/* Page 1: Summary & Heatmap */}
          <div className="print-avoid-break space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                I. Monthly Consistency Heatmap Matrix
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Daily completion rates visualized as a calendar grid. Darker cells represent higher completion percentages.
              </p>
            </div>

            <div className="border border-neutral-200 rounded-xl p-5 bg-white max-w-sm mx-auto w-full shadow-sm">
              <h4 className="font-bold text-[10px] text-neutral-500 uppercase mb-3 text-center">Heatmap Grid ({monthlyName})</h4>
              <div className="grid grid-cols-7 gap-1.5 text-center text-[9px] font-extrabold text-neutral-400 mb-2 border-b border-neutral-100 pb-2">
                <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
              </div>
              <div className="grid grid-cols-7 gap-1.5">
                {monthlyHeatmap.map((day, idx) => {
                  if (day.pad || day.percentage === undefined) {
                    return <div key={`pad-${idx}`} className="aspect-square" />;
                  }
                  let colorStyle = { backgroundColor: "#f3f4f6", color: "#6b7280" };
                  if (day.percentage > 0 && day.percentage <= 33) {
                    colorStyle = { backgroundColor: "#e0e7ff", color: "#4338ca" };
                  } else if (day.percentage > 33 && day.percentage <= 66) {
                    colorStyle = { backgroundColor: "#c7d2fe", color: "#4338ca" };
                  } else if (day.percentage > 66 && day.percentage < 100) {
                    colorStyle = { backgroundColor: "#818cf8", color: "#ffffff" };
                  } else if (day.percentage === 100) {
                    colorStyle = { backgroundColor: "#4f46e5", color: "#ffffff" };
                  }
                  return (
                    <div
                      key={`day-${day.dayNumber}`}
                      style={colorStyle}
                      className="aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold border border-neutral-200/50 shadow-sm"
                    >
                      <span>{day.dayNumber}</span>
                      <span className="text-[7px] font-medium opacity-80">{day.percentage}%</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Clean Page Break */}
          <div className="print-page-break h-0" />

          {/* Page 2: Visualizations */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                II. Performance Data Visualizations
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Monthly trend analysis and relative habit completion counts for the monthly duration.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 print-avoid-break">
              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">Monthly Completion Trend (%)</h4>
                <AreaChart width={280} height={180} data={monthlyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="printMonthlyTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#4f46e5"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#printMonthlyTrend)"
                    dot={false}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">Monthly Habit Contribution</h4>
                {monthlyPieData.length === 0 ? (
                  <div className="text-[10px] text-neutral-400 my-auto">No completions logged.</div>
                ) : (
                  <div className="w-[280px] h-[180px] flex items-center justify-center relative">
                    <PieChart width={280} height={180}>
                      <Pie
                        data={monthlyPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {monthlyPieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                )}
              </div>
            </div>

            {/* Monthly Habit Consistency Progress */}
            <div className="print-avoid-break border border-neutral-200 rounded-xl p-5 bg-white space-y-4">
              <div>
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase">Monthly Habit Consistency Progress</h4>
                <p className="text-[8px] text-neutral-400 mt-0.5">Success rates for all routines over this monthly period.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {monthlyProgressBars.map((item, index) => (
                  <div key={item.id} className="p-3 rounded-lg bg-neutral-50/50 border border-neutral-100 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <span>{item.emoji}</span>
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="text-[9px] font-bold text-neutral-500">
                        {item.completed} / {item.total} days ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: getActivityColor(index)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (type === "yearly") {
      title = "Yearly Routine Performance Analysis";
      dateInfo = `Year of ${baseDate.getFullYear()}`;
      stats = [
        { label: "Completion Rate", value: `${yearlyStats.rate}%` },
        { label: "Completed YTD", value: `${yearlyStats.completed} / ${yearlyStats.total} expected` },
        { label: "Remaining YTD", value: `${yearlyStats.remaining} YTD` }
      ];

      content = (
        <div className="space-y-6 text-neutral-900">
          {/* Page 1: Summary & Month Table */}
          <div className="print-avoid-break space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                I. Executive Consistency Ledger
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Average completion rate calculations mapped for individual months of the year.
              </p>
            </div>

            <table className="w-full text-left border-collapse border border-neutral-200 shadow-sm max-w-sm mx-auto">
              <thead>
                <tr className="bg-indigo-600 text-white font-bold text-[9px] uppercase border-b border-indigo-700">
                  <th className="p-2.5 border border-indigo-700">Month</th>
                  <th className="p-2.5 border border-indigo-700 text-center w-36">Completion Rate</th>
                </tr>
              </thead>
              <tbody>
                {yearlyChartData.map((m) => (
                  <tr key={m.name} className="text-xs border-b border-neutral-100 odd:bg-neutral-50/30">
                    <td className="p-2.5 border border-neutral-200 font-semibold text-neutral-800">{m.name}</td>
                    <td className="p-2.5 border border-neutral-200 text-center font-bold text-indigo-600">{m.rate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clean Page Break */}
          <div className="print-page-break h-0" />

          {/* Page 2: Visualizations */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                II. Performance Data Visualizations
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Yearly average completion trends and completions distribution across all tracked routines.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 print-avoid-break">
              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">Yearly Completion Trend (%)</h4>
                <AreaChart width={280} height={180} data={yearlyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="printYearlyTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#4f46e5"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#printYearlyTrend)"
                    dot={{ r: 2.5, stroke: "#4f46e5", strokeWidth: 1, fill: "#ffffff" }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">Yearly Habit Contribution</h4>
                {yearlyPieData.length === 0 ? (
                  <div className="text-[10px] text-neutral-400 my-auto">No completions logged.</div>
                ) : (
                  <div className="w-[280px] h-[180px] flex items-center justify-center relative">
                    <PieChart width={280} height={180}>
                      <Pie
                        data={yearlyPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {yearlyPieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                )}
              </div>
            </div>

            {/* Yearly Routine Consistency Progress */}
            <div className="print-avoid-break border border-neutral-200 rounded-xl p-5 bg-white space-y-4">
              <div>
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase">Yearly Habit Consistency Progress</h4>
                <p className="text-[8px] text-neutral-400 mt-0.5">YTD success rates for all routines over this calendar year.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {yearlyProgressBars.map((item, index) => (
                  <div key={item.id} className="p-3 rounded-lg bg-neutral-50/50 border border-neutral-100 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <span>{item.emoji}</span>
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="text-[9px] font-bold text-neutral-500">
                        {item.completed} / {item.total} days ({item.percentage}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ 
                          width: `${item.percentage}%`,
                          backgroundColor: getActivityColor(index)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    } else if (type === "total") {
      title = "Lifetime Performance & Workspace Summary";
      dateInfo = "All-Time Logged Summary";
      stats = [
        { label: "Overall Consistency", value: `${overallConsistencyScore}%` },
        { label: "Lifetime Completed", value: `${lifetimeCompletions} Completed` },
        { label: "Total Expected Completed", value: overallExpectedCompletions }
      ];

      content = (
        <div className="space-y-6 text-neutral-900">
          {/* Page 1: Summary & Rankings */}
          <div className="print-avoid-break space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                I. Lifetime Consistency Leaderboard
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Rankings of routines based on their overall historical success rate within this workspace.
              </p>
            </div>

            <table className="w-full text-left border-collapse border border-neutral-200 shadow-sm">
              <thead>
                <tr className="bg-indigo-600 text-white font-bold text-[9px] uppercase border-b border-indigo-700">
                  <th className="p-2.5 border border-indigo-700 text-center w-12">Rank</th>
                  <th className="p-2.5 border border-indigo-700">Habit / Routine Name</th>
                  <th className="p-2.5 border border-indigo-700 text-center w-32">Consistency</th>
                  <th className="p-2.5 border border-indigo-700 text-center w-32">Completed Days</th>
                  <th className="p-2.5 border border-indigo-700 text-center w-32">Total Expected</th>
                </tr>
              </thead>
              <tbody>
                {activityConsistency.map((item, index) => (
                  <tr key={item.id} className="text-xs border-b border-neutral-100 odd:bg-neutral-50/30">
                    <td className="p-2.5 border border-neutral-200 text-center font-bold text-neutral-500">{index + 1}</td>
                    <td className="p-2.5 border border-neutral-200 font-semibold text-neutral-800">
                      <span className="mr-1 text-sm">{item.emoji}</span> {item.name}
                    </td>
                    <td className="p-2.5 border border-neutral-200 text-center font-bold text-indigo-600">{item.rate}%</td>
                    <td className="p-2.5 border border-neutral-200 text-center text-neutral-700 font-semibold">{item.completedDays} days</td>
                    <td className="p-2.5 border border-neutral-200 text-center text-neutral-500">{item.totalLoggedDays} days</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Clean Page Break */}
          <div className="print-page-break h-0" />

          {/* Page 2: Visualizations */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xs font-black uppercase tracking-wider text-indigo-900 border-b-2 border-indigo-100 pb-1 mb-3">
                II. Performance Data Visualizations
              </h2>
              <p className="text-[10px] text-neutral-500 mb-3">
                Long-term monthly trend averages and overall routine share contribution.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-6 print-avoid-break">
              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">Annual Average Trend (%)</h4>
                <AreaChart width={280} height={180} data={yearlyChartData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="printLifetimeTrend" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.2}/>
                      <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <YAxis domain={[0, 100]} stroke="#64748b" tick={{ fontSize: 8 }} tickLine={false} />
                  <Area
                    type="monotone"
                    dataKey="rate"
                    stroke="#4f46e5"
                    strokeWidth={1.5}
                    fillOpacity={1}
                    fill="url(#printLifetimeTrend)"
                    dot={{ r: 2.5, stroke: "#4f46e5", strokeWidth: 1, fill: "#ffffff" }}
                    isAnimationActive={false}
                  />
                </AreaChart>
              </div>

              <div className="border border-neutral-200 rounded-xl p-4 bg-white flex flex-col items-center justify-center">
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase mb-3">Lifetime Habit Contribution</h4>
                {yearlyPieData.length === 0 ? (
                  <div className="text-[10px] text-neutral-400 my-auto">No completions logged.</div>
                ) : (
                  <div className="w-[280px] h-[180px] flex items-center justify-center relative">
                    <PieChart width={280} height={180}>
                      <Pie
                        data={yearlyPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={65}
                        paddingAngle={4}
                        dataKey="value"
                        isAnimationActive={false}
                      >
                        {yearlyPieData.map((entry, idx) => (
                          <Cell key={`cell-${idx}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </div>
                )}
              </div>
            </div>

            {/* Lifetime Routine Consistency Progress */}
            <div className="print-avoid-break border border-neutral-200 rounded-xl p-5 bg-white space-y-4">
              <div>
                <h4 className="font-bold text-[9px] text-neutral-400 uppercase">Lifetime Habit Consistency Progress</h4>
                <p className="text-[8px] text-neutral-400 mt-0.5">Total consistency score achieved since routine creation.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                {activityConsistency.map((item, index) => (
                  <div key={item.id} className="p-3 rounded-lg bg-neutral-50/50 border border-neutral-100 flex flex-col justify-between space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                        <span>{item.emoji}</span>
                        <span className="truncate">{item.name}</span>
                      </span>
                      <span className="text-[9px] font-bold text-neutral-500">
                        {item.completedDays} / {item.totalLoggedDays} days ({item.rate}%)
                      </span>
                    </div>
                    <div className="w-full bg-neutral-200 h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full"
                        style={{ 
                          width: `${item.rate}%`,
                          backgroundColor: getActivityColor(index)
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      );
    }

    setPrintData({ type, title, dateInfo, stats, content });

    // Wait for the state to compile and render inside the DOM before print dialog
    setTimeout(() => {
      window.print();
      // Remove printable component layout on next frame
      setTimeout(() => {
        setPrintData(null);
      }, 500);
    }, 150);
  };

  // Add custom activity
  const handleCreateActivity = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newActivityName.trim()) return;
    const emojiToSave = newActivityEmoji || autoResolveEmoji(newActivityName);
    addActivity(newActivityName.trim(), emojiToSave, newActivityGoal);
    setNewActivityName("");
    setNewActivityEmoji("📝");
    setNewActivityGoal(60);
  };

  // Start editing
  const startEditing = (act: ActivityType) => {
    setEditingId(act.id);
    setEditingName(act.name);
    setEditingEmoji(act.emoji || "📝");
    setEditingGoal(act.targetMinutes || 60);
  };

  // Save inline edit
  const saveEditing = (id: string) => {
    if (editingName.trim()) {
      updateActivity(id, editingName.trim(), editingEmoji, editingGoal);
    }
    setEditingId(null);
    setShowEmojiPickerForId(null);
  };

  return (
    <>
      <div className="space-y-6 select-none pb-12 w-full max-w-full px-4 md:px-8 print:hidden">
      {/* Top dashboard row */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100 flex items-center gap-2.5">
            <CheckSquare className="w-7 h-7 text-indigo-500" />
            <span>Habit Workspace</span>
          </h1>
          <p className="text-sm text-neutral-400 mt-1">
            Track custom routines, daily targets, and visualizes comprehensive analytics.
          </p>
        </div>
        
        {/* Tab view switcher (Spreadsheet vs Reports) */}
        <div className="flex p-0.5 rounded-2xl bg-neutral-200/50 dark:bg-neutral-800/40 border border-neutral-200/20 dark:border-neutral-700/25 w-fit">
          <button
            onClick={() => setCurrentView("spreadsheet")}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              currentView === "spreadsheet"
                ? "bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
            }`}
          >
            <Calendar className="w-4.5 h-4.5" />
            <span>Habit Sheet</span>
          </button>
          <button
            onClick={() => setCurrentView("reports")}
            className={`px-4 py-2 text-xs font-bold rounded-xl flex items-center gap-2 cursor-pointer transition-all ${
              currentView === "reports"
                ? "bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
            }`}
          >
            <BarChart2 className="w-4.5 h-4.5" />
            <span>Analytics & Reports</span>
          </button>
        </div>
      </div>

      {/* Main View rendering */}

      {/* View 1: Notion-style sheet */}
      {currentView === "spreadsheet" && (
        <div className="space-y-6">
          {/* Consistency Metrics (Habits Section Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <BorderGlow glowColor="from-indigo-500/20 via-purple-500/20 to-pink-500/20" duration={6} className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4 p-3.5">
                <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500 shrink-0">
                  <CheckSquare className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Daily Consistency</p>
                  <h3 className="text-2xl font-extrabold mt-0.5">{todayStats.rate}%</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{todayStats.completed} / {activities.length} completed today</p>
                </div>
              </div>
            </BorderGlow>

            <BorderGlow glowColor="from-emerald-500/20 via-teal-500/20 to-cyan-500/20" duration={6} className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4 p-3.5">
                <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500 shrink-0">
                  <Award className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Weekly Consistency</p>
                  <h3 className="text-2xl font-extrabold mt-0.5">{weeklyStats.completionRate}%</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">{weeklyStats.completedCount} / {weeklyStats.totalPossible} completed</p>
                </div>
              </div>
            </BorderGlow>

            <BorderGlow glowColor="from-amber-500/20 via-orange-500/20 to-rose-500/20" duration={6} className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4 p-3.5">
                <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Total Completed Activities</p>
                  <h3 className="text-xl lg:text-2xl font-extrabold mt-0.5">{lifetimeCompletions} Completed {lifetimeCompletions === 1 ? 'Activity' : 'Activities'}</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">Out of {overallExpectedCompletions} expected</p>
                </div>
              </div>
            </BorderGlow>

            <BorderGlow glowColor="from-red-500/20 via-rose-500/20 to-pink-500/20" duration={6} className="hover:-translate-y-0.5 hover:shadow-md transition-all duration-300">
              <div className="flex items-center space-x-4 p-3.5">
                <div className="p-3 bg-red-500/10 rounded-xl text-red-500 shrink-0">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Remaining Tasks</p>
                  <h3 className="text-2xl font-extrabold mt-0.5">{todayStats.remaining} Daily</h3>
                  <p className="text-xs text-neutral-400 mt-0.5">W: {weeklyStats.remaining} | M: {monthlyStats.remaining} | Y: {yearlyStats.remaining}</p>
                </div>
              </div>
            </BorderGlow>
          </div>

          <div className="glass-panel rounded-2xl p-6 space-y-4">
          {/* Calendar navigation */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-neutral-200/50 dark:border-neutral-800/40 pb-4">
            <div className="flex flex-col">
              <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100 flex items-center gap-2">
                <span>Habit Sheet database</span>
              </h2>
              <span className="text-xs text-neutral-400 font-semibold tracking-wide mt-0.5">{formattedWeekRange}</span>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handlePrevWeek}
                className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <button
                onClick={handleResetToCurrent}
                className="px-3 py-1.5 text-xs font-bold bg-neutral-100 dark:bg-neutral-800/60 border border-neutral-200/30 dark:border-neutral-800/30 hover:bg-neutral-200/50 dark:hover:bg-neutral-800 rounded-xl transition-all cursor-pointer text-neutral-700 dark:text-neutral-300"
              >
                This Week
              </button>

              <button
                onClick={handleNextWeek}
                className="p-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 hover:bg-neutral-100 dark:hover:bg-white/5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* spreadsheet container */}
          <div className="overflow-x-auto rounded-xl border border-neutral-200/40 dark:border-neutral-800/35">
            <table className="w-full text-left border-collapse min-w-[850px]">
              <thead>
                <tr className="bg-neutral-50/50 dark:bg-neutral-900/30 text-neutral-400 dark:text-neutral-500 font-bold text-[10px] uppercase tracking-wider border-b border-neutral-200/50 dark:border-neutral-800/40">
                  <th className="p-3.5 pl-5 w-[220px]">Daily Routine / Habit</th>
                  <th className="p-3.5 w-[100px] text-center">Daily Goal</th>
                  {weekDates.map((day, idx) => {
                    const dayLabel = day.toLocaleDateString(undefined, { weekday: "short" });
                    const dayNum = day.getDate();
                    const isToday = day.toISOString().split("T")[0] === new Date().toISOString().split("T")[0];
                    const dateStr = day.toISOString().split("T")[0];
                    const allCompleted = activities.length > 0 && activities.every((act) => {
                      const log = getLogEntry(act.id, dateStr);
                      return log && log.completed;
                    });
                    const hasSomeCompleted = activities.length > 0 && !allCompleted && activities.some((act) => {
                      const log = getLogEntry(act.id, dateStr);
                      return log && log.completed;
                    });

                    return (
                      <th key={idx} className={`p-3.5 text-center w-[85px] ${isToday ? "text-indigo-600 dark:text-indigo-400 font-extrabold" : ""}`}>
                        <div className="flex flex-col items-center">
                          <span>{dayLabel}</span>
                          <span className="text-[9px] mt-0.5 opacity-80">{dayNum}</span>
                          {activities.length > 0 && (
                            <button
                              type="button"
                              onClick={() => handleToggleAllDay(dateStr)}
                              title={allCompleted ? "Deselect all routines for this day" : "Complete all routines for this day"}
                              className="mt-1.5 w-4 h-4 rounded border flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95 cursor-pointer"
                              style={{
                                backgroundColor: allCompleted ? "#4f46e5" : "transparent",
                                borderColor: allCompleted ? "#4f46e5" : hasSomeCompleted ? "#7c3aed" : "rgba(128, 128, 128, 0.3)",
                              }}
                            >
                              <Check
                                className={`w-3 h-3 stroke-[4] transition-all duration-200 ${
                                  allCompleted
                                    ? "text-white scale-100"
                                    : hasSomeCompleted
                                    ? "text-purple-500 scale-75 opacity-70"
                                    : "text-transparent scale-50 hover:text-neutral-400 hover:scale-75"
                                }`}
                              />
                            </button>
                          )}
                        </div>
                      </th>
                    );
                  })}
                  <th className="p-3.5 text-center w-[110px]">Weekly Completion</th>
                  <th className="p-3.5 text-center w-[50px] pr-5">Actions</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((act) => {
                  const isEditing = editingId === act.id;
                  const actColor = getActivityColor(activities.indexOf(act));
                  
                  // Calculate completions inside weekDates
                  const completedInWeek = weekDates.filter((day) => {
                    const dateStr = day.toISOString().split("T")[0];
                    const log = getLogEntry(act.id, dateStr);
                    return log && log.completed;
                  }).length;
                  const pct = Math.round((completedInWeek / 7) * 100);

                  return (
                    <tr key={act.id} className="border-b border-neutral-200/30 dark:border-neutral-800/20 hover:bg-neutral-50/30 dark:hover:bg-neutral-900/10 transition-colors group relative">
                      
                      {/* Emoji & Habit Naming Cell */}
                      <td className="p-3.5 pl-5 text-sm text-neutral-800 dark:text-neutral-200 font-medium">
                        {isEditing ? (
                          <div className="flex items-center space-x-2">
                            {/* Emoji Picker toggle */}
                            <button
                              type="button"
                              onClick={() => setShowEmojiPickerForId(showEmojiPickerForId === act.id ? null : act.id)}
                              className="text-base p-1 bg-black/5 dark:bg-white/5 rounded hover:bg-black/10 dark:hover:bg-white/10 cursor-pointer"
                            >
                              {editingEmoji}
                            </button>
                            <input
                              type="text"
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              onBlur={() => {
                                // Wait short interval to allow emoji clicks
                                setTimeout(() => saveEditing(act.id), 200);
                              }}
                              onKeyDown={(e) => e.key === "Enter" && saveEditing(act.id)}
                              autoFocus
                              className="flex-1 text-sm bg-transparent border-b border-indigo-500 focus:outline-none text-neutral-800 dark:text-neutral-100 px-0.5"
                            />
                            
                            {/* Floating Emoji Selector */}
                            {showEmojiPickerForId === act.id && (
                              <div className="absolute z-20 left-5 bottom-full mb-2 p-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xl grid grid-cols-4 gap-1.5 animate-in fade-in slide-in-from-bottom-2 duration-205">
                                {PREMIUM_EMOJIS.map((emo) => (
                                  <button
                                    key={emo}
                                    type="button"
                                    onClick={() => {
                                      setEditingEmoji(emo);
                                      setShowEmojiPickerForId(null);
                                    }}
                                    className="p-1 text-base hover:bg-neutral-100 dark:hover:bg-white/5 rounded cursor-pointer"
                                  >
                                    {emo}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span
                            className="flex items-center gap-2.5 cursor-pointer hover:text-indigo-500 dark:hover:text-indigo-400 transition-colors"
                            onClick={() => startEditing(act)}
                          >
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: actColor }} />
                            <span className="text-base shrink-0">{act.emoji || "📝"}</span>
                            <span className="truncate">{act.name}</span>
                          </span>
                        )}
                      </td>

                      {/* Daily Goal Cell */}
                      <td className="p-3.5 text-center text-xs text-neutral-500 dark:text-neutral-400 font-semibold">
                        {isEditing ? (
                          <select
                            value={editingGoal}
                            onChange={(e) => setEditingGoal(Number(e.target.value))}
                            className="px-2 py-1 text-xs rounded border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 text-neutral-800 dark:text-neutral-200 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          >
                            {DURATION_OPTIONS.map((opt) => (
                              <option key={opt.value} value={opt.value}>
                                {opt.label}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <span>{formatMinutes(act.targetMinutes || 0)}</span>
                        )}
                      </td>

                      {/* Weekday Completion Cells (Fitts's Law Clickable Cell with Activity Theme Coloring) */}
                      {weekDates.map((day, idx) => {
                        const dateStr = day.toISOString().split("T")[0];
                        const log = getLogEntry(act.id, dateStr);
                        const completed = log ? log.completed : false;

                        return (
                          <td
                            key={idx}
                            onClick={() => handleToggleCheck(dateStr, act.id)}
                            className="p-3 text-center align-middle border-r border-neutral-200/5 dark:border-neutral-800/10 cursor-pointer hover:bg-neutral-50/50 dark:hover:bg-neutral-900/30 transition-all duration-200 select-none group/cell relative"
                            style={{
                              ['--cell-act-color' as any]: actColor,
                            } as React.CSSProperties}
                          >
                            <div className="flex items-center justify-center">
                              <div
                                className="w-6 h-6 rounded-lg border flex items-center justify-center transition-all duration-200 active:scale-90 border-neutral-300 dark:border-neutral-700 group-hover/cell:border-[color:var(--cell-act-color)]"
                                style={{
                                  backgroundColor: completed ? actColor : "transparent",
                                  borderColor: completed ? actColor : undefined,
                                  boxShadow: completed ? `0 3px 8px ${actColor}30` : "none",
                                }}
                              >
                                <Check 
                                  className={`w-4 h-4 stroke-[3.5] transition-all duration-200 ${
                                    completed 
                                      ? "text-white scale-100" 
                                      : "text-transparent scale-75 group-hover/cell:text-[color:var(--cell-act-color)]/30 group-hover/cell:scale-95"
                                  }`} 
                                />
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      {/* Progress bar */}
                      <td className="p-3.5 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <div className="w-16 bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden shrink-0">
                            <div
                              className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-300"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400">{completedInWeek}/7</span>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="p-3.5 text-center pr-5">
                        <button
                          onClick={() => deleteActivity(act.id)}
                          className="p-1 rounded text-neutral-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-black/5 dark:hover:bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer mx-auto block"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {/* Inline add routine row */}
                <tr className="border-b border-neutral-200/30 dark:border-neutral-800/20">
                  <td colSpan={11} className="p-4 pl-5">
                    <form onSubmit={handleCreateActivity} className="flex flex-col sm:flex-row sm:items-center gap-3">
                      <div className="flex items-center gap-2 flex-1">
                        {/* Emoji dropdown */}
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => setShowEmojiPickerForId(showEmojiPickerForId === "new" ? null : "new")}
                            className="text-base p-2 bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/50 dark:border-neutral-800/50 rounded-xl hover:bg-neutral-200 dark:hover:bg-neutral-700 cursor-pointer flex items-center justify-center w-9 h-9"
                          >
                            {newActivityEmoji}
                          </button>
                          
                          {showEmojiPickerForId === "new" && (
                            <div className="absolute z-20 left-0 bottom-full mb-2 p-2 rounded-xl bg-white dark:bg-neutral-950 border border-neutral-200/80 dark:border-neutral-800/80 shadow-xl grid grid-cols-4 gap-1.5 w-36 animate-in fade-in slide-in-from-bottom-2 duration-205">
                              {PREMIUM_EMOJIS.map((emo) => (
                                <button
                                  key={emo}
                                  type="button"
                                  onClick={() => {
                                    setNewActivityEmoji(emo);
                                    setShowEmojiPickerForId(null);
                                  }}
                                  className="p-1.5 text-sm hover:bg-neutral-100 dark:hover:bg-white/5 rounded cursor-pointer"
                                >
                                  {emo}
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        
                        <span 
                          className="w-2.5 h-2.5 rounded-full shrink-0 border border-black/5 dark:border-white/5"
                          style={{ backgroundColor: getActivityColor(activities.length) }}
                          title="Habit Color Category"
                        />
                        <input
                          type="text"
                          required
                          placeholder="＋ Create new habit..."
                          value={newActivityName}
                          onChange={(e) => setNewActivityName(e.target.value)}
                          className="flex-1 bg-transparent border-b border-neutral-200/50 dark:border-neutral-800/50 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 focus:outline-none focus:border-indigo-500 placeholder-neutral-400 dark:placeholder-neutral-600"
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Goal:</span>
                        <select
                          value={newActivityGoal}
                          onChange={(e) => setNewActivityGoal(Number(e.target.value))}
                          className="px-2.5 py-1.5 text-xs rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white dark:bg-neutral-900 text-neutral-700 dark:text-neutral-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                        >
                          {DURATION_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <button
                          type="submit"
                          className="px-4 py-1.5 text-xs bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-semibold cursor-pointer active:scale-95 transition-all shadow-md shadow-indigo-600/10"
                        >
                          Add Habit
                        </button>
                      </div>
                    </form>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}

      {/* View 2: Performance analytics & reports view */}
      {currentView === "reports" && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Sub Tab selection */}
          <div className="flex items-center justify-between border-b border-neutral-200/50 dark:border-neutral-800/40 pb-4">
            <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-indigo-500" />
              <span>Performance Visualizations</span>
            </h2>
            
            <div className="flex p-0.5 rounded-xl bg-neutral-200/50 dark:bg-neutral-800/40 border border-neutral-200/20 dark:border-neutral-700/25">
              {(["daily", "weekly", "monthly", "yearly"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveReportTab(tab)}
                  className={`px-3 py-1 text-[10px] font-bold rounded-lg uppercase tracking-wider transition-all cursor-pointer ${
                    activeReportTab === tab
                      ? "bg-white dark:bg-neutral-900 text-indigo-600 dark:text-indigo-400 shadow-sm"
                      : "text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-300"
                  }`}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Tab 0: Daily Report Section */}
          {activeReportTab === "daily" && (
            <div className="space-y-6">
              {/* Premium Date Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 border border-indigo-500/10 dark:border-indigo-500/25 p-5 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <Calendar className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-indigo-600 text-white rounded-md">
                        Daily Analytics
                      </span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-extrabold uppercase tracking-wide">
                        {baseDate.toLocaleDateString(undefined, { weekday: 'long' })}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-1">
                      {baseDate.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                  </div>
                </div>
                
                <button
                  onClick={() => handleExportPDF("daily")}
                  className="px-3.5 py-1.5 text-[10px] font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/15 shrink-0 self-start sm:self-center active:scale-95"
                >
                  <span>📥</span> Export Daily PDF
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column: Premium Habit Checklist Cards */}
                <div className="lg:col-span-3 glass-panel rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      Routines Checklist
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Daily habits tracking and actual duration logged for the day.
                    </p>
                  </div>
                  
                  {activities.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400">
                      No habits created yet. Create some routines in the Habit Sheet!
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
                      {activities.map((act) => {
                        const dateStr = baseDate.toISOString().split("T")[0];
                        const log = getLogEntry(act.id, dateStr);
                        const completed = log ? log.completed : false;
                        const actColor = getActivityColor(activities.indexOf(act));
                        
                        const actualMinutes = log && log.completed ? log.durationMinutes || act.targetMinutes || 0 : 0;
                        const targetMinutes = act.targetMinutes || 60;
                        const progressPct = Math.min(Math.round((actualMinutes / targetMinutes) * 100), 100);

                        return (
                          <div
                            key={act.id}
                            style={{ borderLeftColor: actColor }}
                            className={`flex flex-col p-4 rounded-xl border border-l-4 transition-all ${
                              completed
                                ? "bg-indigo-500/5 dark:bg-indigo-500/10 border-indigo-500/10 dark:border-indigo-500/20"
                                : "bg-neutral-50/20 dark:bg-neutral-900/15 border-neutral-200/40 dark:border-neutral-800/25"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <span className="text-xl shrink-0">{act.emoji}</span>
                                <div>
                                  <h4 className="text-sm font-bold text-neutral-800 dark:text-neutral-200">
                                    {act.name}
                                  </h4>
                                  <p className="text-[10px] text-neutral-400 font-semibold mt-0.5">
                                    Goal: {formatMinutes(targetMinutes)}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                {completed ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[8px] font-extrabold uppercase bg-indigo-600 text-white rounded-md">
                                    <Check className="w-2.5 h-2.5 stroke-[4]" /> Completed
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[8px] font-extrabold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-400 rounded-md border border-neutral-200/5 dark:border-neutral-800/5">
                                    Pending
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Goal Progress bar inside checklist card */}
                            <div className="mt-3.5 space-y-1.5">
                              <div className="flex justify-between items-center text-[9px] text-neutral-400 font-bold">
                                <span>LOGGED: {formatMinutes(actualMinutes)}</span>
                                <span>{progressPct}%</span>
                              </div>
                              <div className="w-full bg-neutral-200/50 dark:bg-neutral-800/50 h-1.5 rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all duration-300"
                                  style={{ 
                                    width: `${progressPct}%`,
                                    backgroundColor: actColor
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Daily Donut Chart & Productivity Metrics Widget */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Premium Donut Chart Panel */}
                  <div className="glass-panel rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                        Daily Completion Ratio
                      </h3>
                      <p className="text-[11px] text-neutral-400 mt-1">
                        Ratio of completed vs pending habits for today.
                      </p>
                    </div>

                    {activities.length === 0 ? (
                      <div className="py-12 text-center text-xs text-neutral-400 my-auto">
                        No habits tracking active.
                      </div>
                    ) : (
                      <div className="flex-1 flex flex-col items-center justify-center my-6">
                        <div className="h-44 w-full relative flex items-center justify-center">
                          <PieChart width={200} height={200}>
                            <Pie
                              data={[
                                { name: "Completed", value: dailyStats.completed, color: "#4f46e5" },
                                { name: "Pending", value: dailyStats.remaining, color: "#e2e8f0" }
                              ].filter(d => d.value > 0)}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={78}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {[
                                { name: "Completed", value: dailyStats.completed, color: "#4f46e5" },
                                { name: "Pending", value: dailyStats.remaining, color: "#e2e8f0" }
                              ].filter(d => d.value > 0).map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              formatter={(value) => [`${value} habits`, "Count"]}
                              contentStyle={{
                                backgroundColor: "rgba(9, 9, 11, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                fontSize: "11px"
                              }}
                            />
                          </PieChart>
                          
                          {/* Center Text */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-2xl font-black text-neutral-800 dark:text-neutral-100">{dailyStats.rate}%</span>
                            <span className="text-[9px] text-neutral-400 uppercase tracking-widest font-extrabold mt-0.5">Completed</span>
                          </div>
                        </div>
                        
                        <div className="w-full mt-4 border-t border-neutral-200/50 dark:border-neutral-800/40 pt-4 text-[10px] space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-indigo-600" />
                              <span className="text-neutral-500 font-medium">Completed</span>
                            </span>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">{dailyStats.completed} Habits</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center gap-1.5">
                              <span className="w-2.5 h-2.5 rounded-full bg-neutral-200 dark:bg-neutral-800" />
                              <span className="text-neutral-500 font-medium">Pending</span>
                            </span>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200">{dailyStats.remaining} Habits</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Daily Productivity Metrics Widget */}
                  <div className="glass-panel rounded-2xl p-5 space-y-3">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-indigo-500" />
                      <span>Daily Productivity Metrics</span>
                    </h4>
                    <div className="grid grid-cols-2 gap-3.5 text-center mt-2">
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/20 rounded-xl">
                        <span className="text-[9px] text-neutral-400 font-bold uppercase">Logged Time</span>
                        <h5 className="text-base font-extrabold text-neutral-800 dark:text-neutral-100 mt-1">{dailyDurationStats.actualHours} hrs</h5>
                      </div>
                      <div className="p-3 bg-neutral-50 dark:bg-neutral-900/40 border border-neutral-200/20 rounded-xl">
                        <span className="text-[9px] text-neutral-400 font-bold uppercase">Target Time</span>
                        <h5 className="text-base font-extrabold text-neutral-800 dark:text-neutral-100 mt-1">{dailyDurationStats.targetHours} hrs</h5>
                      </div>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-neutral-200/20 text-xs mt-1">
                      <span className="text-neutral-400 font-medium">Goal Accomplishment:</span>
                      <span className="font-bold text-indigo-600 dark:text-indigo-400">{dailyDurationStats.efficiency}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 1: Weekly Report Section */}
          {activeReportTab === "weekly" && (
            <div className="space-y-6">
              {/* Premium Date Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 border border-indigo-500/10 dark:border-indigo-500/25 p-5 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <TrendingUp className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-indigo-600 text-white rounded-md">
                        Weekly Analytics
                      </span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-extrabold uppercase tracking-wide">
                        Year: {baseDate.getFullYear()}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-1">
                      {formattedWeekRange}
                    </h3>
                  </div>
                </div>
                
                <button
                  onClick={() => handleExportPDF("weekly")}
                  className="px-3.5 py-1.5 text-[10px] font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/15 shrink-0 self-start sm:self-center active:scale-95"
                >
                  <span>📥</span> Export Weekly PDF
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column: Weekly Trend Chart */}
                <div className="lg:col-span-3 glass-panel rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      Weekly Completion Trend
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Visualizes routine completion rates day-by-day over the active week.
                    </p>
                  </div>
                  
                  <div className="h-64 w-full text-[10px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={weeklyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorRate" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                            <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" />
                        <XAxis dataKey="name" stroke="#888888" tickLine={false} axisLine={false} />
                        <YAxis domain={[0, 100]} stroke="#888888" tickLine={false} axisLine={false} />
                        <ChartTooltip
                          contentStyle={{
                            backgroundColor: "rgba(9, 9, 11, 0.95)",
                            border: "1px solid rgba(255, 255, 255, 0.1)",
                            borderRadius: "12px",
                            fontSize: "11px"
                          }}
                          formatter={(value) => [`${value}%`, "Completion Rate"]}
                        />
                        <Area
                          type="monotone"
                          dataKey="rate"
                          name="Completion Rate (%)"
                          stroke="#4f46e5"
                          strokeWidth={2}
                          fillOpacity={1}
                          fill="url(#colorRate)"
                          dot={{ r: 3, stroke: "#4f46e5", strokeWidth: 1.5, fill: "#ffffff" }}
                          activeDot={{ r: 5 }}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Right Column: Weekly Pie Chart */}
                <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      Weekly Habit Contribution
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Completions distribution across routines this week.
                    </p>
                  </div>

                  {weeklyPieData.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200/50 dark:border-neutral-800/80 rounded-xl my-auto">
                      No routine logs found for this week. Go back and tick off habits!
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center my-4">
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={weeklyPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {weeklyPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              formatter={(value) => [`${value} completions`, "Logged"]}
                              contentStyle={{
                                backgroundColor: "rgba(9, 9, 11, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                fontSize: "11px"
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-4 border-t border-neutral-200/50 dark:border-neutral-800/40 pt-4 text-[10px]">
                        {weeklyPieData.slice(0, 8).map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-neutral-500 truncate text-[10px]">{item.name}</span>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 shrink-0 ml-auto">{item.value} completed</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Bottom Column: Weekly Progress Bars */}
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Weekly Habit Progress
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Completion rate progress bars for each habit this week.
                  </p>
                </div>

                {weeklyProgressBars.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    No habits created yet. Create some routines in the Habit Sheet!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {weeklyProgressBars.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl bg-neutral-50/30 dark:bg-neutral-900/10 border border-neutral-200/20 dark:border-neutral-800/10 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <span>{item.emoji}</span>
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            {item.completed} / {item.total} days ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: getActivityColor(weeklyProgressBars.indexOf(item))
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Monthly Calendar Heatmap Grid & Charts */}
          {activeReportTab === "monthly" && (
            <div className="space-y-6">
              {/* Premium Date Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 border border-indigo-500/10 dark:border-indigo-500/25 p-5 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <Calendar className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-indigo-600 text-white rounded-md">
                        Monthly Analytics
                      </span>
                      <span className="text-xs text-neutral-400 dark:text-neutral-500 font-extrabold uppercase tracking-wide">
                        Year: {baseDate.getFullYear()}
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-1">
                      {monthlyName}
                    </h3>
                  </div>
                </div>
                
                <button
                  onClick={() => handleExportPDF("monthly")}
                  className="px-3.5 py-1.5 text-[10px] font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/15 shrink-0 self-start sm:self-center active:scale-95"
                >
                  <span>📥</span> Export Monthly PDF
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column: Monthly Heatmap calendar */}
                <div className="lg:col-span-3 glass-panel rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      {monthlyName} Completion Heatmap
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Grid calendar colored by completion density. Click any cell to view that week's sheet.
                    </p>
                  </div>

                  <div className="border border-neutral-200/50 dark:border-neutral-800/40 p-4 rounded-2xl bg-neutral-50/20 dark:bg-neutral-900/10">
                    <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-bold uppercase tracking-wider text-neutral-400 mb-2.5">
                      <span>Sun</span>
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {monthlyHeatmap.map((day, idx) => {
                        if (day.pad || day.percentage === undefined) {
                          return <div key={`pad-${idx}`} className="aspect-square" />;
                        }

                        let colorClass = "bg-neutral-100 dark:bg-neutral-800/30 border border-neutral-200/20 dark:border-neutral-800/10 text-neutral-500 dark:text-neutral-400";
                        if (day.percentage > 0 && day.percentage <= 33) {
                          colorClass = "bg-indigo-500/10 dark:bg-indigo-500/5 border border-indigo-500/20 dark:border-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-semibold";
                        } else if (day.percentage > 33 && day.percentage <= 66) {
                          colorClass = "bg-indigo-500/25 dark:bg-indigo-500/15 border border-indigo-500/30 dark:border-indigo-500/20 text-indigo-700 dark:text-indigo-200 font-bold";
                        } else if (day.percentage > 66 && day.percentage < 100) {
                          colorClass = "bg-indigo-500/45 dark:bg-indigo-500/30 border border-indigo-500/50 dark:border-indigo-500/35 text-indigo-900 dark:text-indigo-100 font-extrabold";
                        } else if (day.percentage === 100) {
                          colorClass = "bg-gradient-to-tr from-indigo-500 to-purple-500 border border-indigo-500 text-white font-extrabold shadow-md shadow-indigo-500/10";
                        }

                        const isSelected = baseDate.toISOString().split("T")[0] === day.dateStr;

                        return (
                          <div
                            key={`day-${day.dayNumber}`}
                            onClick={() => {
                              handleDayClickInHeatmap(day.dateStr);
                              setCurrentView("spreadsheet");
                            }}
                            title={`${day.dayNumber} ${monthlyName}: ${day.completed}/${day.total} habits completed (${day.percentage}%)`}
                            className={`aspect-square flex flex-col items-center justify-center rounded-xl text-xs cursor-pointer hover:scale-105 active:scale-95 transition-all ${colorClass} ${
                              isSelected ? "ring-2 ring-indigo-500/80 ring-offset-2 dark:ring-offset-neutral-900 shadow-md shadow-indigo-500/25 scale-105 z-10" : ""
                            }`}
                          >
                            <span>{day.dayNumber}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Right Column: Monthly Pie Chart */}
                <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      Monthly Habit Contribution
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Completions distribution across routines this month.
                    </p>
                  </div>

                  {monthlyPieData.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200/50 dark:border-neutral-800/80 rounded-xl my-auto">
                      No routine logs found for this month. Go back and tick off habits!
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center my-4">
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={monthlyPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {monthlyPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              formatter={(value) => [`${value} completions`, "Logged"]}
                              contentStyle={{
                                backgroundColor: "rgba(9, 9, 11, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                fontSize: "11px"
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-4 border-t border-neutral-200/50 dark:border-neutral-800/40 pt-4 text-[10px]">
                        {monthlyPieData.slice(0, 8).map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-neutral-500 truncate text-[10px]">{item.name}</span>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 shrink-0 ml-auto">{item.value} completed</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Row: Monthly Trend Chart */}
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Monthly Completion Trend
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Visualizes consistency rating day-by-day across the entire active month.
                  </p>
                </div>

                <div className="h-56 w-full text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorMonthlyRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" />
                      <XAxis dataKey="name" stroke="#888888" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="#888888" tickLine={false} axisLine={false} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "rgba(9, 9, 11, 0.95)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          fontSize: "11px"
                        }}
                        formatter={(value) => [`${value}%`, "Completion Rate"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="rate"
                        name="Completion Rate (%)"
                        stroke="#4f46e5"
                        strokeWidth={1.5}
                        fillOpacity={1}
                        fill="url(#colorMonthlyRate)"
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Row: Monthly Progress Bars */}
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Monthly Habit Progress
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Completion rate progress bars for each habit this month.
                  </p>
                </div>

                {monthlyProgressBars.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    No habits created yet. Create some routines in the Habit Sheet!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {monthlyProgressBars.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl bg-neutral-50/30 dark:bg-neutral-900/10 border border-neutral-200/20 dark:border-neutral-800/10 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <span>{item.emoji}</span>
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            {item.completed} / {item.total} days ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: getActivityColor(monthlyProgressBars.indexOf(item))
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 3: Yearly consistency leaderboard & charts */}
          {activeReportTab === "yearly" && (
            <div className="space-y-6">
              {/* Premium Date Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-500/5 via-purple-500/5 to-pink-500/5 dark:from-indigo-500/10 dark:via-purple-500/10 dark:to-pink-500/10 border border-indigo-500/10 dark:border-indigo-500/25 p-5 rounded-2xl">
                <div className="flex items-center gap-3.5">
                  <div className="p-3 bg-indigo-500/10 rounded-xl text-indigo-500">
                    <Award className="w-5.5 h-5.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 text-[9px] font-extrabold uppercase tracking-wide bg-indigo-600 text-white rounded-md">
                        Yearly Analytics
                      </span>
                    </div>
                    <h3 className="text-lg font-black text-neutral-800 dark:text-neutral-100 mt-1">
                      Year of {baseDate.getFullYear()}
                    </h3>
                  </div>
                </div>
                
                <div className="flex gap-2 shrink-0 self-start sm:self-center">
                  <button
                    onClick={() => handleExportPDF("yearly")}
                    className="px-3.5 py-1.5 text-[10px] font-bold rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition-all flex items-center gap-1.5 cursor-pointer shadow-sm shadow-indigo-600/15 active:scale-95"
                  >
                    <span>📥</span> Export Yearly PDF
                  </button>
                  <button
                    onClick={() => handleExportPDF("total")}
                    className="px-3.5 py-1.5 text-[10px] font-bold rounded-xl bg-purple-600 hover:bg-purple-500 text-white shadow-sm flex items-center gap-1.5 cursor-pointer shadow-sm shadow-purple-600/15 transition-all active:scale-95"
                  >
                    <span>📊</span> Export Lifetime PDF
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Left Column: Consistency Leaderboard */}
                <div className="lg:col-span-3 glass-panel rounded-2xl p-6 space-y-4">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      Consistency Leaderboard
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Overall success rates of tracked habits. Build momentum to earn badges.
                    </p>
                  </div>

                  {activityConsistency.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200/50 dark:border-neutral-800/80 rounded-xl">
                      No tracking logs recorded yet. Tick some sheet checkmarks first!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-4 max-h-[300px] overflow-y-auto pr-1">
                      {activityConsistency.map((item) => {
                        const radius = 20;
                        const strokeWidth = 4;
                        const circumference = 2 * Math.PI * radius;
                        const strokeDashoffset = circumference - (item.rate / 100) * circumference;

                        let badgeLabel = "🌱 Building Habit";
                        let badgeStyle = "bg-neutral-500/10 text-neutral-500 border-neutral-500/20";
                        if (item.rate >= 90) {
                          badgeLabel = "🏆 Elite Consistency";
                          badgeStyle = "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25 animate-pulse";
                        } else if (item.rate >= 75) {
                          badgeLabel = "🔥 High Consistency";
                          badgeStyle = "bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-500/25";
                        } else if (item.rate >= 50) {
                          badgeLabel = "⚡ Steady Progress";
                          badgeStyle = "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/25";
                        }

                        return (
                          <div
                            key={item.id}
                            className="flex items-center justify-between p-3.5 rounded-2xl bg-neutral-50/40 dark:bg-neutral-900/25 border border-neutral-200/40 dark:border-neutral-800/20 hover:border-indigo-500/20 hover:-translate-y-0.5 hover:shadow-md transition-all duration-300"
                          >
                            <div className="flex items-center space-x-3 min-w-0">
                              <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                                <svg className="w-full h-full transform -rotate-90">
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth={strokeWidth}
                                    className="text-neutral-200 dark:text-neutral-800"
                                    fill="transparent"
                                  />
                                  <circle
                                    cx="24"
                                    cy="24"
                                    r={radius}
                                    stroke="currentColor"
                                    strokeWidth={strokeWidth}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={strokeDashoffset}
                                    strokeLinecap="round"
                                    className="text-indigo-600 dark:text-indigo-400 transition-all duration-500"
                                    fill="transparent"
                                  />
                                </svg>
                                <span className="absolute text-[9px] font-extrabold text-neutral-800 dark:text-neutral-200">
                                  {item.rate}%
                                </span>
                              </div>
                              
                              <div className="min-w-0 space-y-0.5">
                                <h4 className="font-bold text-sm text-neutral-800 dark:text-neutral-200 truncate flex items-center gap-1.5">
                                  <span>{item.emoji}</span>
                                  <span className="truncate">{item.name}</span>
                                </h4>
                                
                                <span className={`inline-flex items-center px-1.5 py-0.5 text-[8px] font-extrabold uppercase tracking-wide rounded-full border ${badgeStyle}`}>
                                  {badgeLabel}
                                </span>
                              </div>
                            </div>

                            <div className="text-right text-[10px] font-semibold text-neutral-400 shrink-0 border-l border-neutral-200/50 dark:border-neutral-800/40 pl-3 space-y-0.5">
                              <div>
                                <span className="text-neutral-800 dark:text-neutral-200 font-bold">{item.completedDays}</span> / {item.totalLoggedDays} days
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Right Column: Yearly Pie Chart */}
                <div className="lg:col-span-2 glass-panel rounded-2xl p-6 flex flex-col justify-between">
                  <div>
                    <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                      Yearly Habit Contribution
                    </h3>
                    <p className="text-[11px] text-neutral-400 mt-1">
                      Completions distribution across routines this year.
                    </p>
                  </div>

                  {yearlyPieData.length === 0 ? (
                    <div className="py-12 text-center text-xs text-neutral-400 border border-dashed border-neutral-200/50 dark:border-neutral-800/80 rounded-xl my-auto">
                      No routine logs found for this year. Go back and tick off habits!
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col items-center justify-center my-4">
                      <div className="h-48 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={yearlyPieData}
                              cx="50%"
                              cy="50%"
                              innerRadius={50}
                              outerRadius={75}
                              paddingAngle={4}
                              dataKey="value"
                            >
                              {yearlyPieData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                              ))}
                            </Pie>
                            <ChartTooltip
                              formatter={(value) => [`${value} completions`, "Logged"]}
                              contentStyle={{
                                backgroundColor: "rgba(9, 9, 11, 0.95)",
                                border: "1px solid rgba(255, 255, 255, 0.1)",
                                borderRadius: "12px",
                                fontSize: "11px"
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 w-full mt-4 border-t border-neutral-200/50 dark:border-neutral-800/40 pt-4 text-[10px]">
                        {yearlyPieData.slice(0, 8).map((item, idx) => (
                          <div key={idx} className="flex items-center space-x-2 truncate">
                            <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                            <span className="text-neutral-500 truncate text-[10px]">{item.name}</span>
                            <span className="font-bold text-neutral-800 dark:text-neutral-200 shrink-0 ml-auto">{item.value} completed</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Middle Row: Yearly Trend Chart */}
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Yearly Completion Trend
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Visualizes monthly completion rates across the current year.
                  </p>
                </div>

                <div className="h-56 w-full text-[9px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={yearlyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorYearlyRate" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="#4f46e5" stopOpacity={0.01}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(128, 128, 128, 0.15)" />
                      <XAxis dataKey="name" stroke="#888888" tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 100]} stroke="#888888" tickLine={false} axisLine={false} />
                      <ChartTooltip
                        contentStyle={{
                          backgroundColor: "rgba(9, 9, 11, 0.95)",
                          border: "1px solid rgba(255, 255, 255, 0.1)",
                          borderRadius: "12px",
                          fontSize: "11px"
                        }}
                        formatter={(value) => [`${value}%`, "Completion Rate"]}
                      />
                      <Area
                        type="monotone"
                        dataKey="rate"
                        name="Completion Rate (%)"
                        stroke="#4f46e5"
                        strokeWidth={2}
                        fillOpacity={1}
                        fill="url(#colorYearlyRate)"
                        dot={{ r: 3, stroke: "#4f46e5", strokeWidth: 1.5, fill: "#ffffff" }}
                        activeDot={{ r: 5 }}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Row: Yearly Progress Bars */}
              <div className="glass-panel rounded-2xl p-6 space-y-4">
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-neutral-400">
                    Yearly Habit Progress
                  </h3>
                  <p className="text-[11px] text-neutral-400 mt-1">
                    Completion rate progress bars for each habit this year.
                  </p>
                </div>

                {yearlyProgressBars.length === 0 ? (
                  <div className="py-8 text-center text-xs text-neutral-400">
                    No habits created yet. Create some routines in the Habit Sheet!
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {yearlyProgressBars.map((item) => (
                      <div key={item.id} className="p-4 rounded-xl bg-neutral-50/30 dark:bg-neutral-900/10 border border-neutral-200/20 dark:border-neutral-800/10 flex flex-col justify-between space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-bold text-neutral-800 dark:text-neutral-200 flex items-center gap-1.5">
                            <span>{item.emoji}</span>
                            <span className="truncate">{item.name}</span>
                          </span>
                          <span className="text-xs font-semibold text-neutral-500 dark:text-neutral-400">
                            {item.completed} / {item.total} days ({item.percentage}%)
                          </span>
                        </div>
                        <div className="w-full bg-neutral-200 dark:bg-neutral-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{ 
                              width: `${item.percentage}%`,
                              backgroundColor: getActivityColor(yearlyProgressBars.indexOf(item))
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      </div>

      {/* Printable Report Layout Template */}
      {printData && (
        <div className="hidden print:block min-h-screen bg-white text-neutral-900 p-10 font-sans antialiased">
          {/* Style Injector */}
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* 1. Force light mode color scheme to fix dark theme print dialog and page margins */
              html, body, :root, .dark, [class*="dark"] {
                color-scheme: light !important;
                --background: #ffffff !important;
                --foreground: #111827 !important;
                --card-bg: #ffffff !important;
                --card-border: #e5e7eb !important;
              }

              /* 2. Force HTML and Body to have clean solid white background and default dark-grey text */
              html, body {
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #111827 !important;
              }

              /* 3. Hide all navigation bars, sidebars, background canvas, and screen elements */
              aside, header, nav, footer, .print-hidden, 
              [class*="sidebar"], [class*="Sidebar"], 
              [class*="navbar"], [class*="Navbar"], 
              .glass-navbar, .glass-panel, canvas,
              .click-spark, [class*="ClickSpark"],
              .shape-grid, [class*="ShapeGrid"],
              .splash-screen, [class*="SplashScreen"] {
                display: none !important;
              }

              /* 4. Reset ancestor layout wrappers to be transparent, borders-free, and padding-free */
              html, body, #__next, 
              [class*="min-h-screen"], [class*="w-screen"], [class*="overflow-hidden"], 
              main, [class*="flex-1"], .flex-1,
              body > div, body > div > div {
                height: auto !important;
                min-height: 0 !important;
                width: auto !important;
                max-width: 100% !important;
                overflow: visible !important;
                display: block !important;
                position: static !important;
                background: transparent !important;
                background-color: transparent !important;
                box-shadow: none !important;
                border: none !important;
                padding: 0 !important;
                margin: 0 !important;
              }

              /* 5. Force printable report container display and background white */
              .hidden.print\\:block {
                display: block !important;
                background: #ffffff !important;
                background-color: #ffffff !important;
                color: #111827 !important;
                padding: 0 !important;
                margin: 0 !important;
                border: none !important;
                box-shadow: none !important;
              }

              /* 6. Standard print quality and page size adjustments */
              * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
              }
              @page {
                size: A4;
                margin: 20mm;
              }
              .print-page-break {
                break-before: page !important;
                page-break-before: always !important;
              }
              .print-avoid-break {
                break-inside: avoid !important;
                page-break-inside: avoid !important;
              }
            }
          ` }} />
          
          {/* Report Header */}
          <div className="border-b-2 border-indigo-600 pb-5 mb-6 flex justify-between items-end">
            <div>
              <div className="flex items-center gap-2.5">
                <img src="/Logo.png" className="w-8 h-8 rounded-xl object-cover shrink-0" alt="Notela Logo" />
                <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  Notela
                </span>
                <span className="text-xs uppercase tracking-wider font-extrabold text-neutral-400">| Productivity Report</span>
              </div>
              <h1 className="text-2xl font-extrabold text-neutral-800 mt-2">{printData.title}</h1>
              <p className="text-xs font-bold text-neutral-500 mt-0.5">{printData.dateInfo}</p>
            </div>
            <div className="text-right">
              <span className="text-[9px] text-neutral-400 font-bold uppercase tracking-wider block">Generated On</span>
              <span className="text-xs font-semibold text-neutral-700">{new Date().toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            </div>
          </div>

          {/* Key Metrics Grid */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {printData.stats.map((stat, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-neutral-200 bg-neutral-50 flex flex-col justify-between">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{stat.label}</span>
                <span className="text-xl font-black text-indigo-600 mt-1">{stat.value}</span>
                {stat.subtext && <span className="text-[9px] text-neutral-400 mt-1">{stat.subtext}</span>}
              </div>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="space-y-8">
            {printData.content}
          </div>

          {/* Report Footer */}
          <div className="mt-16 pt-4 border-t border-neutral-100 flex justify-between text-[9px] text-neutral-400">
            <span>© {new Date().getFullYear()} Notela Workspace Systems. All rights reserved.</span>
            <span>Premium Performance Analytics Document</span>
          </div>
        </div>
      )}
    </>
  );
}
