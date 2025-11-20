// src/app/api/alerts/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

const createSchema = z.object({
  keywordId: z.string().min(1),
  frequency: z.enum(["realtime", "hourly", "daily"]).default("realtime"),
  thresholdPct: z.number().nullable().optional(),
  thresholdAbs: z.number().nullable().optional(),
  channels: z.array(z.string()).default([]),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

export async function GET(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;
    const { session } = auth;

    // fetch alerts with last ~24 trend points for each
    const alerts = await prisma.alert.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
      include: {
        keyword: true,
      },
    });

    // for each alert, fetch latest trend points (last 48)
    const enriched = await Promise.all(
      alerts.map(async (a) => {
        const points = await prisma.trendData.findMany({
          where: { keywordId: a.keywordId },
          orderBy: { timestamp: "desc" },
          take: 48,
          select: { timestamp: true, value: true },
        });
        return {
          ...a,
          trendPoints: points.reverse(), // oldest -> newest
        };
      })
    );

    return NextResponse.json({ alerts: enriched });
  } catch (err: any) {
    console.error("GET /api/alerts error:", err);
    return NextResponse.json(
      { error: "Failed to load alerts" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;
    const { session } = auth;

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }
    const payload = parsed.data;

    // verify keyword belongs to user
    const kw = await prisma.keyword.findUnique({
      where: { id: payload.keywordId },
    });
    if (!kw || kw.userId !== session.userId) {
      return NextResponse.json({ error: "Keyword not found" }, { status: 404 });
    }

    const created = await prisma.alert.create({
      data: {
        userId: session.userId,
        keywordId: payload.keywordId,
        frequency: payload.frequency,
        thresholdPct: payload.thresholdPct ?? null,
        thresholdAbs: payload.thresholdAbs ?? null,
        channels: payload.channels,
        priority: payload.priority,
      },
    });

    // optionally emit socket event that alerts list changed (server-side socket)
    try {
      const io = (global as any).__io;
      if (io) io.to(session.userId).emit("alert:new", created);
    } catch (e) {
      // ignore
    }

    return NextResponse.json({ ok: true, alert: created });
  } catch (err: any) {
    console.error("POST /api/alerts error:", err);
    return NextResponse.json(
      { error: "Failed to create alert" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const auth = await requireAuth(req);
    if ("response" in auth) return auth.response;
    const { session } = auth;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    // verify ownership
    const alert = await prisma.alert.findUnique({ where: { id } });
    if (!alert || alert.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.notification.deleteMany({ where: { alertId: id } });
    await prisma.alert.delete({ where: { id } });

    // emit socket that alert was deleted
    try {
      const io = (global as any).__io;
      if (io) io.to(session.userId).emit("alert:deleted", { id });
    } catch (e) {}

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("DELETE /api/alerts error:", err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
