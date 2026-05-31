"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppState, Subject } from "@/context/AppStateContext";
import {
  BookOpen,
  Plus,
  Trash2,
  FileText,
  CheckSquare,
  ArrowLeft,
  Calendar,
  Layers,
  Sparkles,
  Check,
} from "lucide-react";
import Stepper from "@/components/react-bits/Stepper";
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
];

export default function SubjectsPage() {
  const {
    subjects,
    notes,
    tasks,
    addSubject,
    deleteSubject,
    addNote,
    addTask,
  } = useAppState();
  const searchParams = useSearchParams();
  const router = useRouter();

  const activeSubjectId = searchParams.get("id");
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  // Modal / Stepper state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  // Form states
  const [subjectName, setSubjectName] = useState("");
  const [subjectDesc, setSubjectDesc] = useState("");
  const [subjectColor, setSubjectColor] = useState(COLOR_OPTIONS[0]);
  const [initialTaskTitle, setInitialTaskTitle] = useState("");

  // Sync with URL query parameter
  useEffect(() => {
    if (activeSubjectId) {
      const found = subjects.find((s) => s.id === activeSubjectId);
      if (found) {
        setSelectedSubject(found);
      }
    } else {
      setSelectedSubject(null);
    }
  }, [activeSubjectId, subjects]);

  const handleCreateSubjectSubmit = () => {
    // Add subject
    const newSub = addSubject(subjectName, subjectColor, subjectDesc);

    // Add initial task if supplied
    if (initialTaskTitle.trim()) {
      addTask(initialTaskTitle, "medium", undefined, newSub.id);
    }

    // Auto-create initial note
    addNote(`${subjectName} Introduction`, `# ${subjectName}\n\nStart writing notes for your new subject here...`, newSub.id);

    // Reset form states
    setSubjectName("");
    setSubjectDesc("");
    setSubjectColor(COLOR_OPTIONS[0]);
    setInitialTaskTitle("");
    setActiveStep(0);
    setShowCreateModal(false);

    // Navigate to new workspace
    router.push(`/subjects?id=${newSub.id}`);
  };

  const handleDeleteSubject = (id: string) => {
    deleteSubject(id);
    setSelectedSubject(null);
    router.push("/subjects");
  };

  // Get notes/tasks for selected subject
  const subjectNotes = selectedSubject
    ? notes.filter((n) => n.subjectId === selectedSubject.id)
    : [];

  const subjectTasks = selectedSubject
    ? tasks.filter((t) => t.subjectId === selectedSubject.id)
    : [];

  // Steps for Stepper Subject Onboarding wizard
  const steps = [
    {
      label: "Details",
      content: (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            Subject Info
          </h3>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Subject Name
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Physics II, Chemistry, DSA"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
                Description (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Lecture notes and assignments"
                value={subjectDesc}
                onChange={(e) => setSubjectDesc(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      label: "Style",
      content: (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            Pick a Visual Accent
          </h3>
          <p className="text-xs text-neutral-400">
            Choose a color code to categorise notes and lists in your cockpit.
          </p>
          <div className="grid grid-cols-4 gap-2 pt-2">
            {COLOR_OPTIONS.map((color) => (
              <button
                key={color}
                onClick={() => setSubjectColor(color)}
                className={`h-10 rounded-xl cursor-pointer border-2 transition-all flex items-center justify-center ${
                  subjectColor === color
                    ? "border-neutral-800 dark:border-white scale-105 shadow-md shadow-black/10"
                    : "border-transparent hover:scale-105"
                }`}
                style={{ backgroundColor: color }}
              >
                {subjectColor === color && (
                  <Check className="w-4 h-4 text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]" />
                )}
              </button>
            ))}
          </div>
        </div>
      ),
    },
    {
      label: "Setup",
      content: (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-neutral-800 dark:text-neutral-100">
            Initial Task
          </h3>
          <p className="text-xs text-neutral-400">
            Optionally schedule your first todo task for this workspace.
          </p>
          <div className="space-y-1 pt-2">
            <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">
              Task Title (e.g. Read syllabus)
            </label>
            <input
              type="text"
              placeholder="e.g. Print lecture syllabus slides"
              value={initialTaskTitle}
              onChange={(e) => setInitialTaskTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 select-none">
      {selectedSubject ? (
        /* workspace detailed view */
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <button
                onClick={() => router.push("/subjects")}
                className="p-2 rounded-xl bg-black/5 dark:bg-white/5 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div>
                <h1 className="text-2xl font-extrabold flex items-center space-x-2">
                  <span
                    className="w-4.5 h-4.5 rounded-full inline-block shrink-0 shadow-inner"
                    style={{ backgroundColor: selectedSubject.color }}
                  />
                  <span className="text-neutral-800 dark:text-neutral-100">
                    {selectedSubject.name} Workspace
                  </span>
                </h1>
                {selectedSubject.description && (
                  <p className="text-xs text-neutral-400 mt-0.5">
                    {selectedSubject.description}
                  </p>
                )}
              </div>
            </div>

            <button
              onClick={() => handleDeleteSubject(selectedSubject.id)}
              className="flex items-center space-x-2 px-3.5 py-2 rounded-xl text-rose-500 hover:bg-rose-500/10 text-sm font-semibold transition-colors cursor-pointer border border-rose-500/10 hover:border-rose-500/20"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Subject</span>
            </button>
          </div>

          {/* workspace tabs: Notes and Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Notes List */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-indigo-500" />
                  <span>Subject Notes ({subjectNotes.length})</span>
                </h2>
                <button
                  onClick={() => {
                    const newNote = addNote(
                      "Untitled Note",
                      "",
                      selectedSubject.id
                    );
                    router.push(`/notes?id=${newNote.id}`);
                  }}
                  className="p-1 rounded-lg bg-indigo-600/10 hover:bg-indigo-600 text-indigo-500 hover:text-white transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {subjectNotes.length === 0 ? (
                  <div className="text-center py-12 text-xs text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
                    No notes in this subject yet.
                  </div>
                ) : (
                  subjectNotes.map((note) => (
                    <div
                      key={note.id}
                      onClick={() => router.push(`/notes?id=${note.id}`)}
                      className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 hover:bg-black/10 dark:hover:bg-white/10 transition-all border border-transparent hover:border-neutral-800/10 cursor-pointer flex items-center justify-between"
                    >
                      <div className="flex items-center space-x-2.5 truncate">
                        <FileText className="w-4 h-4 text-indigo-500 shrink-0" />
                        <span className="text-xs font-semibold text-neutral-800 dark:text-neutral-200 truncate">
                          {note.title || "Untitled Note"}
                        </span>
                      </div>
                      <span className="text-[9px] text-neutral-500 font-medium">
                        {mounted
                          ? new Date(note.lastModified).toLocaleDateString(undefined, {
                              month: "short",
                              day: "numeric",
                            })
                          : ""}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Tasks List */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col min-h-[300px]">
              <div className="flex items-center justify-between mb-4 shrink-0">
                <h2 className="text-base font-bold text-neutral-800 dark:text-neutral-100 flex items-center space-x-2">
                  <CheckSquare className="w-5 h-5 text-emerald-500" />
                  <span>Subject Tasks ({subjectTasks.length})</span>
                </h2>
                <button
                  onClick={() => router.push("/tasks")}
                  className="p-1 rounded-lg bg-emerald-600/10 hover:bg-emerald-600 text-emerald-500 hover:text-white transition-all cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2">
                {subjectTasks.length === 0 ? (
                  <div className="text-center py-12 text-xs text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-xl">
                    No tasks in this subject yet.
                  </div>
                ) : (
                  subjectTasks.map((task) => (
                    <div
                      key={task.id}
                      className="p-3.5 rounded-xl bg-black/5 dark:bg-white/5 border border-transparent text-xs text-neutral-800 dark:text-neutral-200 flex items-center justify-between"
                    >
                      <span className={`${task.completed ? "line-through text-neutral-500" : ""}`}>
                        {task.title}
                      </span>
                      <span
                        className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          task.priority === "high"
                            ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                            : task.priority === "medium"
                            ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        }`}
                      >
                        {task.priority}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Subjects Grid View */
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
                Subject Workspaces
              </h1>
              <p className="text-sm text-neutral-400 mt-0.5">
                Organise notes, checklists, and projects by subjects.
              </p>
            </div>

            <button
              onClick={() => {
                setActiveStep(0);
                setShowCreateModal(true);
              }}
              className="flex items-center space-x-1.5 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-semibold transition-all shadow-lg hover:shadow-indigo-500/20 cursor-pointer"
            >
              <Plus className="w-4.5 h-4.5" />
              <span>Create Subject</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((sub) => {
              const subNotes = notes.filter((n) => n.subjectId === sub.id);
              const subTasks = tasks.filter((t) => t.subjectId === sub.id);

              return (
                <div key={sub.id} className="cursor-pointer" onClick={() => router.push(`/subjects?id=${sub.id}`)}>
                  <BorderGlow hexColor={sub.color} duration={7}>
                    <div className="space-y-4">
                      {/* Accent title */}
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-2.5">
                          <span
                            className="w-3.5 h-3.5 rounded-full inline-block shadow-inner"
                            style={{ backgroundColor: sub.color }}
                          />
                          <h3 className="font-bold text-lg text-neutral-800 dark:text-neutral-100">
                            {sub.name}
                          </h3>
                        </div>
                        <BookOpen className="w-5 h-5 text-neutral-400" />
                      </div>

                      {sub.description && (
                        <p className="text-xs text-neutral-400 line-clamp-2 min-h-[2rem]">
                          {sub.description}
                        </p>
                      )}

                      {/* Workspace metadata */}
                      <div className="flex items-center space-x-4 pt-3 border-t border-white/5">
                        <div className="flex items-center space-x-1 text-xs text-neutral-500">
                          <FileText className="w-4 h-4 text-indigo-400" />
                          <span>{subNotes.length} notes</span>
                        </div>
                        <div className="flex items-center space-x-1 text-xs text-neutral-500">
                          <CheckSquare className="w-4 h-4 text-emerald-400" />
                          <span>{subTasks.length} tasks</span>
                        </div>
                      </div>
                    </div>
                  </BorderGlow>
                </div>
              );
            })}
          </div>

          {/* Stepper Create Subject Onboarding Modal */}
          {showCreateModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
              <div className="w-full max-w-lg glass-modal rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 dark:border-neutral-800/10 pb-3">
                  <div className="flex items-center space-x-2">
                    <Sparkles className="w-5 h-5 text-indigo-500" />
                    <span className="font-extrabold text-base tracking-tight text-neutral-800 dark:text-neutral-100">
                      Create a Subject
                    </span>
                  </div>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="text-xs text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 font-semibold transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>

                <Stepper steps={steps} activeStep={activeStep} />

                {/* Navigation actions */}
                <div className="flex items-center justify-between pt-4 border-t border-white/10 dark:border-neutral-800/10">
                  <button
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep(activeStep - 1)}
                    className="px-4 py-2 text-xs rounded-xl bg-black/5 dark:bg-white/5 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 disabled:opacity-30 cursor-pointer transition-all"
                  >
                    Back
                  </button>

                  {activeStep < steps.length - 1 ? (
                    <button
                      disabled={activeStep === 0 && !subjectName.trim()}
                      onClick={() => setActiveStep(activeStep + 1)}
                      className="px-4 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium disabled:opacity-50 cursor-pointer"
                    >
                      Next
                    </button>
                  ) : (
                    <button
                      onClick={handleCreateSubjectSubmit}
                      className="px-5 py-2 text-xs rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold cursor-pointer"
                    >
                      Launch Workspace
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
