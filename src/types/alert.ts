// src/types/alert.ts
export type AlertFrequency = "realtime" | "hourly" | "daily";
export type AlertPriority = "low" | "medium" | "high" | "critical";

export interface AlertDTO {
  id?: string;
  userId: string;
  keywordId: string;
  frequency: AlertFrequency;
  thresholdPct?: number;
  thresholdAbs?: number;
  channels: string[]; // email, sms, push, webhook
  priority?: AlertPriority;
}
