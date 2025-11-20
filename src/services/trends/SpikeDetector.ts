// src/services/trends/SpikeDetector.ts
import { TrendPoint, SpikeResult } from "../../types/trend";

/**
 * SpikeDetector - performs rolling window z-score and percent-change based spike detection.
 */

export class SpikeDetector {
  windowSize: number;
  zThreshold: number;

  constructor(windowSize = 14, zThreshold = 2.5) {
    this.windowSize = windowSize;
    this.zThreshold = zThreshold;
  }

  // 🔥 THE IMPORTANT FIX: Implement detectSpike()
  detectSpike(trendData: TrendPoint[]): SpikeResult | null {
    if (!trendData || trendData.length < this.windowSize + 1) {
      return null;
    }

    // Run full detection
    const spikes = this.detect(trendData);

    // Return ONLY the latest spike (if any)
    return spikes.length > 0 ? spikes[spikes.length - 1] : null;
  }

  private mean(values: number[]) {
    const s = values.reduce((a, b) => a + b, 0);
    return s / values.length;
  }

  private std(values: number[]) {
    const m = this.mean(values);
    const variance = values.reduce((a, b) => a + (b - m) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  }

  private severityFromZ(z: number) {
    const az = Math.abs(z);
    if (az >= 4) return "critical";
    if (az >= 3) return "high";
    if (az >= 2.5) return "medium";
    return "low";
  }

  // Main spike detection logic
  public detect(points: TrendPoint[]): SpikeResult[] {
    const results: SpikeResult[] = [];
    if (points.length < 2) return results;

    for (let i = this.windowSize; i < points.length; i++) {
      const windowSlice = points.slice(i - this.windowSize, i);
      const windowValues = windowSlice.map((p) => p.value);

      const mean = this.mean(windowValues);
      const std = this.std(windowValues) || 1e-8;

      const current = points[i].value;
      const prev = points[i - 1].value;

      const z = (current - mean) / std;
      const pctChange = prev === 0 ? 100 : ((current - prev) / Math.abs(prev)) * 100;

      if (Math.abs(z) >= this.zThreshold || Math.abs(pctChange) >= 50) {
        results.push({
          keywordId: points[i].keywordId,
          timestamp: points[i].timestamp,
          value: current,
          zScore: z,
          pctChange,
          severity: this.severityFromZ(z),
          reason: Math.abs(z) >= this.zThreshold ? "zscore" : "pctChange",
        });
      }
    }

    return results;
  }
}
