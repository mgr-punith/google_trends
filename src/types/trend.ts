export interface TrendPoint {
  id: string;
  keywordId: string;
  timestamp: Date;     
  value: number;
  related: string[]; 
  createdAt?: Date;
}

export interface SpikeResult {
  keywordId: string;
  timestamp: Date;
  value: number;
  zScore: number;
  pctChange: number;
  severity: "low" | "medium" | "high" | "critical";
  reason: "zscore" | "pctChange";
}
