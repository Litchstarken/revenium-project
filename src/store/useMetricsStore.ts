import { create } from 'zustand';
import { MetricUpdate, PollingConfig } from '../types';
import { isAnomaly } from '../lib/utils';

export interface Anomaly {
  id: string;
  timestamp: string;
  customerId: string;
  metric: 'cost' | 'tokens' | 'latency';
  value: number;
  average: number;
  acknowledged: boolean;
}

export interface ConnectionStatus {
  status: 'connected' | 'connecting' | 'error' | 'disconnected';
  lastUpdate: string | null;
  errorMessage?: string;
}

interface MetricsState {
  // Raw metrics buffer
  metricsBuffer: MetricUpdate[];
  
  // Aggregated data
  totalCost: number;
  totalTokens: number;
  totalCalls: number;
  avgLatency: number;
  
  // Time-series data (for charts)
  timeSeriesData: Array<{
    timestamp: string;
    tokens: number;
    cost: number;
    calls: number;
  }>;
  
  // Anomalies
  anomalies: Anomaly[];
  
  // Connection status
  connectionStatus: ConnectionStatus;
  
  // Polling configuration
  pollingConfig: PollingConfig;
  
  // Actions
  addMetrics: (metrics: MetricUpdate[]) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setPollingConfig: (config: Partial<PollingConfig>) => void;
  acknowledgeAnomaly: (id: string) => void;
  clearMetrics: () => void;
}

const BUFFER_SIZE = 1000; // Keep last 1000 updates
const TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export const useMetricsStore = create<MetricsState>((set, get) => ({
  metricsBuffer: [],
  totalCost: 0,
  totalTokens: 0,
  totalCalls: 0,
  avgLatency: 0,
  timeSeriesData: [],
  anomalies: [],
  connectionStatus: {
    status: 'disconnected',
    lastUpdate: null,
  },
  pollingConfig: {
    interval: 2000,
    isPaused: false,
    useStreaming: false,
  },

  addMetrics: (newMetrics: MetricUpdate[]) => {
    const state = get();
    const now = Date.now();
    
    // Add to buffer with size limit
    const updatedBuffer = [...state.metricsBuffer, ...newMetrics].slice(-BUFFER_SIZE);
    
    // Filter metrics within time window
    const recentMetrics = updatedBuffer.filter(
      m => now - new Date(m.timestamp).getTime() < TIME_WINDOW_MS
    );
    
    // Calculate aggregates
    const totalCost = recentMetrics.reduce((sum, m) => sum + m.metrics.totalCost, 0);
    const totalTokens = recentMetrics.reduce((sum, m) => sum + m.metrics.totalTokens, 0);
    const totalCalls = recentMetrics.reduce((sum, m) => sum + m.metrics.totalCalls, 0);
    const avgLatency = recentMetrics.length > 0
      ? recentMetrics.reduce((sum, m) => sum + m.metrics.avgLatencyMs, 0) / recentMetrics.length
      : 0;
    
    // Generate time-series data (5-second buckets)
    const bucketSize = 5000; // 5 seconds
    const buckets = new Map<number, { tokens: number; cost: number; calls: number }>();
    
    recentMetrics.forEach(m => {
      const bucketKey = Math.floor(new Date(m.timestamp).getTime() / bucketSize) * bucketSize;
      const existing = buckets.get(bucketKey) || { tokens: 0, cost: 0, calls: 0 };
      buckets.set(bucketKey, {
        tokens: existing.tokens + m.metrics.totalTokens,
        cost: existing.cost + m.metrics.totalCost,
        calls: existing.calls + m.metrics.totalCalls,
      });
    });
    
    const timeSeriesData = Array.from(buckets.entries())
      .map(([timestamp, data]) => ({
        timestamp: new Date(timestamp).toISOString(),
        ...data,
      }))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .slice(-60); // Keep last 60 data points (5 minutes at 5-second intervals)
    
    // Detect anomalies
    const avgCost = totalCost / (recentMetrics.length || 1);
    const avgTokens = totalTokens / (recentMetrics.length || 1);
    const avgLatencyValue = avgLatency;
    
    const newAnomalies: Anomaly[] = [];
    
    newMetrics.forEach(m => {
      const anomalyId = `${m.timestamp}-${m.customerId}`;
      
      // Check if already exists
      if (state.anomalies.some(a => a.id === anomalyId)) return;
      
      if (isAnomaly(m.metrics.totalCost, avgCost)) {
        newAnomalies.push({
          id: anomalyId,
          timestamp: m.timestamp,
          customerId: m.customerId,
          metric: 'cost',
          value: m.metrics.totalCost,
          average: avgCost,
          acknowledged: false,
        });
      }
      
      if (isAnomaly(m.metrics.totalTokens, avgTokens)) {
        newAnomalies.push({
          id: `${anomalyId}-tokens`,
          timestamp: m.timestamp,
          customerId: m.customerId,
          metric: 'tokens',
          value: m.metrics.totalTokens,
          average: avgTokens,
          acknowledged: false,
        });
      }
      
      if (isAnomaly(m.metrics.avgLatencyMs, avgLatencyValue)) {
        newAnomalies.push({
          id: `${anomalyId}-latency`,
          timestamp: m.timestamp,
          customerId: m.customerId,
          metric: 'latency',
          value: m.metrics.avgLatencyMs,
          average: avgLatencyValue,
          acknowledged: false,
        });
      }
    });
    
    set({
      metricsBuffer: updatedBuffer,
      totalCost,
      totalTokens,
      totalCalls,
      avgLatency,
      timeSeriesData,
      anomalies: [...state.anomalies, ...newAnomalies].slice(-50), // Keep last 50 anomalies
      connectionStatus: {
        ...state.connectionStatus,
        lastUpdate: new Date().toISOString(),
      },
    });
  },

  setConnectionStatus: (status: ConnectionStatus) => {
    set({ connectionStatus: status });
  },

  setPollingConfig: (config: Partial<PollingConfig>) => {
    set(state => ({
      pollingConfig: { ...state.pollingConfig, ...config },
    }));
  },

  acknowledgeAnomaly: (id: string) => {
    set(state => ({
      anomalies: state.anomalies.map(a =>
        a.id === id ? { ...a, acknowledged: true } : a
      ),
    }));
  },

  clearMetrics: () => {
    set({
      metricsBuffer: [],
      totalCost: 0,
      totalTokens: 0,
      totalCalls: 0,
      avgLatency: 0,
      timeSeriesData: [],
      anomalies: [],
    });
  },
}));
