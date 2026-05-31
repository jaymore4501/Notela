# 🚀 Notela — System Overview

**Product Name**: Notela  
**Type**: Student Productivity SaaS Web Application  
**Category**: Personal Academic Workspace / Productivity OS  
**Access Model**: Single-user, offline-first with secure cloud synchronization  

![Notela System Overview Poster](./Notela%20Introduction%20Poster%20SO2.png)

---

## 🧠 1. Product Summary & Vision

**Notela** is a modern, high-performance student productivity platform designed to function as a personal academic operating system. It centralizes note-taking, task management, subject organization, lifestyle habit tracking, focus sessions, and productivity analytics into a single unified workspace.

### Core Product Vision
> “To build a calm, intelligent, and distraction-free digital workspace that helps students organize thoughts, manage academic work, and improve focus.”

Unlike enterprise collaboration tools, Notela is strictly optimized for **individual student productivity**. It reduces cognitive overload by organizing scattered academic materials (lecture notes, homework checklists, focus records) into cohesive subject-based hubs.

---

## 🧩 2. System Architecture

Notela follows a modern, full-stack web architecture utilizing local-first state persistence mirrored to a secure server.

```
┌────────────────────────────────────────────────────────────────────────┐
│                              FRONTEND LAYER                            │
│  [Next.js (App Router)] ── [TypeScript] ── [TailwindCSS]               │
│  [Framer Motion] (Transitions)  ── [next-themes] (Light/Dark toggles)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
┌──────────────────────────────────▼─────────────────────────────────────┐
│                            STATE & SYNC LAYER                          │
│  [AppStateContext] (React State) ────> [LocalStorage] (Instant cache)  │
│  [performSync Queue] (Locks parallel POST saves to prevent collisions)  │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │  HTTP-Only Session Cookie
┌──────────────────────────────────▼─────────────────────────────────────┐
│                            DATABASE API LAYER                          │
│  [API Endpoints] (/api/workspace) ── [MongoDB Driver]                 │
│  [MongoDB Database] (Single-document sync per user email)             │
└────────────────────────────────────────────────────────────────────────┘
```

### Technical Stack
*   **Framework**: Next.js (App Router, TypeScript-enabled)
*   **Styling**: TailwindCSS & custom vanilla CSS variables for Glassmorphism
*   **Database**: MongoDB (utilizing native indexing on session tokens and email lookups)
*   **Animations**: Framer Motion for page, sidebar, drawer, and modal transitions
*   **Visual Assets**: High-definition customized SVGs and vector assets
*   **Analytics Rendering**: Recharts for responsive, svg-based telemetry charts

---

## 🎨 3. Design System & Aesthetics

Inspired by modern premium SaaS layouts, Notela employs a clean, distraction-free visual interface.

### Design Principles
1.  **Glassmorphism UI**: High backdrop-blur levels (`12px` to `16px`) combined with soft translucent surfaces (`rgba` opacity `0.45` to `0.6`).
2.  **Harmonious Color Palette**:
    *   **Dark Mode Canvas**: `#0f121d` (deep slate blue) with soft card surfaces.
    *   **Light Mode Canvas**: `#fafafa` (light off-white) to prevent visual fatigue.
    *   **Accents**: Seamless gradients from Indigo (`#6366f1`) to Violet-Purple (`#8b5cf6`).
3.  **UI Component Micro-interactions**:
    *   **`ShinyText`**: Reflections on taglines and headings.
    *   **`ClickSpark`**: Canvas-based spark animations on user clicks.
    *   **`BorderGlow`**: Animated glowing borders to indicate focus on interactive panels.
    *   **`Stepper`**: Wizard-style indicators for multi-stage setup flows.
    *   **`ShapeGrid`**: Subtle background grid movement that maintains text legibility.

### Tool Color-Coding Matrix
To help students organize data at a glance, Notela uses color identifiers:
*   **Subject Workspaces**: Indigo/Royal Blue (`#4F46E5` / `#3B82F6`) on Light Lavender (`#F5F6FF`).
*   **Task Checklists**: Emerald Green (`#10B981` / `#059669`) on Light Mint (`#F0FDF4`).
*   **Focus Cycles**: Amber/Orange (`#D97706` / `#F59E0B`) on Light Peach (`#FFFBEB`).
*   **Productivity Insights**: Violet-Purple (`#8B5CF6`) on Light Violet (`#FAF5FF`).

---

## 🧭 4. Core Application Modules

### 🏠 4.1 Dashboard (Control Center)
Acts as the central command cockpit. Renders personalized greetings, displays current focus streak badges (with gamified fire icon tags), lists recent note cards, maps pending homework, and shows productivity summary graphs.

### 📝 4.2 Notes System
A high-performance WYSIWYG note editor built on native `contentEditable` behaviors to minimize package overhead:
*   **Autosave**: Fires debounced callbacks to local state on title, subject, or text modifications.
*   **Format Painter (Brush)**: Captures inline text styles (family, size, weight, coloring) and applies them to subsequent selections on `mouseUp` release.
*   **Table Operations**: Supports adding/deleting rows/columns, table insertions, and cell modifications.
*   **Image Management**: Offers custom resizing handles and alignment controls.
*   **Multi-format Exports**:
    *   **PDF**: Prints layouts using hidden iframes to bypass browser popup blockers.
    *   **Word (.docx)**: Packages XHTML wrappers into download attachments.
    *   **PNG Image**: Renders current contents onto a hidden `<canvas>` at **3x scale** for ultra-high-definition exports.
    *   **JSON**: Packages notes data for portability.

### 📚 4.3 Subject Workspaces
Organizes documents, tasks, and exam dates by subject folders. Leverages the `Stepper` component to guide new subject registrations.

### ✅ 4.4 Task Management
Enables creating, completing, and deleting tasks. Supports setting priorities (low, medium, high) and filtering tasks by completion state.

### ⏱️ 4.5 Pomodoro Focus Timer
A study-break sequence tracker. Emits soft audio signals upon interval completions and logs total duration metrics to the user’s database.

### 📊 4.6 Analytics & Telemetry
Displays weekly study charts and streak telemetry via Recharts. Fully responsive to layout dimension changes.

### 🏃 4.7 Habits & Lifestyle (Activities)
Allows students to track non-academic habits (e.g., gym visits, sleep schedules, reading time) and monitor target goals.

---

## 🔒 5. Privacy, Syncing & Security

*   **Zero Hardcoded Paths**: The source code is completely free of absolute file system paths, username roots, or development environment links.
*   **Credentials Security**: Database connection links and secrets are stored exclusively in ignored environment files (`.env.local`), never committed to source repositories.
*   **Offline Fallbacks**: State modifications write immediately to browser `localStorage`. If server connections fail, local data is preserved and sync is queued.
*   **Sequential Queue Engine**: The state manager tracks synchronization processes using React refs. Outgoing state updates are processed sequentially to guarantee that rapid changes are not overwritten by slower, out-of-order network responses.
