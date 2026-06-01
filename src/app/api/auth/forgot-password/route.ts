import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { sendResetEmail } from "@/lib/email";

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

    const isDevMode = process.env.EMAIL_DEV_MODE === "true";
    const hasSmtpConfig = !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);

    if (hasSmtpConfig) {
      try {
        // Send a real OTP email
        await sendResetEmail(trimmedEmail, verificationCode);
        console.log(`[PASS_RESET] Real email sent successfully to ${trimmedEmail}`);
      } catch (emailErr: any) {
        console.error("Failed to send real reset email via SMTP:", emailErr);
        
        // In dev mode, we can log and fallback to on-screen helper. In production, we fail securely.
        if (!isDevMode) {
          return NextResponse.json(
            { success: false, error: "Failed to dispatch password recovery email. Please contact support." },
            { status: 500 }
          );
        }
      }
    } else if (!isDevMode) {
      // No SMTP config and NOT dev mode -> secure error
      console.warn("[PASS_RESET] Attempted reset request but SMTP variables are missing and Dev Mode is off.");
      return NextResponse.json(
        { success: false, error: "Email recovery service is currently unavailable. Please try again later." },
        { status: 503 }
      );
    }

    // Console log fallback for local developers
    console.log(`[PASS_RESET_MOCK] Verification code for ${trimmedEmail} is: ${verificationCode}`);

    // Return the code in the response ONLY if dev mode is enabled
    return NextResponse.json({
      success: true,
      message: "Verification code generated successfully.",
      devCode: isDevMode ? verificationCode : undefined,
    });
  } catch (err: any) {
    console.error("Forgot password error:", err);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
