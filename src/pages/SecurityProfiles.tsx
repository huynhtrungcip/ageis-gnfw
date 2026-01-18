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
  Layers,
  Edit,
  Trash2,
  Copy
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FortiToggle } from '@/components/ui/forti-toggle';
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
  action: 'block' | 'monitor' | 'quarantine';
  emulatorEnabled: boolean;
}

const mockAVProfiles: AVProfile[] = [
  { id: 'av-1', name: 'default', comment: 'Default antivirus profile', httpScan: true, ftpScan: true, imapScan: true, pop3Scan: true, smtpScan: true, action: 'block', emulatorEnabled: true },
  { id: 'av-2', name: 'high-security', comment: 'Maximum protection profile', httpScan: true, ftpScan: true, imapScan: true, pop3Scan: true, smtpScan: true, action: 'quarantine', emulatorEnabled: true },
  { id: 'av-3', name: 'monitor-only', comment: 'Detection without blocking', httpScan: true, ftpScan: true, imapScan: true, pop3Scan: true, smtpScan: true, action: 'monitor', emulatorEnabled: false },
];

// Web Filter Profiles
interface WebFilterProfile {
  id: string;
  name: string;
  comment: string;
  mode: 'proxy' | 'flow' | 'dns';
  action: 'block' | 'warning' | 'monitor';
  urlFiltering: boolean;
  safeSearch: boolean;
}

const mockWebProfiles: WebFilterProfile[] = [
  { id: 'wf-1', name: 'default', comment: 'Default web filter', mode: 'proxy', action: 'block', urlFiltering: true, safeSearch: true },
  { id: 'wf-2', name: 'strict', comment: 'Strict filtering for schools', mode: 'proxy', action: 'block', urlFiltering: true, safeSearch: true },
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
}

const mockIPSSignatures: IPSSignature[] = [
  { id: 'ips-1', sid: 44228, name: 'Apache.Log4j.Error.Log.Remote.Code.Execution', category: 'Application', severity: 'critical', action: 'block', enabled: true, cve: 'CVE-2021-44228' },
  { id: 'ips-2', sid: 51006, name: 'MS.SMBv3.Compression.Buffer.Overflow', category: 'Network', severity: 'critical', action: 'block', enabled: true, cve: 'CVE-2020-0796' },
  { id: 'ips-3', sid: 48247, name: 'HTTP.Request.Smuggling', category: 'Web', severity: 'high', action: 'block', enabled: true },
  { id: 'ips-4', sid: 39294, name: 'DNS.Query.Flood.DoS', category: 'DoS', severity: 'high', action: 'block', enabled: true },
  { id: 'ips-5', sid: 17942, name: 'SSH.Brute.Force.Login', category: 'Brute Force', severity: 'medium', action: 'monitor', enabled: true },
  { id: 'ips-6', sid: 35213, name: 'TLS.Invalid.Certificate', category: 'SSL/TLS', severity: 'low', action: 'default', enabled: false },
  { id: 'ips-7', sid: 49021, name: 'Spring4Shell.RCE.Attempt', category: 'Application', severity: 'critical', action: 'block', enabled: true, cve: 'CVE-2022-22965' },
  { id: 'ips-8', sid: 50182, name: 'ProxyShell.Exchange.RCE', category: 'Application', severity: 'critical', action: 'block', enabled: true, cve: 'CVE-2021-34473' },
];

const ipsCategories = ['All', 'Application', 'Network', 'Web', 'DoS', 'Brute Force', 'SSL/TLS'];

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
    toast.success('Signature status updated');
  };

  // Stats
  const stats = {
    avProfiles: avProfiles.length,
    webProfiles: webProfiles.length,
    ipsTotal: ipsSignatures.length,
    ipsEnabled: ipsSignatures.filter(s => s.enabled).length,
    critical: ipsSignatures.filter(s => s.severity === 'critical').length,
  };

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <Shield size={14} />
            <span className="font-semibold">Security Profiles</span>
            <span className="text-[10px] text-[#888]">AntiVirus, Web Filter, IPS</span>
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
            <Copy size={12} />
            <span>Clone</span>
          </button>
          <button className="forti-toolbar-btn">
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn">
            <RefreshCw size={12} />
            <span>Update Definitions</span>
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-0 border-x border-[#ddd]">
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Bug size={14} className="text-red-600" />
            <span className="text-lg font-bold text-red-600">{stats.avProfiles}</span>
            <span className="text-[11px] text-[#666]">AV Profiles</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Globe size={14} className="text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{stats.webProfiles}</span>
            <span className="text-[11px] text-[#666]">Web Filter Profiles</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Shield size={14} className="text-purple-600" />
            <span className="text-lg font-bold text-purple-600">{stats.ipsEnabled}/{stats.ipsTotal}</span>
            <span className="text-[11px] text-[#666]">IPS Signatures</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white">
            <span className="text-lg font-bold text-orange-600">{stats.critical}</span>
            <span className="text-[11px] text-[#666]">Critical Signatures</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-[#f0f0f0] border-x border-b border-[#ddd]">
            <TabsList className="bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger 
                value="antivirus" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                AntiVirus
              </TabsTrigger>
              <TabsTrigger 
                value="webfilter" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                Web Filter
              </TabsTrigger>
              <TabsTrigger 
                value="ips" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                IPS Signatures
              </TabsTrigger>
              <TabsTrigger 
                value="appcontrol" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                Application Control
              </TabsTrigger>
            </TabsList>
          </div>

          {/* AntiVirus Tab */}
          <TabsContent value="antivirus" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Comment</th>
                  <th>HTTP</th>
                  <th>FTP</th>
                  <th>IMAP</th>
                  <th>POP3</th>
                  <th>SMTP</th>
                  <th>Action</th>
                  <th>Emulator</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {avProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="font-medium text-[#333]">{profile.name}</td>
                    <td className="text-[#666]">{profile.comment}</td>
                    <td>
                      <span className={cn("forti-tag", profile.httpScan ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                        {profile.httpScan ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td>
                      <span className={cn("forti-tag", profile.ftpScan ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                        {profile.ftpScan ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td>
                      <span className={cn("forti-tag", profile.imapScan ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                        {profile.imapScan ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td>
                      <span className={cn("forti-tag", profile.pop3Scan ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                        {profile.pop3Scan ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td>
                      <span className={cn("forti-tag", profile.smtpScan ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200')}>
                        {profile.smtpScan ? 'ON' : 'OFF'}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        profile.action === 'block' ? 'bg-red-100 text-red-700 border-red-200' :
                        profile.action === 'quarantine' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      )}>
                        {profile.action.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <FortiToggle enabled={profile.emulatorEnabled} onChange={() => {}} size="sm" />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Edit size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Copy size={12} className="text-[#666]" />
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

          {/* Web Filter Tab */}
          <TabsContent value="webfilter" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Comment</th>
                  <th>Mode</th>
                  <th>Action</th>
                  <th>URL Filter</th>
                  <th>Safe Search</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {webProfiles.map((profile) => (
                  <tr key={profile.id}>
                    <td className="font-medium text-[#333]">{profile.name}</td>
                    <td className="text-[#666]">{profile.comment}</td>
                    <td>
                      <span className="forti-tag bg-purple-100 text-purple-700 border-purple-200">
                        {profile.mode.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        profile.action === 'block' ? 'bg-red-100 text-red-700 border-red-200' :
                        profile.action === 'warning' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      )}>
                        {profile.action.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <FortiToggle enabled={profile.urlFiltering} onChange={() => {}} size="sm" />
                    </td>
                    <td>
                      <FortiToggle enabled={profile.safeSearch} onChange={() => {}} size="sm" />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Edit size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Copy size={12} className="text-[#666]" />
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

          {/* IPS Tab */}
          <TabsContent value="ips" className="mt-0">
            {/* Filter Bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-[#f5f5f5] border-x border-b border-[#ddd]">
              <span className="text-[11px] text-[#666]">Category:</span>
              <div className="flex items-center gap-0.5">
                {ipsCategories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "px-2 py-1 text-[11px] font-medium border transition-colors",
                      category === cat 
                        ? "bg-[hsl(142,70%,35%)] text-white border-[hsl(142,75%,28%)]" 
                        : "bg-white text-[#666] border-[#ccc] hover:bg-[#f5f5f5]"
                    )}
                  >
                    {cat}
                  </button>
                ))}
              </div>
              <div className="forti-toolbar-separator" />
              <span className="text-[11px] text-[#666]">Severity:</span>
              <div className="flex items-center gap-0.5">
                {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
                  <button
                    key={sev}
                    onClick={() => setSeverity(sev)}
                    className={cn(
                      "px-2 py-1 text-[11px] font-medium border transition-colors capitalize",
                      severity === sev 
                        ? "bg-[hsl(142,70%,35%)] text-white border-[hsl(142,75%,28%)]" 
                        : "bg-white text-[#666] border-[#ccc] hover:bg-[#f5f5f5]"
                    )}
                  >
                    {sev === 'all' ? 'All' : sev}
                  </button>
                ))}
              </div>
              <div className="flex-1" />
              <span className="text-[11px] text-[#666]">{filteredIPS.length} signatures</span>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Status</th>
                  <th className="w-20">SID</th>
                  <th>Signature Name</th>
                  <th>Category</th>
                  <th>Severity</th>
                  <th>CVE</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredIPS.map((sig) => (
                  <tr key={sig.id} className={cn(!sig.enabled && "opacity-60")}>
                    <td>
                      <FortiToggle 
                        enabled={sig.enabled}
                        onChange={() => handleToggleIPS(sig.id)}
                        size="sm"
                      />
                    </td>
                    <td className="mono text-[#666]">{sig.sid}</td>
                    <td className="font-medium text-[#333]">{sig.name}</td>
                    <td className="text-[#666]">{sig.category}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        sig.severity === 'critical' ? 'bg-red-100 text-red-700 border-red-200' :
                        sig.severity === 'high' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        sig.severity === 'medium' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        sig.severity === 'low' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        'bg-gray-100 text-gray-500 border-gray-200'
                      )}>
                        {sig.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="mono text-[#666]">{sig.cve || '-'}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        sig.action === 'block' || sig.action === 'reset' ? 'bg-red-100 text-red-700 border-red-200' :
                        sig.action === 'monitor' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        sig.action === 'pass' ? 'bg-green-100 text-green-700 border-green-200' :
                        'bg-gray-100 text-gray-500 border-gray-200'
                      )}>
                        {sig.action.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* App Control Tab */}
          <TabsContent value="appcontrol" className="mt-0 p-4 bg-white border-x border-b border-[#ddd]">
            <div className="flex items-center justify-center py-8 text-[#999]">
              <Layers size={24} className="mr-2" />
              <span>Application Control profiles will be configured here</span>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default SecurityProfiles;
