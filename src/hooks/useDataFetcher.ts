import { useEffect, useRef, useCallback } from 'react';
import { useMetricsStore } from '../store/useMetricsStore';
import type { MetricUpdate, MetricsResponse } from '../types';

const API_BASE = '/api';
const MAX_RETRIES = 5;
const INITIAL_RETRY_DELAY = 1000;

export const useDataFetcher = () => {
  const {
    pollingConfig,
    addMetrics,
    setConnectionStatus,
  } = useMetricsStore();

  const pollingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastPollTimestampRef = useRef<string | null>(null);

  // Calculate exponential backoff delay
  const getRetryDelay = useCallback(() => {
    return Math.min(
      INITIAL_RETRY_DELAY * Math.pow(2, retryCountRef.current),
      30000 // Max 30 seconds
    );
  }, []);

  // Polling implementation
  const pollMetrics = useCallback(async () => {
    try {
      setConnectionStatus({
        status: 'connecting',
        lastUpdate: null,
      });

      const url = lastPollTimestampRef.current
        ? `${API_BASE}/metrics?since=${lastPollTimestampRef.current}`
        : `${API_BASE}/metrics`;

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data: MetricsResponse = await response.json();

      if (data.metrics.length > 0) {
        addMetrics(data.metrics);
        // Update last poll timestamp to the latest metric timestamp
        lastPollTimestampRef.current = data.metrics[data.metrics.length - 1].timestamp;
      }

      setConnectionStatus({
        status: 'connected',
        lastUpdate: new Date().toISOString(),
      });

      // Reset retry count on success
      retryCountRef.current = 0;
    } catch (error) {
      console.error('Polling error:', error);
      retryCountRef.current++;

      setConnectionStatus({
        status: 'error',
        lastUpdate: null,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      });

      // Retry with exponential backoff
      if (retryCountRef.current < MAX_RETRIES) {
        const delay = getRetryDelay();
        console.log(`Retrying in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (!pollingConfig.isPaused && !pollingConfig.useStreaming) {
            pollMetrics();
          }
        }, delay);
      }
    }
  }, [addMetrics, setConnectionStatus, getRetryDelay, pollingConfig.isPaused, pollingConfig.useStreaming]);

  // SSE implementation
  const connectSSE = useCallback(() => {
    // Close existing connection
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }

    setConnectionStatus({
      status: 'connecting',
      lastUpdate: null,
    });

    const eventSource = new EventSource(`${API_BASE}/stream`);
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      console.log('SSE connected');
      setConnectionStatus({
        status: 'connected',
        lastUpdate: new Date().toISOString(),
      });
      retryCountRef.current = 0;
    };

    eventSource.onmessage = (event) => {
      try {
        const metric: MetricUpdate = JSON.parse(event.data);
        addMetrics([metric]);
      } catch (error) {
        console.error('SSE parse error:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();

      retryCountRef.current++;
      setConnectionStatus({
        status: 'error',
        lastUpdate: null,
        errorMessage: 'SSE connection failed',
      });

      // Retry with exponential backoff
      if (retryCountRef.current < MAX_RETRIES && pollingConfig.useStreaming) {
        const delay = getRetryDelay();
        console.log(`Reconnecting SSE in ${delay}ms (attempt ${retryCountRef.current}/${MAX_RETRIES})`);
        
        retryTimeoutRef.current = setTimeout(() => {
          if (pollingConfig.useStreaming && !pollingConfig.isPaused) {
            connectSSE();
          }
        }, delay);
      } else if (retryCountRef.current >= MAX_RETRIES) {
        // Fallback to polling after max retries
        console.log('Max SSE retries reached, falling back to polling');
        useMetricsStore.getState().setPollingConfig({ useStreaming: false });
      }
    };
  }, [addMetrics, setConnectionStatus, getRetryDelay, pollingConfig.useStreaming, pollingConfig.isPaused]);

  // Start/stop data fetching based on config
  useEffect(() => {
    // Clear any existing connections
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
      retryTimeoutRef.current = null;
    }

    // Don't start if paused
    if (pollingConfig.isPaused) {
      setConnectionStatus({
        status: 'disconnected',
        lastUpdate: null,
      });
      return;
    }

    // Start appropriate connection type
    if (pollingConfig.useStreaming) {
      connectSSE();
    } else {
      // Start polling
      pollMetrics(); // Initial poll
      pollingIntervalRef.current = setInterval(pollMetrics, pollingConfig.interval);
    }

    // Cleanup on unmount or config change
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [pollingConfig.interval, pollingConfig.isPaused, pollingConfig.useStreaming, pollMetrics, connectSSE, setConnectionStatus]);

  // Handle browser visibility change (pause when hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Pause updates when tab is hidden
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else {
        // Resume updates when tab is visible
        if (!pollingConfig.isPaused && !pollingConfig.useStreaming) {
          pollMetrics();
          pollingIntervalRef.current = setInterval(pollMetrics, pollingConfig.interval);
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [pollingConfig.interval, pollingConfig.isPaused, pollingConfig.useStreaming, pollMetrics]);
};
