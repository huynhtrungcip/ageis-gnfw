import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import {
  Shield, Network, Lock, Bug, RefreshCw,
  CheckCircle2, ChevronRight, Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  useLatestMetrics, useTrafficHistory, useInterfaces,
  useVPN, useRecentThreats, useFirewallStats
} from '@/hooks/useDashboardData';
import { useQueryClient } from '@tanstack/react-query';
import { formatUptime, formatBytes } from '@/lib/formatters';

// ─── Widget wrapper ─────────────────────────────
const Widget = ({
  title, children, className = '', headerActions, loading
}: {
  title: string; children: React.ReactNode; className?: string;
  headerActions?: React.ReactNode; loading?: boolean;
}) => (
  <div className={cn("widget", className)}>
    <div className="widget-header">
      <span>{title}</span>
      <div className="flex items-center gap-2">
        {loading && <Loader2 size={12} className="animate-spin text-muted-foreground" />}
        {headerActions}
      </div>
    </div>
    <div className="widget-body">{children}</div>
  </div>
);

const licenses = [
  { name: 'VM License', status: 'Valid' },
  { name: 'Support', status: 'Valid' },
  { name: 'IDS & IPS', status: 'Valid' },
  { name: 'AntiVirus', status: 'Valid' },
  { name: 'Web Filtering', status: 'Valid' },
];

// ─── Dashboard ──────────────────────────────────
const Dashboard = () => {
  const queryClient = useQueryClient();
  const metrics = useLatestMetrics();
  const traffic = useTrafficHistory(24);
  const interfaces = useInterfaces();
  const vpn = useVPN();
  const threats = useRecentThreats();
  const fwStats = useFirewallStats();

  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  useEffect(() => {
    if (!isAutoRefresh) return;
    const interval = setInterval(() => {
      queryClient.invalidateQueries();
      setLastRefresh(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [isAutoRefresh, queryClient]);

  const handleManualRefresh = () => {
    queryClient.invalidateQueries();
    setLastRefresh(new Date());
  };

  // ── Derived data ──
  const m = metrics.data;
  const cpuUsage = m?.cpu_usage ?? 0;
  const memPct = m ? Math.round((m.memory_used / m.memory_total) * 100) : 0;
  const diskPct = m ? Math.round((m.disk_used / m.disk_total) * 100) : 0;

  const trafficData = (traffic.data ?? []).map(t => ({
    time: new Date(t.recorded_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    inbound: t.inbound, outbound: t.outbound,
  }));

  const ifaces = interfaces.data ?? [];
  const vpnTunnels = vpn.data ?? [];
  const threatEvents = threats.data ?? [];
  const connectedVPNs = vpnTunnels.filter(v => v.status === 'connected').length;
  const activePortCount = ifaces.filter(i => i.status === 'up').length;

  const threatCounts = {
    critical: threatEvents.filter(t => t.severity === 'critical').length,
    high: threatEvents.filter(t => t.severity === 'high').length,
    medium: threatEvents.filter(t => t.severity === 'medium').length,
    low: threatEvents.filter(t => t.severity === 'low').length,
  };

  return (
    <Shell>
      <div className="space-y-3">
        {/* Refresh Bar */}
        <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-3 py-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              Last updated: <span className="font-medium text-foreground">{lastRefresh.toLocaleTimeString()}</span>
            </span>
            <button onClick={() => setIsAutoRefresh(!isAutoRefresh)} className={cn(
              "px-2 py-1 rounded text-[10px] font-medium transition-colors",
              isAutoRefresh ? "bg-[#4caf50] text-white" : "bg-muted text-muted-foreground"
            )}>
              Auto-refresh: {isAutoRefresh ? 'ON' : 'OFF'}
            </button>
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-2" onClick={handleManualRefresh}>
            <RefreshCw className="h-3 w-3" /> Refresh Now
          </Button>
        </div>

        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-3">
          <Widget title="System Information" className="col-span-2" loading={metrics.isLoading}>
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px]">
              {[
                ['Hostname', m?.hostname ?? '—'], ['Serial Number', 'AEGIS-NGFW-500'],
                ['Operation Mode', 'NAT'], ['HA Status', 'Standalone'],
                ['Firmware', 'v7.0.5 build0304 (GA)'], ['System Time', new Date().toLocaleString()],
                ['Uptime', m ? formatUptime(m.uptime) : '—'],
                ['CPU Cores', m ? `${m.cpu_cores} cores / ${m.cpu_temperature}°C` : '—'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between py-1 border-b border-[#eee]">
                  <span className="text-[#666]">{label}:</span>
                  <span className="font-medium">{value}</span>
                </div>
              ))}
            </div>
          </Widget>
          <Widget title="Licenses">
            <div className="space-y-1">
              {licenses.map((lic, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-[#666]">{lic.name}</span>
                  <span className="inline-flex items-center gap-1 text-[#4caf50]">
                    <CheckCircle2 size={12} /> {lic.status}
                  </span>
                </div>
              ))}
            </div>
          </Widget>
        </div>

        {/* Row 2 - Resources + Traffic */}
        <div className="grid grid-cols-3 gap-3">
          <Widget title="Resources" loading={metrics.isLoading}>
            <div className="space-y-3">
              {[{ label: 'CPU', value: cpuUsage }, { label: 'Memory', value: memPct }, { label: 'Disk', value: diskPct }].map(({ label, value }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-[11px] mb-1">
                    <span className="text-[#666]">{label}</span>
                    <span className="font-medium">{value}%</span>
                  </div>
                  <div className="forti-progress">
                    <div className={cn("forti-progress-bar", value > 80 ? "red" : value > 60 ? "orange" : "green")} style={{ width: `${value}%` }} />
                  </div>
                </div>
              ))}
              {m && <div className="text-[10px] text-[#999] pt-1 border-t border-[#eee]">Load: {m.load_1m} / {m.load_5m} / {m.load_15m}</div>}
            </div>
          </Widget>
          <Widget title="Interface Bandwidth (Mbps)" className="col-span-2" loading={traffic.isLoading}>
            <div className="h-32">
              {trafficData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trafficData.slice(-12)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                    <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#999" />
                    <YAxis tick={{ fontSize: 10 }} stroke="#999" />
                    <Tooltip contentStyle={{ fontSize: 11, background: '#fff', border: '1px solid #ddd' }} />
                    <Area type="monotone" dataKey="inbound" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="outbound" stroke="#2196f3" fill="#2196f3" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-[11px] text-[#999]">No traffic data yet</div>
              )}
            </div>
          </Widget>
        </div>

        {/* Row 3 - Unit + Interfaces */}
        <div className="grid grid-cols-3 gap-3">
          <Widget title="Unit Operation" loading={interfaces.isLoading}>
            <div className="flex flex-col items-center py-2">
              <div className="bg-[#333] rounded px-4 py-2 text-center mb-2">
                <div className="text-[10px] text-gray-400 mb-1">AEGIS</div>
                <div className="text-[11px] text-white font-bold">Aegis NGFW-500</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className={cn("forti-port", i < activePortCount ? "up" : "down")}>{i + 1}</div>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#4caf50]" />Connected: {activePortCount}</span>
                <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#ccc]" />Disconnected: {10 - activePortCount}</span>
              </div>
            </div>
          </Widget>
          <Widget title="Top Interfaces by Bandwidth" className="col-span-2" loading={interfaces.isLoading}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-left text-[#666]"><th className="pb-1">Interface</th><th className="pb-1">IP</th><th className="pb-1">Status</th><th className="pb-1 text-right">Inbound</th><th className="pb-1 text-right">Outbound</th></tr></thead>
              <tbody>
                {ifaces.length > 0 ? ifaces.slice(0, 6).map(iface => (
                  <tr key={iface.id} className="border-t border-[#eee]">
                    <td className="py-1.5 font-medium">{iface.name}</td>
                    <td className="py-1.5 font-mono text-[#666]">{iface.ip_address ?? '—'}</td>
                    <td className="py-1.5"><span className={cn("inline-flex items-center gap-1", iface.status === 'up' ? 'text-[#4caf50]' : 'text-[#999]')}><span className={cn("w-2 h-2 rounded-full", iface.status === 'up' ? 'bg-[#4caf50]' : 'bg-[#ccc]')} />{iface.status === 'up' ? 'Up' : 'Down'}</span></td>
                    <td className="py-1.5 text-right text-[#666]">{formatBytes(iface.rx_bytes)}</td>
                    <td className="py-1.5 text-right text-[#666]">{formatBytes(iface.tx_bytes)}</td>
                  </tr>
                )) : <tr><td colSpan={5} className="py-4 text-center text-[#999]">No interface data</td></tr>}
              </tbody>
            </table>
          </Widget>
        </div>

        {/* Row 4 - Security + Sessions */}
        <div className="grid grid-cols-3 gap-3">
          <Widget title="Security Events (Last 24 Hours)" loading={threats.isLoading}>
            <div className="space-y-2">
              {[
                { label: 'Critical', count: threatCounts.critical, color: 'bg-red-500', textColor: 'text-red-500' },
                { label: 'High', count: threatCounts.high, color: 'bg-orange-500', textColor: 'text-orange-500' },
                { label: 'Medium', count: threatCounts.medium, color: 'bg-yellow-500', textColor: 'text-yellow-600' },
                { label: 'Low', count: threatCounts.low, color: 'bg-blue-500', textColor: 'text-blue-500' },
              ].map(({ label, count, color, textColor }) => (
                <div key={label} className="flex items-center justify-between text-[11px]">
                  <span className="flex items-center gap-2"><span className={cn("w-3 h-3 rounded", color)} />{label}</span>
                  <span className={cn("font-bold", textColor)}>{count}</span>
                </div>
              ))}
              <div className="pt-2 border-t border-[#eee] text-[11px] text-[#666]">Total: <span className="font-bold text-foreground">{threatEvents.length}</span></div>
            </div>
            <Link to="/threats" className="mt-3 flex items-center gap-1 text-[11px] text-[#4caf50] hover:underline">View all events <ChevronRight size={12} /></Link>
          </Widget>
          <Widget title="Top Sessions by Source" className="col-span-2" loading={threats.isLoading}>
            <table className="w-full text-[11px]">
              <thead><tr className="text-left text-[#666]"><th className="pb-1">Source</th><th className="pb-1">Destination</th><th className="pb-1">Category</th><th className="pb-1">Action</th><th className="pb-1 text-right">Confidence</th></tr></thead>
              <tbody>
                {threatEvents.length > 0 ? threatEvents.slice(0, 5).map(t => (
                  <tr key={t.id} className="border-t border-[#eee]">
                    <td className="py-1.5 font-mono">{t.source_ip ?? '—'}</td>
                    <td className="py-1.5 font-mono">{t.destination_ip ?? '—'}{t.destination_port ? `:${t.destination_port}` : ''}</td>
                    <td className="py-1.5">{t.category}</td>
                    <td className="py-1.5"><span className={cn("forti-tag text-[10px]", t.action === 'blocked' ? "bg-red-100 text-red-700 border-red-200" : "bg-yellow-100 text-yellow-700 border-yellow-200")}>{t.action.toUpperCase()}</span></td>
                    <td className="py-1.5 text-right">{t.ai_confidence ? `${t.ai_confidence}%` : '—'}</td>
                  </tr>
                )) : <tr><td colSpan={5} className="py-4 text-center text-[#999]">No recent events</td></tr>}
              </tbody>
            </table>
          </Widget>
        </div>

        {/* Row 5 - VPN */}
        <Widget title={`IPsec VPN (${connectedVPNs}/${vpnTunnels.length} connected)`} loading={vpn.isLoading}>
          <table className="w-full text-[11px]">
            <thead><tr className="text-left text-[#666]"><th className="pb-1">Tunnel</th><th className="pb-1">Type</th><th className="pb-1">Remote GW</th><th className="pb-1">Local Net</th><th className="pb-1">Remote Net</th><th className="pb-1">Status</th><th className="pb-1 text-right">In</th><th className="pb-1 text-right">Out</th></tr></thead>
            <tbody>
              {vpnTunnels.length > 0 ? vpnTunnels.map(v => (
                <tr key={v.id} className="border-t border-[#eee]">
                  <td className="py-1.5 font-medium">{v.name}</td>
                  <td className="py-1.5">{v.type.toUpperCase()}</td>
                  <td className="py-1.5 font-mono text-[#666]">{v.remote_gateway ?? '—'}</td>
                  <td className="py-1.5 font-mono text-[#666]">{v.local_network ?? '—'}</td>
                  <td className="py-1.5 font-mono text-[#666]">{v.remote_network ?? '—'}</td>
                  <td className="py-1.5"><span className={cn("inline-flex items-center gap-1", v.status === 'connected' ? 'text-[#4caf50]' : 'text-[#999]')}><span className={cn("w-2 h-2 rounded-full", v.status === 'connected' ? 'bg-[#4caf50]' : 'bg-[#ccc]')} />{v.status === 'connected' ? 'Up' : 'Down'}</span></td>
                  <td className="py-1.5 text-right text-[#666]">{formatBytes(v.bytes_in)}</td>
                  <td className="py-1.5 text-right text-[#666]">{formatBytes(v.bytes_out)}</td>
                </tr>
              )) : <tr><td colSpan={8} className="py-4 text-center text-[#999]">No VPN tunnels</td></tr>}
            </tbody>
          </table>
        </Widget>

        {/* Row 6 - Stats */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Firewall Rules', value: fwStats.data?.total ?? 0, sub: `${fwStats.data?.active ?? 0} active`, icon: Shield },
            { label: 'VPN Tunnels', value: connectedVPNs, sub: `of ${vpnTunnels.length}`, icon: Lock },
            { label: 'Threats (24h)', value: threatEvents.length, sub: `${threatCounts.critical} critical`, icon: Bug },
            { label: 'Interfaces', value: activePortCount, sub: `of ${ifaces.length} up`, icon: Network },
          ].map(({ label, value, sub, icon: Icon }) => (
            <div key={label} className="widget">
              <div className="widget-body flex items-center gap-3 py-3">
                <div className="w-10 h-10 rounded-lg bg-[#4caf50]/10 flex items-center justify-center">
                  <Icon size={18} className="text-[#4caf50]" />
                </div>
                <div>
                  <div className="text-lg font-bold">{value}</div>
                  <div className="text-[10px] text-[#666]">{label}</div>
                  <div className="text-[9px] text-[#999]">{sub}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Shell>
  );
};

export default Dashboard;
