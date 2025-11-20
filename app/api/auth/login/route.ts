// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { verifyPassword, createToken, setAuthCookie } from "@/lib/auth";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = loginSchema.parse(body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isValid = await verifyPassword(parsed.password, user.password);
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Create session token
    const token = createToken({
      userId: user.id,
      email: user.email,
    });

    // Set cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
    });

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    console.error("Login error:", err);
    if (err?.issues) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to login" },
      { status: 500 }
    );
  }
}

