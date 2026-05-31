"use client";

import React, { useState } from "react";
import { useAppState, Task } from "@/context/AppStateContext";
import {
  CheckSquare,
  Plus,
  Trash2,
  Calendar,
  AlertTriangle,
  FolderMinus,
  SlidersHorizontal,
  Bookmark,
  Edit2,
  X,
} from "lucide-react";
import Dropdown from "@/components/ui/Dropdown";

export default function TasksPage() {
  const { subjects, tasks, addTask, toggleTask, deleteTask, editTask } = useAppState();

  // Dropdown options
  const subjectOptions = [
    { value: "uncategorized", label: "No Subject" },
    ...subjects.map((sub) => ({
      value: sub.id,
      label: sub.name,
      color: sub.color,
    })),
  ];

  const priorityOptions = [
    { value: "low", label: "Low Priority" },
    { value: "medium", label: "Medium Priority" },
    { value: "high", label: "High Priority" },
  ];

  const filterSubjectOptions = [
    { value: "all", label: "All Subjects" },
    { value: "uncategorized", label: "Uncategorized" },
    ...subjects.map((sub) => ({
      value: sub.id,
      label: sub.name,
      color: sub.color,
    })),
  ];

  const filterSortOptions = [
    { value: "priority", label: "Sort by Priority" },
    { value: "dueDate", label: "Sort by Due Date" },
  ];

  const editPriorityOptions = [
    { value: "low", label: "Low" },
    { value: "medium", label: "Medium" },
    { value: "high", label: "High" },
  ];

  // Form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskPriority, setTaskPriority] = useState<Task["priority"]>("medium");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [taskSubjectId, setTaskSubjectId] = useState("uncategorized");

  // Filter/Sort states
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "completed">("pending");
  const [subjectFilter, setSubjectFilter] = useState("all");
  const [sortBy, setSortBy] = useState<"dueDate" | "priority">("priority");

  // Professional Modal edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [activeEditTaskId, setActiveEditTaskId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editPriority, setEditPriority] = useState<Task["priority"]>("medium");
  const [editDueDate, setEditDueDate] = useState("");
  const [editSubjectId, setEditSubjectId] = useState("uncategorized");

  const [mounted, setMounted] = useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;

    addTask(taskTitle, taskPriority, taskDueDate || undefined, taskSubjectId);
    setTaskTitle("");
    setTaskDueDate("");
    setTaskPriority("medium");
    setTaskSubjectId("uncategorized");
  };

  const openEditModal = (task: Task) => {
    setActiveEditTaskId(task.id);
    setEditTitle(task.title);
    setEditPriority(task.priority);
    setEditDueDate(task.dueDate || "");
    setEditSubjectId(task.subjectId);
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeEditTaskId || !editTitle.trim()) return;

    editTask(activeEditTaskId, {
      title: editTitle,
      priority: editPriority,
      dueDate: editDueDate || undefined,
      subjectId: editSubjectId,
    });
    setIsEditModalOpen(false);
    setActiveEditTaskId(null);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((task) => {
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && !task.completed) ||
      (statusFilter === "completed" && task.completed);

    const matchesSubject = subjectFilter === "all" || task.subjectId === subjectFilter;

    return matchesStatus && matchesSubject;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "dueDate") {
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    } else {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    }
  });

  return (
    <div className="space-y-6 select-none max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-neutral-800 dark:text-neutral-100">
          Academic Checklists
        </h1>
        <p className="text-sm text-neutral-400 mt-0.5">
          Plan deadlines, track assignments, and organize study checklist steps.
        </p>
      </div>

      {/* Quick Task Creation Panel */}
      <form onSubmit={handleAddTask} className="glass-panel rounded-2xl p-4 md:p-6 space-y-4">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            required
            placeholder="Type task task title..."
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            className="flex-1 px-3.5 py-2.5 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
          />
          <div className="grid grid-cols-3 md:flex gap-2">
            {/* Subject Selector */}
            <Dropdown
              value={taskSubjectId}
              onChange={setTaskSubjectId}
              options={subjectOptions}
              className="w-full md:w-auto shrink-0"
            />

            {/* Priority Selector */}
            <Dropdown
              value={taskPriority}
              onChange={(val) => setTaskPriority(val as any)}
              options={priorityOptions}
              className="w-full md:w-auto shrink-0"
            />

            {/* Date input */}
            <input
              type="date"
              value={taskDueDate}
              onChange={(e) => setTaskDueDate(e.target.value)}
              className="px-3 py-2.5 text-xs rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-white/5">
          <button
            type="submit"
            className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Add Checklist Item</span>
          </button>
        </div>
      </form>

      {/* Task Filters controls bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-4 rounded-2xl bg-black/5 dark:bg-white/5 border border-white/5 dark:border-neutral-900/50">
        
        {/* Status filtering tabs */}
        <div className="flex items-center bg-black/10 dark:bg-white/5 p-1 rounded-xl w-fit">
          {["pending", "completed", "all"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status as any)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize cursor-pointer transition-colors ${
                statusFilter === status
                  ? "bg-indigo-600 text-white"
                  : "text-neutral-400 hover:text-neutral-200"
              }`}
            >
              {status}
            </button>
          ))}
        </div>

        {/* Sorting and subject filters */}
        <div className="flex items-center space-x-3 text-xs">
          <div className="flex items-center space-x-1.5">
            <FolderMinus className="w-4 h-4 text-neutral-400" />
            <Dropdown
              value={subjectFilter}
              onChange={setSubjectFilter}
              options={filterSubjectOptions}
              variant="transparent"
              align="right"
              className="min-w-[120px]"
            />
          </div>

          <div className="h-4 w-[1px] bg-neutral-200 dark:bg-neutral-800" />

          <div className="flex items-center space-x-1.5">
            <SlidersHorizontal className="w-4 h-4 text-neutral-400" />
            <Dropdown
              value={sortBy}
              onChange={(val) => setSortBy(val as any)}
              options={filterSortOptions}
              variant="transparent"
              align="right"
              className="min-w-[120px]"
            />
          </div>
        </div>
      </div>

      {/* Task Listing Directory */}
      <div className="space-y-2">
        {sortedTasks.length === 0 ? (
          <div className="p-12 text-center text-sm text-neutral-400 border border-dashed border-neutral-300 dark:border-neutral-800 rounded-2xl">
            No checklists found match your filter selection.
          </div>
        ) : (
          sortedTasks.map((task) => {
            const taskSub = subjects.find((s) => s.id === task.subjectId);
            const isOverdue =
              mounted &&
              task.dueDate &&
              new Date(task.dueDate).getTime() < Date.now() - 86400000 &&
              !task.completed;

            return (
              <div
                key={task.id}
                className={`flex items-center justify-between p-4 rounded-2xl glass-card transition-all ${
                  task.completed ? "opacity-60" : ""
                }`}
              >
                <div className="flex items-center space-x-3.5 flex-1 min-w-0 pr-4">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => toggleTask(task.id)}
                    className="cursor-pointer shrink-0"
                  />
                  <span
                    className={`text-sm truncate select-text cursor-text font-medium text-neutral-800 dark:text-neutral-100 ${
                      task.completed ? "line-through text-neutral-500" : ""
                    }`}
                  >
                    {task.title}
                  </span>
                </div>

                <div className="flex items-center space-x-2 shrink-0">
                  {/* Subject Tag */}
                  {taskSub && (
                    <span
                      className="hidden sm:inline text-[9px] px-2 py-0.5 rounded font-semibold border"
                      style={{
                        borderColor: `${taskSub.color}25`,
                        backgroundColor: `${taskSub.color}05`,
                        color: taskSub.color,
                      }}
                    >
                      {taskSub.name}
                    </span>
                  )}

                  {/* Due Date Indicator */}
                  {mounted && task.dueDate && (
                    <span
                      className={`flex items-center space-x-1 text-[10px] font-semibold ${
                        isOverdue ? "text-rose-500" : "text-neutral-500"
                      }`}
                    >
                      {isOverdue ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-500 animate-bounce" />
                      ) : (
                        <Calendar className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {new Date(task.dueDate).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </span>
                  )}

                  {/* Priority Tag */}
                  <span
                    className={`text-[9px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                      task.priority === "high"
                        ? "bg-rose-500/10 text-rose-500 border border-rose-500/20"
                        : task.priority === "medium"
                        ? "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                        : "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                    }`}
                  >
                    {task.priority}
                  </span>

                  {/* Edit Option */}
                  <button
                    onClick={() => openEditModal(task)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-colors cursor-pointer"
                    title="Edit Task"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete Option */}
                  <button
                    onClick={() => deleteTask(task.id)}
                    className="p-1 rounded-lg text-neutral-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors cursor-pointer"
                    title="Delete Task"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Task Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-modal w-full max-w-md rounded-2xl p-6 relative shadow-2xl border border-white/10 dark:border-neutral-900/50 animate-in fade-in zoom-in-95 duration-150">
            <button
              onClick={() => setIsEditModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/5 dark:bg-white/5 text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 cursor-pointer transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
            
            <h2 className="text-lg font-bold text-neutral-800 dark:text-neutral-100 mb-4">
              Edit Checklist Item
            </h2>
            
            <form onSubmit={handleSaveEdit} className="space-y-4">
              {/* Task Title */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                  Task Title
                </label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                />
              </div>

              {/* Subject Selector */}
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                  Linked Subject
                </label>
                <Dropdown
                  value={editSubjectId}
                  onChange={setEditSubjectId}
                  options={subjectOptions}
                  className="w-full"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* Priority Selector */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                    Priority
                  </label>
                  <Dropdown
                    value={editPriority}
                    onChange={(val) => setEditPriority(val as any)}
                    options={editPriorityOptions}
                    className="w-full"
                  />
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <label className="text-[10px] font-extrabold uppercase tracking-widest text-neutral-400">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl glass-input text-neutral-800 dark:text-neutral-200"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4 border-t border-white/5">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-black/10 dark:bg-white/5 hover:bg-black/15 dark:hover:bg-white/10 text-neutral-700 dark:text-neutral-300 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold cursor-pointer shadow-md"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
