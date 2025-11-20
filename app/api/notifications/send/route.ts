// src/app/api/notifications/send/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function POST(req: NextRequest) {
  try {
    const { userId, alertId, keywordTerm, channels, priority } = await req.json();

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Send email notification
    if (channels.includes("email")) {
      await transporter.sendMail({
        from: process.env.EMAIL_FROM || process.env.SMTP_USER,
        to: user.email,
        subject: `🚨 Alert Created: ${keywordTerm}`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
              .container { max-width: 600px; margin: 20px auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: #4F46E5; color: white; padding: 30px 20px; text-align: center; }
              .content { padding: 30px 20px; }
              .keyword { background: #EEF2FF; padding: 15px; border-radius: 8px; border-left: 4px solid #4F46E5; margin: 20px 0; font-size: 20px; font-weight: bold; color: #4F46E5; }
              .footer { background: #f9fafb; color: #6b7280; font-size: 13px; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🚨 Alert Created!</h1>
              </div>
              <div class="content">
                <p>Hi <strong>${user.name || user.email}</strong>,</p>
                <p>Your Google Trends alert has been created:</p>
                <div class="keyword">📊 ${keywordTerm}</div>
                <p>You'll receive notifications when this keyword trends.</p>
                <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              </div>
              <div class="footer">
                <p>Google Trends Alert System</p>
              </div>
            </div>
          </body>
          </html>
        `,
      });

      await prisma.notification.create({
        data: {
          userId: user.id,
          alertId,
          type: "email",
          message: `Alert created for: ${keywordTerm}`,
          read: false,
        },
      });
    }

    // Log other channels (implement later)
    if (channels.includes("sms")) console.log("📱 SMS queued");
    if (channels.includes("push")) console.log("🔔 Push queued");
    if (channels.includes("webhook")) console.log("🔗 Webhook queued");

    return NextResponse.json({ success: true, message: "Notifications sent" });
  } catch (error) {
    console.error("Notification error:", error);
    return NextResponse.json({ error: "Failed to send notification" }, { status: 500 });
  }
}
