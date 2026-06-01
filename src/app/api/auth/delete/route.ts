import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";

export async function POST() {
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
    const workspacesCollection = db.collection("workspaces");

    // Authenticate user via session token
    const foundUser = await usersCollection.findOne({ sessionToken });

    if (!foundUser) {
      return NextResponse.json(
        { success: false, error: "Unauthorized access." },
        { status: 401 }
      );
    }

    const trimmedEmail = foundUser.email.trim().toLowerCase();

    // 1. Delete user workspace data from workspaces collection
    await workspacesCollection.deleteOne({ email: trimmedEmail });

    // 2. Delete user account from users collection
    await usersCollection.deleteOne({ _id: foundUser._id });

    // 3. Clear the HTTP-only cookie
    cookieStore.set("notela_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({
      success: true,
      message: "Account and workspace data deleted successfully.",
    });
  } catch (err: any) {
    console.error("Delete account error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
