import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { 
  Activity, ArrowDown, ArrowUp, Globe, Monitor,
  Pause, Play, Download
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import { toast } from 'sonner';

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

const protocolData = [
  { name: 'HTTPS', value: 45, color: '#2e9e5e' },
  { name: 'HTTP', value: 15, color: '#3b82f6' },
  { name: 'SSH', value: 12, color: '#f59e0b' },
  { name: 'DNS', value: 10, color: '#8b5cf6' },
  { name: 'SMTP', value: 8, color: '#ef4444' },
  { name: 'Other', value: 10, color: '#94a3b8' },
];

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

const CHART_COLORS = ['#2e9e5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ef4444', '#06b6d4', '#ec4899', '#94a3b8'];

const TrafficAnalysis = () => {
  const { demoMode } = useDemoMode();
  const [bandwidthData, setBandwidthData] = useState(demoMode ? generateBandwidthData() : []);
  const [topTalkers, setTopTalkers] = useState(demoMode ? generateTopTalkers() : []);
  const [isLive, setIsLive] = useState(true);
  const [timeRange, setTimeRange] = useState('1h');
  const [selectedInterface, setSelectedInterface] = useState('all');
  const [activeTab, setActiveTab] = useState<'talkers' | 'protocols' | 'ports' | 'geo'>('talkers');

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
  }, [isLive, demoMode]);

  const totalInbound = bandwidthData.reduce((sum, d) => sum + d.inbound, 0);
  const totalOutbound = bandwidthData.reduce((sum, d) => sum + d.outbound, 0);
  const avgInbound = bandwidthData.length ? Math.round(totalInbound / bandwidthData.length) : 0;
  const avgOutbound = bandwidthData.length ? Math.round(totalOutbound / bandwidthData.length) : 0;

  const handleExport = () => {
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
    toast.success('Traffic data exported');
  };

  const tabs = [
    { key: 'talkers' as const, label: 'Top Talkers' },
    { key: 'protocols' as const, label: 'Protocols' },
    { key: 'ports' as const, label: 'Ports' },
    { key: 'geo' as const, label: 'Geographic' },
  ];

  return (
    <Shell>
      <div className="space-y-3">
        {/* Page Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <Activity size={14} />
            <span>Traffic Analysis</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="forti-toolbar">
          <span className="forti-label-inline mr-1">Interface:</span>
          <select
            className="forti-select w-28"
            value={selectedInterface}
            onChange={e => setSelectedInterface(e.target.value)}
          >
            <option value="all">All Interfaces</option>
            <option value="wan">WAN</option>
            <option value="lan">LAN</option>
            <option value="dmz">DMZ</option>
          </select>
          <div className="forti-toolbar-separator" />
          <span className="forti-label-inline mr-1">Period:</span>
          <select
            className="forti-select w-20"
            value={timeRange}
            onChange={e => setTimeRange(e.target.value)}
          >
            <option value="5m">5 min</option>
            <option value="15m">15 min</option>
            <option value="1h">1 hour</option>
            <option value="24h">24 hours</option>
          </select>
          <div className="forti-toolbar-separator" />
          <button
            className={`forti-toolbar-btn ${isLive ? 'primary' : ''}`}
            onClick={() => setIsLive(!isLive)}
          >
            {isLive ? <Pause size={12} /> : <Play size={12} />}
            {isLive ? 'Pause' : 'Resume'}
          </button>
          <button className="forti-toolbar-btn" onClick={handleExport}>
            <Download size={12} />
            Export
          </button>
        </div>

        {/* Summary Strip */}
        <div className="summary-strip">
          <div className="summary-item">
            <ArrowDown size={16} className="text-green-600" />
            <div>
              <div className="summary-count text-green-700">{bandwidthData[bandwidthData.length - 1]?.inbound || 0}</div>
              <div className="summary-label">Inbound (Mbps)</div>
            </div>
          </div>
          <div className="forti-toolbar-separator h-8" />
          <div className="summary-item">
            <ArrowUp size={16} className="text-blue-600" />
            <div>
              <div className="summary-count text-blue-700">{bandwidthData[bandwidthData.length - 1]?.outbound || 0}</div>
              <div className="summary-label">Outbound (Mbps)</div>
            </div>
          </div>
          <div className="forti-toolbar-separator h-8" />
          <div className="summary-item">
            <Activity size={16} className="text-[hsl(var(--forti-green))]" />
            <div>
              <div className="summary-count">{avgInbound} / {avgOutbound}</div>
              <div className="summary-label">Avg In / Out</div>
            </div>
          </div>
          <div className="forti-toolbar-separator h-8" />
          <div className="summary-item">
            <Monitor size={16} className="text-orange-600" />
            <div>
              <div className="summary-count text-orange-700">{topTalkers.reduce((sum, t) => sum + t.connections, 0)}</div>
              <div className="summary-label">Active Sessions</div>
            </div>
          </div>
        </div>

        {/* Bandwidth Chart */}
        <div className="section">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <Activity size={12} />
              <span>Real-time Bandwidth</span>
              {isLive && (
                <span className="inline-flex items-center gap-1 text-[10px] bg-white/20 px-1.5 py-0.5 rounded">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
                  LIVE
                </span>
              )}
            </div>
          </div>
          <div className="section-body">
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={bandwidthData}>
                <defs>
                  <linearGradient id="inboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2e9e5e" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#2e9e5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="outboundGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                <XAxis dataKey="time" tick={{ fill: '#666', fontSize: 10 }} axisLine={{ stroke: '#ccc' }} />
                <YAxis tick={{ fill: '#666', fontSize: 10 }} axisLine={{ stroke: '#ccc' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="inbound" name="Inbound (Mbps)" stroke="#2e9e5e" fill="url(#inboundGrad)" strokeWidth={2} />
                <Area type="monotone" dataKey="outbound" name="Outbound (Mbps)" stroke="#3b82f6" fill="url(#outboundGrad)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="forti-view-toggle">
          {tabs.map(tab => (
            <button
              key={tab.key}
              className={`forti-view-btn ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Top Talkers */}
        {activeTab === 'talkers' && (
          <div className="section">
            <div className="section-header">
              <span>Top Network Talkers</span>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Host</th>
                  <th>IP Address</th>
                  <th>Country</th>
                  <th>Inbound (MB)</th>
                  <th>Outbound (MB)</th>
                  <th>Connections</th>
                </tr>
              </thead>
              <tbody>
                {topTalkers.map((t, i) => (
                  <tr key={t.ip}>
                    <td className="text-center font-semibold">{i + 1}</td>
                    <td className="font-medium">{t.hostname}</td>
                    <td className="mono">{t.ip}</td>
                    <td>
                      <span className="forti-tag enabled">{t.country}</span>
                    </td>
                    <td className="text-green-700 font-medium">{t.inbound.toLocaleString()}</td>
                    <td className="text-blue-700 font-medium">{t.outbound.toLocaleString()}</td>
                    <td>{t.connections}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Protocols */}
        {activeTab === 'protocols' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="section">
              <div className="section-header">
                <span>Protocol Distribution</span>
              </div>
              <div className="section-body">
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie
                      data={protocolData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {protocolData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '11px' }} formatter={(v: number) => [`${v}%`, 'Traffic']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="section">
              <div className="section-header">
                <span>Protocol Breakdown</span>
              </div>
              <div className="section-body space-y-2">
                {protocolData.map((p) => (
                  <div key={p.name}>
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="text-[hsl(var(--forti-text))]">{p.name}</span>
                      <span className="text-[hsl(var(--forti-text-secondary))]">{p.value}%</span>
                    </div>
                    <div className="forti-progress">
                      <div className="forti-progress-bar" style={{ width: `${p.value}%`, backgroundColor: p.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Ports */}
        {activeTab === 'ports' && (
          <div className="section">
            <div className="section-header">
              <span>Traffic by Port</span>
            </div>
            <div className="section-body">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={portData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#ddd" />
                  <XAxis type="number" tick={{ fill: '#666', fontSize: 10 }} axisLine={{ stroke: '#ccc' }} />
                  <YAxis dataKey="port" type="category" tick={{ fill: '#666', fontSize: 10 }} axisLine={{ stroke: '#ccc' }} width={60} />
                  <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '11px' }} formatter={(v: number) => [`${v} MB`, 'Traffic']} />
                  <Bar dataKey="traffic" fill="hsl(var(--forti-green))" radius={[0, 2, 2, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Geographic */}
        {activeTab === 'geo' && (
          <div className="grid grid-cols-2 gap-3">
            <div className="section">
              <div className="section-header">
                <div className="flex items-center gap-2">
                  <Globe size={12} />
                  <span>Traffic by Country</span>
                </div>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Country</th>
                    <th>Code</th>
                    <th>Traffic (MB)</th>
                    <th>Share</th>
                  </tr>
                </thead>
                <tbody>
                  {geoData.map((g, i) => (
                    <tr key={g.code}>
                      <td className="text-center font-semibold">{i + 1}</td>
                      <td className="font-medium">{g.country}</td>
                      <td><span className="forti-tag enabled">{g.code}</span></td>
                      <td>{g.traffic.toLocaleString()}</td>
                      <td>
                        <div className="flex items-center gap-2">
                          <div className="forti-progress flex-1">
                            <div className="forti-progress-bar" style={{ width: `${g.percentage}%`, backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }} />
                          </div>
                          <span className="text-[11px] w-8 text-right">{g.percentage}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="section">
              <div className="section-header">
                <span>Distribution Chart</span>
              </div>
              <div className="section-body">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={geoData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={95}
                      paddingAngle={2}
                      dataKey="percentage"
                      label={({ code, percentage }) => `${code}: ${percentage}%`}
                      labelLine={false}
                    >
                      {geoData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', fontSize: '11px' }} formatter={(v: number) => [`${v}%`, 'Traffic']} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default TrafficAnalysis;
