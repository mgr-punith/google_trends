// src/app/page.tsx
"use client";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

export default function HomePage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
        <div className="max-w-4xl w-full px-4">
          <div className="text-center mb-12">
            <h1 className="text-4xl sm:text-5xl font-bold text-slate-900 mb-4">
              Monitor Google Trends
              <span className="block text-blue-600">Get Real-Time Alerts</span>
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Track keyword popularity, detect spikes, and receive instant notifications via email, SMS, or push alerts.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            <div className="card text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Real-Time Monitoring</h3>
              <p className="text-sm text-slate-600">Track keyword trends as they happen</p>
            </div>
            
            <div className="card text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Smart Alerts</h3>
              <p className="text-sm text-slate-600">Get notified when trends spike</p>
            </div>
            
            <div className="card text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-2">Multi-Channel</h3>
              <p className="text-sm text-slate-600">Email, SMS, and push notifications</p>
            </div>
          </div>
          
          <div className="text-center">
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register" className="btn-primary px-8 py-3 text-base">
                Get Started Free
              </Link>
              <Link href="/login" className="btn-ghost px-8 py-3 text-base">
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-8rem)] flex items-center justify-center">
      <div className="max-w-md w-full">
        <div className="card text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-white text-2xl font-bold">
              {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
            </span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">
            Welcome back, {user.name || user.email.split("@")[0]}!
          </h2>
          <p className="text-slate-600 mb-6">
            Ready to monitor your keywords and get alerts?
          </p>
          <Link href="/dashboard" className="btn-primary px-8 py-3 inline-block">
            Go to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
