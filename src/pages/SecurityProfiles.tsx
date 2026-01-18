import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Shield, 
  Search, 
  Plus,
  RefreshCw,
  Globe,
  Bug,
  Lock,
  Layers,
  FileText,
  AlertTriangle,
  Check,
  X,
  Ban,
  Eye,
  Filter,
  Settings,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

// AntiVirus Profiles
interface AVProfile {
  id: string;
  name: string;
  comment: string;
  httpScan: boolean;
  ftpScan: boolean;
  imapScan: boolean;
  pop3Scan: boolean;
  smtpScan: boolean;
  smbScan: boolean;
  action: 'block' | 'monitor' | 'quarantine';
  emulatorEnabled: boolean;
  analyticsEnabled: boolean;
}

const mockAVProfiles: AVProfile[] = [
  { id: 'av-1', name: 'default', comment: 'Default antivirus profile', httpScan: true, ftpScan: true, imapScan: true, pop3Scan: true, smtpScan: true, smbScan: false, action: 'block', emulatorEnabled: true, analyticsEnabled: true },
  { id: 'av-2', name: 'high-security', comment: 'Maximum protection profile', httpScan: true, ftpScan: true, imapScan: true, pop3Scan: true, smtpScan: true, smbScan: true, action: 'quarantine', emulatorEnabled: true, analyticsEnabled: true },
  { id: 'av-3', name: 'monitor-only', comment: 'Detection without blocking', httpScan: true, ftpScan: true, imapScan: true, pop3Scan: true, smtpScan: true, smbScan: false, action: 'monitor', emulatorEnabled: false, analyticsEnabled: true },
];

// Web Filter Profiles
interface WebFilterProfile {
  id: string;
  name: string;
  comment: string;
  mode: 'proxy' | 'flow' | 'dns';
  action: 'block' | 'warning' | 'monitor' | 'authenticate';
  categories: { name: string; action: 'allow' | 'block' | 'monitor' | 'warning'; }[];
  urlFiltering: boolean;
  safeSearch: boolean;
  youtubeRestrict: boolean;
}

const webCategories = [
  'Adult/Mature Content', 'Malware', 'Phishing', 'Spam URLs', 'Gambling', 
  'Games', 'Social Networking', 'Streaming Media', 'Peer-to-Peer', 'Proxy Avoidance',
  'Hacking', 'Illegal Drugs', 'Weapons', 'Violence', 'Alcohol'
];

const mockWebProfiles: WebFilterProfile[] = [
  { 
    id: 'wf-1', 
    name: 'default', 
    comment: 'Default web filter', 
    mode: 'proxy', 
    action: 'block',
    categories: [
      { name: 'Adult/Mature Content', action: 'block' },
      { name: 'Malware', action: 'block' },
      { name: 'Phishing', action: 'block' },
      { name: 'Gambling', action: 'warning' },
      { name: 'Social Networking', action: 'monitor' },
    ],
    urlFiltering: true,
    safeSearch: true,
    youtubeRestrict: false
  },
  { 
    id: 'wf-2', 
    name: 'strict', 
    comment: 'Strict filtering for schools', 
    mode: 'proxy', 
    action: 'block',
    categories: [
      { name: 'Adult/Mature Content', action: 'block' },
      { name: 'Malware', action: 'block' },
      { name: 'Games', action: 'block' },
      { name: 'Streaming Media', action: 'block' },
      { name: 'Social Networking', action: 'block' },
    ],
    urlFiltering: true,
    safeSearch: true,
    youtubeRestrict: true
  },
];

// IPS Signatures
interface IPSSignature {
  id: string;
  sid: number;
  name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  action: 'default' | 'pass' | 'block' | 'reset' | 'monitor';
  enabled: boolean;
  cve?: string;
  target: 'client' | 'server' | 'both';
}

const mockIPSSignatures: IPSSignature[] = [
  { id: 'ips-1', sid: 44228, name: 'Apache.Log4j.Error.Log.Remote.Code.Execution', category: 'Application', severity: 'critical', action: 'block', enabled: true, cve: 'CVE-2021-44228', target: 'server' },
  { id: 'ips-2', sid: 51006, name: 'MS.SMBv3.Compression.Buffer.Overflow', category: 'Network', severity: 'critical', action: 'block', enabled: true, cve: 'CVE-2020-0796', target: 'both' },
  { id: 'ips-3', sid: 48247, name: 'HTTP.Request.Smuggling', category: 'Web', severity: 'high', action: 'block', enabled: true, target: 'server' },
  { id: 'ips-4', sid: 39294, name: 'DNS.Query.Flood.DoS', category: 'DoS', severity: 'high', action: 'block', enabled: true, target: 'server' },
  { id: 'ips-5', sid: 17942, name: 'SSH.Brute.Force.Login', category: 'Brute Force', severity: 'medium', action: 'monitor', enabled: true, target: 'server' },
  { id: 'ips-6', sid: 35213, name: 'TLS.Invalid.Certificate', category: 'SSL/TLS', severity: 'low', action: 'default', enabled: false, target: 'both' },
  { id: 'ips-7', sid: 49021, name: 'Spring4Shell.RCE.Attempt', category: 'Application', severity: 'critical', action: 'block', enabled: true, cve: 'CVE-2022-22965', target: 'server' },
  { id: 'ips-8', sid: 50182, name: 'ProxyShell.Exchange.RCE', category: 'Application', severity: 'critical', action: 'block', enabled: true, cve: 'CVE-2021-34473', target: 'server' },
];

const ipsCategories = ['All', 'Application', 'Network', 'Web', 'DoS', 'Brute Force', 'SSL/TLS', 'Botnet', 'Malware'];

const SecurityProfiles = () => {
  const [activeTab, setActiveTab] = useState('antivirus');
  const [avProfiles] = useState<AVProfile[]>(mockAVProfiles);
  const [webProfiles] = useState<WebFilterProfile[]>(mockWebProfiles);
  const [ipsSignatures, setIpsSignatures] = useState<IPSSignature[]>(mockIPSSignatures);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('all');

  const filteredIPS = ipsSignatures.filter(sig => {
    const matchesSearch = search === '' || 
      sig.name.toLowerCase().includes(search.toLowerCase()) ||
      sig.sid.toString().includes(search) ||
      (sig.cve && sig.cve.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'All' || sig.category === category;
    const matchesSeverity = severity === 'all' || sig.severity === severity;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const handleToggleIPS = (id: string) => {
    setIpsSignatures(prev => prev.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleChangeIPSAction = (id: string, action: IPSSignature['action']) => {
    setIpsSignatures(prev => prev.map(s =>
      s.id === id ? { ...s, action } : s
    ));
    toast.success('Signature action updated');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'high': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'low': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'block': case 'quarantine': return 'text-red-400';
      case 'monitor': case 'warning': return 'text-yellow-400';
      case 'pass': case 'allow': return 'text-emerald-400';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">Security Profiles</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Configure AntiVirus, Web Filter, and IPS protection</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw size={14} />
              Update Definitions
            </Button>
            <Button size="sm" className="gap-1.5 bg-[#4caf50] hover:bg-[#43a047]">
              <Plus size={14} />
              Create New
            </Button>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1e293b]">
            <TabsTrigger value="antivirus" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <Bug size={14} />
              AntiVirus
            </TabsTrigger>
            <TabsTrigger value="webfilter" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <Globe size={14} />
              Web Filter
            </TabsTrigger>
            <TabsTrigger value="ips" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <Shield size={14} />
              IPS Signatures
            </TabsTrigger>
            <TabsTrigger value="appcontrol" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <Layers size={14} />
              Application Control
            </TabsTrigger>
          </TabsList>

          {/* AntiVirus Tab */}
          <TabsContent value="antivirus" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {avProfiles.map((profile) => (
                <div key={profile.id} className="section p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-red-500/20">
                        <Bug size={18} className="text-red-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{profile.name}</h3>
                        <p className="text-xs text-muted-foreground">{profile.comment}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm"><Edit size={14} /></Button>
                      <Button variant="ghost" size="sm"><Copy size={14} /></Button>
                      <Button variant="ghost" size="sm" className="text-red-400"><Trash2 size={14} /></Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-6 gap-4">
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">HTTP</div>
                      <div className={cn("text-xs font-medium", profile.httpScan ? "text-emerald-400" : "text-muted-foreground")}>
                        {profile.httpScan ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">FTP</div>
                      <div className={cn("text-xs font-medium", profile.ftpScan ? "text-emerald-400" : "text-muted-foreground")}>
                        {profile.ftpScan ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">IMAP</div>
                      <div className={cn("text-xs font-medium", profile.imapScan ? "text-emerald-400" : "text-muted-foreground")}>
                        {profile.imapScan ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">POP3</div>
                      <div className={cn("text-xs font-medium", profile.pop3Scan ? "text-emerald-400" : "text-muted-foreground")}>
                        {profile.pop3Scan ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">SMTP</div>
                      <div className={cn("text-xs font-medium", profile.smtpScan ? "text-emerald-400" : "text-muted-foreground")}>
                        {profile.smtpScan ? 'Enabled' : 'Disabled'}
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[10px] text-muted-foreground uppercase">Action</div>
                      <div className={cn("text-xs font-medium", getActionColor(profile.action))}>
                        {profile.action.charAt(0).toUpperCase() + profile.action.slice(1)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-6 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Switch checked={profile.emulatorEnabled} disabled />
                      <span className="text-xs text-muted-foreground">Emulator</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={profile.analyticsEnabled} disabled />
                      <span className="text-xs text-muted-foreground">FortiSandbox</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Web Filter Tab */}
          <TabsContent value="webfilter" className="space-y-4 mt-4">
            <div className="grid gap-4">
              {webProfiles.map((profile) => (
                <div key={profile.id} className="section p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-blue-500/20">
                        <Globe size={18} className="text-blue-400" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold">{profile.name}</h3>
                        <p className="text-xs text-muted-foreground">{profile.comment}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "text-[10px] px-2 py-0.5 rounded border",
                        profile.mode === 'proxy' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                        profile.mode === 'flow' ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' :
                        'bg-amber-500/20 text-amber-400 border-amber-500/30'
                      )}>
                        {profile.mode.toUpperCase()} Mode
                      </span>
                      <Button variant="ghost" size="sm"><Edit size={14} /></Button>
                      <Button variant="ghost" size="sm"><Copy size={14} /></Button>
                    </div>
                  </div>

                  <div className="mt-4">
                    <div className="text-[10px] text-muted-foreground uppercase mb-2">Category Actions</div>
                    <div className="flex flex-wrap gap-2">
                      {profile.categories.map((cat, i) => (
                        <span key={i} className={cn(
                          "text-[10px] px-2 py-1 rounded border",
                          cat.action === 'block' ? 'bg-red-500/10 text-red-400 border-red-500/30' :
                          cat.action === 'warning' ? 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30' :
                          cat.action === 'monitor' ? 'bg-blue-500/10 text-blue-400 border-blue-500/30' :
                          'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        )}>
                          {cat.name}: {cat.action}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 flex items-center gap-6 pt-3 border-t border-border">
                    <div className="flex items-center gap-2">
                      <Switch checked={profile.urlFiltering} disabled />
                      <span className="text-xs text-muted-foreground">URL Filter</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={profile.safeSearch} disabled />
                      <span className="text-xs text-muted-foreground">Safe Search</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Switch checked={profile.youtubeRestrict} disabled />
                      <span className="text-xs text-muted-foreground">YouTube Restrict</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* IPS Tab */}
          <TabsContent value="ips" className="space-y-4 mt-4">
            {/* Filter Bar */}
            <div className="flex items-center gap-3">
              <div className="relative flex-1 max-w-xs">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search signatures or CVE..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-9"
                />
              </div>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-40 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ipsCategories.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <div className="flex-1" />
              <span className="text-xs text-muted-foreground">{filteredIPS.length} signatures</span>
            </div>

            {/* IPS Table */}
            <div className="section">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-14">Status</th>
                    <th className="w-20">ID</th>
                    <th>Signature Name</th>
                    <th>Category</th>
                    <th className="w-24">CVE</th>
                    <th className="w-20">Severity</th>
                    <th className="w-20">Target</th>
                    <th className="w-28">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredIPS.map((sig) => (
                    <tr key={sig.id} className={cn(!sig.enabled && "opacity-50")}>
                      <td>
                        <Switch
                          checked={sig.enabled}
                          onCheckedChange={() => handleToggleIPS(sig.id)}
                          className="scale-75"
                        />
                      </td>
                      <td className="font-mono text-muted-foreground text-xs">{sig.sid}</td>
                      <td>
                        <div className="font-medium text-sm">{sig.name}</div>
                      </td>
                      <td className="text-xs text-muted-foreground">{sig.category}</td>
                      <td>
                        {sig.cve && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                            {sig.cve}
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={cn("text-[10px] px-2 py-0.5 rounded border uppercase", getSeverityColor(sig.severity))}>
                          {sig.severity}
                        </span>
                      </td>
                      <td className="text-xs text-muted-foreground capitalize">{sig.target}</td>
                      <td>
                        <Select 
                          value={sig.action} 
                          onValueChange={(value) => handleChangeIPSAction(sig.id, value as IPSSignature['action'])}
                        >
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="default">Default</SelectItem>
                            <SelectItem value="pass">Pass</SelectItem>
                            <SelectItem value="monitor">Monitor</SelectItem>
                            <SelectItem value="block">Block</SelectItem>
                            <SelectItem value="reset">Reset</SelectItem>
                          </SelectContent>
                        </Select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Application Control Tab */}
          <TabsContent value="appcontrol" className="space-y-4 mt-4">
            <div className="section p-8 text-center">
              <Layers size={48} className="mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-bold mb-2">Application Control</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Control application usage on your network. Create profiles to allow, block, or monitor applications.
              </p>
              <Button className="gap-1.5 bg-[#4caf50] hover:bg-[#43a047]">
                <Plus size={14} />
                Create Application Sensor
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default SecurityProfiles;
