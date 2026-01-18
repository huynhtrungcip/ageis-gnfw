import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Globe, 
  Plus,
  RefreshCw,
  ArrowRight,
  Server,
  Activity,
  Clock,
  AlertTriangle,
  Check,
  X,
  Wifi,
  Network,
  BarChart3,
  Settings,
  Edit,
  Trash2,
  Play,
  Pause,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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
  { 
    id: 'sdwan-1', 
    name: 'wan1', 
    interface: 'port1', 
    gateway: '203.0.113.1', 
    status: 'up', 
    priority: 1, 
    weight: 100, 
    cost: 10,
    latency: 12,
    jitter: 2,
    packetLoss: 0,
    bandwidth: { in: 450, out: 280, max: 1000 },
    slaStatus: 'pass'
  },
  { 
    id: 'sdwan-2', 
    name: 'wan2', 
    interface: 'port2', 
    gateway: '198.51.100.1', 
    status: 'up', 
    priority: 2, 
    weight: 50, 
    cost: 20,
    latency: 28,
    jitter: 5,
    packetLoss: 0.1,
    bandwidth: { in: 180, out: 120, max: 500 },
    slaStatus: 'pass'
  },
  { 
    id: 'sdwan-3', 
    name: 'wan3-lte', 
    interface: 'usb0', 
    gateway: '100.64.0.1', 
    status: 'up', 
    priority: 3, 
    weight: 10, 
    cost: 100,
    latency: 65,
    jitter: 15,
    packetLoss: 0.5,
    bandwidth: { in: 45, out: 20, max: 100 },
    slaStatus: 'warning'
  },
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
  { 
    id: 'sla-1', 
    name: 'voice-sla', 
    probeServer: '8.8.8.8', 
    probeMode: 'ping', 
    interval: 500,
    latencyThreshold: 100,
    jitterThreshold: 30,
    packetLossThreshold: 1,
    linkStatus: [
      { member: 'wan1', status: 'pass' },
      { member: 'wan2', status: 'pass' },
      { member: 'wan3-lte', status: 'fail' },
    ]
  },
  { 
    id: 'sla-2', 
    name: 'video-sla', 
    probeServer: '1.1.1.1', 
    probeMode: 'ping', 
    interval: 500,
    latencyThreshold: 150,
    jitterThreshold: 50,
    packetLossThreshold: 2,
    linkStatus: [
      { member: 'wan1', status: 'pass' },
      { member: 'wan2', status: 'pass' },
      { member: 'wan3-lte', status: 'pass' },
    ]
  },
  { 
    id: 'sla-3', 
    name: 'default-sla', 
    probeServer: '208.67.222.222', 
    probeMode: 'dns', 
    interval: 1000,
    latencyThreshold: 250,
    jitterThreshold: 100,
    packetLossThreshold: 5,
    linkStatus: [
      { member: 'wan1', status: 'pass' },
      { member: 'wan2', status: 'pass' },
      { member: 'wan3-lte', status: 'pass' },
    ]
  },
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up': case 'pass': return 'text-emerald-400';
      case 'down': case 'fail': return 'text-red-400';
      case 'degraded': case 'warning': return 'text-yellow-400';
      default: return 'text-muted-foreground';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'up': case 'pass': return 'bg-emerald-500';
      case 'down': case 'fail': return 'bg-red-500';
      case 'degraded': case 'warning': return 'bg-yellow-500';
      default: return 'bg-muted';
    }
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">SD-WAN</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Software-Defined Wide Area Network Configuration</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw size={14} />
              Refresh
            </Button>
            <Button size="sm" className="gap-1.5 bg-[#4caf50] hover:bg-[#43a047]">
              <Plus size={14} />
              Create New
            </Button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="section p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Network size={18} className="text-emerald-400" />
              </div>
              <span className="text-2xl font-bold text-emerald-400">{interfaces.filter(i => i.status === 'up').length}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Active Members</div>
          </div>
          <div className="section p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-blue-500/20">
                <BarChart3 size={18} className="text-blue-400" />
              </div>
              <span className="text-2xl font-bold">
                {Math.round(interfaces.reduce((a, i) => a + i.bandwidth.in, 0))} Mbps
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Total Bandwidth In</div>
          </div>
          <div className="section p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Activity size={18} className="text-purple-400" />
              </div>
              <span className="text-2xl font-bold">
                {Math.round(interfaces.reduce((a, i) => a + i.latency, 0) / interfaces.length)} ms
              </span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Avg Latency</div>
          </div>
          <div className="section p-4">
            <div className="flex items-center justify-between">
              <div className="p-2 rounded-lg bg-amber-500/20">
                <Zap size={18} className="text-amber-400" />
              </div>
              <span className="text-2xl font-bold">{rules.filter(r => r.enabled).length}</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">Active Rules</div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1e293b]">
            <TabsTrigger value="zones" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <Globe size={14} />
              SD-WAN Zones
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <ArrowRight size={14} />
              SD-WAN Rules
            </TabsTrigger>
            <TabsTrigger value="sla" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <Activity size={14} />
              Performance SLA
            </TabsTrigger>
          </TabsList>

          {/* Zones Tab - Interface Status */}
          <TabsContent value="zones" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {interfaces.map((iface) => (
                <div key={iface.id} className={cn(
                  "section p-4",
                  iface.status === 'up' && "border-emerald-500/30",
                  iface.status === 'degraded' && "border-yellow-500/30",
                  iface.status === 'down' && "border-red-500/30"
                )}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-12 h-12 rounded-lg flex items-center justify-center",
                        iface.status === 'up' ? "bg-emerald-500/20" : 
                        iface.status === 'degraded' ? "bg-yellow-500/20" : "bg-red-500/20"
                      )}>
                        <Wifi size={24} className={getStatusColor(iface.status)} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold">{iface.name}</h3>
                          <span className={cn("w-2 h-2 rounded-full", getStatusBg(iface.status))} />
                          <span className={cn("text-xs", getStatusColor(iface.status))}>
                            {iface.status.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {iface.interface} → {iface.gateway}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 text-center">
                      <div>
                        <div className="text-lg font-bold">{iface.latency}ms</div>
                        <div className="text-[10px] text-muted-foreground">Latency</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{iface.jitter}ms</div>
                        <div className="text-[10px] text-muted-foreground">Jitter</div>
                      </div>
                      <div>
                        <div className="text-lg font-bold">{iface.packetLoss}%</div>
                        <div className="text-[10px] text-muted-foreground">Packet Loss</div>
                      </div>
                      <div>
                        <span className={cn(
                          "text-[10px] px-2 py-1 rounded border",
                          iface.slaStatus === 'pass' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                          iface.slaStatus === 'warning' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                          'bg-red-500/20 text-red-400 border-red-500/30'
                        )}>
                          SLA {iface.slaStatus.toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Bandwidth In</span>
                        <span>{iface.bandwidth.in} / {iface.bandwidth.max} Mbps</span>
                      </div>
                      <Progress value={(iface.bandwidth.in / iface.bandwidth.max) * 100} className="h-2" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Bandwidth Out</span>
                        <span>{iface.bandwidth.out} / {iface.bandwidth.max} Mbps</span>
                      </div>
                      <Progress value={(iface.bandwidth.out / iface.bandwidth.max) * 100} className="h-2" />
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-4 pt-3 border-t border-border text-xs text-muted-foreground">
                    <span>Priority: <span className="text-foreground font-medium">{iface.priority}</span></span>
                    <span>Weight: <span className="text-foreground font-medium">{iface.weight}</span></span>
                    <span>Cost: <span className="text-foreground font-medium">{iface.cost}</span></span>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-4 mt-4">
            <div className="section">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-14">Status</th>
                    <th>Name</th>
                    <th>Source</th>
                    <th>Destination</th>
                    <th>Service</th>
                    <th>Mode</th>
                    <th>Members</th>
                    <th className="text-right">Hits</th>
                    <th className="w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rules.map((rule) => (
                    <tr key={rule.id} className={cn(!rule.enabled && "opacity-50")}>
                      <td>
                        <Switch
                          checked={rule.enabled}
                          onCheckedChange={() => handleToggleRule(rule.id)}
                          className="scale-75"
                        />
                      </td>
                      <td className="font-medium">{rule.name}</td>
                      <td className="text-xs text-muted-foreground">{rule.source}</td>
                      <td className="text-xs text-muted-foreground">{rule.destination}</td>
                      <td className="text-xs text-muted-foreground">{rule.service}</td>
                      <td>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded border",
                          rule.mode === 'sla' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                          rule.mode === 'load-balance' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                          rule.mode === 'priority' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                          'bg-gray-500/20 text-gray-400 border-gray-500/30'
                        )}>
                          {rule.mode}
                        </span>
                      </td>
                      <td>
                        <div className="flex gap-1">
                          {rule.members.map((m, i) => (
                            <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">
                              {m}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="text-right font-mono text-muted-foreground">
                        {rule.hits.toLocaleString()}
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                            <Edit size={12} />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-400">
                            <Trash2 size={12} />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Performance SLA Tab */}
          <TabsContent value="sla" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {slas.map((sla) => (
                <div key={sla.id} className="section p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Activity size={18} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{sla.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {sla.probeMode.toUpperCase()} probe to {sla.probeServer}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm"><Edit size={14} /></Button>
                      <Button variant="ghost" size="sm" className="text-red-400"><Trash2 size={14} /></Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-4 gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">Probe Interval</div>
                      <div className="text-sm font-medium">{sla.interval}ms</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">Max Latency</div>
                      <div className="text-sm font-medium">{sla.latencyThreshold}ms</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">Max Jitter</div>
                      <div className="text-sm font-medium">{sla.jitterThreshold}ms</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">Max Packet Loss</div>
                      <div className="text-sm font-medium">{sla.packetLossThreshold}%</div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="text-[10px] text-muted-foreground uppercase mb-2">Member Status</div>
                    <div className="flex gap-3">
                      {sla.linkStatus.map((link, i) => (
                        <div key={i} className={cn(
                          "flex items-center gap-2 px-3 py-1.5 rounded border",
                          link.status === 'pass' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-red-500/10 border-red-500/30'
                        )}>
                          {link.status === 'pass' ? (
                            <Check size={12} className="text-emerald-400" />
                          ) : (
                            <X size={12} className="text-red-400" />
                          )}
                          <span className="text-xs">{link.member}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default SDWAN;
