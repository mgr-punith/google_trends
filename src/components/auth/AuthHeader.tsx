// src/components/auth/AuthHeader.tsx
"use client";
import React from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";

export function AuthHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  if (!user) {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.push("/login")}
          className="px-4 py-2 text-slate-700 hover:text-blue-600 font-medium transition-colors"
        >
          Login
        </button>
        <button
          onClick={() => router.push("/register")}
          className="btn-primary"
        >
          Sign Up
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
          <span className="text-white text-xs font-semibold">
            {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block">
          <div className="text-sm font-medium text-slate-900">{user.name || user.email}</div>
          <div className="text-xs text-slate-500">{user.name ? user.email : ""}</div>
        </div>
      </div>
      <button
        onClick={handleLogout}
        className="btn-ghost text-sm"
      >
        Logout
      </button>
    </div>
  );
}


export { useAuth };
