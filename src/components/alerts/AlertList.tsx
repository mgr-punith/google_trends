// components/alerts/AlertList.tsx
"use client";

import React from "react";
import { useRouter } from "next/navigation";
import useAlerts from "@/hooks/useAlerts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AlertListProps {
  showNavigationButtons?: boolean;
}

export default function AlertList({ showNavigationButtons = true }: AlertListProps = {}) {
  const { alerts, loading, reloadAlerts, deleteAlert } = useAlerts();
  const router = useRouter();

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 py-12 text-sm text-slate-500">
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
        Loading alerts...
      </div>
    );
  }

  if (!alerts.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-6 py-12 text-center">
        <p className="text-base font-semibold text-slate-700">You have no alerts yet</p>
        <p className="mt-2 text-sm text-slate-500">
          Use the button below to create your first email alert and start watching spikes.
        </p>
        {showNavigationButtons && (
          <Button className="mt-4" onClick={() => router.push("/alerts")}>
            Go to Alerts
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {showNavigationButtons && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-slate-600">
            {alerts.length} {alerts.length === 1 ? "alert" : "alerts"} active
          </p>
          <Button size="sm" onClick={() => router.push("/alerts")}>
            View All Alerts
          </Button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {alerts.map((a: any) => {
          const chartData = (a.trendPoints || []).map((p: any) => ({
            time: new Date(p.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            value: p.value,
          }));

          return (
            <Card
              key={a.id}
              className="overflow-hidden border-slate-100 bg-white/90 shadow-lg shadow-blue-50 transition hover:-translate-y-1 hover:shadow-xl"
            >
              <CardHeader className="flex flex-col gap-4 p-6 pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <CardTitle className="text-xl text-slate-900">{a.keyword.term}</CardTitle>
                  <div className="mt-1 text-sm text-slate-500">
                    {a.frequency} • {a.priority}
                  </div>
                  <div className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                    Created {new Date(a.createdAt).toLocaleString()}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-3">
                  <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                    {a.channels.join(", ")}
                  </Badge>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => {
                      if (confirm("Delete alert?")) {
                        deleteAlert(a.id).then(() => reloadAlerts());
                      }
                    }}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 pt-0">
                {chartData.length ? (
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData}>
                        <XAxis dataKey="time" stroke="#cbd5f5" fontSize={12} />
                        <YAxis
                          domain={["auto", "auto"]}
                          stroke="#cbd5f5"
                          fontSize={12}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                          contentStyle={{
                            borderRadius: "12px",
                            border: "1px solid #e2e8f0",
                            boxShadow: "0 10px 15px -3px rgba(15,23,42,0.15)",
                          }}
                        />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <div className="rounded-xl bg-slate-50 py-10 text-center text-sm text-slate-500">
                    No trend data recorded for this alert yet.
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
