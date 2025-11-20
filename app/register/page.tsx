// app/register/page.tsx
"use client";
import RegisterForm from "@/components/auth/RegisterForm";
import Link from "next/link";

export default function RegisterPage() {
  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-slate-900">Create your account</h2>
          <p className="mt-2 text-sm text-slate-600">
            Start monitoring Google Trends and get real-time alerts
          </p>
        </div>
        <div className="card">
          <RegisterForm />
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Already have an account? </span>
            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 transition-colors">
              Sign in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

