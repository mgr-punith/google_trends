"use client";

import React, { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { Line, LineChart, ResponsiveContainer } from "recharts";

interface TrendPoint {
  timestamp: string;
  value: number;
}

interface TrendSeries {
  keywordId: string;
  keyword: string;
  points: TrendPoint[];
}

interface TrendSummary {
  keywordId: string;
  keyword: string;
  latest: number;
  changePct: number;
  direction: "up" | "down" | "steady";
  sparkline: TrendPoint[];
}

const directionConfig: Record<
  TrendSummary["direction"],
  { label: string; color: string; bg: string; icon: string }
> = {
  up: {
    label: "spiking",
    color: "text-green-600",
    bg: "bg-green-50 text-green-700 border-green-100",
    icon: "M5 12h14M12 5l7 7-7 7",
  },
  down: {
    label: "cooling",
    color: "text-red-600",
    bg: "bg-red-50 text-red-700 border-red-100",
    icon: "M19 12H5m7-7-7 7 7 7",
  },
  steady: {
    label: "steady",
    color: "text-slate-600",
    bg: "bg-slate-100 text-slate-600 border-slate-200",
    icon: "M4 12h16",
  },
};

export default function TrendHighlights() {
  const [series, setSeries] = useState<TrendSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadTrends() {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("/api/trends?limit=48");
        setSeries(res.data.series ?? []);
      } catch (err: any) {
        console.error(err);
        setError("Unable to load trending keywords.");
      } finally {
        setLoading(false);
      }
    }

    loadTrends();
  }, []);

  const summaries = useMemo<TrendSummary[]>(() => {
    return series
      .map((s) => {
        const points = s.points;
        if (!points.length) {
          return null;
        }
        const latestValue = points[points.length - 1]?.value ?? 0;
        const previousValue = points[points.length - 2]?.value ?? latestValue;
        const change =
          previousValue === 0 && latestValue === 0
            ? 0
            : ((latestValue - previousValue) / Math.max(previousValue, 1)) * 100;

        let direction: TrendSummary["direction"] = "steady";
        if (change > 4) direction = "up";
        else if (change < -4) direction = "down";

        return {
          keywordId: s.keywordId,
          keyword: s.keyword,
          latest: latestValue,
          changePct: change,
          direction,
          sparkline: points.slice(-12),
        };
      })
      .filter(Boolean)
      .sort((a, b) => (b?.changePct || 0) - (a?.changePct || 0))
      .slice(0, 4) as TrendSummary[];
  }, [series]);

  if (loading) {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white/60 px-6 py-8 text-sm text-slate-500">
        <svg
          className="h-5 w-5 animate-spin text-blue-600"
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
        Fetching the latest keywords...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-100 bg-red-50 px-6 py-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (!summaries.length) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white px-6 py-8 text-center text-sm text-slate-500">
        No trending keywords yet. Start tracking by adding keywords.
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {summaries.map((summary, idx) => {
        const dir = directionConfig[summary.direction];
        const change = summary.changePct;
        const formattedChange =
          Math.abs(change) < 0.5 ? "<0.5" : change.toFixed(1).replace("-0.0", "0");

        return (
          <div
            key={summary.keywordId}
            className="rounded-2xl border border-slate-200 bg-white/80 p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium uppercase text-slate-500">
                  Trending #{idx + 1}
                </p>
                <h3 className="text-lg font-semibold text-slate-900">{summary.keyword}</h3>
              </div>
              <div
                className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${dir.bg}`}
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path
                    d={dir.icon}
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {dir.label}
              </div>
            </div>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <p className="text-xs uppercase tracking-wide text-slate-400">latest score</p>
                <p className="text-2xl font-semibold text-slate-900">{summary.latest}</p>
              </div>
              <div className="text-right">
                <p className="text-xs uppercase tracking-wide text-slate-400">movement</p>
                <p className={`text-sm font-semibold ${dir.color}`}>
                  {change > 0 ? "+" : change < 0 ? "-" : ""}
                  {formattedChange}
                  {formattedChange !== "<0.5" ? "%" : ""}
                </p>
              </div>
            </div>

            <div className="mt-4 h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summary.sparkline}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke={summary.direction === "up" ? "#22c55e" : summary.direction === "down" ? "#ef4444" : "#0ea5e9"}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        );
      })}
    </div>
  );
}

