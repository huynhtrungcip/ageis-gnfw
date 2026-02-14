import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { useDemoMode } from '@/contexts/DemoModeContext';
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
  Copy,
  Download,
  Upload,
  X
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import { exportToJSON, importFromJSON, createFileInput } from '@/lib/exportImport';

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

const initialAVProfiles: AVProfile[] = [
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

const initialWebProfiles: WebFilterProfile[] = [
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

const initialIPSSignatures: IPSSignature[] = [
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
  const { demoMode } = useDemoMode();
  const [activeTab, setActiveTab] = useState('antivirus');
  const [avProfiles, setAvProfiles] = useState<AVProfile[]>(demoMode ? initialAVProfiles : []);
  const [webProfiles, setWebProfiles] = useState<WebFilterProfile[]>(demoMode ? initialWebProfiles : []);
  const [ipsSignatures, setIpsSignatures] = useState<IPSSignature[]>(demoMode ? initialIPSSignatures : []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [severity, setSeverity] = useState('all');

  // Modal states
  const [avModalOpen, setAvModalOpen] = useState(false);
  const [webModalOpen, setWebModalOpen] = useState(false);
  const [editingAv, setEditingAv] = useState<AVProfile | null>(null);
  const [editingWeb, setEditingWeb] = useState<WebFilterProfile | null>(null);

  // Delete confirmation
  const [deleteAvId, setDeleteAvId] = useState<string | null>(null);
  const [deleteWebId, setDeleteWebId] = useState<string | null>(null);

  // Form states
  const [avForm, setAvForm] = useState<{
    name: string; comment: string; httpScan: boolean; ftpScan: boolean; imapScan: boolean;
    pop3Scan: boolean; smtpScan: boolean; action: 'block' | 'monitor' | 'quarantine'; emulatorEnabled: boolean;
  }>({
    name: '', comment: '', httpScan: true, ftpScan: true, imapScan: true,
    pop3Scan: true, smtpScan: true, action: 'block', emulatorEnabled: true
  });
  const [webForm, setWebForm] = useState<{
    name: string; comment: string; mode: 'proxy' | 'flow' | 'dns'; action: 'block' | 'warning' | 'monitor';
    urlFiltering: boolean; safeSearch: boolean;
  }>({
    name: '', comment: '', mode: 'proxy', action: 'block',
    urlFiltering: true, safeSearch: true
  });

  const filteredIPS = ipsSignatures.filter(sig => {
    const matchesSearch = search === '' || 
      sig.name.toLowerCase().includes(search.toLowerCase()) ||
      sig.sid.toString().includes(search) ||
      (sig.cve && sig.cve.toLowerCase().includes(search.toLowerCase()));
    const matchesCategory = category === 'All' || sig.category === category;
    const matchesSeverity = severity === 'all' || sig.severity === severity;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  // AV Profile handlers
  const handleCreateAv = () => {
    setEditingAv(null);
    setAvForm({ name: '', comment: '', httpScan: true, ftpScan: true, imapScan: true, pop3Scan: true, smtpScan: true, action: 'block', emulatorEnabled: true });
    setAvModalOpen(true);
  };

  const handleEditAv = (profile: AVProfile) => {
    setEditingAv(profile);
    setAvForm({ 
      name: profile.name, comment: profile.comment, httpScan: profile.httpScan, ftpScan: profile.ftpScan,
      imapScan: profile.imapScan, pop3Scan: profile.pop3Scan, smtpScan: profile.smtpScan,
      action: profile.action, emulatorEnabled: profile.emulatorEnabled 
    });
    setAvModalOpen(true);
  };

  const handleSaveAv = () => {
    if (!avForm.name) { toast.error('Name is required'); return; }
    if (editingAv) {
      setAvProfiles(prev => prev.map(p => p.id === editingAv.id ? { ...p, ...avForm } : p));
      toast.success('AntiVirus profile updated');
    } else {
      setAvProfiles(prev => [...prev, { ...avForm, id: `av-${Date.now()}` }]);
      toast.success('AntiVirus profile created');
    }
    setAvModalOpen(false);
  };

  const handleCloneAv = (profile: AVProfile) => {
    const clone = { ...profile, id: `av-${Date.now()}`, name: `${profile.name}_copy` };
    setAvProfiles(prev => [...prev, clone]);
    toast.success('Profile cloned');
  };

  const handleDeleteAv = () => {
    if (deleteAvId) {
      setAvProfiles(prev => prev.filter(p => p.id !== deleteAvId));
      toast.success('AntiVirus profile deleted');
      setDeleteAvId(null);
    }
  };

  // Web Profile handlers
  const handleCreateWeb = () => {
    setEditingWeb(null);
    setWebForm({ name: '', comment: '', mode: 'proxy', action: 'block', urlFiltering: true, safeSearch: true });
    setWebModalOpen(true);
  };

  const handleEditWeb = (profile: WebFilterProfile) => {
    setEditingWeb(profile);
    setWebForm({ 
      name: profile.name, comment: profile.comment, mode: profile.mode, 
      action: profile.action, urlFiltering: profile.urlFiltering, safeSearch: profile.safeSearch 
    });
    setWebModalOpen(true);
  };

  const handleSaveWeb = () => {
    if (!webForm.name) { toast.error('Name is required'); return; }
    if (editingWeb) {
      setWebProfiles(prev => prev.map(p => p.id === editingWeb.id ? { ...p, ...webForm } : p));
      toast.success('Web Filter profile updated');
    } else {
      setWebProfiles(prev => [...prev, { ...webForm, id: `wf-${Date.now()}` }]);
      toast.success('Web Filter profile created');
    }
    setWebModalOpen(false);
  };

  const handleCloneWeb = (profile: WebFilterProfile) => {
    const clone = { ...profile, id: `wf-${Date.now()}`, name: `${profile.name}_copy` };
    setWebProfiles(prev => [...prev, clone]);
    toast.success('Profile cloned');
  };

  const handleDeleteWeb = () => {
    if (deleteWebId) {
      setWebProfiles(prev => prev.filter(p => p.id !== deleteWebId));
      toast.success('Web Filter profile deleted');
      setDeleteWebId(null);
    }
  };

  // IPS handlers
  const handleToggleIPS = (id: string) => {
    setIpsSignatures(prev => prev.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    toast.success('Signature status updated');
  };

  // Export/Import
  const handleExport = () => {
    if (activeTab === 'antivirus') {
      exportToJSON(avProfiles, `antivirus-profiles-${new Date().toISOString().split('T')[0]}.json`);
      toast.success(`Exported ${avProfiles.length} AV profiles`);
    } else if (activeTab === 'webfilter') {
      exportToJSON(webProfiles, `webfilter-profiles-${new Date().toISOString().split('T')[0]}.json`);
      toast.success(`Exported ${webProfiles.length} Web Filter profiles`);
    } else {
      exportToJSON(ipsSignatures, `ips-signatures-${new Date().toISOString().split('T')[0]}.json`);
      toast.success(`Exported ${ipsSignatures.length} IPS signatures`);
    }
  };

  const handleImport = () => {
    createFileInput('.json', (file) => {
      if (activeTab === 'antivirus') {
        importFromJSON<AVProfile>(file, (data) => {
          setAvProfiles(prev => [...prev, ...data.map(p => ({ ...p, id: `av-${Date.now()}-${Math.random()}` }))]);
          toast.success(`Imported ${data.length} AV profiles`);
        }, (err) => toast.error(err));
      } else if (activeTab === 'webfilter') {
        importFromJSON<WebFilterProfile>(file, (data) => {
          setWebProfiles(prev => [...prev, ...data.map(p => ({ ...p, id: `wf-${Date.now()}-${Math.random()}` }))]);
          toast.success(`Imported ${data.length} Web Filter profiles`);
        }, (err) => toast.error(err));
      } else {
        importFromJSON<IPSSignature>(file, (data) => {
          setIpsSignatures(prev => [...prev, ...data.map(s => ({ ...s, id: `ips-${Date.now()}-${Math.random()}` }))]);
          toast.success(`Imported ${data.length} IPS signatures`);
        }, (err) => toast.error(err));
      }
    });
  };

  const handleRefresh = () => {
    toast.success('Definitions updated');
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
          <button className="forti-toolbar-btn primary" onClick={() => {
            if (activeTab === 'antivirus') handleCreateAv();
            else if (activeTab === 'webfilter') handleCreateWeb();
            else toast.info('IPS signatures are managed automatically');
          }}>
            <Plus size={12} />
            <span>Create New</span>
          </button>
          <button className="forti-toolbar-btn" onClick={() => {
            if (activeTab === 'antivirus' && avProfiles.length > 0) handleEditAv(avProfiles[0]);
            else if (activeTab === 'webfilter' && webProfiles.length > 0) handleEditWeb(webProfiles[0]);
          }}>
            <Edit size={12} />
            <span>Edit</span>
          </button>
          <button className="forti-toolbar-btn" onClick={() => {
            if (activeTab === 'antivirus' && avProfiles.length > 0) handleCloneAv(avProfiles[0]);
            else if (activeTab === 'webfilter' && webProfiles.length > 0) handleCloneWeb(webProfiles[0]);
          }}>
            <Copy size={12} />
            <span>Clone</span>
          </button>
          <button className="forti-toolbar-btn" onClick={() => {
            if (activeTab === 'antivirus' && avProfiles.length > 0) setDeleteAvId(avProfiles[0].id);
            else if (activeTab === 'webfilter' && webProfiles.length > 0) setDeleteWebId(webProfiles[0].id);
          }}>
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={handleRefresh}>
            <RefreshCw size={12} />
            <span>Update Definitions</span>
          </button>
          <button className="forti-toolbar-btn" onClick={handleExport}>
            <Download size={12} />
            <span>Export</span>
          </button>
          <button className="forti-toolbar-btn" onClick={handleImport}>
            <Upload size={12} />
            <span>Import</span>
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
              <TabsTrigger value="antivirus" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]">
                AntiVirus
              </TabsTrigger>
              <TabsTrigger value="webfilter" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]">
                Web Filter
              </TabsTrigger>
              <TabsTrigger value="ips" className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]">
                IPS Signatures
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
                        "forti-tag inline-block min-w-[72px] text-center",
                        profile.action === 'block' ? 'bg-red-100 text-red-700 border-red-200' :
                        profile.action === 'quarantine' ? 'bg-orange-100 text-orange-700 border-orange-200' :
                        'bg-yellow-100 text-yellow-700 border-yellow-200'
                      )}>
                        {profile.action.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={profile.emulatorEnabled} 
                        onToggle={() => setAvProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, emulatorEnabled: !p.emulatorEnabled } : p))} 
                        size="sm" 
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => handleEditAv(profile)}>
                          <Edit size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => handleCloneAv(profile)}>
                          <Copy size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => setDeleteAvId(profile.id)}>
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
                      <span className="forti-tag inline-block min-w-[72px] text-center bg-purple-100 text-purple-700 border-purple-200">
                        {profile.mode.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        "forti-tag inline-block min-w-[72px] text-center",
                        profile.action === 'block' ? 'bg-red-100 text-red-700 border-red-200' :
                        profile.action === 'warning' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-blue-100 text-blue-700 border-blue-200'
                      )}>
                        {profile.action.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={profile.urlFiltering} 
                        onToggle={() => setWebProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, urlFiltering: !p.urlFiltering } : p))} 
                        size="sm" 
                      />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={profile.safeSearch} 
                        onToggle={() => setWebProfiles(prev => prev.map(p => p.id === profile.id ? { ...p, safeSearch: !p.safeSearch } : p))} 
                        size="sm" 
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => handleEditWeb(profile)}>
                          <Edit size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => handleCloneWeb(profile)}>
                          <Copy size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => setDeleteWebId(profile.id)}>
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
                  <th className="w-16">Enabled</th>
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
                      <FortiToggle enabled={sig.enabled} onToggle={() => handleToggleIPS(sig.id)} size="sm" />
                    </td>
                    <td className="mono text-[11px]">{sig.sid}</td>
                    <td className="text-[11px] font-medium">{sig.name}</td>
                    <td>
                      <span className="forti-tag bg-blue-100 text-blue-700 border-blue-200">{sig.category}</span>
                    </td>
                    <td>
                      <span className={cn(
                        "forti-tag inline-block min-w-[72px] text-center",
                        sig.severity === 'critical' ? "bg-red-100 text-red-700 border-red-200" :
                        sig.severity === 'high' ? "bg-orange-100 text-orange-700 border-orange-200" :
                        sig.severity === 'medium' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                        "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {sig.severity.toUpperCase()}
                      </span>
                    </td>
                    <td className="mono text-[10px] text-blue-600">{sig.cve || '-'}</td>
                    <td>
                      <span className={cn(
                        "forti-tag inline-block min-w-[72px] text-center",
                        sig.action === 'block' ? "bg-red-100 text-red-700 border-red-200" :
                        sig.action === 'monitor' ? "bg-blue-100 text-blue-700 border-blue-200" :
                        "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {sig.action.toUpperCase()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        </Tabs>
      </div>

      {/* AV Profile Modal */}
      <Dialog open={avModalOpen} onOpenChange={setAvModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{editingAv ? 'Edit AntiVirus Profile' : 'Create AntiVirus Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="forti-label">Name *</label>
              <input className="forti-input w-full" value={avForm.name} onChange={(e) => setAvForm({ ...avForm, name: e.target.value })} placeholder="e.g., custom-av" />
            </div>
            <div>
              <label className="forti-label">Comment</label>
              <input className="forti-input w-full" value={avForm.comment} onChange={(e) => setAvForm({ ...avForm, comment: e.target.value })} placeholder="Description" />
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['httpScan', 'ftpScan', 'imapScan', 'pop3Scan', 'smtpScan'] as const).map(key => (
                <label key={key} className="flex items-center gap-2 text-[11px]">
                  <input type="checkbox" checked={avForm[key]} onChange={() => setAvForm({ ...avForm, [key]: !avForm[key] })} />
                  {key.replace('Scan', '').toUpperCase()}
                </label>
              ))}
            </div>
            <div>
              <label className="forti-label">Action</label>
              <select className="forti-select w-full" value={avForm.action} onChange={(e) => setAvForm({ ...avForm, action: e.target.value as any })}>
                <option value="block">Block</option>
                <option value="monitor">Monitor</option>
                <option value="quarantine">Quarantine</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={avForm.emulatorEnabled} onChange={() => setAvForm({ ...avForm, emulatorEnabled: !avForm.emulatorEnabled })} />
              <span className="text-[11px]">Enable Emulator</span>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setAvModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveAv}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Web Profile Modal */}
      <Dialog open={webModalOpen} onOpenChange={setWebModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{editingWeb ? 'Edit Web Filter Profile' : 'Create Web Filter Profile'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="forti-label">Name *</label>
              <input className="forti-input w-full" value={webForm.name} onChange={(e) => setWebForm({ ...webForm, name: e.target.value })} placeholder="e.g., strict-filter" />
            </div>
            <div>
              <label className="forti-label">Comment</label>
              <input className="forti-input w-full" value={webForm.comment} onChange={(e) => setWebForm({ ...webForm, comment: e.target.value })} placeholder="Description" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="forti-label">Mode</label>
                <select className="forti-select w-full" value={webForm.mode} onChange={(e) => setWebForm({ ...webForm, mode: e.target.value as any })}>
                  <option value="proxy">Proxy</option>
                  <option value="flow">Flow</option>
                  <option value="dns">DNS</option>
                </select>
              </div>
              <div>
                <label className="forti-label">Action</label>
                <select className="forti-select w-full" value={webForm.action} onChange={(e) => setWebForm({ ...webForm, action: e.target.value as any })}>
                  <option value="block">Block</option>
                  <option value="warning">Warning</option>
                  <option value="monitor">Monitor</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-[11px]">
                <input type="checkbox" checked={webForm.urlFiltering} onChange={() => setWebForm({ ...webForm, urlFiltering: !webForm.urlFiltering })} />
                URL Filtering
              </label>
              <label className="flex items-center gap-2 text-[11px]">
                <input type="checkbox" checked={webForm.safeSearch} onChange={() => setWebForm({ ...webForm, safeSearch: !webForm.safeSearch })} />
                Safe Search
              </label>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setWebModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveWeb}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmations */}
      <AlertDialog open={!!deleteAvId} onOpenChange={() => setDeleteAvId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete AntiVirus Profile</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAv} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteWebId} onOpenChange={() => setDeleteWebId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Web Filter Profile</AlertDialogTitle>
            <AlertDialogDescription>Are you sure? This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteWeb} className="bg-red-600 hover:bg-red-700">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default SecurityProfiles;
