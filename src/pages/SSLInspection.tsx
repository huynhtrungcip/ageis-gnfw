import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  Shield, 
  Search, 
  Plus,
  RefreshCw,
  Lock,
  FileText,
  Key,
  Eye,
  EyeOff,
  Download,
  Upload,
  Trash2,
  Edit2,
  Copy,
  AlertTriangle,
  Calendar,
  Server,
  Globe,
  ChevronDown,
  ChevronUp,
  
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// Types
interface Certificate {
  id: string;
  name: string;
  type: 'local' | 'remote' | 'ca' | 'crl';
  subject: string;
  issuer: string;
  serialNumber: string;
  validFrom: Date;
  validTo: Date;
  status: 'valid' | 'expired' | 'revoked' | 'pending';
  keySize: number;
  signatureAlgorithm: string;
  usage: string[];
  fingerprint: string;
}

interface SSLProfile {
  id: string;
  name: string;
  comment: string;
  enabled: boolean;
  mode: 'certificate-inspection' | 'deep-inspection';
  allowInvalidCert: boolean;
  untrustedCertAction: 'allow' | 'block' | 'ignore';
  sniCheck: boolean;
  mitmMode: boolean;
  caName: string;
  exemptedCategories: string[];
  exemptedAddresses: string[];
  protocols: { https: boolean; smtps: boolean; pop3s: boolean; imaps: boolean; ftps: boolean; };
  ports: { https: string; smtps: string; pop3s: string; imaps: string; ftps: string; };
}

// Mock Data
const mockCertificates: Certificate[] = [
  {
    id: 'cert-1', name: 'Aegis_CA_SSL', type: 'ca',
    subject: 'CN=Aegis CA SSL, O=Aegis Security, C=US',
    issuer: 'CN=Aegis CA SSL, O=Aegis Security, C=US',
    serialNumber: '00:A1:B2:C3:D4:E5:F6:78',
    validFrom: new Date('2023-01-01'), validTo: new Date('2033-01-01'),
    status: 'valid', keySize: 4096, signatureAlgorithm: 'SHA256withRSA',
    usage: ['Digital Signature', 'Key Encipherment', 'CA'],
    fingerprint: 'A1:B2:C3:D4:E5:F6:78:90:AB:CD:EF:12:34:56:78:90'
  },
  {
    id: 'cert-2', name: 'Aegis_Server', type: 'local',
    subject: 'CN=Aegis-500E, O=Organization, C=US',
    issuer: 'CN=Aegis CA SSL, O=Aegis Security, C=US',
    serialNumber: '00:FF:EE:DD:CC:BB:AA:99',
    validFrom: new Date('2024-01-01'), validTo: new Date('2025-01-01'),
    status: 'valid', keySize: 2048, signatureAlgorithm: 'SHA256withRSA',
    usage: ['Digital Signature', 'Key Encipherment'],
    fingerprint: 'FF:EE:DD:CC:BB:AA:99:88:77:66:55:44:33:22:11:00'
  },
  {
    id: 'cert-3', name: 'DigiCert_Root_CA', type: 'remote',
    subject: 'CN=DigiCert Global Root CA, O=DigiCert Inc, C=US',
    issuer: 'CN=DigiCert Global Root CA, O=DigiCert Inc, C=US',
    serialNumber: '08:3B:E0:56:90:42:46:B1:A1:75:6A:C9:59:91:C7:4A',
    validFrom: new Date('2006-11-10'), validTo: new Date('2031-11-10'),
    status: 'valid', keySize: 2048, signatureAlgorithm: 'SHA1withRSA',
    usage: ['Digital Signature', 'Certificate Sign', 'CRL Sign'],
    fingerprint: '08:3B:E0:56:90:42:46:B1:A1:75:6A:C9:59:91:C7:4A'
  },
  {
    id: 'cert-4', name: 'Expired_Legacy_Cert', type: 'local',
    subject: 'CN=Legacy Server, O=Organization, C=US',
    issuer: 'CN=Aegis CA SSL, O=Aegis Security, C=US',
    serialNumber: '00:11:22:33:44:55:66:77',
    validFrom: new Date('2020-01-01'), validTo: new Date('2023-01-01'),
    status: 'expired', keySize: 2048, signatureAlgorithm: 'SHA256withRSA',
    usage: ['Digital Signature'],
    fingerprint: '11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00'
  }
];

const mockSSLProfiles: SSLProfile[] = [
  {
    id: 'ssl-1', name: 'deep-inspection', comment: 'Full SSL/TLS inspection with MITM',
    enabled: true, mode: 'deep-inspection', allowInvalidCert: false,
    untrustedCertAction: 'block', sniCheck: true, mitmMode: true, caName: 'Aegis_CA_SSL',
    exemptedCategories: ['Finance and Banking', 'Health and Wellness'],
    exemptedAddresses: ['10.0.0.0/8', '172.16.0.0/12'],
    protocols: { https: true, smtps: true, pop3s: true, imaps: true, ftps: true },
    ports: { https: '443', smtps: '465', pop3s: '995', imaps: '993', ftps: '990' }
  },
  {
    id: 'ssl-2', name: 'certificate-inspection', comment: 'Basic certificate validation only',
    enabled: true, mode: 'certificate-inspection', allowInvalidCert: true,
    untrustedCertAction: 'allow', sniCheck: true, mitmMode: false, caName: '',
    exemptedCategories: [], exemptedAddresses: [],
    protocols: { https: true, smtps: false, pop3s: false, imaps: false, ftps: false },
    ports: { https: '443', smtps: '465', pop3s: '995', imaps: '993', ftps: '990' }
  },
  {
    id: 'ssl-3', name: 'no-inspection', comment: 'Bypass SSL inspection',
    enabled: false, mode: 'certificate-inspection', allowInvalidCert: true,
    untrustedCertAction: 'ignore', sniCheck: false, mitmMode: false, caName: '',
    exemptedCategories: [], exemptedAddresses: [],
    protocols: { https: false, smtps: false, pop3s: false, imaps: false, ftps: false },
    ports: { https: '443', smtps: '465', pop3s: '995', imaps: '993', ftps: '990' }
  }
];

const webCategories = [
  'Finance and Banking', 'Health and Wellness', 'Government', 
  'Education', 'News and Media', 'Shopping', 'Social Networking',
  'Entertainment', 'Games', 'Adult Content'
];

const SSLInspection = () => {
  const { demoMode } = useDemoMode();
  const [activeTab, setActiveTab] = useState('profiles');
  const [certificates, setCertificates] = useState<Certificate[]>(demoMode ? mockCertificates : []);
  const [sslProfiles, setSSLProfiles] = useState<SSLProfile[]>(demoMode ? mockSSLProfiles : []);
  const [search, setSearch] = useState('');
  const [certType, setCertType] = useState('all');
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SSLProfile | null>(null);
  const [expandedProfiles, setExpandedProfiles] = useState<string[]>([]);

  const tabs = [
    { id: 'profiles', label: 'Inspection Profiles', icon: Shield },
    { id: 'certificates', label: 'Certificates', icon: Key },
    { id: 'ca', label: 'CA Certificates', icon: FileText },
    { id: 'exemptions', label: 'Exemptions', icon: EyeOff },
  ];

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = search === '' ||
      cert.name.toLowerCase().includes(search.toLowerCase()) ||
      cert.subject.toLowerCase().includes(search.toLowerCase());
    const matchesType = certType === 'all' || cert.type === certType;
    return matchesSearch && matchesType;
  });

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

  const getDaysUntilExpiry = (date: Date) => {
    const diff = date.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const toggleCertSelection = (id: string) => setSelectedCerts(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  const toggleProfileSelection = (id: string) => setSelectedProfiles(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
  const toggleProfileExpand = (id: string) => setExpandedProfiles(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);

  const handleDeleteCert = (id: string) => {
    setCertificates(prev => prev.filter(c => c.id !== id));
    toast.success('Certificate deleted');
  };

  const handleToggleProfile = (id: string) => {
    setSSLProfiles(prev => prev.map(p => p.id === id ? { ...p, enabled: !p.enabled } : p));
    toast.success('Profile status updated');
  };

  const openProfileModal = (profile?: SSLProfile) => {
    if (profile) {
      setEditingProfile({ ...profile });
    } else {
      setEditingProfile({
        id: `ssl-${Date.now()}`, name: '', comment: '', enabled: true,
        mode: 'certificate-inspection', allowInvalidCert: false, untrustedCertAction: 'block',
        sniCheck: true, mitmMode: false, caName: '', exemptedCategories: [], exemptedAddresses: [],
        protocols: { https: true, smtps: false, pop3s: false, imaps: false, ftps: false },
        ports: { https: '443', smtps: '465', pop3s: '995', imaps: '993', ftps: '990' }
      });
    }
    setShowProfileModal(true);
  };

  const saveProfile = () => {
    if (!editingProfile) return;
    const exists = sslProfiles.find(p => p.id === editingProfile.id);
    if (exists) {
      setSSLProfiles(prev => prev.map(p => p.id === editingProfile.id ? editingProfile : p));
      toast.success('Profile updated');
    } else {
      setSSLProfiles(prev => [...prev, editingProfile]);
      toast.success('Profile created');
    }
    setShowProfileModal(false);
    setEditingProfile(null);
  };

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <span className="font-semibold">SSL Inspection</span>
            <span className="text-[10px] text-[#888]">Manage certificates and deep inspection profiles</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn" onClick={() => toast.success('Data refreshed')}>
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn text-green-700" onClick={() => {
            if (activeTab === 'profiles') openProfileModal();
            else toast.info('Select profiles tab first');
          }}>
            <Plus size={12} />
            <span>Create New</span>
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {/* Tab Bar */}
        <div className="flex items-center border-x border-b border-[#ddd] bg-[#f5f5f5]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium border-b-2 transition-colors",
                activeTab === tab.id
                  ? "border-[hsl(142,70%,35%)] text-[hsl(142,70%,35%)] bg-white"
                  : "border-transparent text-[#666] hover:text-[#333] hover:bg-white/50"
              )}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profiles Tab */}
        {activeTab === 'profiles' && (
          <div>
            {/* Action bar */}
            <div className="flex items-center gap-2 px-3 py-2 bg-white border-x border-b border-[#ddd]">
              <button className="forti-toolbar-btn text-green-700" onClick={() => openProfileModal()}>
                <Plus size={12} />
                <span>Create New</span>
              </button>
              <button className="forti-toolbar-btn" disabled={selectedProfiles.length !== 1}
                onClick={() => {
                  const p = sslProfiles.find(x => x.id === selectedProfiles[0]);
                  if (p) openProfileModal(p);
                }}>
                <Edit2 size={12} />
                <span>Edit</span>
              </button>
              <button className="forti-toolbar-btn" disabled={selectedProfiles.length !== 1}>
                <Copy size={12} />
                <span>Clone</span>
              </button>
              <button className="forti-toolbar-btn text-red-600" disabled={selectedProfiles.length === 0}
                onClick={() => {
                  setSSLProfiles(prev => prev.filter(p => !selectedProfiles.includes(p.id)));
                  setSelectedProfiles([]);
                  toast.success('Profiles deleted');
                }}>
                <Trash2 size={12} />
                <span>Delete</span>
              </button>
            </div>

            {/* Profiles Table */}
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"><input type="checkbox" className="forti-checkbox" /></th>
                  <th className="w-8"></th>
                  <th>Name</th>
                  <th className="w-32">Mode</th>
                  <th className="w-28">Protocols</th>
                  <th className="w-28">Untrusted Cert</th>
                  <th className="w-20">SNI</th>
                  <th className="w-16">Status</th>
                  <th className="w-16"></th>
                </tr>
              </thead>
              <tbody>
                {sslProfiles.map((profile) => (
                  <>
                    <tr key={profile.id} className={cn(selectedProfiles.includes(profile.id) && "bg-green-50")}>
                      <td>
                        <input
                          type="checkbox"
                          className="forti-checkbox"
                          checked={selectedProfiles.includes(profile.id)}
                          onChange={() => toggleProfileSelection(profile.id)}
                        />
                      </td>
                      <td>
                        {profile.mode === 'deep-inspection' ? (
                          <Eye size={14} className="text-purple-600" />
                        ) : (
                          <Lock size={14} className="text-blue-600" />
                        )}
                      </td>
                      <td>
                        <div>
                          <span className="font-medium text-[#333]">{profile.name}</span>
                          <div className="text-[10px] text-[#999]">{profile.comment}</div>
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          "forti-tag",
                          profile.mode === 'deep-inspection'
                            ? "bg-purple-100 text-purple-700 border-purple-200"
                            : "bg-blue-100 text-blue-700 border-blue-200"
                        )}>
                          {profile.mode === 'deep-inspection' ? 'Deep Inspection' : 'Cert Inspection'}
                        </span>
                      </td>
                      <td className="text-[10px] text-[#666]">
                        {Object.entries(profile.protocols).filter(([, v]) => v).map(([k]) => k.toUpperCase()).join(', ') || '—'}
                      </td>
                      <td>
                        <span className={cn(
                          "forti-tag",
                          profile.untrustedCertAction === 'block' ? "bg-red-100 text-red-700 border-red-200" :
                          profile.untrustedCertAction === 'allow' ? "bg-yellow-100 text-yellow-700 border-yellow-200" :
                          "bg-gray-100 text-gray-600 border-gray-200"
                        )}>
                          {profile.untrustedCertAction.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-[11px]">
                        {profile.sniCheck ? <span className="text-green-600">✓ On</span> : <span className="text-[#999]">Off</span>}
                      </td>
                      <td>
                        <FortiToggle enabled={profile.enabled} onToggle={() => handleToggleProfile(profile.id)} size="sm" />
                      </td>
                      <td>
                        <div className="flex items-center gap-0.5">
                          <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => openProfileModal(profile)}>
                            <Edit2 size={12} className="text-[#666]" />
                          </button>
                          <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => toggleProfileExpand(profile.id)}>
                            {expandedProfiles.includes(profile.id) ? <ChevronUp size={12} className="text-[#666]" /> : <ChevronDown size={12} className="text-[#666]" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                    {expandedProfiles.includes(profile.id) && (
                      <tr key={`${profile.id}-expand`}>
                        <td colSpan={9} className="!p-0">
                          <div className="bg-[#fafafa] border-t border-[#eee] p-4 space-y-3">
                            {/* Protocol grid */}
                            <div>
                              <div className="text-[10px] text-[#888] uppercase font-semibold mb-2">Inspected Protocols</div>
                              <div className="grid grid-cols-5 gap-2">
                                {Object.entries(profile.protocols).map(([proto, enabled]) => (
                                  <div key={proto} className={cn(
                                    "p-2 border text-center text-[11px]",
                                    enabled ? "bg-green-50 border-green-200 text-green-700" : "bg-[#f5f5f5] border-[#ddd] text-[#999]"
                                  )}>
                                    <div className="font-medium">{proto.toUpperCase()}</div>
                                    <div className="text-[10px]">Port {profile.ports[proto as keyof typeof profile.ports]}</div>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Settings */}
                            <div className="grid grid-cols-4 gap-4 text-[11px]">
                              <div><span className="text-[10px] text-[#888] uppercase block">SNI Check</span><span className={profile.sniCheck ? "text-green-600" : "text-[#999]"}>{profile.sniCheck ? 'Enabled' : 'Disabled'}</span></div>
                              <div><span className="text-[10px] text-[#888] uppercase block">Invalid Cert</span><span className={profile.allowInvalidCert ? "text-orange-600" : "text-green-600"}>{profile.allowInvalidCert ? 'Allow' : 'Block'}</span></div>
                              <div><span className="text-[10px] text-[#888] uppercase block">Untrusted Cert</span><span className={profile.untrustedCertAction === 'block' ? "text-red-600" : "text-orange-600"}>{profile.untrustedCertAction.charAt(0).toUpperCase() + profile.untrustedCertAction.slice(1)}</span></div>
                              <div><span className="text-[10px] text-[#888] uppercase block">CA Certificate</span><span className="text-blue-600">{profile.caName || 'None'}</span></div>
                            </div>

                            {/* Exemptions */}
                            {(profile.exemptedCategories.length > 0 || profile.exemptedAddresses.length > 0) && (
                              <div>
                                <div className="text-[10px] text-[#888] uppercase font-semibold mb-1">Exemptions</div>
                                <div className="flex flex-wrap gap-1">
                                  {profile.exemptedCategories.map((cat, i) => (
                                    <span key={i} className="forti-tag bg-orange-100 text-orange-700 border-orange-200">{cat}</span>
                                  ))}
                                  {profile.exemptedAddresses.map((addr, i) => (
                                    <span key={i} className="forti-tag bg-blue-100 text-blue-700 border-blue-200 font-mono">{addr}</span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Certificates Tab */}
        {activeTab === 'certificates' && (
          <div>
            <div className="flex items-center gap-2 px-3 py-2 bg-white border-x border-b border-[#ddd]">
              <button className="forti-toolbar-btn text-green-700"><Plus size={12} /><span>Generate</span></button>
              <button className="forti-toolbar-btn"><Upload size={12} /><span>Import</span></button>
              <button className="forti-toolbar-btn" disabled={selectedCerts.length !== 1}><Download size={12} /><span>Export</span></button>
              <button className="forti-toolbar-btn text-red-600" disabled={selectedCerts.length === 0}><Trash2 size={12} /><span>Delete</span></button>
              <div className="flex-1" />
              <select
                value={certType}
                onChange={(e) => setCertType(e.target.value)}
                className="text-[11px] border border-[#ccc] px-2 py-1 bg-white"
              >
                <option value="all">All Types</option>
                <option value="local">Local</option>
                <option value="remote">Remote</option>
                <option value="ca">CA</option>
                <option value="crl">CRL</option>
              </select>
            </div>

            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"><input type="checkbox" className="forti-checkbox" /></th>
                  <th>Name</th>
                  <th className="w-16">Type</th>
                  <th>Subject</th>
                  <th className="w-20">Status</th>
                  <th className="w-24">Valid From</th>
                  <th className="w-24">Valid To</th>
                  <th className="w-16">Key</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCertificates.map((cert) => {
                  const daysLeft = getDaysUntilExpiry(cert.validTo);
                  const isExpiringSoon = daysLeft > 0 && daysLeft < 90;
                  return (
                    <tr key={cert.id} className={cn(selectedCerts.includes(cert.id) && "bg-green-50")}>
                      <td>
                        <input
                          type="checkbox"
                          className="forti-checkbox"
                          checked={selectedCerts.includes(cert.id)}
                          onChange={() => toggleCertSelection(cert.id)}
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          <Key size={12} className="text-[#666]" />
                          <span className="font-medium text-[#333]">{cert.name}</span>
                        </div>
                      </td>
                      <td>
                        <span className={cn(
                          "forti-tag",
                          cert.type === 'ca' ? "bg-purple-100 text-purple-700 border-purple-200" :
                          cert.type === 'local' ? "bg-blue-100 text-blue-700 border-blue-200" :
                          cert.type === 'remote' ? "bg-green-100 text-green-700 border-green-200" :
                          "bg-yellow-100 text-yellow-700 border-yellow-200"
                        )}>
                          {cert.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-[#666] text-[10px] max-w-[200px] truncate" title={cert.subject}>{cert.subject}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <span className={cn(
                            "forti-tag",
                            cert.status === 'valid' ? "bg-green-100 text-green-700 border-green-200" :
                            cert.status === 'expired' ? "bg-red-100 text-red-700 border-red-200" :
                            cert.status === 'revoked' ? "bg-orange-100 text-orange-700 border-orange-200" :
                            "bg-yellow-100 text-yellow-700 border-yellow-200"
                          )}>
                            {cert.status.toUpperCase()}
                          </span>
                          {isExpiringSoon && <span title={`Expires in ${daysLeft} days`}><AlertTriangle size={11} className="text-orange-500" /></span>}
                        </div>
                      </td>
                      <td className="text-[10px] text-[#666]">{formatDate(cert.validFrom)}</td>
                      <td className={cn("text-[10px]", cert.status === 'expired' ? "text-red-600" : "text-[#666]")}>{formatDate(cert.validTo)}</td>
                      <td className="text-[10px] text-[#666]">{cert.keySize} bit</td>
                      <td>
                        <div className="flex items-center gap-0.5">
                          <button className="p-1 hover:bg-[#f0f0f0]"><Eye size={12} className="text-[#666]" /></button>
                          <button className="p-1 hover:bg-[#f0f0f0]"><Download size={12} className="text-[#666]" /></button>
                          <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => handleDeleteCert(cert.id)}><Trash2 size={12} className="text-red-500" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* CA Certificates Tab */}
        {activeTab === 'ca' && (
          <div className="border-x border-b border-[#ddd] bg-white">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-[#eee]">
              <button className="forti-toolbar-btn"><Upload size={12} /><span>Import CA</span></button>
              <button className="forti-toolbar-btn"><Download size={12} /><span>Export</span></button>
            </div>
            <div className="grid grid-cols-2 gap-4 p-4">
              {certificates.filter(c => c.type === 'ca' || c.type === 'remote').map((cert) => (
                <div key={cert.id} className="border border-[#ddd] bg-[#fafafa]">
                  <div className="flex items-center justify-between px-3 py-2 bg-[#f0f0f0] border-b border-[#ddd]">
                    <div className="flex items-center gap-2">
                      <FileText size={13} className={cert.type === 'ca' ? "text-purple-600" : "text-blue-600"} />
                      <span className="text-[11px] font-semibold">{cert.name}</span>
                      <span className={cn(
                        "forti-tag",
                        cert.type === 'ca' ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-blue-100 text-blue-700 border-blue-200"
                      )}>
                        {cert.type.toUpperCase()}
                      </span>
                    </div>
                    <span className={cn(
                      "forti-tag",
                      cert.status === 'valid' ? "bg-green-100 text-green-700 border-green-200" : "bg-red-100 text-red-700 border-red-200"
                    )}>
                      {cert.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="p-3 space-y-2 text-[11px]">
                    <div className="text-[10px] text-[#666] truncate">{cert.subject}</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div><span className="text-[10px] text-[#888]">Serial:</span> <span className="mono text-[10px]">{cert.serialNumber}</span></div>
                      <div><span className="text-[10px] text-[#888]">Algorithm:</span> {cert.signatureAlgorithm}</div>
                      <div className="flex items-center gap-1"><Calendar size={10} className="text-[#888]" /> {formatDate(cert.validFrom)}</div>
                      <div className="flex items-center gap-1"><Calendar size={10} className="text-[#888]" /> {formatDate(cert.validTo)}</div>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1 border-t border-[#eee]">
                      {cert.usage.map((u, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 bg-[#f0f0f0] border border-[#ddd] text-[#666]">{u}</span>
                      ))}
                    </div>
                    <div className="flex justify-end gap-1 pt-1">
                      <button className="forti-toolbar-btn"><Download size={11} /><span>Export</span></button>
                      <button className="forti-toolbar-btn text-red-600"><Trash2 size={11} /><span>Remove</span></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exemptions Tab */}
        {activeTab === 'exemptions' && (
          <div className="border-x border-b border-[#ddd] bg-white p-4">
            <div className="grid grid-cols-2 gap-4">
              {/* Category Exemptions */}
              <div className="border border-[#ddd]">
                <div className="flex items-center justify-between px-3 py-2 bg-[#f0f0f0] border-b border-[#ddd]">
                  <div className="flex items-center gap-1.5">
                    <Globe size={13} className="text-orange-600" />
                    <span className="text-[11px] font-semibold">Category Exemptions</span>
                  </div>
                  <button className="forti-toolbar-btn text-green-700"><Plus size={11} /><span>Add</span></button>
                </div>
                <div className="p-2 text-[10px] text-[#888] border-b border-[#eee]">Skip SSL inspection for these website categories</div>
                <div className="divide-y divide-[#eee]">
                  {webCategories.slice(0, 4).map((cat, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <EyeOff size={12} className="text-orange-500" />
                        <span className="text-[11px]">{cat}</span>
                      </div>
                      <button className="p-1 hover:bg-[#f0f0f0]"><Trash2 size={11} className="text-red-500" /></button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address Exemptions */}
              <div className="border border-[#ddd]">
                <div className="flex items-center justify-between px-3 py-2 bg-[#f0f0f0] border-b border-[#ddd]">
                  <div className="flex items-center gap-1.5">
                    <Server size={13} className="text-blue-600" />
                    <span className="text-[11px] font-semibold">Address Exemptions</span>
                  </div>
                  <button className="forti-toolbar-btn text-green-700"><Plus size={11} /><span>Add</span></button>
                </div>
                <div className="p-2 text-[10px] text-[#888] border-b border-[#eee]">Skip SSL inspection for these IP addresses/ranges</div>
                <div className="divide-y divide-[#eee]">
                  {['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'internal.company.com'].map((addr, i) => (
                    <div key={i} className="flex items-center justify-between px-3 py-2">
                      <div className="flex items-center gap-2">
                        <EyeOff size={12} className="text-blue-500" />
                        <span className="text-[11px] mono">{addr}</span>
                      </div>
                      <button className="p-1 hover:bg-[#f0f0f0]"><Trash2 size={11} className="text-red-500" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Profile Edit Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-2xl p-0">
          <DialogHeader className="section-header-neutral !mb-0 p-3">
            <DialogTitle className="text-[11px] font-semibold flex items-center gap-2">
              <Shield size={14} />
              {editingProfile?.name ? `Edit Profile: ${editingProfile.name}` : 'Create SSL Inspection Profile'}
            </DialogTitle>
          </DialogHeader>

          {editingProfile && (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] text-[#666] block mb-1">Name *</label>
                  <input className="forti-input w-full" value={editingProfile.name}
                    onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})} placeholder="Profile name" />
                </div>
                <div>
                  <label className="text-[11px] text-[#666] block mb-1">Inspection Mode</label>
                  <select className="forti-input w-full" value={editingProfile.mode}
                    onChange={(e) => setEditingProfile({...editingProfile, mode: e.target.value as SSLProfile['mode']})}>
                    <option value="certificate-inspection">Certificate Inspection</option>
                    <option value="deep-inspection">Deep Inspection (MITM)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[11px] text-[#666] block mb-1">Comment</label>
                <input className="forti-input w-full" value={editingProfile.comment}
                  onChange={(e) => setEditingProfile({...editingProfile, comment: e.target.value})} placeholder="Description" />
              </div>

              {editingProfile.mode === 'deep-inspection' && (
                <div className="p-3 border border-purple-200 bg-purple-50">
                  <div className="flex items-center gap-2 mb-2 text-[11px] font-semibold text-purple-700">
                    <Eye size={13} /> Deep Inspection Settings
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] text-[#666] block mb-1">CA Certificate</label>
                      <select className="forti-input w-full" value={editingProfile.caName}
                        onChange={(e) => setEditingProfile({...editingProfile, caName: e.target.value})}>
                        <option value="">Select CA Certificate</option>
                        {certificates.filter(c => c.type === 'ca').map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-end">
                      <label className="flex items-center gap-2 text-[11px]">
                        <input type="checkbox" checked={editingProfile.mitmMode}
                          onChange={(e) => setEditingProfile({...editingProfile, mitmMode: e.target.checked})} />
                        Enable MITM
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[11px] text-[#666] block mb-1">Untrusted Cert Action</label>
                  <select className="forti-input w-full" value={editingProfile.untrustedCertAction}
                    onChange={(e) => setEditingProfile({...editingProfile, untrustedCertAction: e.target.value as SSLProfile['untrustedCertAction']})}>
                    <option value="block">Block</option>
                    <option value="allow">Allow</option>
                    <option value="ignore">Ignore</option>
                  </select>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={editingProfile.sniCheck}
                      onChange={(e) => setEditingProfile({...editingProfile, sniCheck: e.target.checked})} />
                    SNI Check
                  </label>
                </div>
                <div className="flex items-end">
                  <label className="flex items-center gap-2 text-[11px]">
                    <input type="checkbox" checked={editingProfile.allowInvalidCert}
                      onChange={(e) => setEditingProfile({...editingProfile, allowInvalidCert: e.target.checked})} />
                    Allow Invalid Certs
                  </label>
                </div>
              </div>

              {/* Protocols */}
              <div>
                <label className="text-[11px] text-[#666] block mb-2">Inspected Protocols & Ports</label>
                <div className="grid grid-cols-5 gap-2">
                  {Object.entries(editingProfile.protocols).map(([proto, enabled]) => (
                    <div key={proto} className={cn("p-2 border text-center", enabled ? "bg-green-50 border-green-200" : "bg-[#f5f5f5] border-[#ddd]")}>
                      <label className="flex items-center justify-center gap-1 text-[11px] font-medium mb-1">
                        <input type="checkbox" checked={enabled}
                          onChange={(e) => setEditingProfile({
                            ...editingProfile,
                            protocols: {...editingProfile.protocols, [proto]: e.target.checked}
                          })} />
                        {proto.toUpperCase()}
                      </label>
                      <input className="forti-input w-full text-center text-[10px]"
                        value={editingProfile.ports[proto as keyof typeof editingProfile.ports]}
                        onChange={(e) => setEditingProfile({
                          ...editingProfile,
                          ports: {...editingProfile.ports, [proto]: e.target.value}
                        })} />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-[#eee]">
                <button className="btn btn-outline" onClick={() => setShowProfileModal(false)}>Cancel</button>
                <button className="btn btn-primary" onClick={saveProfile}>Save</button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default SSLInspection;
