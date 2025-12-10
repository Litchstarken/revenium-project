import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatCurrency, formatNumber } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: number;
  format?: 'currency' | 'number';
  trend?: number;
  suffix?: string;
  animated?: boolean;
}

export const MetricCard = ({ 
  title, 
  value, 
  format = 'number', 
  trend,
  suffix = '',
  animated = false 
}: MetricCardProps) => {
  const formattedValue = format === 'currency' 
    ? formatCurrency(value) 
    : formatNumber(value);
  
  const trendPositive = trend !== undefined && trend > 0;
  const trendNegative = trend !== undefined && trend < 0;

  return (
    <Card className={animated ? 'transition-all duration-300 hover:shadow-lg' : ''}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {trend !== undefined && (
          <div className={`flex items-center text-xs ${trendPositive ? 'text-green-600' : trendNegative ? 'text-red-600' : 'text-gray-500'}`}>
            {trendPositive && <TrendingUp className="h-4 w-4 mr-1" />}
            {trendNegative && <TrendingDown className="h-4 w-4 mr-1" />}
            {Math.abs(trend).toFixed(1)}%
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">
          {formattedValue}{suffix}
        </div>
      </CardContent>
    </Card>
  );
};
