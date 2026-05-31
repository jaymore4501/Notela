import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";

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
    const { subjects, notes, tasks, focusSessions, pomodoroConfig, activities, activityLog } = body;

    const workspacesCollection = db.collection("workspaces");

    await workspacesCollection.updateOne(
      { email: trimmedEmail },
      {
        $set: {
          subjects: subjects || [],
          notes: notes || [],
          tasks: tasks || [],
          focusSessions: focusSessions || [],
          pomodoroConfig: pomodoroConfig || { focus: 25, shortBreak: 5, longBreak: 15 },
          activities: activities || [],
          activityLog: activityLog || [],
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
