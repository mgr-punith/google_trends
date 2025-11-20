
import Twilio from "twilio";

const sid = process.env.TWILIO_ACCOUNT_SID;
const token = process.env.TWILIO_AUTH_TOKEN;
export const twilioClient = sid && token ? Twilio(sid, token) : null;

/**
 * sendSms - wrapper that sends an SMS using Twilio if configured
 */
export async function sendSms(to: string, body: string, from?: string) {
  if (!twilioClient) throw new Error("Twilio not configured");
  try {
    const message = await twilioClient.messages.create({
      to,
      from: from ?? process.env.TWILIO_FROM_NUMBER,
      body,
    });
    return message;
  } catch (err) {
    console.error("Twilio sendSms error:", err);
    throw err;
  }
}
