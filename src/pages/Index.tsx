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
  const activeVPN = mockVPNTunnels.filter(v => v.status === 'connected').length;

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold">Dashboard</h1>
          <span className="text-xs text-muted-foreground">Last updated: just now</span>
        </div>

        {/* Hero Stats Row */}
        <div className="grid grid-cols-6 gap-3">
          <div className="stat-card border-l-2 border-l-status-high">
            <div className="stat-value text-status-high">HIGH</div>
            <div className="stat-label">Risk Level</div>
          </div>
          <div className="stat-card">
            <div className="flex items-baseline gap-2">
              <span className="stat-value text-status-critical">{criticalCount}</span>
              <span className="text-xs text-muted-foreground">critical</span>
            </div>
            <div className="stat-label">Active Incidents</div>
          </div>
          <div className="stat-card">
            <div className="flex items-baseline gap-2">
              <span className="stat-value text-status-high">{highCount}</span>
              <span className="text-xs text-muted-foreground">high</span>
            </div>
            <div className="stat-label">Threats</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2">
              <span className="stat-value">{cpu.usage}%</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${cpu.usage}%` }}
                />
              </div>
            </div>
            <div className="stat-label">CPU Usage</div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-2">
              <span className="stat-value">{memPct}%</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary rounded-full" 
                  style={{ width: `${memPct}%` }}
                />
              </div>
            </div>
            <div className="stat-label">Memory</div>
          </div>
          <div className="stat-card">
            <div className="flex items-baseline gap-2">
              <span className="stat-value text-status-healthy">{activeVPN}</span>
              <span className="text-xs text-muted-foreground">/ {mockVPNTunnels.length}</span>
            </div>
            <div className="stat-label">VPN Tunnels</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-12 gap-4">
          {/* Active Threats */}
          <div className="col-span-8">
            <div className="section">
              <div className="panel-header">
                <h2 className="panel-title">Active Threats</h2>
                <Link to="/threats" className="btn btn-ghost text-primary">
                  View all <ChevronRight size={14} className="inline" />
                </Link>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Severity</th>
                    <th>Signature</th>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Action</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {threats.map((t) => (
                    <tr key={t.id}>
                      <td>
                        <span className={cn("tag", t.severity === 'critical' ? 'tag-critical' : 'tag-high')}>
                          {t.severity === 'critical' ? 'CRITICAL' : 'HIGH'}
                        </span>
                      </td>
                      <td className="font-medium">{t.sig}</td>
                      <td className="mono text-muted-foreground">{t.src}</td>
                      <td className="mono text-muted-foreground">{t.dst}</td>
                      <td>
                        <span className="tag tag-healthy">BLOCKED</span>
                      </td>
                      <td>
                        <Link to={`/threats/${t.id}`} className="btn btn-ghost text-primary text-xs">
                          Details →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Right Column */}
          <div className="col-span-4 space-y-4">
            {/* Network Status */}
            <div className="section">
              <div className="panel-header">
                <h2 className="panel-title">Network Status</h2>
              </div>
              <div className="divide-y divide-border/50">
                {mockInterfaces.slice(0, 4).map((iface) => (
                  <div key={iface.id} className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className={cn("status-dot-lg", iface.status === 'up' ? 'status-healthy' : 'status-inactive')} />
                      <div>
                        <div className="text-sm font-medium">{iface.name}</div>
                        <div className="mono text-xs text-muted-foreground">{iface.ipAddress}</div>
                      </div>
                    </div>
                    <span className={cn(
                      "tag",
                      iface.status === 'up' ? 'tag-healthy' : 'bg-muted text-muted-foreground'
                    )}>
                      {iface.status.toUpperCase()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Insights */}
            <div className="section">
              <div className="panel-header">
                <h2 className="panel-title">Insights</h2>
                <Link to="/insights/behavioral" className="text-xs text-muted-foreground hover:text-primary">
                  View all →
                </Link>
              </div>
              <div className="divide-y divide-border/50">
                {insights.map((ins, i) => (
                  <div key={i} className="px-4 py-3">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={cn(
                        "text-[10px] font-semibold uppercase",
                        ins.priority === 'high' ? 'text-status-high' : 'text-muted-foreground'
                      )}>
                        {ins.type === 'anomaly' ? 'Anomaly' : 'Recommendation'}
                      </span>
                      {ins.host && (
                        <span className="mono text-xs text-muted-foreground">• {ins.host}</span>
                      )}
                    </div>
                    <div className="text-sm font-medium">{ins.title}</div>
                    {ins.conf && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Confidence: <span className="font-medium">{ins.conf}</span>
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
