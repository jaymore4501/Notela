import nodemailer from "nodemailer";

/**
 * Sends a password reset OTP verification code to a user via SMTP.
 */
export async function sendResetEmail(toEmail: string, code: string): Promise<void> {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || "587", 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || `"Notela Security" <${user}>`;

  if (!host || !user || !pass) {
    throw new Error(
      "Missing SMTP configuration. Please define SMTP_HOST, SMTP_USER, and SMTP_PASS in your environment."
    );
  }

  // Create Nodemailer Transporter
  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // True for 465, false for other ports (like 587)
    auth: {
      user,
      pass,
    },
  });

  // Polished glassmorphism-inspired HTML email template
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Notela Password Reset Code</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #0b0e14;
            color: #f3f4f6;
            margin: 0;
            padding: 40px 20px;
          }
          .container {
            max-width: 480px;
            margin: 0 auto;
            background: rgba(17, 24, 39, 0.9);
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 20px;
            padding: 40px 30px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
            text-align: center;
          }
          .logo {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            margin-bottom: 24px;
          }
          .title {
            font-size: 24px;
            font-weight: 800;
            color: #ffffff;
            margin-bottom: 12px;
            letter-spacing: -0.5px;
          }
          .subtitle {
            font-size: 14px;
            color: #9ca3af;
            line-height: 1.5;
            margin-bottom: 30px;
          }
          .code-box {
            background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(139, 92, 246, 0.1) 100%);
            border: 1px solid rgba(99, 102, 241, 0.25);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
            display: inline-block;
            letter-spacing: 6px;
            font-family: "Courier New", Courier, monospace;
            font-size: 32px;
            font-weight: bold;
            color: #8b5cf6;
            text-shadow: 0 0 10px rgba(139, 92, 246, 0.3);
          }
          .footer {
            font-size: 11px;
            color: #4b5563;
            line-height: 1.4;
            border-top: 1px solid rgba(255, 255, 255, 0.05);
            padding-top: 20px;
            margin-top: 20px;
          }
          .footer a {
            color: #6366f1;
            text-decoration: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="title">Reset Your Password</h1>
          <p class="subtitle">We received a request to recover your Notela account password. Use the verification code below to authorize this request. This code is valid for 15 minutes.</p>
          
          <div class="code-box">${code}</div>
          
          <p class="subtitle" style="font-size: 12px; margin-bottom: 0;">If you did not request this code, please secure your account immediately or ignore this email.</p>
          
          <div class="footer">
            <p>Sent by Notela Security — Academic Operating System</p>
            <p>Need support? Contact us at <a href="mailto:support@notela.com">support@notela.com</a></p>
          </div>
        </div>
      </body>
    </html>
  `;

  // Send Email
  await transporter.sendMail({
    from,
    to: toEmail,
    subject: "Reset your Notela Password",
    text: `Your Notela password recovery code is: ${code}. This code expires in 15 minutes.`,
    html: htmlContent,
  });
}
