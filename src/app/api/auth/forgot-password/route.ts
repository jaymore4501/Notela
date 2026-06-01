import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, error: "Email address is required." },
        { status: 400 }
      );
    }

    const trimmedEmail = email.trim().toLowerCase();

    const client = await clientPromise;
    const db = client.db("notela");
    const usersCollection = db.collection("users");

    // Check if user exists
    const user = await usersCollection.findOne({ email: trimmedEmail });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "No account found with that email address." },
        { status: 404 }
      );
    }

    // Generate a secure 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expirationTime = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store code on user document
    await usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          resetCode: verificationCode,
          resetCodeExpires: expirationTime,
        },
      }
    );

    // In a real production app, we would use an email transporter here (e.g. Nodemailer/Resend)
    console.log(`[PASS_RESET_MOCK] Verification code for ${trimmedEmail} is: ${verificationCode}`);

    // Return the code in the response as devCode for easy UI simulation and testing
    return NextResponse.json({
      success: true,
      message: "Verification code generated successfully.",
      devCode: verificationCode,
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
