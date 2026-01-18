import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { mockInterfaces, mockSystemStatus, mockVPNTunnels } from '@/data/mockData';
import { 
  ChevronRight, 
  Cpu, 
  HardDrive, 
  Shield, 
  AlertTriangle, 
  Network, 
  Globe, 
  Activity, 
  ShieldCheck, 
  Lock, 
  Bug, 
  Filter,
  Settings,
  GripVertical,
  Maximize2,
  X,
  RefreshCw,
  CheckCircle2,
  Clock,
  Server,
  Wifi,
  Database
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Mock data
const scanningStats = [
  { rating: 'Malicious', sniffer: 0, device: 0, onDemand: 0, network: 0, adapter: 0, url: 0, all: 0 },
  { rating: 'Suspicious - High Risk', sniffer: 0, device: 2, onDemand: 0, network: 0, adapter: 0, url: 0, all: 2 },
  { rating: 'Suspicious - Medium Risk', sniffer: 0, device: 12, onDemand: 0, network: 0, adapter: 0, url: 0, all: 12 },
  { rating: 'Suspicious - Low Risk', sniffer: 0, device: 0, onDemand: 100, network: 0, adapter: 0, url: 0, all: 100 },
  { rating: 'Clean', sniffer: 0, device: 13056, onDemand: 5, network: 0, adapter: 0, url: 0, all: 13061 },
  { rating: 'Other', sniffer: 0, device: 0, onDemand: 0, network: 0, adapter: 0, url: 0, all: 0 },
  { rating: 'Processed', sniffer: 0, device: 13170, onDemand: 5, network: 0, adapter: 0, url: 0, all: 13175 },
  { rating: 'Pending', sniffer: 0, device: 0, onDemand: 0, network: 0, adapter: 0, url: 0, all: 0 },
  { rating: 'Processing', sniffer: 0, device: 3, onDemand: 0, network: 0, adapter: 0, url: 0, all: 3 },
  { rating: 'Total', sniffer: 0, device: 13173, onDemand: 5, network: 0, adapter: 0, url: 0, all: 13178 },
];

const licenses = [
  { name: 'Support', status: 'active', icon: ShieldCheck },
  { name: 'IPS', status: 'active', icon: Lock },
  { name: 'AntiVirus', status: 'active', icon: Bug },
  { name: 'Web Filter', status: 'active', icon: Filter },
];

// Widget Header Component
const WidgetHeader = ({ 
  title, 
  icon: Icon,
  onSettings,
  onMaximize,
  onClose 
}: { 
  title: string; 
  icon?: React.ElementType;
  onSettings?: () => void;
  onMaximize?: () => void;
  onClose?: () => void;
}) => (
  <div className="widget-header">
    <div className="flex items-center gap-2">
      <GripVertical size={12} className="text-white/60 cursor-grab" />
      {Icon && <Icon size={14} />}
      <span>{title}</span>
    </div>
    <div className="flex items-center gap-1">
      {onSettings && (
        <button onClick={onSettings} className="p-0.5 hover:bg-white/20 rounded">
          <Settings size={12} />
        </button>
      )}
      {onMaximize && (
        <button onClick={onMaximize} className="p-0.5 hover:bg-white/20 rounded">
          <Maximize2 size={12} />
        </button>
      )}
      {onClose && (
        <button onClick={onClose} className="p-0.5 hover:bg-white/20 rounded">
          <X size={12} />
        </button>
      )}
    </div>
  </div>
);

const Dashboard = () => {
  const { cpu, memory, uptime, hostname } = mockSystemStatus;
  const memPct = Math.round((memory.used / memory.total) * 100);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days} day(s) ${hours} hour(s) ${mins} minute(s)`;
  };

  return (
    <Shell>
      <div className="space-y-3">
        {/* Top Action Bar */}
        <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-sm border border-border">
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5 text-primary">
            <span className="text-lg leading-none">+</span> Add Widget
          </Button>
          <Button variant="ghost" size="sm" className="h-7 text-xs gap-1.5">
            <RefreshCw size={12} /> Reset View
          </Button>
        </div>

        {/* Main Grid - 2 Column Layout */}
        <div className="grid grid-cols-2 gap-3">
          {/* Left Column */}
          <div className="space-y-3">
            {/* System Information Widget */}
            <div className="widget">
              <WidgetHeader title="System Information" icon={Server} onSettings={() => {}} onMaximize={() => {}} />
              <div className="widget-body">
                <table className="widget-table">
                  <tbody>
                    <tr>
                      <td className="widget-label">Unit Type</td>
                      <td className="widget-value">
                        Primary <Link to="#" className="text-primary hover:underline">[Change]</Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="widget-label">Host Name</td>
                      <td className="widget-value">
                        {hostname} <Link to="#" className="text-primary hover:underline">[Change]</Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="widget-label">Serial Number</td>
                      <td className="widget-value font-mono">AEGIS-FW-001</td>
                    </tr>
                    <tr>
                      <td className="widget-label">System Time</td>
                      <td className="widget-value">
                        {new Date().toLocaleString()} <Link to="#" className="text-primary hover:underline">[Change]</Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="widget-label">Firmware Version</td>
                      <td className="widget-value">
                        v1.0.0 build1024 (GA) <Link to="#" className="text-primary hover:underline">[Update]</Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="widget-label">System Configuration</td>
                      <td className="widget-value">
                        Last Backup: {new Date().toLocaleDateString()} <Link to="#" className="text-primary hover:underline">[Backup]</Link>
                      </td>
                    </tr>
                    <tr>
                      <td className="widget-label">Current Administrator</td>
                      <td className="widget-value">admin</td>
                    </tr>
                    <tr>
                      <td className="widget-label">Uptime</td>
                      <td className="widget-value">{formatUptime(uptime)}</td>
                    </tr>
                  </tbody>
                </table>

                {/* License Status */}
                <div className="mt-3 pt-3 border-t border-border">
                  <table className="widget-table">
                    <tbody>
                      {licenses.map((lic) => (
                        <tr key={lic.name}>
                          <td className="widget-label">{lic.name}</td>
                          <td className="widget-value">
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 size={14} className="text-green-600" />
                              <span className="text-green-600">Active</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* System Resources Widget */}
            <div className="widget">
              <WidgetHeader title="System Resources" icon={Activity} onSettings={() => {}} onMaximize={() => {}} />
              <div className="widget-body">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Cpu size={16} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground w-24">CPU Usage:</span>
                    <div className="flex-1 h-4 bg-gray-200 rounded-sm overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          cpu.usage > 80 ? "bg-red-500" : cpu.usage > 60 ? "bg-yellow-500" : "bg-green-500"
                        )}
                        style={{ width: `${cpu.usage}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right">{cpu.usage}%</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <HardDrive size={16} className="text-muted-foreground" />
                    <span className="text-xs text-muted-foreground w-24">Memory Usage:</span>
                    <div className="flex-1 h-4 bg-gray-200 rounded-sm overflow-hidden">
                      <div 
                        className={cn(
                          "h-full transition-all",
                          memPct > 80 ? "bg-red-500" : memPct > 60 ? "bg-yellow-500" : "bg-green-500"
                        )}
                        style={{ width: `${memPct}%` }}
                      />
                    </div>
                    <span className="text-xs font-medium w-12 text-right">{memPct}%</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center gap-3">
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <RefreshCw size={12} className="mr-1.5" /> Reboot
                  </Button>
                  <Button variant="outline" size="sm" className="h-7 text-xs">
                    <Settings size={12} className="mr-1.5" /> Shutdown
                  </Button>
                </div>
              </div>
            </div>

            {/* Disk Monitor Widget */}
            <div className="widget">
              <WidgetHeader title="Disk Monitor" icon={Database} onSettings={() => {}} onMaximize={() => {}} />
              <div className="widget-body">
                <div className="grid grid-cols-4 gap-2">
                  <div className="text-center p-2 border border-border rounded-sm">
                    <div className="text-lg font-bold text-green-600">98%</div>
                    <div className="text-[10px] text-muted-foreground">Disk 1</div>
                  </div>
                  <div className="text-center p-2 border border-border rounded-sm">
                    <div className="text-lg font-bold text-green-600">95%</div>
                    <div className="text-[10px] text-muted-foreground">Disk 2</div>
                  </div>
                  <div className="text-center p-2 border border-border rounded-sm">
                    <div className="text-lg font-bold text-green-600">87%</div>
                    <div className="text-[10px] text-muted-foreground">Disk 3</div>
                  </div>
                  <div className="text-center p-2 border border-border rounded-sm">
                    <div className="text-lg font-bold text-gray-400">--</div>
                    <div className="text-[10px] text-muted-foreground">Disk 4</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-3">
            {/* Scanning Statistics Widget */}
            <div className="widget">
              <WidgetHeader title="Scanning Statistics - Last 7 Days" icon={Shield} onSettings={() => {}} onMaximize={() => {}} />
              <div className="widget-body p-0">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-1.5 px-2 font-medium">Rating</th>
                      <th className="text-right py-1.5 px-2 font-medium">Sniffer</th>
                      <th className="text-right py-1.5 px-2 font-medium">Device(s)</th>
                      <th className="text-right py-1.5 px-2 font-medium">On Demand</th>
                      <th className="text-right py-1.5 px-2 font-medium">Network</th>
                      <th className="text-right py-1.5 px-2 font-medium">Adapter</th>
                      <th className="text-right py-1.5 px-2 font-medium">URL</th>
                      <th className="text-right py-1.5 px-2 font-medium">All</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scanningStats.map((row, idx) => (
                      <tr key={idx} className={cn(
                        "border-b border-border/60",
                        row.rating === 'Total' && "bg-muted font-medium"
                      )}>
                        <td className="py-1.5 px-2">{row.rating}</td>
                        <td className="text-right py-1.5 px-2">{row.sniffer}</td>
                        <td className="text-right py-1.5 px-2">
                          {row.device > 0 ? (
                            <Link to="#" className="text-primary hover:underline">{row.device}</Link>
                          ) : row.device}
                        </td>
                        <td className="text-right py-1.5 px-2">
                          {row.onDemand > 0 ? (
                            <Link to="#" className="text-primary hover:underline">{row.onDemand}</Link>
                          ) : row.onDemand}
                        </td>
                        <td className="text-right py-1.5 px-2">{row.network}</td>
                        <td className="text-right py-1.5 px-2">{row.adapter}</td>
                        <td className="text-right py-1.5 px-2">{row.url}</td>
                        <td className="text-right py-1.5 px-2">
                          {row.all > 0 ? (
                            <Link to="#" className="text-primary hover:underline">{row.all}</Link>
                          ) : row.all}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-2 py-1.5 text-[10px] text-muted-foreground text-right border-t border-border">
                  Last Updated: {new Date().toLocaleString()}
                </div>
              </div>
            </div>

            {/* Interface Status Widget */}
            <div className="widget">
              <WidgetHeader title="Interface Status" icon={Network} onSettings={() => {}} onMaximize={() => {}} />
              <div className="widget-body p-0">
                {mockInterfaces.slice(0, 5).map((iface) => (
                  <div key={iface.id} className="flex items-center justify-between px-3 py-2 border-b border-border/60 hover:bg-muted/50">
                    <div className="flex items-center gap-2">
                      <Wifi size={14} className={iface.status === 'up' ? 'text-green-600' : 'text-gray-400'} />
                      <div>
                        <div className="text-xs font-medium">{iface.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">{iface.ipAddress}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                        iface.status === 'up' 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          iface.status === 'up' ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        {iface.status.toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
                <div className="px-3 py-2 bg-muted">
                  <Link to="/interfaces" className="text-xs text-primary hover:underline flex items-center gap-1">
                    View all interfaces <ChevronRight size={12} />
                  </Link>
                </div>
              </div>
            </div>

            {/* VPN Status Widget */}
            <div className="widget">
              <WidgetHeader title="VPN Status" icon={Globe} onSettings={() => {}} onMaximize={() => {}} />
              <div className="widget-body p-0">
                <table className="w-full text-[11px]">
                  <thead>
                    <tr className="bg-muted">
                      <th className="text-left py-1.5 px-2 font-medium">Name</th>
                      <th className="text-left py-1.5 px-2 font-medium">Type</th>
                      <th className="text-left py-1.5 px-2 font-medium">Gateway</th>
                      <th className="text-center py-1.5 px-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockVPNTunnels.slice(0, 4).map((vpn) => (
                      <tr key={vpn.id} className="border-b border-border/60">
                        <td className="py-1.5 px-2 font-medium">{vpn.name}</td>
                        <td className="py-1.5 px-2 text-muted-foreground">
                          {vpn.type === 'ipsec' ? 'IPsec' : vpn.type === 'openvpn' ? 'OpenVPN' : 'WireGuard'}
                        </td>
                        <td className="py-1.5 px-2 font-mono text-muted-foreground">{vpn.remoteGateway}</td>
                        <td className="py-1.5 px-2 text-center">
                          <span className={cn(
                            "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                            vpn.status === 'connected' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-gray-100 text-gray-500'
                          )}>
                            <span className={cn(
                              "w-1.5 h-1.5 rounded-full",
                              vpn.status === 'connected' ? 'bg-green-500' : 'bg-gray-400'
                            )} />
                            {vpn.status.toUpperCase()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Row - Full Width Charts */}
        <div className="grid grid-cols-2 gap-3">
          {/* Traffic Chart Placeholder */}
          <div className="widget">
            <WidgetHeader title="File Job Statistics" icon={Activity} onSettings={() => {}} onMaximize={() => {}} />
            <div className="widget-body">
              <div className="h-32 flex items-center justify-center bg-muted/30 rounded">
                <span className="text-xs text-muted-foreground">[Traffic Chart Placeholder]</span>
              </div>
              <div className="mt-2 flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-red-500 rounded-sm" /> On Demand</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-green-500 rounded-sm" /> Sniffer</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-blue-500 rounded-sm" /> Device(s)</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-purple-500 rounded-sm" /> Network Share</span>
                <span className="flex items-center gap-1"><span className="w-3 h-2 bg-orange-500 rounded-sm" /> Adapter</span>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground text-right">
                Last Updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>

          {/* Scanning Activity Chart */}
          <div className="widget">
            <WidgetHeader title="File Scanning Activity - Last 4 Weeks" icon={Activity} onSettings={() => {}} onMaximize={() => {}} />
            <div className="widget-body">
              <div className="h-32 flex items-center justify-center bg-muted/30 rounded">
                <span className="text-xs text-muted-foreground">[Scanning Activity Chart Placeholder]</span>
              </div>
              <div className="mt-2 text-[10px] text-muted-foreground text-right">
                Last Updated: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default Dashboard;
