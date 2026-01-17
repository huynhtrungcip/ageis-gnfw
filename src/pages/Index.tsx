import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { mockInterfaces, mockSystemStatus, mockVPNTunnels } from '@/data/mockData';
import { ChevronRight } from 'lucide-react';

// Mock data
const threats = [
  { id: '1', severity: 'critical', sig: 'SSH Brute Force', src: '45.33.32.156', dst: 'WAN:22', action: 'blocked', time: '2m' },
  { id: '2', severity: 'high', sig: 'C2 Communication', src: '192.168.1.105', dst: '185.220.101.45:443', action: 'blocked', time: '8m' },
  { id: '3', severity: 'high', sig: 'SQL Injection', src: '89.248.167.131', dst: 'DMZ:80', action: 'blocked', time: '15m' },
];

const insights = [
  { type: 'anomaly', priority: 'high', title: 'Beaconing behavior', host: '192.168.1.55', conf: 'Medium' },
  { type: 'rec', priority: 'medium', title: 'Enable GeoIP blocking', host: null, conf: null },
];

const Dashboard = () => {
  const { cpu, memory } = mockSystemStatus;
  const memPct = Math.round((memory.used / memory.total) * 100);
  const criticalCount = 1;
  const highCount = 2;

  return (
    <Shell>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold">Dashboard</h1>
          <span className="text-[10px] text-muted-foreground">Last updated: just now</span>
        </div>

        {/* Top Row - Flat stats */}
        <div className="grid grid-cols-6 gap-px bg-border">
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">Risk</div>
            <div className="text-sm font-semibold text-status-high">HIGH</div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">Critical</div>
            <div className="text-sm font-semibold text-status-critical">{criticalCount}</div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">High</div>
            <div className="text-sm font-semibold text-status-high">{highCount}</div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">CPU</div>
            <div className="text-sm font-semibold">{cpu.usage}%</div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">Memory</div>
            <div className="text-sm font-semibold">{memPct}%</div>
          </div>
          <div className="bg-card px-3 py-2">
            <div className="text-[10px] text-muted-foreground">VPN</div>
            <div className="text-sm font-semibold">{mockVPNTunnels.filter(v => v.status === 'connected').length}/{mockVPNTunnels.length}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-3">
          {/* Threats */}
          <div className="col-span-7">
            <div className="section">
              <div className="section-header">
                <span>Active Threats</span>
                <Link to="/threats" className="text-primary text-[10px] hover:underline">View all →</Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Sev</th>
                    <th>Signature</th>
                    <th>Source</th>
                    <th>Dest</th>
                    <th>Action</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {threats.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={cn("tag", t.severity === 'critical' ? 'tag-critical' : 'tag-high')}>
                          {t.severity === 'critical' ? 'CRIT' : 'HIGH'}
                        </span>
                      </td>
                      <td className="font-medium">{t.sig}</td>
                      <td className="font-mono text-[11px] text-muted-foreground">{t.src}</td>
                      <td className="font-mono text-[11px] text-muted-foreground">{t.dst}</td>
                      <td className="text-status-healthy text-[10px]">BLOCKED</td>
                      <td>
                        <Link to={`/threats/${t.id}`} className="text-primary text-[10px] hover:underline">
                          detail
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-5 space-y-3">
            {/* Interfaces */}
            <div className="section">
              <div className="section-header">
                <span>Interfaces</span>
              </div>
              <div>
                {mockInterfaces.slice(0, 4).map((iface) => (
                  <div key={iface.id} className="list-row flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={cn("status-dot", iface.status === 'up' ? 'status-healthy' : 'status-inactive')} />
                      <span className="text-xs">{iface.name}</span>
                      <span className="font-mono text-[10px] text-muted-foreground">{iface.ipAddress}</span>
                    </div>
                    <span className={cn("text-[10px]", iface.status === 'up' ? 'text-status-healthy' : 'text-muted-foreground')}>
                      {iface.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights - Muted */}
            <div className="section">
              <div className="section-header">
                <span>Insights</span>
              </div>
              <div>
                {insights.map((ins, i) => (
                  <div key={i} className="list-row">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn(
                        "text-[9px] uppercase",
                        ins.priority === 'high' ? 'text-status-high' : 'text-muted-foreground'
                      )}>
                        {ins.type === 'anomaly' ? 'anomaly' : 'rec'}
                      </span>
                      {ins.host && <span className="font-mono text-[10px] text-muted-foreground">{ins.host}</span>}
                    </div>
                    <div className="text-xs">{ins.title}</div>
                    {ins.conf && (
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        Confidence: {ins.conf}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default Dashboard;
