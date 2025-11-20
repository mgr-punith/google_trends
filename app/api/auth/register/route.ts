// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, createToken, setAuthCookie } from "@/lib/auth";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registerSchema.parse(body);

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: parsed.email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(parsed.password);
    const user = await prisma.user.create({
      data: {
        email: parsed.email,
        password: hashedPassword,
        name: parsed.name,
      },
    });

    // Create session token
    const token = createToken({
      userId: user.id,
      email: user.email,
    });

    // Set cookie
    const response = NextResponse.json(
      {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
      { status: 201 }
    );

    setAuthCookie(response, token);
    return response;
  } catch (err: any) {
    console.error("Register error:", err);
    if (err?.issues) {
      return NextResponse.json(
        { error: "Validation error", details: err.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Failed to register" },
      { status: 500 }
    );
  }
}

