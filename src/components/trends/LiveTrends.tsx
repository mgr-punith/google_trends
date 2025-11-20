// src/components/trends/LiveTrends.tsx
"use client";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface TrendPoint {
  timestamp: string;
  value: number;
}

interface TrendSeries {
  keywordId: string;
  keyword: string;
  points: TrendPoint[];
}

const COLORS = ["#2563eb", "#10b981", "#f97316", "#a855f7", "#ef4444"];

export default function LiveTrends() {
  const [series, setSeries] = useState<TrendSeries[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadTrends = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/trends?limit=50");
      setSeries(res.data.series ?? []);
    } catch (err: any) {
      console.error("Failed to fetch trends", err);
      setError(
        err?.response?.data?.error ||
          "Failed to load trends. Make sure the Python scraper and worker are running."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTrends();
  }, [loadTrends]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      loadTrends();
    }, 60000);

    const handleKeywordUpdate = () => {
      loadTrends();
    };

    window.addEventListener("keywords:updated", handleKeywordUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener("keywords:updated", handleKeywordUpdate);
    };
  }, [loadTrends]);

  const chartData = useMemo(() => {
    const map = new Map<string, any>();

    series.forEach((s) => {
      s.points.forEach((point) => {
        const key = point.timestamp;
        if (!map.has(key)) {
          map.set(key, {
            timestamp: key,
            time: new Date(key).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          });
        }
        map.get(key)[s.keyword] = point.value;
      });
    });

    return Array.from(map.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [series]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <svg
          className="animate-spin h-8 w-8 mb-4 text-blue-600"
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
        <p className="text-sm">Loading trend data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600 text-sm bg-red-50 border border-red-100 rounded-lg px-4">
        {error}
      </div>
    );
  }

  if (!series.length || !chartData.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-slate-500">
        <svg
          className="w-16 h-16 mb-4 text-slate-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-sm font-medium mb-1">No trend data yet</p>
        <p className="text-xs text-center max-w-sm">
          Add keywords on the left, start the Python scraper (<code>npm run python-scraper</code>), and run the worker (<code>npm run worker</code>) to collect trend
          data.
        </p>
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
          <XAxis
            dataKey="time"
            stroke="#94a3b8"
            fontSize={12}
            tick={{ fill: "#64748b" }}
          />
          <YAxis
            stroke="#94a3b8"
            fontSize={12}
            tick={{ fill: "#64748b" }}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #e2e8f0",
              borderRadius: "8px",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
            }}
          />
          <Legend />
          {series.map((s, index) => (
            <Line
              key={s.keywordId}
              type="monotone"
              dataKey={s.keyword}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
