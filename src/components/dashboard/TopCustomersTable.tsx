import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { useMetricsStore } from '@/store/useMetricsStore';
import { formatCurrency, formatNumber } from '@/lib/utils';
import { useMemo } from 'react';

export const TopCustomersTable = () => {
  const metricsBuffer = useMetricsStore(state => state.metricsBuffer);

  // Aggregate by customer
  const topCustomers = useMemo(() => {
    const customerMap = new Map<string, { totalCost: number; totalTokens: number; totalCalls: number }>();

    metricsBuffer.forEach(m => {
      const existing = customerMap.get(m.customerId) || { totalCost: 0, totalTokens: 0, totalCalls: 0 };
      customerMap.set(m.customerId, {
        totalCost: existing.totalCost + m.metrics.totalCost,
        totalTokens: existing.totalTokens + m.metrics.totalTokens,
        totalCalls: existing.totalCalls + m.metrics.totalCalls,
      });
    });

    return Array.from(customerMap.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.totalCost - a.totalCost)
      .slice(0, 10);
  }, [metricsBuffer]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Customers by Spend</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topCustomers.length === 0 ? (
            <p className="text-sm text-muted-foreground">No data available</p>
          ) : (
            <div className="overflow-auto max-h-[400px]">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr className="text-left">
                    <th className="pb-2 font-medium">Customer</th>
                    <th className="pb-2 font-medium text-right">Tokens</th>
                    <th className="pb-2 font-medium text-right">Calls</th>
                    <th className="pb-2 font-medium text-right">Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {topCustomers.map((customer, idx) => (
                    <tr key={customer.id} className="border-b last:border-0">
                      <td className="py-2">
                        <div className="flex items-center gap-2">
                          <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {idx + 1}
                          </span>
                          <span className="font-medium">{customer.id}</span>
                        </div>
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {formatNumber(customer.totalTokens)}
                      </td>
                      <td className="py-2 text-right text-muted-foreground">
                        {formatNumber(customer.totalCalls)}
                      </td>
                      <td className="py-2 text-right font-semibold">
                        {formatCurrency(customer.totalCost)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
