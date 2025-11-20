// src/lib/auth.ts
import { NextRequest, NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const COOKIE_NAME = "session_token";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export interface SessionPayload {
  userId: string;
  email: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function createToken(payload: SessionPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as SessionPayload;
  } catch {
    return null;
  }
}

export function setAuthCookie(response: NextResponse, token: string): void {
  response.cookies.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE,
    path: "/",
  });
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 0,
    path: "/",
  });
}

export function getTokenFromRequest(request: NextRequest): string | null {
  return request.cookies.get(COOKIE_NAME)?.value || null;
}

export async function getSession(request: NextRequest): Promise<SessionPayload | null> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  return verifyToken(token);
}

export async function requireAuth(
  request: NextRequest
): Promise<{ session: SessionPayload; response?: NextResponse } | { response: NextResponse }> {
  const session = await getSession(request);
  if (!session) {
    return {
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }
  return { session };
}

