// src/components/alerts/CreateAlertModal.tsx
"use client";
import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { z } from "zod";
import { toast } from "sonner";

const formSchema = z.object({
  keyword: z.string().min(1, "Keyword is required"),
  frequency: z.enum(["realtime", "hourly", "daily"]).default("realtime"),
  thresholdPct: z.string().optional(),
  thresholdAbs: z.string().optional(),
  priority: z.enum(["low", "medium", "high", "critical"]).default("medium"),
});

export default function CreateAlertModal() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    keyword: "",
    frequency: "realtime",
    thresholdPct: "",
    thresholdAbs: "",
    priority: "medium",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function onChange<K extends keyof typeof form>(key: K, value: any) {
    setForm((s) => ({ ...s, [key]: value }));
  }

  async function onSubmit(e?: React.FormEvent) {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);

    const parsed = formSchema.safeParse({
      ...form,
      thresholdPct: form.thresholdPct || undefined,
      thresholdAbs: form.thresholdAbs || undefined,
    });

    if (!parsed.success) {
      setError(parsed.error.errors[0].message);
      setLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/alerts/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keyword: form.keyword,
          frequency: form.frequency,
          thresholdPct: form.thresholdPct ? parseFloat(form.thresholdPct) : null,
          thresholdAbs: form.thresholdAbs ? parseFloat(form.thresholdAbs) : null,
          channels: ["email"],
          priority: form.priority,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create alert");
      }

      const data = await response.json();

      toast.success(`✅ Alert created for "${form.keyword}"! Email notification will be sent in 10 seconds...`);

      setOpen(false);
      setForm({
        keyword: "",
        frequency: "realtime",
        thresholdPct: "",
        thresholdAbs: "",
        priority: "medium",
      });

      // Reload page after 10 seconds to show the alert
      setTimeout(() => {
        window.location.reload();
      }, 10000);

    } catch (err: any) {
      setError(err?.message || "Failed to create alert");
      toast.error("❌ Failed to create alert");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create Alert</Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Create Alert</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} className="space-y-4 mt-4">
          <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-700">
            Email delivery is enabled by default. SMS, push, and webhook notifications have been
            disabled to keep alerts focused on your inbox.
          </div>

          <div>
            <Label>Keyword *</Label>
            <Input
              placeholder="e.g., AI, ChatGPT, Next.js"
              value={form.keyword}
              onChange={(e) => onChange("keyword", e.target.value)}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Type any keyword you want to monitor
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Frequency</Label>
              <Select
                value={form.frequency}
                onValueChange={(val) => onChange("frequency", val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="realtime">Realtime</SelectItem>
                  <SelectItem value="hourly">Hourly</SelectItem>
                  <SelectItem value="daily">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(val) => onChange("priority", val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Threshold (%)</Label>
              <Input
                placeholder="e.g., 20"
                value={form.thresholdPct}
                onChange={(e) => onChange("thresholdPct", e.target.value)}
                type="number"
                step="0.1"
              />
            </div>
            <div>
              <Label>Threshold (absolute)</Label>
              <Input
                placeholder="e.g., 50"
                value={form.thresholdAbs}
                onChange={(e) => onChange("thresholdAbs", e.target.value)}
                type="number"
                step="0.1"
              />
            </div>
          </div>

          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
            Notifications will be sent to your account email.
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Alert"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
