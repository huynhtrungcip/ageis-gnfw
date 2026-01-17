import { Shell } from '@/components/layout/Shell';
import { QuickStats } from '@/components/dashboard/QuickStats';
import { TrafficGraph } from '@/components/dashboard/TrafficGraph';
import { InterfaceStatus } from '@/components/dashboard/InterfaceStatus';
import { ThreatSummary } from '@/components/dashboard/ThreatSummary';
import { SystemMetrics } from '@/components/dashboard/SystemMetrics';
import { AIRiskScore } from '@/components/dashboard/AIRiskScore';
import { VPNStatus } from '@/components/dashboard/VPNStatus';

const Dashboard = () => {
  return (
    <Shell>
      <div className="space-y-6 animate-slide-in">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Next-Generation Firewall Overview</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs">Export Report</button>
            <button className="btn-primary text-xs">Add Widget</button>
          </div>
        </div>

        {/* Quick Stats */}
        <QuickStats />

        {/* Traffic Graph */}
        <TrafficGraph />

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-6">
          {/* Left Column */}
          <div className="col-span-4 space-y-6">
            <AIRiskScore />
            <SystemMetrics />
          </div>

          {/* Center Column */}
          <div className="col-span-4 space-y-6">
            <ThreatSummary />
            <VPNStatus />
          </div>

          {/* Right Column */}
          <div className="col-span-4">
            <InterfaceStatus />
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default Dashboard;
