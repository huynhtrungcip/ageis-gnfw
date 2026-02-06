import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { mockInterfaces, mockSystemStatus, mockVPNTunnels } from '@/data/mockData';
import { 
  Cpu, 
  HardDrive, 
  Shield, 
  Network, 
  Globe, 
  Activity, 
  ShieldCheck, 
  Lock, 
  Bug, 
  Filter,
  Settings,
  RefreshCw,
  CheckCircle2,
  Server,
  Wifi,
  Database,
  ChevronRight,
  ArrowRight,
  X,
  XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  Legend,
  LineChart,
  Line
} from 'recharts';

// Mock chart data
const generateTrafficData = () => {
  const hours = [];
  for (let i = 0; i < 24; i++) {
    hours.push({
      time: `${i}:00`,
      inbound: Math.floor(Math.random() * 50) + 10,
      outbound: Math.floor(Math.random() * 40) + 5,
    });
  }
  return hours;
};

const licenses = [
  { name: 'VM License', status: 'Valid', expiry: '2025-12-31' },
  { name: 'Support', status: 'Valid', expiry: '2025-12-31' },
  { name: 'IPS & IPS', status: 'Valid', expiry: '2025-12-31' },
  { name: 'AntiVirus', status: 'Valid', expiry: '2025-12-31' },
  { name: 'Web Filtering', status: 'Valid', expiry: '2025-12-31' },
  { name: 'Email Filtering', status: 'Valid', expiry: '2025-12-31' },
  { name: 'Aegis Sandbox Cloud', status: 'Valid', expiry: '2025-12-31' },
];

// Widget Component
const Widget = ({ 
  title, 
  children,
  className = '',
  headerActions
}: { 
  title: string; 
  children: React.ReactNode;
  className?: string;
  headerActions?: React.ReactNode;
}) => (
  <div className={cn("widget", className)}>
    <div className="widget-header">
      <span>{title}</span>
      {headerActions}
    </div>
    <div className="widget-body">
      {children}
    </div>
  </div>
);

const Dashboard = () => {
  const { cpu, memory, uptime, hostname, disk } = mockSystemStatus;
  const memPct = Math.round((memory.used / memory.total) * 100);
  const diskPct = Math.round((disk.used / disk.total) * 100);
  
  const [trafficData, setTrafficData] = useState(generateTrafficData);
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [isAutoRefresh, setIsAutoRefresh] = useState(true);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!isAutoRefresh) return;
    
    const interval = setInterval(() => {
      setTrafficData(generateTrafficData());
      setLastRefresh(new Date());
    }, 30000);
    
    return () => clearInterval(interval);
  }, [isAutoRefresh]);

  const handleManualRefresh = () => {
    setTrafficData(generateTrafficData());
    setLastRefresh(new Date());
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days} days ${hours} hours ${mins} minutes`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  return (
    <Shell>
      <div className="space-y-3">
        {/* Refresh Status Bar */}
        <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg px-3 py-2">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-muted-foreground">
              Last updated: <span className="font-medium text-foreground">{lastRefresh.toLocaleTimeString()}</span>
            </span>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsAutoRefresh(!isAutoRefresh)}
                className={cn(
                  "px-2 py-1 rounded text-[10px] font-medium transition-colors",
                  isAutoRefresh 
                    ? "bg-[#4caf50] text-white" 
                    : "bg-muted text-muted-foreground"
                )}
              >
                Auto-refresh: {isAutoRefresh ? 'ON' : 'OFF'}
              </button>
              <span className="text-muted-foreground">(every 30s)</span>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 gap-2"
            onClick={handleManualRefresh}
          >
            <RefreshCw className="h-3 w-3" />
            Refresh Now
          </Button>
        </div>
        {/* Top Row - System Info + Licenses */}
        <div className="grid grid-cols-3 gap-3">
          {/* System Information */}
          <Widget title="System Information" className="col-span-2">
            <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-[11px]">
              <div className="flex justify-between py-1 border-b border-[#eee]">
                <span className="text-[#666]">Hostname:</span>
                <span className="font-medium">{hostname}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#eee]">
                <span className="text-[#666]">Serial Number:</span>
                <span className="font-medium font-mono">FG100E4Q16005747</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#eee]">
                <span className="text-[#666]">Operation Mode:</span>
                <span className="font-medium">NAT</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#eee]">
                <span className="text-[#666]">HA Status:</span>
                <span className="font-medium">Standalone</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#eee]">
                <span className="text-[#666]">Firmware:</span>
                <span className="font-medium">v7.0.5 build0304 (GA)</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#eee]">
                <span className="text-[#666]">System Time:</span>
                <span className="font-medium">{new Date().toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#eee]">
                <span className="text-[#666]">Uptime:</span>
                <span className="font-medium">{formatUptime(uptime)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-[#eee]">
                <span className="text-[#666]">VDOM Mode:</span>
                <span className="font-medium">Disabled</span>
              </div>
            </div>
          </Widget>

          {/* Licenses */}
          <Widget title="Licenses">
            <div className="space-y-1">
              {licenses.slice(0, 5).map((lic, idx) => (
                <div key={idx} className="flex items-center justify-between text-[11px] py-0.5">
                  <span className="text-[#666]">{lic.name}</span>
                  <span className="inline-flex items-center gap-1 text-[#4caf50]">
                    <CheckCircle2 size={12} />
                    {lic.status}
                  </span>
                </div>
              ))}
            </div>
          </Widget>
        </div>

        {/* Second Row - Resources + Interface */}
        <div className="grid grid-cols-3 gap-3">
          {/* CPU / Memory / Disk */}
          <Widget title="Resources">
            <div className="space-y-3">
              {/* CPU */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#666]">CPU</span>
                  <span className="font-medium">{cpu.usage}%</span>
                </div>
                <div className="forti-progress">
                  <div 
                    className={cn(
                      "forti-progress-bar",
                      cpu.usage > 80 ? "red" : cpu.usage > 60 ? "orange" : "green"
                    )}
                    style={{ width: `${cpu.usage}%` }}
                  />
                </div>
              </div>
              {/* Memory */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#666]">Memory</span>
                  <span className="font-medium">{memPct}%</span>
                </div>
                <div className="forti-progress">
                  <div 
                    className={cn(
                      "forti-progress-bar",
                      memPct > 80 ? "red" : memPct > 60 ? "orange" : "blue"
                    )}
                    style={{ width: `${memPct}%` }}
                  />
                </div>
              </div>
              {/* Session */}
              <div>
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-[#666]">Session</span>
                  <span className="font-medium">2.4K</span>
                </div>
                <div className="forti-progress">
                  <div className="forti-progress-bar green" style={{ width: '12%' }} />
                </div>
              </div>
            </div>
          </Widget>

          {/* Interface Bandwidth */}
          <Widget title="Interface Bandwidth (Mbps)" className="col-span-2">
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trafficData.slice(-12)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" />
                  <XAxis dataKey="time" tick={{ fontSize: 10 }} stroke="#999" />
                  <YAxis tick={{ fontSize: 10 }} stroke="#999" />
                  <Tooltip 
                    contentStyle={{ fontSize: 11, background: '#fff', border: '1px solid #ddd' }}
                  />
                  <Area type="monotone" dataKey="inbound" stroke="#4caf50" fill="#4caf50" fillOpacity={0.3} />
                  <Area type="monotone" dataKey="outbound" stroke="#2196f3" fill="#2196f3" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Widget>
        </div>

        {/* Third Row - Device Unit + Interfaces */}
        <div className="grid grid-cols-3 gap-3">
          {/* Aegis Unit Visualization */}
          <Widget title="Unit Operation">
            <div className="flex flex-col items-center py-2">
              {/* Device Visual */}
              <div className="bg-[#333] rounded px-4 py-2 text-center mb-2">
                <div className="text-[10px] text-gray-400 mb-1">AEGIS</div>
                <div className="text-[11px] text-white font-bold">Aegis NGFW-500</div>
                <div className="flex items-center justify-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                    <div 
                      key={i}
                      className={cn(
                        "forti-port",
                        i <= 4 ? "up" : "down"
                      )}
                    >
                      {i}
                    </div>
                  ))}
                </div>
              </div>
              {/* Status */}
              <div className="flex items-center gap-4 text-[10px]">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#4caf50]" />
                  Connected: 4
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#ccc]" />
                  Disconnected: 6
                </span>
              </div>
            </div>
          </Widget>

          {/* Interfaces Status */}
          <Widget title="Top Interfaces by Bandwidth" className="col-span-2">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-[#666]">
                  <th className="pb-1">Interface</th>
                  <th className="pb-1">IP</th>
                  <th className="pb-1">Status</th>
                  <th className="pb-1 text-right">Inbound</th>
                  <th className="pb-1 text-right">Outbound</th>
                </tr>
              </thead>
              <tbody>
                {mockInterfaces.slice(0, 4).map((iface) => (
                  <tr key={iface.id} className="border-t border-[#eee]">
                    <td className="py-1.5 font-medium">{iface.name}</td>
                    <td className="py-1.5 font-mono text-[#666]">{iface.ipAddress}</td>
                    <td className="py-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1",
                        iface.status === 'up' ? 'text-[#4caf50]' : 'text-[#999]'
                      )}>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          iface.status === 'up' ? 'bg-[#4caf50]' : 'bg-[#ccc]'
                        )} />
                        {iface.status === 'up' ? 'Up' : 'Down'}
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-[#666]">{formatBytes(iface.rxBytes)}</td>
                    <td className="py-1.5 text-right text-[#666]">{formatBytes(iface.txBytes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Widget>
        </div>

        {/* Fourth Row - Security + Sessions */}
        <div className="grid grid-cols-3 gap-3">
          {/* Security Events */}
          <Widget title="Security Events (Last 24 Hours)">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-red-500" />
                  Critical
                </span>
                <span className="font-bold text-red-500">3</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-orange-500" />
                  High
                </span>
                <span className="font-bold text-orange-500">12</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-yellow-500" />
                  Medium
                </span>
                <span className="font-bold text-yellow-600">45</span>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded bg-blue-500" />
                  Low
                </span>
                <span className="font-bold text-blue-500">128</span>
              </div>
            </div>
            <Link to="/threats" className="mt-3 flex items-center gap-1 text-[11px] text-[#4caf50] hover:underline">
              View all events <ChevronRight size={12} />
            </Link>
          </Widget>

          {/* Top Sessions */}
          <Widget title="Top Sessions by Source" className="col-span-2">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-[#666]">
                  <th className="pb-1">Source</th>
                  <th className="pb-1">Destination</th>
                  <th className="pb-1">Application</th>
                  <th className="pb-1 text-right">Sessions</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-t border-[#eee]">
                  <td className="py-1.5 font-mono">192.168.1.105</td>
                  <td className="py-1.5 font-mono">8.8.8.8</td>
                  <td className="py-1.5">DNS</td>
                  <td className="py-1.5 text-right font-medium">1,247</td>
                </tr>
                <tr className="border-t border-[#eee]">
                  <td className="py-1.5 font-mono">192.168.1.112</td>
                  <td className="py-1.5 font-mono">151.101.1.140</td>
                  <td className="py-1.5">HTTPS</td>
                  <td className="py-1.5 text-right font-medium">892</td>
                </tr>
                <tr className="border-t border-[#eee]">
                  <td className="py-1.5 font-mono">192.168.1.108</td>
                  <td className="py-1.5 font-mono">142.250.185.46</td>
                  <td className="py-1.5">HTTPS</td>
                  <td className="py-1.5 text-right font-medium">654</td>
                </tr>
              </tbody>
            </table>
          </Widget>
        </div>

        {/* Fifth Row - VPN Status + WiFi */}
        <div className="grid grid-cols-3 gap-3">
          {/* WiFi Status Widget */}
          <Widget title="WiFi Controller Status">
            <div className="space-y-3">
              {/* AP Status */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-[#4caf50]/20 flex items-center justify-center">
                    <Wifi size={16} className="text-[#4caf50]" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#666]">Access Points</div>
                    <div className="text-sm font-bold">
                      <span className="text-[#4caf50]">4</span>
                      <span className="text-[#999]"> / 5</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#666]">Online</div>
                  <div className="text-sm font-bold text-[#4caf50]">80%</div>
                </div>
              </div>

              {/* Clients */}
              <div className="flex items-center justify-between py-2 border-t border-[#eee]">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded bg-blue-500/20 flex items-center justify-center">
                    <Network size={16} className="text-blue-500" />
                  </div>
                  <div>
                    <div className="text-[11px] text-[#666]">Connected Clients</div>
                    <div className="text-sm font-bold text-blue-600">55</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[11px] text-[#666]">5GHz</div>
                  <div className="text-sm font-bold text-blue-600">42</div>
                </div>
              </div>

              {/* Bandwidth */}
              <div className="flex items-center justify-between py-2 border-t border-[#eee]">
                <div>
                  <div className="text-[11px] text-[#666]">Total Bandwidth</div>
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-[11px]">
                      <span className="text-[#4caf50]">↓</span> 675 Mbps
                    </span>
                    <span className="text-[11px]">
                      <span className="text-blue-500">↑</span> 320 Mbps
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <Link to="/wifi" className="mt-2 flex items-center gap-1 text-[11px] text-[#4caf50] hover:underline">
              View WiFi Controller <ChevronRight size={12} />
            </Link>
          </Widget>

          {/* VPN Status */}
          <Widget title="IPsec VPN" className="col-span-2">
            <table className="w-full text-[11px]">
              <thead>
                <tr className="text-left text-[#666]">
                  <th className="pb-1">Tunnel Name</th>
                  <th className="pb-1">Type</th>
                  <th className="pb-1">Remote Gateway</th>
                  <th className="pb-1">Status</th>
                  <th className="pb-1 text-right">Incoming</th>
                  <th className="pb-1 text-right">Outgoing</th>
                </tr>
              </thead>
              <tbody>
                {mockVPNTunnels.slice(0, 3).map((vpn) => (
                  <tr key={vpn.id} className="border-t border-[#eee]">
                    <td className="py-1.5 font-medium">{vpn.name}</td>
                    <td className="py-1.5">{vpn.type.toUpperCase()}</td>
                    <td className="py-1.5 font-mono text-[#666]">{vpn.remoteGateway}</td>
                    <td className="py-1.5">
                      <span className={cn(
                        "inline-flex items-center gap-1",
                        vpn.status === 'connected' ? 'text-[#4caf50]' : 'text-[#999]'
                      )}>
                        <span className={cn(
                          "w-2 h-2 rounded-full",
                          vpn.status === 'connected' ? 'bg-[#4caf50]' : 'bg-[#ccc]'
                        )} />
                        {vpn.status === 'connected' ? 'Up' : 'Down'}
                      </span>
                    </td>
                    <td className="py-1.5 text-right text-[#666]">{formatBytes(vpn.bytesIn)}</td>
                    <td className="py-1.5 text-right text-[#666]">{formatBytes(vpn.bytesOut)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Widget>
        </div>

        {/* Sixth Row - SSID Status */}
        <Widget title="Active SSIDs">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-left text-[#666]">
                <th className="pb-1">SSID Name</th>
                <th className="pb-1">Security</th>
                <th className="pb-1">Band</th>
                <th className="pb-1">VLAN</th>
                <th className="pb-1 text-center">Clients</th>
                <th className="pb-1 text-right">RX (Mbps)</th>
                <th className="pb-1 text-right">TX (Mbps)</th>
                <th className="pb-1">Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-t border-[#eee]">
                <td className="py-1.5 font-medium">Corporate-WiFi</td>
                <td className="py-1.5">
                  <span className="forti-tag bg-blue-100 text-blue-700 border-blue-200">WPA2-ENT</span>
                </td>
                <td className="py-1.5">Dual</td>
                <td className="py-1.5">10</td>
                <td className="py-1.5 text-center font-medium">45</td>
                <td className="py-1.5 text-right">1,250</td>
                <td className="py-1.5 text-right">890</td>
                <td className="py-1.5">
                  <span className="forti-tag bg-green-100 text-green-700 border-green-200">ACTIVE</span>
                </td>
              </tr>
              <tr className="border-t border-[#eee]">
                <td className="py-1.5 font-medium">Guest-WiFi</td>
                <td className="py-1.5">
                  <span className="forti-tag bg-purple-100 text-purple-700 border-purple-200">WPA2-PSK</span>
                </td>
                <td className="py-1.5">Dual</td>
                <td className="py-1.5">20</td>
                <td className="py-1.5 text-center font-medium">12</td>
                <td className="py-1.5 text-right">450</td>
                <td className="py-1.5 text-right">120</td>
                <td className="py-1.5">
                  <span className="forti-tag bg-green-100 text-green-700 border-green-200">ACTIVE</span>
                </td>
              </tr>
              <tr className="border-t border-[#eee]">
                <td className="py-1.5 font-medium">IoT-Network</td>
                <td className="py-1.5">
                  <span className="forti-tag bg-purple-100 text-purple-700 border-purple-200">WPA2-PSK</span>
                </td>
                <td className="py-1.5">2.4GHz</td>
                <td className="py-1.5">30</td>
                <td className="py-1.5 text-center font-medium">8</td>
                <td className="py-1.5 text-right">50</td>
                <td className="py-1.5 text-right">30</td>
                <td className="py-1.5">
                  <span className="forti-tag bg-green-100 text-green-700 border-green-200">ACTIVE</span>
                </td>
              </tr>
            </tbody>
          </table>
        </Widget>
      </div>
    </Shell>
  );
};

export default Dashboard;
