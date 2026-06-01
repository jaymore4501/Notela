import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { hashPassword } from "@/lib/auth";

export async function POST(request: Request) {
  try {
    const { email, code, password } = await request.json();

    if (!email || !code || !password) {
      return NextResponse.json(
        { success: false, error: "All fields are required." },
        { status: 400 }
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: "Password must be at least 6 characters." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCode = code.trim();

    const client = await clientPromise;
    const db = client.db("notela");
    const usersCollection = db.collection("users");

    // Find the user
    const user = await usersCollection.findOne({ email: trimmedEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "User account not found." },
        { status: 404 }
      );
    }

    // Verify verification code and expiry
    if (!user.resetCode || user.resetCode !== trimmedCode) {
      return NextResponse.json(
        { success: false, error: "Invalid verification code." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (!user.resetCodeExpires || new Date(user.resetCodeExpires) < now) {
      return NextResponse.json(
        { success: false, error: "Verification code has expired. Please request a new one." },
        { status: 400 }
      );
    }

    // Hash the new password securely using PBKDF2
    const hashedPassword = hashPassword(password);

    // Update password and clear reset state
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedPassword,
        },
        $unset: {
          resetCode: "",
          resetCodeExpires: "",
          sessionToken: "", // Invalidate current active session
        },
      }
    );

    return NextResponse.json({
      success: true,
      message: "Password has been successfully updated.",
    });
  } catch (err: any) {
    console.error("Reset password error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
