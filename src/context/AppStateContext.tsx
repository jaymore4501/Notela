"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useAuth } from "./AuthContext";

export interface Subject {
  id: string;
  name: string;
  color: string; // Hex color
  description?: string;
  dateCreated: string;
}

export interface Note {
  id: string;
  title: string;
  content: string; // Holds HTML for MS Office rich text
  subjectId: string; // 'uncategorized' or subject.id
  lastModified: string;
}

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  priority: "low" | "medium" | "high";
  dueDate?: string;
  subjectId: string; // 'uncategorized' or subject.id
}

export interface FocusSession {
  id: string;
  date: string; // YYYY-MM-DD
  durationMinutes: number;
  subjectId: string;
}

export interface PomodoroConfig {
  focus: number;
  shortBreak: number;
  longBreak: number;
}

export interface Activity {
  id: string;
  name: string;
  emoji?: string;
  targetMinutes?: number;
  dateCreated: string;
}

export interface ActivityLog {
  id: string;
  date: string; // YYYY-MM-DD
  activityId: string;
  completed: boolean;
  durationMinutes?: number;
}

interface AppStateContextType {
  subjects: Subject[];
  notes: Note[];
  tasks: Task[];
  focusSessions: FocusSession[];
  streak: number;
  pomodoroConfig: PomodoroConfig;
  activities: Activity[];
  activityLog: ActivityLog[];
  addSubject: (name: string, color: string, description?: string) => Subject;
  deleteSubject: (id: string) => void;
  addNote: (title: string, content: string, subjectId: string) => Note;
  updateNote: (id: string, title: string, content: string, subjectId: string) => void;
  deleteNote: (id: string) => void;
  addTask: (title: string, priority: Task["priority"], dueDate?: string, subjectId?: string) => Task;
  toggleTask: (id: string) => void;
  editTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  addFocusSession: (durationMinutes: number, subjectId: string) => void;
  updatePomodoroConfig: (focus: number, shortBreak: number, longBreak: number) => void;
  addActivity: (name: string, emoji?: string, targetMinutes?: number) => Activity;
  updateActivity: (id: string, name: string, emoji?: string, targetMinutes?: number) => void;
  deleteActivity: (id: string) => void;
  toggleActivityCompletion: (date: string, activityId: string, durationMinutes?: number) => void;
  resetDatabase: () => void;
  importJSONData: (data: any) => { success: boolean; message: string };
}

const AppStateContext = createContext<AppStateContextType | undefined>(undefined);

export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [focusSessions, setFocusSessions] = useState<FocusSession[]>([]);
  const [streak, setStreak] = useState(0);
  const [pomodoroConfig, setPomodoroConfig] = useState<PomodoroConfig>({
    focus: 25,
    shortBreak: 5,
    longBreak: 15,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activityLog, setActivityLog] = useState<ActivityLog[]>([]);

  const userPrefix = user ? `notela_${user.email.replace(/[@.]/g, "_")}_` : "";

  // 1. Refactor sync helpers to queue requests and prevent parallel race conditions
  const isSyncingRef = React.useRef(false);
  const pendingSyncPayloadRef = React.useRef<any>(null);

  const performSync = React.useCallback(async (payload: any) => {
    if (isSyncingRef.current) {
      pendingSyncPayloadRef.current = payload;
      return;
    }

    isSyncingRef.current = true;
    try {
      const res = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        console.warn("Workspace sync failed on server.");
      }
    } catch (err) {
      console.error("Failed to sync workspace to MongoDB:", err);
    } finally {
      isSyncingRef.current = false;
      if (pendingSyncPayloadRef.current) {
        const nextPayload = pendingSyncPayloadRef.current;
        pendingSyncPayloadRef.current = null;
        performSync(nextPayload);
      }
    }
  }, []);

  // Save state to both localStorage and MongoDB
  const saveState = (
    newSubjects: Subject[],
    newNotes: Note[],
    newTasks: Task[],
    newSessions: FocusSession[],
    newPomoConfig: PomodoroConfig,
    newActivities?: Activity[],
    newActivityLog?: ActivityLog[]
  ) => {
    if (!user) return;

    const finalActivities = newActivities !== undefined ? newActivities : activities;
    const finalActivityLog = newActivityLog !== undefined ? newActivityLog : activityLog;

    // Save to localStorage
    localStorage.setItem(`${userPrefix}subjects`, JSON.stringify(newSubjects));
    localStorage.setItem(`${userPrefix}notes`, JSON.stringify(newNotes));
    localStorage.setItem(`${userPrefix}tasks`, JSON.stringify(newTasks));
    localStorage.setItem(`${userPrefix}sessions`, JSON.stringify(newSessions));
    localStorage.setItem(`${userPrefix}pomodoro_config`, JSON.stringify(newPomoConfig));
    localStorage.setItem(`${userPrefix}activities`, JSON.stringify(finalActivities));
    localStorage.setItem(`${userPrefix}activity_log`, JSON.stringify(finalActivityLog));

    // Queue sync payload to MongoDB (without email parameter for session security)
    const payload = {
      subjects: newSubjects,
      notes: newNotes,
      tasks: newTasks,
      focusSessions: newSessions,
      pomodoroConfig: newPomoConfig,
      activities: finalActivities,
      activityLog: finalActivityLog,
    };
    performSync(payload);
  };

  // Load state from localStorage / MongoDB on mount/user change
  useEffect(() => {
    if (!user) {
      setSubjects([]);
      setNotes([]);
      setTasks([]);
      setFocusSessions([]);
      setStreak(0);
      setActivities([]);
      setActivityLog([]);
      return;
    }

    // Try loading from MongoDB first (uses secure HTTP-only session cookie)
    fetch("/api/workspace")
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          // If we got valid data from MongoDB, load it
          if (data.subjects.length > 0 || data.notes.length > 0 || data.tasks.length > 0 || data.activities?.length > 0) {
            setSubjects(data.subjects);
            setNotes(data.notes);
            setTasks(data.tasks);
            setFocusSessions(data.focusSessions);
            setPomodoroConfig(data.pomodoroConfig);
            setActivities(data.activities || []);
            setActivityLog(data.activityLog || []);
            calculateStreak(data.focusSessions);
            
            // Sync to localStorage
            localStorage.setItem(`${userPrefix}subjects`, JSON.stringify(data.subjects));
            localStorage.setItem(`${userPrefix}notes`, JSON.stringify(data.notes));
            localStorage.setItem(`${userPrefix}tasks`, JSON.stringify(data.tasks));
            localStorage.setItem(`${userPrefix}sessions`, JSON.stringify(data.focusSessions));
            localStorage.setItem(`${userPrefix}pomodoro_config`, JSON.stringify(data.pomodoroConfig));
            localStorage.setItem(`${userPrefix}activities`, JSON.stringify(data.activities || []));
            localStorage.setItem(`${userPrefix}activity_log`, JSON.stringify(data.activityLog || []));
            return;
          }
        }
        
        // Fallback to localStorage if MongoDB fetch fails or has no data
        loadFromLocalStorage();
      })
      .catch((err) => {
        console.error("Failed to load workspace from MongoDB, falling back to localStorage:", err);
        loadFromLocalStorage();
      });

    function loadFromLocalStorage() {
      const savedSubjects = localStorage.getItem(`${userPrefix}subjects`);
      const savedNotes = localStorage.getItem(`${userPrefix}notes`);
      const savedTasks = localStorage.getItem(`${userPrefix}tasks`);
      const savedSessions = localStorage.getItem(`${userPrefix}sessions`);
      const savedPomo = localStorage.getItem(`${userPrefix}pomodoro_config`);
      const savedActivities = localStorage.getItem(`${userPrefix}activities`);
      const savedActivityLog = localStorage.getItem(`${userPrefix}activity_log`);

      let currentSubjects = [];
      let currentNotes = [];
      let currentTasks = [];
      let currentSessions = [];
      let currentPomo = { focus: 25, shortBreak: 5, longBreak: 15 };
      let currentActivities = [];
      let currentActivityLog = [];

      if (savedSubjects) {
        currentSubjects = JSON.parse(savedSubjects);
        setSubjects(currentSubjects);
      } else {
        const defaults = [
          { id: "sub-1", name: "Mathematics", color: "#ef4444", description: "Calculus & Linear Algebra", dateCreated: new Date().toISOString() },
          { id: "sub-2", name: "Physics", color: "#3b82f6", description: "Mechanics & Thermodynamics", dateCreated: new Date().toISOString() },
          { id: "sub-3", name: "Chemistry", color: "#f97316", description: "Organic & Inorganic Chemistry", dateCreated: new Date().toISOString() },
          { id: "sub-4", name: "Biology", color: "#10b981", description: "Genetics & Evolutionary Theory", dateCreated: new Date().toISOString() },
          { id: "sub-5", name: "Computer Science", color: "#6366f1", description: "Data Structures & Systems Architecture", dateCreated: new Date().toISOString() },
          { id: "sub-6", name: "English Literature", color: "#8b5cf6", description: "Shakespeare & Modern Prose", dateCreated: new Date().toISOString() },
          { id: "sub-7", name: "History", color: "#eab308", description: "World War I & Modern Civilizations", dateCreated: new Date().toISOString() },
          { id: "sub-8", name: "Philosophy", color: "#ec4899", description: "Ethics, Metaphysics & Epistemology", dateCreated: new Date().toISOString() },
          { id: "sub-9", name: "Art & Design", color: "#06b6d4", description: "Visual Arts, Sketching & Color Theory", dateCreated: new Date().toISOString() },
          { id: "sub-10", name: "Economics", color: "#14b8a6", description: "Macroeconomics & Microeconomics Principles", dateCreated: new Date().toISOString() },
        ];
        currentSubjects = defaults;
        setSubjects(defaults);
        localStorage.setItem(`${userPrefix}subjects`, JSON.stringify(defaults));
      }

      if (savedNotes) {
        currentNotes = JSON.parse(savedNotes);
        setNotes(currentNotes);
      } else {
        const defaults = [
          {
            id: "note-1",
            title: "Welcome to Notela",
            content: "<div><h1>Welcome to Notela!</h1><p>Notela is a modern student productivity platform. You are currently viewing a rich MS Office-style note template.</p><ul><li><b>Bold</b>, <i>italic</i>, and <u>underlined</u> text formatting are supported.</li><li>Choose different <b>font families</b> and <b>sizes</b> from the custom toolbar above.</li><li>Select a text and click the 🖌️ <b>Format Painter</b> to copy/apply styles!</li></ul><p>Start writing and customizing your studies!</p></div>",
            subjectId: "sub-5",
            lastModified: new Date().toISOString(),
          },
        ];
        currentNotes = defaults;
        setNotes(defaults);
        localStorage.setItem(`${userPrefix}notes`, JSON.stringify(defaults));
      }

      if (savedTasks) {
        currentTasks = JSON.parse(savedTasks);
        setTasks(currentTasks);
      } else {
        const defaults = [
          { id: "task-1", title: "Complete Physics Lab Report", completed: false, priority: "high" as const, dueDate: new Date(Date.now() + 86400000 * 2).toISOString().split("T")[0], subjectId: "sub-2" },
          { id: "task-2", title: "Study Calculus Chapter 4", completed: false, priority: "medium" as const, dueDate: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0], subjectId: "sub-1" },
          { id: "task-3", title: "Set up Notela project skeleton", completed: true, priority: "low" as const, dueDate: new Date().toISOString().split("T")[0], subjectId: "sub-5" },
        ];
        currentTasks = defaults;
        setTasks(defaults);
        localStorage.setItem(`${userPrefix}tasks`, JSON.stringify(defaults));
      }

      if (savedSessions) {
        currentSessions = JSON.parse(savedSessions);
        setFocusSessions(currentSessions);
        calculateStreak(currentSessions);
      } else {
        setFocusSessions([]);
        setStreak(0);
      }

      if (savedPomo) {
        currentPomo = JSON.parse(savedPomo);
        setPomodoroConfig(currentPomo);
      } else {
        setPomodoroConfig({ focus: 25, shortBreak: 5, longBreak: 15 });
      }

      if (savedActivities) {
        currentActivities = JSON.parse(savedActivities);
        setActivities(currentActivities);
      } else {
        const defaults = [
          { id: "act-1", name: "30 mins Social media limit", emoji: "📱", targetMinutes: 30, dateCreated: new Date().toISOString() },
          { id: "act-2", name: "1 hr reading books", emoji: "📚", targetMinutes: 60, dateCreated: new Date().toISOString() },
          { id: "act-3", name: "2 hrs gym", emoji: "🏋️", targetMinutes: 120, dateCreated: new Date().toISOString() },
          { id: "act-4", name: "Protein diet", emoji: "🥗", targetMinutes: 60, dateCreated: new Date().toISOString() },
          { id: "act-5", name: "8 hrs sleep", emoji: "😴", targetMinutes: 480, dateCreated: new Date().toISOString() },
          { id: "act-6", name: "Friends and family 2hrs", emoji: "👥", targetMinutes: 120, dateCreated: new Date().toISOString() },
        ];
        currentActivities = defaults;
        setActivities(defaults);
        localStorage.setItem(`${userPrefix}activities`, JSON.stringify(defaults));
      }

      if (savedActivityLog) {
        currentActivityLog = JSON.parse(savedActivityLog);
        setActivityLog(currentActivityLog);
      } else {
        setActivityLog([]);
      }

      // Sync the loaded localStorage data to MongoDB securely
      performSync({
        subjects: currentSubjects,
        notes: currentNotes,
        tasks: currentTasks,
        focusSessions: currentSessions,
        pomodoroConfig: currentPomo,
        activities: currentActivities,
        activityLog: currentActivityLog,
      });
    }
  }, [user, userPrefix, performSync]);

  const calculateStreak = (sessions: FocusSession[]) => {
    if (!sessions || sessions.length === 0) {
      setStreak(0);
      return;
    }

    const dates = Array.from(new Set(sessions.map((s) => s.date))).sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );

    if (dates.length === 0) {
      setStreak(0);
      return;
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];

    const latestDate = dates[0];
    if (latestDate !== todayStr && latestDate !== yesterdayStr) {
      setStreak(0);
      return;
    }

    let currentStreak = 1;
    for (let i = 0; i < dates.length - 1; i++) {
      const current = new Date(dates[i]);
      const next = new Date(dates[i + 1]);
      const diffTime = Math.abs(current.getTime() - next.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        currentStreak++;
      } else if (diffDays > 1) {
        break;
      }
    }

    setStreak(currentStreak);
  };

  const addSubject = (name: string, color: string, description?: string) => {
    const newSub: Subject = {
      id: `sub-${Date.now()}`,
      name,
      color,
      description,
      dateCreated: new Date().toISOString(),
    };
    const updated = [...subjects, newSub];
    setSubjects(updated);
    saveState(updated, notes, tasks, focusSessions, pomodoroConfig);
    return newSub;
  };

  const deleteSubject = (id: string) => {
    const updatedSub = subjects.filter((s) => s.id !== id);
    setSubjects(updatedSub);

    const updatedNotes = notes.map((n) =>
      n.subjectId === id ? { ...n, subjectId: "uncategorized" } : n
    );
    setNotes(updatedNotes);

    const updatedTasks = tasks.map((t) =>
      t.subjectId === id ? { ...t, subjectId: "uncategorized" } : t
    );
    setTasks(updatedTasks);

    saveState(updatedSub, updatedNotes, updatedTasks, focusSessions, pomodoroConfig);
  };

  const addNote = (title: string, content: string, subjectId: string) => {
    const newNote: Note = {
      id: `note-${Date.now()}`,
      title,
      content,
      subjectId: subjectId || "uncategorized",
      lastModified: new Date().toISOString(),
    };
    const updated = [newNote, ...notes];
    setNotes(updated);
    saveState(subjects, updated, tasks, focusSessions, pomodoroConfig);
    return newNote;
  };

  const updateNote = (id: string, title: string, content: string, subjectId: string) => {
    const updated = notes.map((n) =>
      n.id === id
        ? { ...n, title, content, subjectId: subjectId || "uncategorized", lastModified: new Date().toISOString() }
        : n
    );
    setNotes(updated);
    saveState(subjects, updated, tasks, focusSessions, pomodoroConfig);
  };

  const deleteNote = (id: string) => {
    const updated = notes.filter((n) => n.id !== id);
    setNotes(updated);
    saveState(subjects, updated, tasks, focusSessions, pomodoroConfig);
  };

  const addTask = (title: string, priority: Task["priority"], dueDate?: string, subjectId?: string) => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title,
      completed: false,
      priority,
      dueDate,
      subjectId: subjectId || "uncategorized",
    };
    const updated = [newTask, ...tasks];
    setTasks(updated);
    saveState(subjects, notes, updated, focusSessions, pomodoroConfig);
    return newTask;
  };

  const toggleTask = (id: string) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
    setTasks(updated);
    saveState(subjects, notes, updated, focusSessions, pomodoroConfig);
  };

  const editTask = (id: string, updates: Partial<Task>) => {
    const updated = tasks.map((t) => (t.id === id ? { ...t, ...updates } : t));
    setTasks(updated);
    saveState(subjects, notes, updated, focusSessions, pomodoroConfig);
  };

  const deleteTask = (id: string) => {
    const updated = tasks.filter((t) => t.id !== id);
    setTasks(updated);
    saveState(subjects, notes, updated, focusSessions, pomodoroConfig);
  };

  const addFocusSession = (durationMinutes: number, subjectId: string) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const newSession: FocusSession = {
      id: `focus-${Date.now()}`,
      date: todayStr,
      durationMinutes,
      subjectId: subjectId || "uncategorized",
    };
    const updated = [newSession, ...focusSessions];
    setFocusSessions(updated);
    calculateStreak(updated);
    saveState(subjects, notes, tasks, updated, pomodoroConfig);
  };

  const updatePomodoroConfig = (focus: number, shortBreak: number, longBreak: number) => {
    const newConfig = { focus, shortBreak, longBreak };
    setPomodoroConfig(newConfig);
    saveState(subjects, notes, tasks, focusSessions, newConfig);
  };

  const importJSONData = (data: any): { success: boolean; message: string } => {
    if (!user) return { success: false, message: "User session not found." };
    if (!data) return { success: false, message: "Invalid payload data." };

    try {
      // Case 1: Single note import
      if (data.type === "notela_note" || (data.title !== undefined && data.content !== undefined && !Array.isArray(data.notes))) {
        const noteTitle = data.title || "Untitled Imported Note";
        const noteContent = data.content || "";
        
        let targetSubjectId = "uncategorized";
        let updatedSubjects = [...subjects];
        if (data.subject && typeof data.subject === "object") {
          const subName = data.subject.name;
          const subColor = data.subject.color || "#6366f1";
          
          const existingSub = subjects.find(s => s.name.toLowerCase() === subName.toLowerCase());
          if (existingSub) {
            targetSubjectId = existingSub.id;
          } else {
            const newSubId = `sub-${Date.now()}`;
            const newSub: Subject = {
              id: newSubId,
              name: subName,
              color: subColor,
              dateCreated: new Date().toISOString()
            };
            updatedSubjects = [...subjects, newSub];
            setSubjects(updatedSubjects);
            targetSubjectId = newSubId;
          }
        } else if (data.subjectId) {
          const existingSub = subjects.find(s => s.id === data.subjectId);
          if (existingSub) {
            targetSubjectId = existingSub.id;
          }
        }
        
        const newNote: Note = {
          id: `note-${Date.now()}`,
          title: noteTitle,
          content: noteContent,
          subjectId: targetSubjectId,
          lastModified: new Date().toISOString()
        };
        const updatedNotes = [newNote, ...notes];
        setNotes(updatedNotes);
        
        saveState(updatedSubjects, updatedNotes, tasks, focusSessions, pomodoroConfig);
        
        return { success: true, message: `Successfully imported note "${noteTitle}"!` };
      }

      // Case 2: Full backup import (subjects, notes, tasks, etc.)
      const importedSubjects = Array.isArray(data.subjects) ? data.subjects : [];
      const importedNotes = Array.isArray(data.notes) ? data.notes : [];
      const importedTasks = Array.isArray(data.tasks) ? data.tasks : [];
      const importedSessions = Array.isArray(data.focusSessions) ? data.focusSessions : [];
      const importedActivities = Array.isArray(data.activities) ? data.activities : [];
      const importedActivityLog = Array.isArray(data.activityLog) ? data.activityLog : [];

      if (importedSubjects.length === 0 && importedNotes.length === 0 && importedTasks.length === 0 && importedActivities.length === 0) {
        return { success: false, message: "No subjects, notes, tasks, or activities found in import file." };
      }

      // 1. Merge subjects
      let mergedSubjects = [...subjects];
      importedSubjects.forEach((sub: any) => {
        if (!sub.id || !sub.name) return;
        const exists = mergedSubjects.some(s => s.id === sub.id || s.name.toLowerCase() === sub.name.toLowerCase());
        if (!exists) {
          mergedSubjects.push({
            id: sub.id,
            name: sub.name,
            color: sub.color || "#6366f1",
            description: sub.description || "",
            dateCreated: sub.dateCreated || new Date().toISOString()
          });
        }
      });
      setSubjects(mergedSubjects);

      // 2. Merge notes
      let mergedNotes = [...notes];
      importedNotes.forEach((note: any, idx: number) => {
        if (!note.title && !note.content) return;
        const newId = `note-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
        mergedNotes.push({
          id: newId,
          title: note.title || "Untitled Note",
          content: note.content || "",
          subjectId: note.subjectId || "uncategorized",
          lastModified: note.lastModified || new Date().toISOString()
        });
      });
      setNotes(mergedNotes);

      // 3. Merge tasks
      let mergedTasks = [...tasks];
      importedTasks.forEach((task: any, idx: number) => {
        if (!task.title) return;
        const newId = `task-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
        mergedTasks.push({
          id: newId,
          title: task.title,
          completed: !!task.completed,
          priority: task.priority || "medium",
          dueDate: task.dueDate,
          subjectId: task.subjectId || "uncategorized"
        });
      });
      setTasks(mergedTasks);

      // 4. Merge sessions if present
      let mergedSessions = [...focusSessions];
      if (importedSessions.length > 0) {
        importedSessions.forEach((s: any, idx: number) => {
          if (!s.date || !s.durationMinutes) return;
          const newId = `session-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 5)}`;
          mergedSessions.push({
            id: newId,
            date: s.date,
            durationMinutes: s.durationMinutes,
            subjectId: s.subjectId || "uncategorized"
          });
        });
        setFocusSessions(mergedSessions);
        calculateStreak(mergedSessions);
      }

      // 5. Pomodoro Config
      let mergedPomo = { ...pomodoroConfig };
      if (data.pomodoroConfig && typeof data.pomodoroConfig === "object") {
        mergedPomo = {
          focus: Number(data.pomodoroConfig.focus) || 25,
          shortBreak: Number(data.pomodoroConfig.shortBreak) || 5,
          longBreak: Number(data.pomodoroConfig.longBreak) || 15
        };
        setPomodoroConfig(mergedPomo);
      }

      // 6. Merge Activities
      let mergedActivities = [...activities];
      importedActivities.forEach((act: any) => {
        if (!act.id || !act.name) return;
        const exists = mergedActivities.some(a => a.id === act.id || a.name.toLowerCase() === act.name.toLowerCase());
        if (!exists) {
          mergedActivities.push({
            id: act.id,
            name: act.name,
            dateCreated: act.dateCreated || new Date().toISOString()
          });
        }
      });
      setActivities(mergedActivities);

      // 7. Merge Activity Log
      let mergedActivityLog = [...activityLog];
      importedActivityLog.forEach((log: any) => {
        if (!log.date || !log.activityId) return;
        const exists = mergedActivityLog.some(l => l.date === log.date && l.activityId === log.activityId);
        if (!exists) {
          mergedActivityLog.push({
            id: log.id || `act-log-${Date.now()}-${Math.random()}`,
            date: log.date,
            activityId: log.activityId,
            completed: !!log.completed
          });
        }
      });
      setActivityLog(mergedActivityLog);

      saveState(mergedSubjects, mergedNotes, mergedTasks, mergedSessions, mergedPomo, mergedActivities, mergedActivityLog);

      return { success: true, message: `Successfully imported backup (${importedSubjects.length} subjects, ${importedNotes.length} notes, ${importedTasks.length} tasks, ${importedActivities.length} activities)!` };
    } catch (err) {
      return { success: false, message: "Failed to parse JSON file structure." };
    }
  };

  const resetDatabase = () => {
    if (!user) return;
    localStorage.removeItem(`${userPrefix}subjects`);
    localStorage.removeItem(`${userPrefix}notes`);
    localStorage.removeItem(`${userPrefix}tasks`);
    localStorage.removeItem(`${userPrefix}sessions`);
    localStorage.removeItem(`${userPrefix}pomodoro_config`);
    localStorage.removeItem(`${userPrefix}activities`);
    localStorage.removeItem(`${userPrefix}activity_log`);

    fetch("/api/workspace", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        subjects: [],
        notes: [],
        tasks: [],
        focusSessions: [],
        pomodoroConfig: { focus: 25, shortBreak: 5, longBreak: 15 },
        activities: [],
        activityLog: []
      })
    }).then(() => {
      window.location.reload();
    }).catch(() => {
      window.location.reload();
    });
  };

  const addActivity = (name: string, emoji?: string, targetMinutes?: number) => {
    const newAct: Activity = {
      id: `act-${Date.now()}`,
      name,
      emoji: emoji || "📝",
      targetMinutes: targetMinutes || 0,
      dateCreated: new Date().toISOString(),
    };
    const updated = [...activities, newAct];
    setActivities(updated);
    saveState(subjects, notes, tasks, focusSessions, pomodoroConfig, updated, activityLog);
    return newAct;
  };

  const updateActivity = (id: string, name: string, emoji?: string, targetMinutes?: number) => {
    const updated = activities.map((a) =>
      a.id === id
        ? {
            ...a,
            name,
            emoji: emoji || a.emoji || "📝",
            targetMinutes: targetMinutes !== undefined ? targetMinutes : a.targetMinutes || 0,
          }
        : a
    );
    setActivities(updated);
    saveState(subjects, notes, tasks, focusSessions, pomodoroConfig, updated, activityLog);
  };

  const deleteActivity = (id: string) => {
    const updatedActivities = activities.filter((a) => a.id !== id);
    setActivities(updatedActivities);
    // Clean up associated activityLog items
    const updatedLog = activityLog.filter((log) => log.activityId !== id);
    setActivityLog(updatedLog);
    saveState(subjects, notes, tasks, focusSessions, pomodoroConfig, updatedActivities, updatedLog);
  };

  const toggleActivityCompletion = (date: string, activityId: string, durationMinutes?: number) => {
    const existingLogIdx = activityLog.findIndex((l) => l.date === date && l.activityId === activityId);
    let updatedLog = [...activityLog];

    const act = activities.find((a) => a.id === activityId);
    const defaultDuration = act?.targetMinutes || 30; // Use activity target or 30m default

    if (existingLogIdx > -1) {
      const log = updatedLog[existingLogIdx];
      const nextCompleted = !log.completed;
      updatedLog[existingLogIdx] = {
        ...log,
        completed: nextCompleted,
        durationMinutes: nextCompleted ? (durationMinutes !== undefined ? durationMinutes : defaultDuration) : 0,
      };
    } else {
      const newLog: ActivityLog = {
        id: `act-log-${Date.now()}`,
        date,
        activityId,
        completed: true,
        durationMinutes: durationMinutes !== undefined ? durationMinutes : defaultDuration,
      };
      updatedLog.push(newLog);
    }

    setActivityLog(updatedLog);
    saveState(subjects, notes, tasks, focusSessions, pomodoroConfig, activities, updatedLog);
  };

  return (
    <AppStateContext.Provider
      value={{
        subjects,
        notes,
        tasks,
        focusSessions,
        streak,
        pomodoroConfig,
        activities,
        activityLog,
        addSubject,
        deleteSubject,
        addNote,
        updateNote,
        deleteNote,
        addTask,
        toggleTask,
        editTask,
        deleteTask,
        addFocusSession,
        updatePomodoroConfig,
        addActivity,
        updateActivity,
        deleteActivity,
        toggleActivityCompletion,
        resetDatabase,
        importJSONData,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
