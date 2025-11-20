// src/hooks/useAlerts.ts
"use client";
import { useEffect, useState, useCallback } from "react";
import useSocket from "./useSocket";

type Keyword = { id: string; term: string };
type TrendPoint = { timestamp: string; value: number };

export default function useAlerts() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(true);
  const socket = useSocket();

  const fetchAlerts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/alerts");
      if (!res.ok) throw new Error("Failed to load alerts");
      const data = await res.json();
      setAlerts(data.alerts || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchKeywords = useCallback(async () => {
    try {
      const res = await fetch("/api/keywords");
      if (!res.ok) throw new Error("Failed to load keywords");
      const data = await res.json();
      setKeywords(data.keywords || []);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    fetchKeywords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // socket realtime updates
  useEffect(() => {
    if (!socket) return;
    const onNew = (payload: any) => {
      // when new alert triggered or created server-side, refresh or merge
      fetchAlerts();
    };
    socket.on("alert:new", onNew);
    socket.on("alert:deleted", onNew);
    return () => {
      socket.off("alert:new", onNew);
      socket.off("alert:deleted", onNew);
    };
  }, [socket, fetchAlerts]);

  async function createAlert(payload: any) {
    const res = await fetch("/api/alerts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || "Failed to create alert");
    }
    await fetchAlerts();
  }

  async function deleteAlert(id: string) {
    const res = await fetch(`/api/alerts?id=${encodeURIComponent(id)}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body?.error || "Failed to delete alert");
    }
    await fetchAlerts();
  }

  return {
    alerts,
    keywords,
    loading,
    createAlert,
    deleteAlert,
    reloadAlerts: fetchAlerts,
    reloadKeywords: fetchKeywords,
  };
}
