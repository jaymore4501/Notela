import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { verifyPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("notela_session")?.value;

    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access. No session token found." },
        { status: 401 }
      );
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Both email and password are required to confirm deletion." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const client = await clientPromise;
    const db = client.db("notela");
    const usersCollection = db.collection("users");
    const workspacesCollection = db.collection("workspaces");

    // Authenticate the user by session token
    const user = await usersCollection.findOne({ sessionToken });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access. Invalid session." },
        { status: 401 }
      );
    }

    // Ensure the email matches the logged-in session email
    if (user.email !== trimmedEmail) {
      return NextResponse.json(
        { success: false, error: "Confirmation email address does not match your account." },
        { status: 400 }
      );
    }

    // Verify user's password
    const isMatch = user.password.includes(":")
      ? verifyPassword(password, user.password)
      : user.password === password;

    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Incorrect password. Account deletion aborted." },
        { status: 401 }
      );
    }

    // Proceed with database purging
    // 1. Delete user record
    await usersCollection.deleteOne({ _id: user._id });

    // 2. Delete workspace record
    await workspacesCollection.deleteOne({ email: user.email });

    // 3. Clear session cookie
    cookieStore.set("notela_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0, // Invalidate instantly
      expires: new Date(0),
      path: "/",
    });

    console.log(`[ACCOUNT_PURGE] User account and workspaces for ${user.email} have been permanently deleted.`);

    return NextResponse.json({
      success: true,
      message: "Your account and data have been permanently deleted.",
    });
  } catch (err: any) {
    console.error("Delete account API error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
