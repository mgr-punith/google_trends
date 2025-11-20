// src/app/(dashboard)/alerts/page.tsx
import React from "react";
import AlertList from "@/components/alerts/AlertList";
import CreateAlertModal from "@/components/alerts/CreateAlertModal";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Alerts",
};

export default async function AlertsPage() {
  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-blue-700 to-sky-500 p-8 text-white shadow-xl">
        <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-[0.35em] text-blue-200">Alerts</p>
            <h1 className="mt-3 text-3xl font-semibold leading-tight">
              Track spikes & get notified instantly
            </h1>
            <p className="mt-4 max-w-2xl text-base text-blue-100">
              Keep an eye on data surges and dips. Alerts are delivered to your inbox so you
              never miss a meaningful change in interest.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <CreateAlertModal />
            <Button
              asChild
              variant="secondary"
              className="bg-white/10 text-white hover:bg-white/20"
            >
              <Link href="/dashboard">Back to dashboard</Link>
            </Button>
          </div>
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -bottom-10 right-6 h-48 w-48 rounded-full bg-white blur-3xl" />
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-lg shadow-blue-50">
        <div className="mb-6">
          <h2 className="text-2xl font-semibold text-slate-900">Email alert center</h2>
          <p className="mt-2 text-sm text-slate-500">
            Review every alert, inspect trend spikes, and prune anything you no longer need.
          </p>
        </div>
        <AlertList showNavigationButtons={false} />
      </section>
    </div>
  );
}
