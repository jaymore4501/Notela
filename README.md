# 🚀 Notela — Student Productivity Workspace

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![Version](https://img.shields.io/badge/version-1.0.0-indigo)](https://github.com/Notela/Notela)
[![Build Status](https://img.shields.io/badge/build-passing-success)](https://github.com/Notela/Notela)
[![Next.js](https://img.shields.io/badge/Next.js-16-black)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-blue)](https://react.dev/)
[![MongoDB](https://img.shields.io/badge/MongoDB-%234ea94b.svg)](https://www.mongodb.com/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](#-contributing-guidelines)

**Notela** is a modern, calm, and intelligent glassmorphic academic operating system designed for students. It centralizes note-taking, task management, subject organization, lifestyle habit tracking, focus sessions, and productivity analytics into a single, distraction-free productivity environment.

![Notela Introduction Poster](./public/Notela%20Introduction%20Poster%20SO1.png)

---

## ⚡ The Problem Notela Solves

Students face digital fragmentation and cognitive overload by jumping between different tools for writing notes, tracking assignments, timing focus sessions, and reviewing habit patterns. 

**Notela consolidates these functions into a single unified cockpit.** It converts chaotic student schedules into a structured workspace, letting students link notes, checklists, and timer stats directly to academic subjects (e.g. Mathematics, Computer Science) in a visually calm environment that reduces study fatigue.

---

## ✨ Main Features

*   **🏠 Dashboard control center**: Welcome widgets, active streaks (with gamified fire icon indicators), quick-action links, and a comprehensive overview of daily tasks.
*   **📝 Notion-Style Rich Text Editor**: A lightweight, native `contentEditable` editor optimized for speed:
    *   *Debounced Autosave*: Keeps your notes saved in real-time.
    *   *Format Painter (Brush)*: Captures font families, sizes, weights, background highlights, and styling, applying them to selections on release.
    *   *Grid and Table Modifiers*: Custom row/column insertions and cell editing.
    *   *Image Resize Engine*: Interactive resize handles and alignment tools.
    *   *Multi-format Exports*: Download documents as A4 PDF layouts (with iframe print triggers to bypass popup blockers), Word (`.docx`), JSON backup, or **3x scale UHD PNG images**.
*   **📚 Subject Workspaces**: Guided step-by-step onboarding wizards (using React Stepper) to create segregated compartments for lecture notes, homework lists, and specific course resources.
*   **✅ Academic Task Manager**: Clean checkboxes and task prioritizing (low, medium, high) with pending/completed filtering.
*   **⏱️ Focus Pomodoro Timer**: Pre-configured work-break timers with soft audio ticks and automatic history logs.
*   **📊 Productivity Telemetry**: Responsive analytics charts showing weekly study trends and completed task statistics powered by **Recharts**.
*   **🏋️ Habits Tracker (Activities)**: Lifestyle log mapping habits (gym, sleep, reading, social media limits) alongside academic work.
*   **⚙️ Settings Panel**: Switch between light/dark themes, manage profile preferences, or download/restore complete database backups.

---

## 🛠️ Technology Stack

*   **Frontend Framework**: [Next.js](https://nextjs.org/) (App Router, React 19, TypeScript)
*   **Styling & Themes**: [TailwindCSS](https://tailwindcss.com/) & [next-themes](https://github.com/pacocoursey/next-themes) (vanilla CSS variables for custom Glassmorphism panels)
*   **Database**: [MongoDB](https://www.mongodb.com/) (using native Node.js MongoDB driver connection)
*   **Animation System**: [Framer Motion](https://www.framer.com/motion/) (smooth spring transitions for menus, panels, and modals)
*   **Data Visualization**: [Recharts](https://recharts.org/) (responsive SVG charts)
*   **Sanitization**: [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify) (blocks XSS injection vectors)

---

## 🛡️ Audited Security Features

*   **HTTP-Only Cookies**: Authentication sessions are secured via `notela_session` cookies configured with `HttpOnly`, `Secure`, and `SameSite=Strict` flags to block script access and CSRF exploits.
*   **PBKDF2 Hashing**: Passwords are encrypted using Node's `crypto` module via PBKDF2 with unique, cryptographically random salts. Plaintext accounts are migrated automatically on login.
*   **Safe HTML Rendering**: All document editor nodes are passed through strict DOMPurify filters before database sync or rendering.
*   **Database Indexing**: Pre-configured indexes on `users.email` (unique), `users.sessionToken`, and `workspaces.email` (unique) secure fast lookup limits ($O(1)$ query times).
*   **Autosave Queue**: A lock-based queue prevents out-of-order save requests from triggering database collisions during automatic background saves.

---

## ⚙️ Environment Configuration

Create a `.env.local` file in the root directory of your project:

```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster0.example.mongodb.net/notela?retryWrites=true&w=majority
```

*   `MONGODB_URI`: The connection string to your MongoDB Atlas cluster or local database instance.

---

## 🚀 Local Development Setup

To run Notela on your local machine:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/your-username/notela.git
    cd notela
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Run the Development Server**:
    ```bash
    npm run dev
    ```

4.  **Access the App**:
    Open [http://localhost:3000](http://localhost:3000) inside your web browser.

5.  **Compile Check**:
    To verify code compilation and linting:
    ```bash
    npx tsc --noEmit
    ```

---

## 💡 Usage Examples

### 1. Organizing by Subject
*   Go to **Subjects** in the sidebar.
*   Click **Add Subject** and complete the Stepper wizard. Choose a signature color and name it (e.g. `Computer Science`).
*   Your new subject folder is ready to house separate notes and checklists.

### 2. Creating a Rich Note
*   Click **Notes** and select **New Note**.
*   Select your subject from the dropdown and write your heading.
*   Use the **Format Painter** by selecting styled text, clicking the Paintbrush button, and highlighting target text to apply the style instantly.
*   Add a table using the toolbar Grid icon, and click the corner resizer of images to scale them cleanly.
*   Click **Export** to save your work as an A4 PDF or UHD PNG image.

### 3. Launching a Focus Session
*   Go to the **Focus Timer** page.
*   Select your subject and click **Start Focus**.
*   Once completed, your focus telemetry is automatically logged and visualized in the **Analytics** page.

---

## ☁️ Deployment Guide

Notela is pre-configured for instant deployment on cloud hosting providers like [Vercel](https://vercel.com/):

1.  **Database Provisioning**:
    *   Provision a free cluster on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
    *   Set up a database user and copy the connection string.
    *   Whitelist access from anywhere (`0.0.0.0/0`) to allow dynamic cloud host connections.
2.  **Deployment**:
    *   Import your repository into Vercel.
    *   Add your environment variables:
        *   `MONGODB_URI`: *[Your Atlas connection string]*
    *   Click **Deploy**. Vercel will bundle, compile, and publish your project automatically.

---

## 🤝 Contributing Guidelines

We welcome contributions to Notela! Please follow these guidelines:
1.  Fork the repository and create your feature branch (`git checkout -b feature/NewFeature`).
2.  Check for clean TypeScript compilation before committing:
    ```bash
    npx tsc --noEmit
    ```
3.  Submit a Pull Request describing your changes.

---

## 👤 Author & Maintainers
*   **Jaymo** (Project Creator & Design Lead)

---

## 📄 License
This project is open-source and licensed under the [MIT License](./LICENSE).
