import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { useMetricsStore } from '@/store/useMetricsStore';
import { AlertTriangle, X } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const AnomalyAlerts = () => {
  const anomalies = useMetricsStore(state => state.anomalies);
  const acknowledgeAnomaly = useMetricsStore(state => state.acknowledgeAnomaly);

  const unacknowledgedAnomalies = anomalies.filter(a => !a.acknowledged);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-destructive" />
          Anomaly Alerts
          {unacknowledgedAnomalies.length > 0 && (
            <Badge variant="destructive">{unacknowledgedAnomalies.length}</Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 max-h-[300px] overflow-auto">
          {unacknowledgedAnomalies.length === 0 ? (
            <p className="text-sm text-muted-foreground">No anomalies detected</p>
          ) : (
            unacknowledgedAnomalies.map((anomaly, idx) => (
              <div
                key={`${anomaly.id}-${anomaly.metric}-${idx}`}
                className="flex items-start justify-between p-3 border rounded-lg bg-destructive/5 border-destructive/20"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="destructive" className="text-xs">
                      {anomaly.metric.toUpperCase()}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(anomaly.timestamp), { addSuffix: true })}
                    </span>
                  </div>
                  <p className="text-sm font-medium">{anomaly.customerId}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Spike detected: {anomaly.value.toFixed(2)} (avg: {anomaly.average.toFixed(2)})
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => acknowledgeAnomaly(anomaly.id)}
                  className="ml-2"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
