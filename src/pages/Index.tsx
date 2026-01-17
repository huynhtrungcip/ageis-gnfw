import { Shell } from '@/components/layout/Shell';
import { SecurityPosture } from '@/components/dashboard/SecurityPosture';
import { ActiveThreats } from '@/components/dashboard/ActiveThreats';
import { NetworkHealth } from '@/components/dashboard/NetworkHealth';
import { SystemStatus } from '@/components/dashboard/SystemStatus';
import { AIInsights } from '@/components/dashboard/AIInsights';

const Dashboard = () => {
  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div>
          <h1 className="text-lg font-semibold">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Security operations overview</p>
        </div>

        {/* Main Grid - 4 blocks */}
        <div className="grid grid-cols-12 gap-4">
          {/* Security Posture - Center focus */}
          <div className="col-span-3">
            <SecurityPosture />
          </div>

          {/* Active Threats - Actionable */}
          <div className="col-span-5">
            <ActiveThreats />
          </div>

          {/* Network Health */}
          <div className="col-span-4">
            <NetworkHealth />
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-12 gap-4">
          {/* System Status */}
          <div className="col-span-4">
            <SystemStatus />
          </div>

          {/* AI Insights - Advisor, not showoff */}
          <div className="col-span-8">
            <AIInsights />
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default Dashboard;
