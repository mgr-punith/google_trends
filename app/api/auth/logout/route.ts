// app/api/auth/logout/route.ts
import { NextRequest, NextResponse } from "next/server";
import { clearAuthCookie } from "@/lib/auth";

export async function POST(req: NextRequest) {
  const response = NextResponse.json({ message: "Logged out successfully" });
  clearAuthCookie(response);
  return response;
}

