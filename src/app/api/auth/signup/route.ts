import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, password } = body || {};
    
    if (typeof name !== "string" || typeof email !== "string" || typeof password !== "string") {
      return NextResponse.json(
        { success: false, error: "Invalid request payload." },
        { status: 400 }
      );
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName || !trimmedEmail || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    // Strict email format verification
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return NextResponse.json(
        { success: false, error: "Invalid email format." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const client = await clientPromise;
    const db = client.db("notela");
    const usersCollection = db.collection("users");

    // Check if user already exists
    const existingUser = await usersCollection.findOne({
      email: trimmedEmail,
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email is already registered." },
        { status: 400 }
      );
    }

    // Hash the password securely using PBKDF2
    const hashedPassword = hashPassword(password);
    const sessionToken = crypto.randomUUID();

    const newUser = {
      name: trimmedName,
      email: trimmedEmail,
      password: hashedPassword,
      sessionToken,
      focusGoal: 60,
      createdAt: new Date(),
    };

    await usersCollection.insertOne(newUser);

    // Initialize an empty workspace document for this user
    const workspacesCollection = db.collection("workspaces");
    await workspacesCollection.updateOne(
      { email: trimmedEmail },
      {
        $setOnInsert: {
          email: trimmedEmail,
          subjects: [],
          notes: [],
          tasks: [],
          focusSessions: [],
          pomodoroConfig: { focus: 25, shortBreak: 5, longBreak: 15 },
          activities: [],
          activityLog: [],
        },
      },
      { upsert: true }
    );

    // Set HTTP-only secure cookie for immediate session activation
    const cookieStore = await cookies();
    cookieStore.set("notela_session", sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 1 week
      path: "/",
    });

    return NextResponse.json({
      success: true,
      user: {
        name: newUser.name,
        email: newUser.email,
        focusGoal: newUser.focusGoal,
      },
    });
  } catch (err: any) {
    console.error("Signup error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
