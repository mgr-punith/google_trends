// src/app/api/alerts/create/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createAlertSchema = z.object({
  keyword: z.string().min(1),
  frequency: z.enum(["realtime", "hourly", "daily"]),
  thresholdPct: z.number().nullable(),
  thresholdAbs: z.number().nullable(),
  channels: z.array(z.string()),
  priority: z.enum(["low", "medium", "high", "critical"]),
});

async function getUser(req: NextRequest) {
  const res = await fetch(`${req.nextUrl.origin}/api/auth/me`, {
    headers: { cookie: req.headers.get("cookie") || "" },
  });
  return res.ok ? (await res.json()).user : null;
}

export async function POST(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = createAlertSchema.parse(await req.json());

    // Create keyword and alert
    const keyword = await prisma.keyword.create({
      data: { userId: user.id, term: parsed.keyword, tags: [], active: true },
    });

    const alert = await prisma.alert.create({
      data: {
        userId: user.id,
        keywordId: keyword.id,
        frequency: parsed.frequency,
        thresholdPct: parsed.thresholdPct,
        thresholdAbs: parsed.thresholdAbs,
        channels: parsed.channels,
        priority: parsed.priority,
      },
    });

    // Schedule notification
    setTimeout(() => {
      fetch(`${req.nextUrl.origin}/api/notifications/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: user.id,
          userEmail: user.email,
          userName: user.name,
          alertId: alert.id,
          keywordTerm: parsed.keyword,
          channels: parsed.channels,
          priority: parsed.priority,
        }),
      }).catch(console.error);
    }, 10000);

    return NextResponse.json({
      success: true,
      keyword: { id: keyword.id, term: keyword.term },
      alert: { id: alert.id, frequency: alert.frequency, priority: alert.priority },
      message: "Alert created! Notification will be sent in 10 seconds.",
    });
  } catch (err: any) {
    console.error("Create alert error:", err);
    return NextResponse.json(
      { error: err?.issues?.[0]?.message || err.message || "Failed to create alert" },
      { status: err?.issues ? 400 : 500 }
    );
  }
}
