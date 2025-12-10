import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { useMetricsStore } from '@/store/useMetricsStore';
import { Play, Pause, Wifi, RefreshCw } from 'lucide-react';

export const Controls = () => {
  const { pollingConfig, connectionStatus, setPollingConfig, clearMetrics } = useMetricsStore();

  const togglePause = () => {
    setPollingConfig({ isPaused: !pollingConfig.isPaused });
  };

  const toggleStreaming = () => {
    setPollingConfig({ useStreaming: !pollingConfig.useStreaming });
  };

  const setInterval = (interval: number) => {
    setPollingConfig({ interval });
  };

  const getStatusBadge = () => {
    switch (connectionStatus.status) {
      case 'connected':
        return <Badge className="bg-green-600">Connected</Badge>;
      case 'connecting':
        return <Badge variant="secondary">Connecting...</Badge>;
      case 'error':
        return <Badge variant="destructive">Error</Badge>;
      case 'disconnected':
        return <Badge variant="outline">Disconnected</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Controls</span>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Connection Mode */}
        <div>
          <label className="text-sm font-medium mb-2 block">Connection Mode</label>
          <div className="flex gap-2">
            <Button
              variant={pollingConfig.useStreaming ? 'outline' : 'default'}
              size="sm"
              onClick={() => !pollingConfig.useStreaming || toggleStreaming()}
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Polling
            </Button>
            <Button
              variant={pollingConfig.useStreaming ? 'default' : 'outline'}
              size="sm"
              onClick={() => pollingConfig.useStreaming || toggleStreaming()}
              className="flex-1"
            >
              <Wifi className="h-4 w-4 mr-2" />
              SSE
            </Button>
          </div>
        </div>

        {/* Polling Interval (only show when not streaming) */}
        {!pollingConfig.useStreaming && (
          <div>
            <label className="text-sm font-medium mb-2 block">Polling Interval</label>
            <div className="grid grid-cols-4 gap-2">
              {[1000, 2000, 5000, 10000].map(interval => (
                <Button
                  key={interval}
                  variant={pollingConfig.interval === interval ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setInterval(interval)}
                >
                  {interval / 1000}s
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Play/Pause */}
        <div>
          <label className="text-sm font-medium mb-2 block">Data Updates</label>
          <div className="flex gap-2">
            <Button
              variant={pollingConfig.isPaused ? 'outline' : 'default'}
              size="sm"
              onClick={togglePause}
              className="flex-1"
            >
              {pollingConfig.isPaused ? (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Resume
                </>
              ) : (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMetrics}
            >
              Clear Data
            </Button>
          </div>
        </div>

        {/* Connection Status Details */}
        {connectionStatus.errorMessage && (
          <div className="text-xs text-destructive bg-destructive/10 p-2 rounded">
            {connectionStatus.errorMessage}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
