export interface Metric {
  totalCalls: number;
  totalTokens: number;
  totalCost: number;
  avgLatencyMs: number;
}

export interface MetricUpdate {
  timestamp: string;
  tenantId: string;
  customerId: string;
  metrics: Metric;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  totalSpend: number;
  totalTokens: number;
  lastActive: string;
}

export interface PollingConfig {
  interval: number; // milliseconds
  isPaused: boolean;
  useStreaming: boolean;
}

export interface MetricsResponse {
  metrics: MetricUpdate[];
  nextPollAfter: number;
}

export interface HistoryResponse {
  data: MetricUpdate[];
}
