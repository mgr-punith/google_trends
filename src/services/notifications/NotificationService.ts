
import nodemailer from "nodemailer";
import { createTransport } from "nodemailer";
import webpush from "web-push";

type EmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

export class NotificationService {
  private emailTransport: ReturnType<typeof createTransport> | null = null;

  constructor() {
    // Configure webpush VAPID if present
    if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
      try {
        webpush.setVapidDetails(
          `mailto:${process.env.EMAIL_FROM || "no-reply@example.com"}`,
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY
        );
      } catch (err) {
        console.warn("web-push VAPID setup failed:", err);
      }
    }
  }

  async initEmailTransport() {
    if (this.emailTransport) return this.emailTransport;

    // If SMTP env present (e.g., SMTP_HOST), use it. Otherwise use Ethereal for dev.
    if (process.env.SMTP_HOST && process.env.SMTP_PORT) {
      console.log(`[EMAIL] Initializing SMTP transport: ${process.env.SMTP_HOST}:${process.env.SMTP_PORT}`);
      this.emailTransport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === "true",
        auth:
          process.env.SMTP_USER && process.env.SMTP_PASS
            ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
            : undefined,
      });
      console.log(`[EMAIL] SMTP transport initialized successfully`);
    } else {
      // dev: ethereal
      console.warn(`[EMAIL] SMTP not configured (SMTP_HOST/SMTP_PORT missing). Using Ethereal test account.`);
      console.warn(`[EMAIL] NOTE: Emails will NOT be delivered. Check console for preview URLs.`);
      console.warn(`[EMAIL] To send real emails, configure SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in .env`);
      const testAccount = await nodemailer.createTestAccount();
      this.emailTransport = nodemailer.createTransport({
        host: testAccount.smtp.host,
        port: testAccount.smtp.port,
        secure: testAccount.smtp.secure,
        auth: { user: testAccount.user, pass: testAccount.pass },
      });
      console.info("[EMAIL] Using Ethereal test account. Preview URLs will be printed in console.");
    }

    return this.emailTransport;
  }

  async sendEmail(opts: EmailOptions) {
    try {
      console.log(`[EMAIL] Attempting to send email to ${opts.to}...`);
      const transport = await this.initEmailTransport();
      const from = process.env.EMAIL_FROM || "no-reply@example.com";
      
      const info = await transport.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
      });

      console.log(`[EMAIL] Email sent successfully. Message ID: ${info.messageId}`);

      // print ethereal preview url
      if ((nodemailer as any).getTestMessageUrl) {
        const url = nodemailer.getTestMessageUrl(info);
        if (url) {
          console.info(`[EMAIL] ⚠️  Ethereal Preview URL (test email, not delivered): ${url}`);
        }
      }
      return info;
    } catch (err) {
      console.error("[EMAIL] sendEmail error:", err);
      if (err instanceof Error) {
        console.error(`[EMAIL] Error message: ${err.message}`);
        console.error(`[EMAIL] Error stack: ${err.stack}`);
      }
      throw err;
    }
  }

  // placeholder for other channels: sms, push, webhook
  async sendPush(subscription: any, payload: any) {
    if (!process.env.VAPID_PUBLIC_KEY) throw new Error("VAPID not configured");
    return webpush.sendNotification(subscription, JSON.stringify(payload));
  }
}

export default new NotificationService();
