// src/app/api/trends/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50");

    // Fetch active keywords
    const keywords = await prisma.keyword.findMany({
      where: { active: true },
      take: 10, // Limit to 10 keywords for chart performance
    });

    if (keywords.length === 0) {
      return NextResponse.json({ series: [] });
    }

    // Fetch trend data for each keyword
    const series = await Promise.all(
      keywords.map(async (kw) => {
        const points = await prisma.trendData.findMany({
          where: { keywordId: kw.id },
          orderBy: { timestamp: "desc" },
          take: limit,
        });

        return {
          keywordId: kw.id,
          keyword: kw.term,
          points: points
            .reverse() // Oldest to newest for chart
            .map((p) => ({
              timestamp: p.timestamp.toISOString(),
              value: p.value,
            })),
        };
      })
    );

    // Filter out keywords with no data
    const seriesWithData = series.filter((s) => s.points.length > 0);

    return NextResponse.json({ series: seriesWithData });
  } catch (err) {
    console.error("Trends API error:", err);
    return NextResponse.json(
      { error: "Failed to fetch trends" },
      { status: 500 }
    );
  }
}
