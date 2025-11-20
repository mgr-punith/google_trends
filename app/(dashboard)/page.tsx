
"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import LiveTrends from "@/components/trends/LiveTrends";
import KeywordManager from "@/components/keywords/KeywordManager";
import TrendHighlights from "@/components/trends/TrendHighlights";
import { Button } from "@/components/ui/button";
import useAlerts from "@/hooks/useAlerts";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const { alerts, loading: alertsLoading } = useAlerts();
  const hasAlerts = alerts.length > 0;

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <div className="text-center text-slate-500">Loading your dashboard...</div>
      </div>
    );
  }

  if (!user) {
    router.push("/login");
    return null;
  }

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-blue-900 to-blue-700 px-8 py-10 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-blue-200">
              Live dashboard
            </p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Trending keywords, visualized beautifully
            </h1>
            <p className="mt-3 text-base text-blue-100">
              Monitor how interest shifts in real time and jump into alerts to catch spikes in
              traffic before anyone else.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button asChild size="lg" className="bg-white text-slate-900 hover:bg-blue-50">
              <Link href="/alerts">View alerts & spikes</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-white/50 bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="#keywords">Manage keywords</Link>
            </Button>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -top-16 right-10 h-48 w-48 rounded-full bg-blue-500 blur-3xl" />
          <div className="absolute bottom-0 left-0 h-32 w-32 rounded-full bg-sky-400 blur-3xl" />
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  Trend monitor
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Visual insight of your hottest topics
                </h2>
              </div>
              <div className="rounded-full bg-blue-50 px-4 py-1 text-sm font-semibold text-blue-700">
                Live
              </div>
            </div>
            <div className="mt-6">
              <LiveTrends />
            </div>
          </section>

          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  Top momentum
                </p>
                <h2 className="text-xl font-semibold text-slate-900">Trending keywords</h2>
              </div>
            </div>
            <div className="mt-6">
              <TrendHighlights />
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                  Alerts
                </p>
                <h2 className="text-xl font-semibold text-slate-900">
                  Track spikes & dips via email
                </h2>
                <p className="text-sm text-slate-500">
                  Create alerts to be notified whenever a keyword crosses your threshold.
                </p>
              </div>
              <Button asChild variant="ghost" className="text-blue-600 hover:text-blue-700">
                <Link href="/alerts">Open</Link>
              </Button>
            </div>

            <div className="mt-6">
              {alertsLoading ? (
                <div className="flex items-center justify-center rounded-xl border border-slate-100 bg-slate-50 py-10 text-sm text-slate-500">
                  <svg
                    className="mr-2 h-4 w-4 animate-spin text-blue-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Checking your alerts...
                </div>
              ) : hasAlerts ? (
                <div className="space-y-4">
                  {alerts.slice(0, 3).map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50/70 px-4 py-3"
                    >
                      <div>
                        <p className="font-semibold text-slate-900">{alert.keyword.term}</p>
                        <p className="text-xs uppercase tracking-wide text-slate-500">
                          {alert.frequency} • {alert.priority}
                        </p>
                      </div>
                      <div className="text-right text-xs text-slate-400">
                        Updated {new Date(alert.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}

                  <Button className="w-full" onClick={() => router.push("/alerts")}>
                    Review all alerts
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-10 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white shadow">
                    <svg className="h-6 w-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v14m7-7H5" />
                    </svg>
                  </div>
                  <p className="text-base font-semibold text-slate-800">You have no alerts yet</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Use the button below to create your first email alert and start watching spikes.
                  </p>
                  <Button className="mt-5" onClick={() => router.push("/alerts")}>
                    Create alert
                  </Button>
                </div>
              )}
            </div>
          </section>

          <section
            id="keywords"
            className="rounded-2xl border border-slate-200 bg-white/90 p-6 shadow-sm"
          >
            <div className="mb-4">
              <p className="text-sm font-medium uppercase tracking-wide text-slate-500">
                Keywords
              </p>
              <h2 className="text-xl font-semibold text-slate-900">
                Control what you track
              </h2>
              <p className="text-sm text-slate-500">
                Add or remove keywords to update the visualized trends instantly.
              </p>
            </div>
            <KeywordManager />
          </section>
        </div>
      </section>
    </div>
  );
}
