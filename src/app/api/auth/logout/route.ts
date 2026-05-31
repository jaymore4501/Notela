import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";

export async function POST() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("notela_session")?.value;

    if (sessionToken) {
      const client = await clientPromise;
      const db = client.db("notela");
      const usersCollection = db.collection("users");

      // Invalidate the session token in the database
      await usersCollection.updateOne(
        { sessionToken },
        { $unset: { sessionToken: "" } }
      );
    }

    // Clear the HTTP-only cookie
    cookieStore.set("notela_session", "", {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 0,
      path: "/",
    });

    return NextResponse.json({ success: true, message: "Logged out successfully." });
  } catch (err: any) {
    console.error("Logout error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
