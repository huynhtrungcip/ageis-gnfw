import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  ArrowDown, 
  ArrowUp, 
  Globe, 
  Monitor, 
  RefreshCw,
  Pause,
  Play,
  Download
} from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Generate real-time bandwidth data
const generateBandwidthData = () => {
  const now = new Date();
  return Array.from({ length: 30 }, (_, i) => {
    const time = new Date(now.getTime() - (29 - i) * 2000);
    return {
      time: time.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      inbound: Math.floor(Math.random() * 500 + 200),
      outbound: Math.floor(Math.random() * 300 + 100),
    };
  });
};

// Top talkers data
const generateTopTalkers = () => [
  { ip: '192.168.1.105', hostname: 'workstation-01', inbound: 2458, outbound: 1823, connections: 145, country: 'US' },
  { ip: '192.168.1.42', hostname: 'server-db-01', inbound: 1956, outbound: 3421, connections: 89, country: 'US' },
  { ip: '10.0.0.15', hostname: 'web-proxy', inbound: 1654, outbound: 987, connections: 234, country: 'DE' },
  { ip: '192.168.1.88', hostname: 'dev-machine', inbound: 1234, outbound: 2156, connections: 67, country: 'US' },
  { ip: '172.16.0.5', hostname: 'mail-server', inbound: 1089, outbound: 756, connections: 178, country: 'GB' },
  { ip: '192.168.1.201', hostname: 'backup-nas', inbound: 956, outbound: 4521, connections: 23, country: 'US' },
  { ip: '10.0.0.99', hostname: 'monitoring', inbound: 845, outbound: 432, connections: 312, country: 'JP' },
  { ip: '192.168.1.67', hostname: 'guest-laptop', inbound: 723, outbound: 234, connections: 45, country: 'FR' },
];

// Protocol distribution data
const protocolData = [
  { name: 'HTTPS', value: 45, color: '#2e9e5e' },
  { name: 'HTTP', value: 15, color: '#3b82f6' },
  { name: 'SSH', value: 12, color: '#f59e0b' },
  { name: 'DNS', value: 10, color: '#8b5cf6' },
  { name: 'SMTP', value: 8, color: '#ef4444' },
  { name: 'Other', value: 10, color: '#94a3b8' },
];

// Port distribution data
const portData = [
  { port: '443', protocol: 'HTTPS', traffic: 4521, percentage: 45 },
  { port: '80', protocol: 'HTTP', traffic: 1502, percentage: 15 },
  { port: '22', protocol: 'SSH', traffic: 1201, percentage: 12 },
  { port: '53', protocol: 'DNS', traffic: 1001, percentage: 10 },
  { port: '25', protocol: 'SMTP', traffic: 801, percentage: 8 },
  { port: '3306', protocol: 'MySQL', traffic: 501, percentage: 5 },
  { port: '5432', protocol: 'PostgreSQL', traffic: 301, percentage: 3 },
  { port: 'Other', protocol: 'Various', traffic: 201, percentage: 2 },
];

// Geographic distribution
const geoData = [
  { country: 'United States', code: 'US', traffic: 4521, percentage: 42 },
  { country: 'Germany', code: 'DE', traffic: 1823, percentage: 17 },
  { country: 'United Kingdom', code: 'GB', traffic: 1234, percentage: 11 },
  { country: 'Japan', code: 'JP', traffic: 987, percentage: 9 },
  { country: 'France', code: 'FR', traffic: 756, percentage: 7 },
  { country: 'Canada', code: 'CA', traffic: 543, percentage: 5 },
  { country: 'Australia', code: 'AU', traffic: 432, percentage: 4 },
  { country: 'Other', code: 'XX', traffic: 534, percentage: 5 },
];

const TrafficAnalysis = () => {
  const { demoMode } = useDemoMode();
  const [bandwidthData, setBandwidthData] = useState(demoMode ? generateBandwidthData() : []);
  const [topTalkers, setTopTalkers] = useState(demoMode ? generateTopTalkers() : []);
  const [isLive, setIsLive] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedInterface, setSelectedInterface] = useState('all');

  // Real-time update effect
  useEffect(() => {
    if (!isLive || !demoMode) return;

    const interval = setInterval(() => {
      setBandwidthData(prev => {
        const now = new Date();
        const newPoint = {
          time: now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          inbound: Math.floor(Math.random() * 500 + 200),
          outbound: Math.floor(Math.random() * 300 + 100),
        };
        return [...prev.slice(1), newPoint];
      });

      // Occasionally update top talkers
      if (Math.random() > 0.7) {
        setTopTalkers(prev => 
          prev.map(t => ({
            ...t,
            inbound: t.inbound + Math.floor(Math.random() * 100 - 50),
            outbound: t.outbound + Math.floor(Math.random() * 100 - 50),
            connections: t.connections + Math.floor(Math.random() * 10 - 5),
          })).sort((a, b) => (b.inbound + b.outbound) - (a.inbound + a.outbound))
        );
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isLive]);

  const totalInbound = bandwidthData.reduce((sum, d) => sum + d.inbound, 0);
  const totalOutbound = bandwidthData.reduce((sum, d) => sum + d.outbound, 0);
  const avgInbound = Math.round(totalInbound / bandwidthData.length);
  const avgOutbound = Math.round(totalOutbound / bandwidthData.length);

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Traffic Analysis</h1>
            <p className="text-sm text-muted-foreground">Real-time network traffic monitoring and analysis</p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedInterface} onValueChange={setSelectedInterface}>
              <SelectTrigger className="w-32 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Interfaces</SelectItem>
                <SelectItem value="wan">WAN</SelectItem>
                <SelectItem value="lan">LAN</SelectItem>
                <SelectItem value="dmz">DMZ</SelectItem>
              </SelectContent>
            </Select>
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-24 h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5m">5 min</SelectItem>
                <SelectItem value="15m">15 min</SelectItem>
                <SelectItem value="1h">1 hour</SelectItem>
                <SelectItem value="24h">24 hours</SelectItem>
              </SelectContent>
            </Select>
            <Button
              variant={isLive ? "default" : "outline"}
              size="sm"
              onClick={() => setIsLive(!isLive)}
              className="h-8"
            >
              {isLive ? <Pause size={14} className="mr-1" /> : <Play size={14} className="mr-1" />}
              {isLive ? 'Pause' : 'Resume'}
            </Button>
            <Button variant="outline" size="sm" className="h-8" onClick={() => {
              const csvRows = ['Time,Inbound (Mbps),Outbound (Mbps)'];
              bandwidthData.forEach(d => csvRows.push(`${d.time},${d.inbound},${d.outbound}`));
              csvRows.push('', 'Protocol,Traffic %');
              protocolData.forEach(p => csvRows.push(`${p.name},${p.value}`));
              csvRows.push('', 'Country,Code,Traffic (MB),Percentage');
              geoData.forEach(g => csvRows.push(`${g.country},${g.code},${g.traffic},${g.percentage}%`));
              const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `traffic-analysis-${new Date().toISOString().split('T')[0]}.csv`;
              a.click();
              URL.revokeObjectURL(url);
              import('sonner').then(m => m.toast.success('Traffic data exported'));
            }}>
              <Download size={14} className="mr-1" />
              Export
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-4 gap-3">
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current Inbound</p>
                  <p className="text-2xl font-bold text-foreground">{bandwidthData[bandwidthData.length - 1]?.inbound || 0}</p>
                  <p className="text-xs text-muted-foreground">Mbps</p>
                </div>
                <div className="p-2 bg-green-500/10 rounded-lg">
                  <ArrowDown className="text-green-500" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Current Outbound</p>
                  <p className="text-2xl font-bold text-foreground">{bandwidthData[bandwidthData.length - 1]?.outbound || 0}</p>
                  <p className="text-xs text-muted-foreground">Mbps</p>
                </div>
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <ArrowUp className="text-blue-500" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Avg Inbound</p>
                  <p className="text-2xl font-bold text-foreground">{avgInbound}</p>
                  <p className="text-xs text-muted-foreground">Mbps</p>
                </div>
                <div className="p-2 bg-primary/10 rounded-lg">
                  <Activity className="text-primary" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card/50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-muted-foreground">Active Connections</p>
                  <p className="text-2xl font-bold text-foreground">{topTalkers.reduce((sum, t) => sum + t.connections, 0)}</p>
                  <p className="text-xs text-muted-foreground">sessions</p>
                </div>
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <Monitor className="text-orange-500" size={20} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bandwidth Chart */}
        <Card>
          <CardHeader className="py-3 px-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Activity size={16} className="text-primary" />
                Real-time Bandwidth
                {isLive && (
                  <Badge variant="outline" className="text-green-500 border-green-500/30 text-xs">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1 animate-pulse" />
                    LIVE
                  </Badge>
                )}
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={bandwidthData}>
                <defs>
                  <linearGradient id="inboundGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outboundGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--chart-2))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--chart-2))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="time" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                />
                <YAxis 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                  axisLine={{ stroke: 'hsl(var(--border))' }}
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '6px',
                    fontSize: '12px',
                  }}
                  labelStyle={{ color: 'hsl(var(--foreground))' }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="inbound"
                  name="Inbound (Mbps)"
                  stroke="hsl(var(--chart-1))"
                  fill="url(#inboundGradient)"
                  strokeWidth={2}
                />
                <Area
                  type="monotone"
                  dataKey="outbound"
                  name="Outbound (Mbps)"
                  stroke="hsl(var(--chart-2))"
                  fill="url(#outboundGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="talkers" className="w-full">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="talkers" className="text-xs">Top Talkers</TabsTrigger>
            <TabsTrigger value="protocols" className="text-xs">Protocols</TabsTrigger>
            <TabsTrigger value="ports" className="text-xs">Ports</TabsTrigger>
            <TabsTrigger value="geo" className="text-xs">Geographic</TabsTrigger>
          </TabsList>

          {/* Top Talkers */}
          <TabsContent value="talkers" className="mt-3">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium">Top Network Talkers</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-2">
                  {topTalkers.map((talker, index) => (
                    <div
                      key={talker.ip}
                      className="flex items-center justify-between p-3 bg-muted/30 rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary text-xs font-bold rounded">
                          {index + 1}
                        </span>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-foreground">{talker.hostname}</span>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">{talker.country}</Badge>
                          </div>
                          <span className="text-xs text-muted-foreground font-mono">{talker.ip}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-6 text-xs">
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-green-500">
                            <ArrowDown size={12} />
                            <span>{talker.inbound} MB</span>
                          </div>
                          <span className="text-muted-foreground">Inbound</span>
                        </div>
                        <div className="text-right">
                          <div className="flex items-center gap-1 text-blue-500">
                            <ArrowUp size={12} />
                            <span>{talker.outbound} MB</span>
                          </div>
                          <span className="text-muted-foreground">Outbound</span>
                        </div>
                        <div className="text-right">
                          <div className="text-foreground font-medium">{talker.connections}</div>
                          <span className="text-muted-foreground">Connections</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Protocol Distribution */}
          <TabsContent value="protocols" className="mt-3">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Protocol Distribution</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={protocolData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={2}
                        dataKey="value"
                      >
                        {protocolData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value}%`, 'Traffic']}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="py-3 px-4">
                  <CardTitle className="text-sm font-medium">Protocol Breakdown</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-3">
                    {protocolData.map((protocol) => (
                      <div key={protocol.name} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{protocol.name}</span>
                          <span className="text-muted-foreground">{protocol.value}%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${protocol.value}%`,
                              backgroundColor: protocol.color,
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Port Distribution */}
          <TabsContent value="ports" className="mt-3">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium">Traffic by Port</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={portData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      type="number"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      dataKey="port"
                      type="category"
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                      width={60}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(var(--popover))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '6px',
                        fontSize: '12px',
                      }}
                      formatter={(value: number, name: string) => [
                        `${value} MB`,
                        name === 'traffic' ? 'Traffic' : name
                      ]}
                    />
                    <Bar 
                      dataKey="traffic" 
                      fill="hsl(var(--primary))" 
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Geographic Distribution */}
          <TabsContent value="geo" className="mt-3">
            <Card>
              <CardHeader className="py-3 px-4">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Globe size={16} className="text-primary" />
                  Traffic by Country
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    {geoData.map((geo, index) => (
                      <div
                        key={geo.code}
                        className="flex items-center justify-between p-3 bg-muted/30 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 flex items-center justify-center bg-primary/10 text-primary text-xs font-bold rounded">
                            {index + 1}
                          </span>
                          <div>
                            <span className="font-medium text-sm text-foreground">{geo.country}</span>
                            <Badge variant="outline" className="ml-2 text-[10px] px-1.5 py-0">{geo.code}</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-medium text-foreground">{geo.traffic} MB</div>
                          <div className="text-xs text-muted-foreground">{geo.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={geoData}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="percentage"
                        label={({ code, percentage }) => `${code}: ${percentage}%`}
                        labelLine={false}
                      >
                        {geoData.map((_, index) => {
                          const geoColors = ['#2e9e5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#94a3b8'];
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={geoColors[index % geoColors.length]} 
                            />
                          );
                        })}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--popover))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '6px',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`${value}%`, 'Traffic']}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default TrafficAnalysis;
