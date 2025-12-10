import { DashboardLayout } from './components/dashboard/DashboardLayout';
import { MetricCard } from './components/dashboard/MetricCard';
import { TokenUsageChart } from './components/dashboard/TokenUsageChart';
import { TopCustomersTable } from './components/dashboard/TopCustomersTable';
import { AnomalyAlerts } from './components/dashboard/AnomalyAlerts';
import { Controls } from './components/dashboard/Controls';
import { useDataFetcher } from './hooks/useDataFetcher';
import { useMetricsStore } from './store/useMetricsStore';

function App() {
  // Initialize data fetching
  useDataFetcher();

  // Get metrics from store
  const { totalCost, totalTokens, totalCalls, avgLatency } = useMetricsStore();

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Metrics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total Cost"
            value={totalCost}
            format="currency"
            animated
          />
          <MetricCard
            title="Total Tokens"
            value={totalTokens}
            format="number"
            animated
          />
          <MetricCard
            title="Total Calls"
            value={totalCalls}
            format="number"
            animated
          />
          <MetricCard
            title="Avg Latency"
            value={avgLatency}
            format="number"
            suffix="ms"
            animated
          />
        </div>

        {/* Charts and Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TokenUsageChart />
          </div>
          <div>
            <Controls />
          </div>
        </div>

        {/* Anomalies and Top Customers */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AnomalyAlerts />
          <TopCustomersTable />
        </div>
      </div>
    </DashboardLayout>
  );
}

export default App;
