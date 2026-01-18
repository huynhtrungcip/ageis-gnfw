import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Globe, 
  Plus,
  RefreshCw,
  Activity,
  Check,
  X,
  Network,
  BarChart3,
  Edit,
  Trash2,
  Zap,
  Search
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FortiToggle } from '@/components/ui/forti-toggle';

// SD-WAN Interfaces
interface SDWANInterface {
  id: string;
  name: string;
  interface: string;
  gateway: string;
  status: 'up' | 'down' | 'degraded';
  priority: number;
  weight: number;
  cost: number;
  latency: number;
  jitter: number;
  packetLoss: number;
  bandwidth: { in: number; out: number; max: number };
  slaStatus: 'pass' | 'fail' | 'warning';
}

const mockInterfaces: SDWANInterface[] = [
  { id: 'sdwan-1', name: 'wan1', interface: 'port1', gateway: '203.0.113.1', status: 'up', priority: 1, weight: 100, cost: 10, latency: 12, jitter: 2, packetLoss: 0, bandwidth: { in: 450, out: 280, max: 1000 }, slaStatus: 'pass' },
  { id: 'sdwan-2', name: 'wan2', interface: 'port2', gateway: '198.51.100.1', status: 'up', priority: 2, weight: 50, cost: 20, latency: 28, jitter: 5, packetLoss: 0.1, bandwidth: { in: 180, out: 120, max: 500 }, slaStatus: 'pass' },
  { id: 'sdwan-3', name: 'wan3-lte', interface: 'usb0', gateway: '100.64.0.1', status: 'up', priority: 3, weight: 10, cost: 100, latency: 65, jitter: 15, packetLoss: 0.5, bandwidth: { in: 45, out: 20, max: 100 }, slaStatus: 'warning' },
];

// SD-WAN Rules
interface SDWANRule {
  id: string;
  name: string;
  source: string;
  destination: string;
  service: string;
  mode: 'priority' | 'load-balance' | 'sla' | 'manual';
  members: string[];
  slaTarget?: string;
  enabled: boolean;
  hits: number;
}

const mockRules: SDWANRule[] = [
  { id: 'rule-1', name: 'VoIP-Traffic', source: 'all', destination: 'all', service: 'SIP/RTP', mode: 'sla', members: ['wan1', 'wan2'], slaTarget: 'voice-sla', enabled: true, hits: 15420 },
  { id: 'rule-2', name: 'Video-Conf', source: 'LAN', destination: 'all', service: 'MS365/Teams', mode: 'sla', members: ['wan1', 'wan2'], slaTarget: 'video-sla', enabled: true, hits: 8930 },
  { id: 'rule-3', name: 'Backup-Traffic', source: 'all', destination: 'Backup-Servers', service: 'any', mode: 'manual', members: ['wan2'], enabled: true, hits: 4521 },
  { id: 'rule-4', name: 'General-Traffic', source: 'all', destination: 'all', service: 'any', mode: 'load-balance', members: ['wan1', 'wan2', 'wan3-lte'], enabled: true, hits: 125890 },
];

// SLA Profiles
interface SLAProfile {
  id: string;
  name: string;
  probeServer: string;
  probeMode: 'ping' | 'http' | 'dns' | 'tcp';
  interval: number;
  latencyThreshold: number;
  jitterThreshold: number;
  packetLossThreshold: number;
  linkStatus: { member: string; status: 'pass' | 'fail' }[];
}

const mockSLAs: SLAProfile[] = [
  { id: 'sla-1', name: 'voice-sla', probeServer: '8.8.8.8', probeMode: 'ping', interval: 500, latencyThreshold: 100, jitterThreshold: 30, packetLossThreshold: 1, linkStatus: [{ member: 'wan1', status: 'pass' }, { member: 'wan2', status: 'pass' }, { member: 'wan3-lte', status: 'fail' }] },
  { id: 'sla-2', name: 'video-sla', probeServer: '1.1.1.1', probeMode: 'ping', interval: 500, latencyThreshold: 150, jitterThreshold: 50, packetLossThreshold: 2, linkStatus: [{ member: 'wan1', status: 'pass' }, { member: 'wan2', status: 'pass' }, { member: 'wan3-lte', status: 'pass' }] },
  { id: 'sla-3', name: 'default-sla', probeServer: '208.67.222.222', probeMode: 'dns', interval: 1000, latencyThreshold: 250, jitterThreshold: 100, packetLossThreshold: 5, linkStatus: [{ member: 'wan1', status: 'pass' }, { member: 'wan2', status: 'pass' }, { member: 'wan3-lte', status: 'pass' }] },
];

const SDWAN = () => {
  const [activeTab, setActiveTab] = useState('zones');
  const [interfaces] = useState<SDWANInterface[]>(mockInterfaces);
  const [rules, setRules] = useState<SDWANRule[]>(mockRules);
  const [slas] = useState<SLAProfile[]>(mockSLAs);

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r =>
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
  };

  // Stats
  const stats = {
    activeMembers: interfaces.filter(i => i.status === 'up').length,
    totalBandwidth: Math.round(interfaces.reduce((a, i) => a + i.bandwidth.in, 0)),
    avgLatency: Math.round(interfaces.reduce((a, i) => a + i.latency, 0) / interfaces.length),
    activeRules: rules.filter(r => r.enabled).length,
  };

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <Globe size={14} />
            <span className="font-semibold">SD-WAN</span>
            <span className="text-[10px] text-[#888]">Software-Defined Wide Area Network</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn primary">
            <Plus size={12} />
            <span>Create New</span>
          </button>
          <button className="forti-toolbar-btn">
            <Edit size={12} />
            <span>Edit</span>
          </button>
          <button className="forti-toolbar-btn">
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn">
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input type="text" placeholder="Search..." />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-0 border-x border-[#ddd]">
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Network size={14} className="text-green-600" />
            <span className="text-lg font-bold text-green-600">{stats.activeMembers}</span>
            <span className="text-[11px] text-[#666]">Active Members</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <BarChart3 size={14} className="text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{stats.totalBandwidth}</span>
            <span className="text-[11px] text-[#666]">Mbps Total</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Activity size={14} className="text-purple-600" />
            <span className="text-lg font-bold text-purple-600">{stats.avgLatency}</span>
            <span className="text-[11px] text-[#666]">ms Avg Latency</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white">
            <Zap size={14} className="text-orange-600" />
            <span className="text-lg font-bold text-orange-600">{stats.activeRules}</span>
            <span className="text-[11px] text-[#666]">Active Rules</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-[#f0f0f0] border-x border-b border-[#ddd]">
            <TabsList className="bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger 
                value="zones" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                SD-WAN Zones
              </TabsTrigger>
              <TabsTrigger 
                value="rules" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                SD-WAN Rules
              </TabsTrigger>
              <TabsTrigger 
                value="sla" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                Performance SLA
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Zones Tab */}
          <TabsContent value="zones" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Status</th>
                  <th>Name</th>
                  <th>Interface</th>
                  <th>Gateway</th>
                  <th className="w-20">Latency</th>
                  <th className="w-20">Jitter</th>
                  <th className="w-20">Pkt Loss</th>
                  <th className="w-24">Bandwidth In</th>
                  <th className="w-20">SLA</th>
                  <th className="w-16">Priority</th>
                </tr>
              </thead>
              <tbody>
                {interfaces.map((iface) => (
                  <tr key={iface.id}>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        iface.status === 'up' ? 'bg-green-100 text-green-700 border-green-200' :
                        iface.status === 'degraded' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      )}>
                        {iface.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-medium text-[#333]">{iface.name}</td>
                    <td className="text-[#666]">{iface.interface}</td>
                    <td className="mono text-[#666]">{iface.gateway}</td>
                    <td className="text-[#666]">{iface.latency} ms</td>
                    <td className="text-[#666]">{iface.jitter} ms</td>
                    <td className="text-[#666]">{iface.packetLoss}%</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-[#e0e0e0] rounded overflow-hidden">
                          <div 
                            className="h-full bg-[hsl(142,70%,35%)]" 
                            style={{ width: `${(iface.bandwidth.in / iface.bandwidth.max) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#666]">{iface.bandwidth.in}/{iface.bandwidth.max}</span>
                      </div>
                    </td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        iface.slaStatus === 'pass' ? 'bg-green-100 text-green-700 border-green-200' :
                        iface.slaStatus === 'warning' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      )}>
                        {iface.slaStatus.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-center text-[#666]">{iface.priority}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Status</th>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Service</th>
                  <th>Mode</th>
                  <th>Members</th>
                  <th className="text-right">Hits</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((rule) => (
                  <tr key={rule.id} className={cn(!rule.enabled && "opacity-60")}>
                    <td>
                      <FortiToggle 
                        enabled={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        size="sm"
                      />
                    </td>
                    <td className="font-medium text-[#333]">{rule.name}</td>
                    <td className="text-[#666]">{rule.source}</td>
                    <td className="text-[#666]">{rule.destination}</td>
                    <td className="text-[#666]">{rule.service}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        rule.mode === 'sla' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        rule.mode === 'load-balance' ? 'bg-cyan-100 text-cyan-700 border-cyan-200' :
                        rule.mode === 'priority' ? 'bg-amber-100 text-amber-700 border-amber-200' :
                        'bg-gray-100 text-gray-700 border-gray-200'
                      )}>
                        {rule.mode}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        {rule.members.map((m, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#f0f0f0] text-[#666] border border-[#ddd]">
                            {m}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="text-right mono text-[#666]">{rule.hits.toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Edit size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* SLA Tab */}
          <TabsContent value="sla" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Probe Server</th>
                  <th>Mode</th>
                  <th>Interval</th>
                  <th>Latency Threshold</th>
                  <th>Jitter Threshold</th>
                  <th>Pkt Loss Threshold</th>
                  <th>Link Status</th>
                </tr>
              </thead>
              <tbody>
                {slas.map((sla) => (
                  <tr key={sla.id}>
                    <td className="font-medium text-[#333]">{sla.name}</td>
                    <td className="mono text-[#666]">{sla.probeServer}</td>
                    <td>
                      <span className="forti-tag bg-blue-100 text-blue-700 border-blue-200">
                        {sla.probeMode.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-[#666]">{sla.interval} ms</td>
                    <td className="text-[#666]">{sla.latencyThreshold} ms</td>
                    <td className="text-[#666]">{sla.jitterThreshold} ms</td>
                    <td className="text-[#666]">{sla.packetLossThreshold}%</td>
                    <td>
                      <div className="flex gap-1">
                        {sla.linkStatus.map((link, i) => (
                          <span 
                            key={i} 
                            className={cn(
                              "text-[10px] px-1.5 py-0.5 border flex items-center gap-1",
                              link.status === 'pass' 
                                ? 'bg-green-100 text-green-700 border-green-200' 
                                : 'bg-red-100 text-red-700 border-red-200'
                            )}
                          >
                            {link.status === 'pass' ? <Check size={10} /> : <X size={10} />}
                            {link.member}
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default SDWAN;
