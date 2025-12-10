import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useMetricsStore } from '@/store/useMetricsStore';
import { format } from 'date-fns';

export const TokenUsageChart = () => {
  const timeSeriesData = useMetricsStore(state => state.timeSeriesData);

  const chartData = timeSeriesData.map(d => ({
    time: format(new Date(d.timestamp), 'HH:mm:ss'),
    tokens: d.tokens,
    cost: d.cost,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Token Usage (Last 5 Minutes)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis 
              dataKey="time" 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis 
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px'
              }}
            />
            <Line 
              type="monotone" 
              dataKey="tokens" 
              stroke="hsl(var(--primary))" 
              strokeWidth={2}
              dot={false}
              animationDuration={300}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
