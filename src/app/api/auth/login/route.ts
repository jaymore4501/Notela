import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Please enter both email and password." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const client = await clientPromise;
    const db = client.db("notela");
    const usersCollection = db.collection("users");

    // Find user
    const foundUser = await usersCollection.findOne({
      email: trimmedEmail,
    });

    if (!foundUser) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Check password compatibility (handles migrated salt:hash and legacy plaintext)
    const isMatch = foundUser.password.includes(":")
      ? verifyPassword(password, foundUser.password)
      : foundUser.password === password;

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password." },
        { status: 401 }
      );
    }

    // Auto-migrate legacy plaintext password to PBKDF2 hash on successful login
    if (!foundUser.password.includes(":")) {
      const hashedPassword = hashPassword(password);
      await usersCollection.updateOne(
        { _id: foundUser._id },
        { $set: { password: hashedPassword } }
      );
    }

    // Generate a cryptographically secure session token
    const sessionToken = crypto.randomUUID();
    await usersCollection.updateOne(
      { _id: foundUser._id },
      { $set: { sessionToken } }
    );

    // Set HTTP-only secure cookie
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
        email: foundUser.email,
        name: foundUser.name,
        focusGoal: foundUser.focusGoal || 60,
      },
    });
  } catch (err: any) {
    console.error("Login error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
