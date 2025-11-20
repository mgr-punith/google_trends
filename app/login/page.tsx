// app/login/page.tsx
"use client";
import LoginForm from "@/components/auth/LoginForm";
import Link from "next/link";

export default function LoginPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Welcome back</h2>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to your account to continue monitoring trends
          </p>
        </div>
        <div className="card">
          <LoginForm />
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Don't have an account? </span>
            <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Sign up for free
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

