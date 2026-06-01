import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";
import { hashPassword, verifyPassword } from "@/lib/auth";

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

    const body = await request.json();

    // Action 1: Password Update
    if (body.oldPassword !== undefined && body.newPassword !== undefined) {
      const { oldPassword, newPassword } = body;
      
      if (typeof oldPassword !== "string" || typeof newPassword !== "string") {
        return NextResponse.json(
          { success: false, error: "Invalid password fields." },
          { status: 400 }
        );
      }
      
      // Verify old password (handles legacy plaintext and hashed)
      const isMatch = foundUser.password.includes(":") || foundUser.password.startsWith("pbkdf2:")
        ? verifyPassword(oldPassword, foundUser.password)
        : foundUser.password === oldPassword;

      if (!isMatch) {
        return NextResponse.json(
          { success: false, error: "Incorrect old password." },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { success: false, error: "New password must be at least 6 characters." },
          { status: 400 }
        );
      }

      // Hash the new password securely
      const hashedPassword = hashPassword(newPassword);

      await usersCollection.updateOne(
        { _id: foundUser._id },
        { $set: { password: hashedPassword } }
      );

      return NextResponse.json({ success: true, message: "Password updated successfully!" });
    }

    // Action 2: Profile Settings Update (Name & Focus Goal)
    if (body.name !== undefined && body.focusGoal !== undefined) {
      const { name, focusGoal } = body;

      if (typeof name !== "string" || isNaN(Number(focusGoal))) {
        return NextResponse.json(
          { success: false, error: "Invalid name or focus goal parameters." },
          { status: 400 }
        );
      }

      if (!name.trim()) {
        return NextResponse.json(
          { success: false, error: "Name cannot be empty." },
          { status: 400 }
        );
      }

      await usersCollection.updateOne(
        { _id: foundUser._id },
        { $set: { name: name.trim(), focusGoal: Number(focusGoal) } }
      );

      return NextResponse.json({
        success: true,
        user: {
          email: foundUser.email,
          name: name.trim(),
          focusGoal: Number(focusGoal),
        },
      });
    }

    return NextResponse.json(
      { success: false, error: "Invalid request payload." },
      { status: 400 }
    );
  } catch (err: any) {
    console.error("Update profile/password error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
