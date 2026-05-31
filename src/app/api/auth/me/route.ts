import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("notela_session")?.value;

    if (!sessionToken) {
      return NextResponse.json({ success: false, user: null });
    }

    const client = await clientPromise;
    const db = client.db("notela");
    const usersCollection = db.collection("users");

    // Find user by session token
    const foundUser = await usersCollection.findOne({ sessionToken });

    if (!foundUser) {
      return NextResponse.json({ success: false, user: null });
    }

    return NextResponse.json({
      success: true,
      user: {
        email: foundUser.email,
        name: foundUser.name,
        focusGoal: foundUser.focusGoal || 60,
      },
    });
  } catch (err: any) {
    console.error("Auth me check error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
