// src/app/api/keywords/route.ts
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { requireAuth } from "@/lib/auth";

// Zod schemas
const createKeywordSchema = z.object({
  term: z.string().min(1),
  tags: z.array(z.string()).optional(),
  active: z.boolean().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ("response" in authResult) return authResult.response;
    const { session } = authResult;

    const keywords = await prisma.keyword.findMany({
      where: { userId: session.userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(keywords);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ("response" in authResult) return authResult.response;
    const { session } = authResult;

    const body = await req.json();
    const parsed = createKeywordSchema.parse(body);
    const kw = await prisma.keyword.create({
      data: {
        userId: session.userId,
        term: parsed.term,
        tags: parsed.tags ?? [],
        active: parsed.active ?? true,
      },
    });
    return NextResponse.json(kw);
  } catch (err: any) {
    console.error("POST /api/keywords error:", err);
    if (err?.issues)
      return NextResponse.json(
        { error: err.errors ?? err.issues },
        { status: 400 }
      );
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ("response" in authResult) return authResult.response;
    const { session } = authResult;

    const body = await req.json();
    const parsed = createKeywordSchema
      .extend({ id: z.string() })
      .partial()
      .parse(body);
    if (!parsed.id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    // Verify ownership
    const keyword = await prisma.keyword.findUnique({
      where: { id: parsed.id },
    });
    if (!keyword || keyword.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const updated = await prisma.keyword.update({
      where: { id: parsed.id },
      data: {
        term: parsed.term,
        tags: parsed.tags,
        active: parsed.active,
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update keyword" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const authResult = await requireAuth(req);
    if ("response" in authResult) return authResult.response;
    const { session } = authResult;

    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id)
      return NextResponse.json({ error: "id required" }, { status: 400 });

    // Verify ownership
    const keyword = await prisma.keyword.findUnique({
      where: { id },
    });
    if (!keyword || keyword.userId !== session.userId) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.keyword.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}
