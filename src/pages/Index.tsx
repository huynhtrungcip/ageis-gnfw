import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { mockInterfaces, mockSystemStatus, mockVPNTunnels } from '@/data/mockData';
import { ChevronRight, Cpu, HardDrive, Thermometer, Clock, Shield, AlertTriangle, Network, Globe, Activity } from 'lucide-react';

// Mock data
const threats = [
  { id: '1', severity: 'critical', sig: 'SSH Brute Force', src: '45.33.32.156', dst: 'WAN:22', action: 'blocked', time: '2m' },
  { id: '2', severity: 'high', sig: 'C2 Communication', src: '192.168.1.105', dst: '185.220.101.45:443', action: 'blocked', time: '8m' },
  { id: '3', severity: 'high', sig: 'SQL Injection', src: '89.248.167.131', dst: 'DMZ:80', action: 'blocked', time: '15m' },
];

const licenses = [
  { name: 'FortiCare', status: 'active', icon: '🛡️' },
  { name: 'IPS', status: 'active', icon: '🔒' },
  { name: 'AntiVirus', status: 'active', icon: '🦠' },
  { name: 'Web Filter', status: 'active', icon: '🌐' },
];

const Dashboard = () => {
  const { cpu, memory, uptime, hostname } = mockSystemStatus;
  const memPct = Math.round((memory.used / memory.total) * 100);
  const activeVPN = mockVPNTunnels.filter(v => v.status === 'connected').length;

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* System Info Cards Row */}
        <div className="grid grid-cols-12 gap-4">
          {/* System Information */}
          <div className="col-span-4 section">
            <div className="section-header">
              <span className="flex items-center gap-2">
                <Shield size={14} />
                System Information
              </span>
            </div>
            <div className="section-body">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Hostname</span>
                  <span className="font-semibold text-primary">{hostname}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Serial Number</span>
                  <span className="font-mono text-xs">FG60E4Q17001395</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Firmware</span>
                  <span>v7.4.3 build2573</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mode</span>
                  <span>NAT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Uptime</span>
                  <span>{formatUptime(uptime)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">WAN IP</span>
                  <span className="font-mono text-primary">103.159.54.219</span>
                </div>
              </div>
            </div>
          </div>

          {/* Licenses */}
          <div className="col-span-4 section">
            <div className="section-header">
              <span className="flex items-center gap-2">
                <Shield size={14} />
                Licenses
              </span>
            </div>
            <div className="section-body">
              <div className="grid grid-cols-2 gap-3">
                {licenses.map((lic) => (
                  <div key={lic.name} className="flex items-center gap-2 p-2 bg-green-50 rounded border border-green-200">
                    <span className="text-lg">{lic.icon}</span>
                    <div>
                      <div className="text-xs font-medium">{lic.name}</div>
                      <div className="text-[10px] text-green-600">Active</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* System Resources */}
          <div className="col-span-4 section">
            <div className="section-header">
              <span className="flex items-center gap-2">
                <Activity size={14} />
                System Resources
              </span>
            </div>
            <div className="section-body">
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <Cpu size={12} /> CPU Usage
                    </span>
                    <span className="text-sm font-semibold">{cpu.usage}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        cpu.usage > 80 ? "bg-red-500" : cpu.usage > 60 ? "bg-yellow-500" : "bg-green-500"
                      )}
                      style={{ width: `${cpu.usage}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground flex items-center gap-1">
                      <HardDrive size={12} /> Memory Usage
                    </span>
                    <span className="text-sm font-semibold">{memPct}%</span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full transition-all",
                        memPct > 80 ? "bg-red-500" : memPct > 60 ? "bg-yellow-500" : "bg-green-500"
                      )}
                      style={{ width: `${memPct}%` }}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Thermometer size={12} /> Temperature
                  </span>
                  <span className="text-sm font-semibold">{cpu.temperature}°C</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* Threat Protection Statistics */}
          <div className="col-span-8 section">
            <div className="section-header">
              <span className="flex items-center gap-2">
                <AlertTriangle size={14} />
                Advanced Threat Protection Statistics
              </span>
              <Link to="/threats" className="text-white text-xs hover:underline flex items-center gap-1">
                View all <ChevronRight size={12} />
              </Link>
            </div>
            <div className="forti-toolbar">
              <button className="forti-toolbar-btn primary">+ Create New</button>
              <button className="forti-toolbar-btn">✏️ Edit</button>
              <button className="forti-toolbar-btn">🗑️ Delete</button>
              <div className="flex-1" />
              <div className="forti-search">
                <input type="text" placeholder="Search" className="w-32" />
              </div>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12"></th>
                  <th>Severity</th>
                  <th>Signature</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Action</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {threats.map((t, idx) => (
                  <tr key={t.id} className={idx === 0 ? "selected" : ""}>
                    <td>
                      <input type="checkbox" className="rounded" />
                    </td>
                    <td>
                      <span className={cn("tag", t.severity === 'critical' ? 'tag-critical' : 'tag-high')}>
                        {t.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-medium">{t.sig}</td>
                    <td className="mono text-muted-foreground text-xs">{t.src}</td>
                    <td className="mono text-muted-foreground text-xs">{t.dst}</td>
                    <td>
                      <span className="tag tag-healthy">BLOCKED</span>
                    </td>
                    <td className="text-muted-foreground text-xs">{t.time} ago</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Interface Status */}
          <div className="col-span-4 section">
            <div className="section-header">
              <span className="flex items-center gap-2">
                <Network size={14} />
                Interface Status
              </span>
            </div>
            {/* Port Visualization */}
            <div className="px-3 py-3 border-b border-border bg-muted/50">
              <div className="flex items-center gap-1 justify-center">
                {mockInterfaces.map((iface, idx) => (
                  <div 
                    key={iface.id}
                    className={cn(
                      "port-indicator",
                      iface.status === 'up' ? "port-up" : "port-down"
                    )}
                    title={`${iface.name}: ${iface.status}`}
                  >
                    {idx + 1}
                  </div>
                ))}
              </div>
            </div>
            <div className="divide-y divide-border/60">
              {mockInterfaces.slice(0, 5).map((iface) => (
                <div key={iface.id} className="list-row flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={cn("status-dot-lg", iface.status === 'up' ? 'status-healthy' : 'status-inactive')} />
                    <div>
                      <div className="text-sm font-medium">{iface.name}</div>
                      <div className="mono text-[10px] text-muted-foreground">{iface.ipAddress}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={cn(
                      "tag text-[9px]",
                      iface.status === 'up' ? 'tag-healthy' : 'bg-gray-100 text-gray-500 border border-gray-200'
                    )}>
                      {iface.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div className="px-3 py-2 bg-muted border-t border-border">
              <Link to="/interfaces" className="text-xs text-primary hover:underline flex items-center gap-1">
                View all interfaces <ChevronRight size={12} />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-12 gap-4">
          {/* VPN Status */}
          <div className="col-span-6 section">
            <div className="section-header">
              <span className="flex items-center gap-2">
                <Globe size={14} />
                VPN Status
              </span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Remote Gateway</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {mockVPNTunnels.slice(0, 3).map((vpn) => (
                  <tr key={vpn.id}>
                    <td className="font-medium">{vpn.name}</td>
                    <td className="text-muted-foreground">{vpn.type === 'ipsec' ? 'IPsec' : vpn.type === 'openvpn' ? 'OpenVPN' : 'WireGuard'}</td>
                    <td className="mono text-xs text-muted-foreground">{vpn.remoteGateway}</td>
                    <td>
                      <span className={cn(
                        "tag",
                        vpn.status === 'connected' ? 'tag-healthy' : 'bg-gray-100 text-gray-500 border border-gray-200'
                      )}>
                        {vpn.status.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Quick Stats */}
          <div className="col-span-6 section">
            <div className="section-header">
              <span className="flex items-center gap-2">
                <Activity size={14} />
                Traffic Statistics
              </span>
            </div>
            <div className="section-body">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded border border-blue-200">
                  <div className="text-2xl font-bold text-blue-600">1.2M</div>
                  <div className="text-xs text-muted-foreground">Sessions</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded border border-green-200">
                  <div className="text-2xl font-bold text-green-600">847</div>
                  <div className="text-xs text-muted-foreground">Mbps In</div>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded border border-orange-200">
                  <div className="text-2xl font-bold text-orange-600">423</div>
                  <div className="text-xs text-muted-foreground">Mbps Out</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default Dashboard;
