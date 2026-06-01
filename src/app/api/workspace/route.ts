import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import DOMPurify from "isomorphic-dompurify";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("notela_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("notela");
    const usersCollection = db.collection("users");

    // Authenticate user via session token
    const foundUser = await usersCollection.findOne({ sessionToken });

    if (!foundUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const trimmedEmail = foundUser.email.trim().toLowerCase();
    const workspacesCollection = db.collection("workspaces");

    // Fetch user workspace
    let workspace: any = await workspacesCollection.findOne({ email: trimmedEmail });

    if (!workspace) {
      // If it doesn't exist, initialize and return defaults
      const defaults = {
        email: trimmedEmail,
        subjects: [],
        notes: [],
        tasks: [],
        focusSessions: [],
        pomodoroConfig: { focus: 25, shortBreak: 5, longBreak: 15 },
        activities: [],
        activityLog: [],
      };
      await workspacesCollection.insertOne(defaults);
      workspace = defaults;
    }

    return NextResponse.json({
      success: true,
      subjects: workspace.subjects || [],
      notes: workspace.notes || [],
      tasks: workspace.tasks || [],
      focusSessions: workspace.focusSessions || [],
      pomodoroConfig: workspace.pomodoroConfig || { focus: 25, shortBreak: 5, longBreak: 15 },
      activities: workspace.activities || [],
      activityLog: workspace.activityLog || [],
    });
  } catch (err: any) {
    console.error("Fetch workspace error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("notela_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const client = await clientPromise;
    const db = client.db("notela");
    const usersCollection = db.collection("users");

    // Authenticate user via session token
    const foundUser = await usersCollection.findOne({ sessionToken });

    if (!foundUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const trimmedEmail = foundUser.email.trim().toLowerCase();
    const body = await request.json();
    const { subjects, notes, tasks, focusSessions, pomodoroConfig, activities, activityLog } = body || {};

    if (subjects !== undefined && !Array.isArray(subjects)) {
      return NextResponse.json({ success: false, error: "subjects must be an array." }, { status: 400 });
    }
    if (notes !== undefined && !Array.isArray(notes)) {
      return NextResponse.json({ success: false, error: "notes must be an array." }, { status: 400 });
    }
    if (tasks !== undefined && !Array.isArray(tasks)) {
      return NextResponse.json({ success: false, error: "tasks must be an array." }, { status: 400 });
    }
    if (focusSessions !== undefined && !Array.isArray(focusSessions)) {
      return NextResponse.json({ success: false, error: "focusSessions must be an array." }, { status: 400 });
    }
    if (activities !== undefined && !Array.isArray(activities)) {
      return NextResponse.json({ success: false, error: "activities must be an array." }, { status: 400 });
    }
    if (activityLog !== undefined && !Array.isArray(activityLog)) {
      return NextResponse.json({ success: false, error: "activityLog must be an array." }, { status: 400 });
    }
    if (pomodoroConfig !== undefined && (typeof pomodoroConfig !== "object" || pomodoroConfig === null)) {
      return NextResponse.json({ success: false, error: "pomodoroConfig must be an object." }, { status: 400 });
    }

    const sanitizedSubjects = subjects ? subjects.map((sub: any) => ({
      id: typeof sub.id === "string" ? sub.id : "",
      name: typeof sub.name === "string" ? DOMPurify.sanitize(sub.name).trim() : "",
      color: typeof sub.color === "string" ? DOMPurify.sanitize(sub.color).trim() : "",
      description: typeof sub.description === "string" ? DOMPurify.sanitize(sub.description).trim() : "",
      dateCreated: typeof sub.dateCreated === "string" ? sub.dateCreated : new Date().toISOString(),
    })) : [];

    const sanitizedNotes = notes ? notes.map((note: any) => ({
      id: typeof note.id === "string" ? note.id : "",
      title: typeof note.title === "string" ? DOMPurify.sanitize(note.title).trim() : "",
      content: typeof note.content === "string" ? DOMPurify.sanitize(note.content) : "",
      subjectId: typeof note.subjectId === "string" ? note.subjectId : "uncategorized",
      lastModified: typeof note.lastModified === "string" ? note.lastModified : new Date().toISOString(),
    })) : [];

    const sanitizedTasks = tasks ? tasks.map((task: any) => ({
      id: typeof task.id === "string" ? task.id : "",
      title: typeof task.title === "string" ? DOMPurify.sanitize(task.title).trim() : "",
      completed: !!task.completed,
      priority: ["low", "medium", "high"].includes(task.priority) ? task.priority : "low",
      dueDate: typeof task.dueDate === "string" ? task.dueDate : undefined,
      subjectId: typeof task.subjectId === "string" ? task.subjectId : "uncategorized",
    })) : [];

    const sanitizedSessions = focusSessions ? focusSessions.map((session: any) => ({
      id: typeof session.id === "string" ? session.id : "",
      date: typeof session.date === "string" ? session.date : new Date().toISOString().split("T")[0],
      durationMinutes: typeof session.durationMinutes === "number" ? Math.max(0, session.durationMinutes) : 0,
      subjectId: typeof session.subjectId === "string" ? session.subjectId : "uncategorized",
    })) : [];

    const sanitizedActivities = activities ? activities.map((act: any) => ({
      id: typeof act.id === "string" ? act.id : "",
      name: typeof act.name === "string" ? DOMPurify.sanitize(act.name).trim() : "",
      emoji: typeof act.emoji === "string" ? DOMPurify.sanitize(act.emoji).trim() : undefined,
      targetMinutes: typeof act.targetMinutes === "number" ? Math.max(0, act.targetMinutes) : undefined,
      dateCreated: typeof act.dateCreated === "string" ? act.dateCreated : new Date().toISOString(),
    })) : [];

    const sanitizedActivityLog = activityLog ? activityLog.map((log: any) => ({
      id: typeof log.id === "string" ? log.id : "",
      date: typeof log.date === "string" ? log.date : new Date().toISOString().split("T")[0],
      activityId: typeof log.activityId === "string" ? log.activityId : "",
      completed: !!log.completed,
      durationMinutes: typeof log.durationMinutes === "number" ? Math.max(0, log.durationMinutes) : undefined,
    })) : [];

    const sanitizedPomodoro = pomodoroConfig ? {
      focus: typeof pomodoroConfig.focus === "number" ? Math.max(1, pomodoroConfig.focus) : 25,
      shortBreak: typeof pomodoroConfig.shortBreak === "number" ? Math.max(1, pomodoroConfig.shortBreak) : 5,
      longBreak: typeof pomodoroConfig.longBreak === "number" ? Math.max(1, pomodoroConfig.longBreak) : 15,
    } : { focus: 25, shortBreak: 5, longBreak: 15 };

    const workspacesCollection = db.collection("workspaces");

    await workspacesCollection.updateOne(
      { email: trimmedEmail },
      {
        $set: {
          subjects: sanitizedSubjects,
          notes: sanitizedNotes,
          tasks: sanitizedTasks,
          focusSessions: sanitizedSessions,
          pomodoroConfig: sanitizedPomodoro,
          activities: sanitizedActivities,
          activityLog: sanitizedActivityLog,
        },
      },
      { upsert: true }
    );

    return NextResponse.json({ success: true, message: "Workspace synced successfully." });
  } catch (err: any) {
    console.error("Save workspace error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
