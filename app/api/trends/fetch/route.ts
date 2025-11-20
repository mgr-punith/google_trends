// /app/api/trends/fetch/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { SpikeDetector } from "@/services/trends/SpikeDetector";
import { getIo } from "@/lib/socket-server";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

/**
 * Manual trigger to fetch trends or process existing TrendData for spikes.
 * For this template, it expects body { keywordId?: string } to analyze stored TrendData.
 */

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ("response" in authResult) return authResult.response;
    const { session } = authResult;

    const body = await req.json();
    const parsed = z.object({ keywordId: z.string().optional() }).parse(body);

    // fetch recent trend data for keyword(s) - only user's keywords
    const keywords = parsed.keywordId
      ? await prisma.keyword.findMany({
          where: { id: parsed.keywordId, userId: session.userId },
        })
      : await prisma.keyword.findMany({
          where: { active: true, userId: session.userId },
        });

    const detector = new SpikeDetector(14, 2.5);
    const spikes: any[] = [];

    for (const kw of keywords) {
      const points = await prisma.trendData.findMany({
        where: { keywordId: kw.id },
        orderBy: { timestamp: "asc" },
        take: 200,
      });

      const tp = points.map(
        (p: {
          timestamp: { toISOString: () => any };
          value: any;
          related: any;
        }) => ({
          timestamp: p.timestamp.toISOString(),
          value: p.value,
          related: p.related,
        })
      );
      const found = detector.detect(tp);
      for (const f of found) {
        f.keywordId = kw.id;
        // create an alert in DB as a Notification to user (or call NotificationService in production)
        const note = await prisma.notification.create({
          data: {
            userId: kw.userId,
            alertId: null,
            type: "system",
            message: `Spike detected for ${kw.term} severity=${f.severity} z=${f.zScore.toFixed(2)} pct=${f.pctChange?.toFixed(2)}`,
          },
        });
        // emit real-time event
        try {
          getIo()
            .to(kw.userId)
            .emit("trend:spike", {
              ...f,
              keyword: kw.term,
              notificationId: note.id,
            });
        } catch (err) {}
        spikes.push({ ...f, keyword: kw.term });
      }
    }
    return NextResponse.json({ spikes });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch/analyze trends" },
      { status: 500 }
    );
  }
}
