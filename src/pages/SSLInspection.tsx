import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
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
  Edit,
  Copy,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Calendar,
  Server,
  Globe,
  Settings,
  ChevronDown,
  ChevronUp
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

// Certificate Types
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
  protocols: {
    https: boolean;
    smtps: boolean;
    pop3s: boolean;
    imaps: boolean;
    ftps: boolean;
  };
  ports: {
    https: string;
    smtps: string;
    pop3s: string;
    imaps: string;
    ftps: string;
  };
}

// Mock Data
const mockCertificates: Certificate[] = [
  {
    id: 'cert-1',
    name: 'Fortinet_CA_SSL',
    type: 'ca',
    subject: 'CN=Fortinet CA SSL, O=Fortinet, C=US',
    issuer: 'CN=Fortinet CA SSL, O=Fortinet, C=US',
    serialNumber: '00:A1:B2:C3:D4:E5:F6:78',
    validFrom: new Date('2023-01-01'),
    validTo: new Date('2033-01-01'),
    status: 'valid',
    keySize: 4096,
    signatureAlgorithm: 'SHA256withRSA',
    usage: ['Digital Signature', 'Key Encipherment', 'CA'],
    fingerprint: 'A1:B2:C3:D4:E5:F6:78:90:AB:CD:EF:12:34:56:78:90'
  },
  {
    id: 'cert-2',
    name: 'FortiGate_Server',
    type: 'local',
    subject: 'CN=FortiGate-500E, O=Organization, C=US',
    issuer: 'CN=Fortinet CA SSL, O=Fortinet, C=US',
    serialNumber: '00:FF:EE:DD:CC:BB:AA:99',
    validFrom: new Date('2024-01-01'),
    validTo: new Date('2025-01-01'),
    status: 'valid',
    keySize: 2048,
    signatureAlgorithm: 'SHA256withRSA',
    usage: ['Digital Signature', 'Key Encipherment'],
    fingerprint: 'FF:EE:DD:CC:BB:AA:99:88:77:66:55:44:33:22:11:00'
  },
  {
    id: 'cert-3',
    name: 'DigiCert_Root_CA',
    type: 'remote',
    subject: 'CN=DigiCert Global Root CA, O=DigiCert Inc, C=US',
    issuer: 'CN=DigiCert Global Root CA, O=DigiCert Inc, C=US',
    serialNumber: '08:3B:E0:56:90:42:46:B1:A1:75:6A:C9:59:91:C7:4A',
    validFrom: new Date('2006-11-10'),
    validTo: new Date('2031-11-10'),
    status: 'valid',
    keySize: 2048,
    signatureAlgorithm: 'SHA1withRSA',
    usage: ['Digital Signature', 'Certificate Sign', 'CRL Sign'],
    fingerprint: '08:3B:E0:56:90:42:46:B1:A1:75:6A:C9:59:91:C7:4A'
  },
  {
    id: 'cert-4',
    name: 'Expired_Legacy_Cert',
    type: 'local',
    subject: 'CN=Legacy Server, O=Organization, C=US',
    issuer: 'CN=Fortinet CA SSL, O=Fortinet, C=US',
    serialNumber: '00:11:22:33:44:55:66:77',
    validFrom: new Date('2020-01-01'),
    validTo: new Date('2023-01-01'),
    status: 'expired',
    keySize: 2048,
    signatureAlgorithm: 'SHA256withRSA',
    usage: ['Digital Signature'],
    fingerprint: '11:22:33:44:55:66:77:88:99:AA:BB:CC:DD:EE:FF:00'
  }
];

const mockSSLProfiles: SSLProfile[] = [
  {
    id: 'ssl-1',
    name: 'deep-inspection',
    comment: 'Full SSL/TLS inspection with MITM',
    enabled: true,
    mode: 'deep-inspection',
    allowInvalidCert: false,
    untrustedCertAction: 'block',
    sniCheck: true,
    mitmMode: true,
    caName: 'Fortinet_CA_SSL',
    exemptedCategories: ['Finance and Banking', 'Health and Wellness'],
    exemptedAddresses: ['10.0.0.0/8', '172.16.0.0/12'],
    protocols: { https: true, smtps: true, pop3s: true, imaps: true, ftps: true },
    ports: { https: '443', smtps: '465', pop3s: '995', imaps: '993', ftps: '990' }
  },
  {
    id: 'ssl-2',
    name: 'certificate-inspection',
    comment: 'Basic certificate validation only',
    enabled: true,
    mode: 'certificate-inspection',
    allowInvalidCert: true,
    untrustedCertAction: 'allow',
    sniCheck: true,
    mitmMode: false,
    caName: '',
    exemptedCategories: [],
    exemptedAddresses: [],
    protocols: { https: true, smtps: false, pop3s: false, imaps: false, ftps: false },
    ports: { https: '443', smtps: '465', pop3s: '995', imaps: '993', ftps: '990' }
  },
  {
    id: 'ssl-3',
    name: 'no-inspection',
    comment: 'Bypass SSL inspection',
    enabled: false,
    mode: 'certificate-inspection',
    allowInvalidCert: true,
    untrustedCertAction: 'ignore',
    sniCheck: false,
    mitmMode: false,
    caName: '',
    exemptedCategories: [],
    exemptedAddresses: [],
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
  const [activeTab, setActiveTab] = useState('profiles');
  const [certificates, setCertificates] = useState<Certificate[]>(mockCertificates);
  const [sslProfiles, setSSLProfiles] = useState<SSLProfile[]>(mockSSLProfiles);
  const [search, setSearch] = useState('');
  const [certType, setCertType] = useState('all');
  const [selectedCerts, setSelectedCerts] = useState<string[]>([]);
  const [selectedProfiles, setSelectedProfiles] = useState<string[]>([]);
  const [showCertModal, setShowCertModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [editingProfile, setEditingProfile] = useState<SSLProfile | null>(null);
  const [editingCert, setEditingCert] = useState<Certificate | null>(null);
  const [expandedProfiles, setExpandedProfiles] = useState<string[]>([]);

  const filteredCertificates = certificates.filter(cert => {
    const matchesSearch = search === '' ||
      cert.name.toLowerCase().includes(search.toLowerCase()) ||
      cert.subject.toLowerCase().includes(search.toLowerCase());
    const matchesType = certType === 'all' || cert.type === certType;
    return matchesSearch && matchesType;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'expired': return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'revoked': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getCertTypeColor = (type: string) => {
    switch (type) {
      case 'ca': return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      case 'local': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'remote': return 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30';
      case 'crl': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const getDaysUntilExpiry = (date: Date) => {
    const diff = date.getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const toggleCertSelection = (id: string) => {
    setSelectedCerts(prev =>
      prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]
    );
  };

  const toggleProfileSelection = (id: string) => {
    setSelectedProfiles(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const toggleProfileExpand = (id: string) => {
    setExpandedProfiles(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleDeleteCert = (id: string) => {
    setCertificates(prev => prev.filter(c => c.id !== id));
    toast.success('Certificate deleted');
  };

  const handleToggleProfile = (id: string) => {
    setSSLProfiles(prev => prev.map(p =>
      p.id === id ? { ...p, enabled: !p.enabled } : p
    ));
    toast.success('Profile status updated');
  };

  const openProfileModal = (profile?: SSLProfile) => {
    if (profile) {
      setEditingProfile({ ...profile });
    } else {
      setEditingProfile({
        id: `ssl-${Date.now()}`,
        name: '',
        comment: '',
        enabled: true,
        mode: 'certificate-inspection',
        allowInvalidCert: false,
        untrustedCertAction: 'block',
        sniCheck: true,
        mitmMode: false,
        caName: '',
        exemptedCategories: [],
        exemptedAddresses: [],
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
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">SSL Inspection</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Manage certificates and deep inspection profiles</p>
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

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-[#1e293b]">
            <TabsTrigger value="profiles" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <Shield size={14} />
              Inspection Profiles
            </TabsTrigger>
            <TabsTrigger value="certificates" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <Key size={14} />
              Certificates
            </TabsTrigger>
            <TabsTrigger value="ca" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <FileText size={14} />
              CA Certificates
            </TabsTrigger>
            <TabsTrigger value="exemptions" className="gap-1.5 data-[state=active]:bg-[#4caf50]">
              <EyeOff size={14} />
              Exemptions
            </TabsTrigger>
          </TabsList>

          {/* Inspection Profiles Tab */}
          <TabsContent value="profiles" className="space-y-4 mt-4">
            {/* Toolbar */}
            <div className="forti-toolbar">
              <Button 
                size="sm" 
                className="gap-1.5 bg-[#4caf50] hover:bg-[#43a047]"
                onClick={() => openProfileModal()}
              >
                <Plus size={14} />
                Create New
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={selectedProfiles.length !== 1}>
                <Edit size={14} />
                Edit
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={selectedProfiles.length !== 1}>
                <Copy size={14} />
                Clone
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-red-400" disabled={selectedProfiles.length === 0}>
                <Trash2 size={14} />
                Delete
              </Button>
              <div className="flex-1" />
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder="Search profiles..." className="pl-8 h-8 w-48" />
              </div>
            </div>

            {/* Profiles List */}
            <div className="space-y-3">
              {sslProfiles.map((profile) => (
                <div 
                  key={profile.id} 
                  className={cn(
                    "section border overflow-hidden",
                    selectedProfiles.includes(profile.id) && "ring-1 ring-[#4caf50]"
                  )}
                >
                  {/* Profile Header */}
                  <div 
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-white/5"
                    onClick={() => toggleProfileExpand(profile.id)}
                  >
                    <Checkbox
                      checked={selectedProfiles.includes(profile.id)}
                      onCheckedChange={() => toggleProfileSelection(profile.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className={cn(
                      "p-2 rounded-lg",
                      profile.mode === 'deep-inspection' ? "bg-purple-500/20" : "bg-blue-500/20"
                    )}>
                      {profile.mode === 'deep-inspection' ? (
                        <Eye size={18} className="text-purple-400" />
                      ) : (
                        <Lock size={18} className="text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold">{profile.name}</h3>
                        <span className={cn(
                          "text-[10px] px-2 py-0.5 rounded border",
                          profile.mode === 'deep-inspection' 
                            ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        )}>
                          {profile.mode === 'deep-inspection' ? 'Deep Inspection' : 'Certificate Inspection'}
                        </span>
                        {profile.mitmMode && (
                          <span className="text-[10px] px-2 py-0.5 rounded border bg-amber-500/20 text-amber-400 border-amber-500/30">
                            MITM
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">{profile.comment}</p>
                    </div>
                    <Switch
                      checked={profile.enabled}
                      onCheckedChange={() => handleToggleProfile(profile.id)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <Button variant="ghost" size="sm" onClick={(e) => { e.stopPropagation(); openProfileModal(profile); }}>
                      <Edit size={14} />
                    </Button>
                    {expandedProfiles.includes(profile.id) ? (
                      <ChevronUp size={16} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={16} className="text-muted-foreground" />
                    )}
                  </div>

                  {/* Expanded Details */}
                  {expandedProfiles.includes(profile.id) && (
                    <div className="border-t border-border p-4 bg-black/20 space-y-4">
                      {/* Protocol Settings */}
                      <div>
                        <div className="text-[10px] text-muted-foreground uppercase mb-2">Inspected Protocols</div>
                        <div className="grid grid-cols-5 gap-3">
                          {Object.entries(profile.protocols).map(([proto, enabled]) => (
                            <div key={proto} className={cn(
                              "p-2 rounded border text-center",
                              enabled ? "bg-emerald-500/10 border-emerald-500/30" : "bg-muted/20 border-border"
                            )}>
                              <div className="text-xs font-medium">{proto.toUpperCase()}</div>
                              <div className="text-[10px] text-muted-foreground">
                                Port {profile.ports[proto as keyof typeof profile.ports]}
                              </div>
                              <div className={cn("text-[10px] mt-1", enabled ? "text-emerald-400" : "text-muted-foreground")}>
                                {enabled ? 'Enabled' : 'Disabled'}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Security Settings */}
                      <div className="grid grid-cols-4 gap-4">
                        <div className="space-y-1">
                          <div className="text-[10px] text-muted-foreground uppercase">SNI Check</div>
                          <div className={cn("text-xs font-medium", profile.sniCheck ? "text-emerald-400" : "text-muted-foreground")}>
                            {profile.sniCheck ? 'Enabled' : 'Disabled'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-muted-foreground uppercase">Invalid Cert</div>
                          <div className={cn("text-xs font-medium", profile.allowInvalidCert ? "text-amber-400" : "text-emerald-400")}>
                            {profile.allowInvalidCert ? 'Allow' : 'Block'}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-muted-foreground uppercase">Untrusted Cert</div>
                          <div className={cn(
                            "text-xs font-medium",
                            profile.untrustedCertAction === 'block' ? "text-red-400" :
                            profile.untrustedCertAction === 'allow' ? "text-amber-400" : "text-muted-foreground"
                          )}>
                            {profile.untrustedCertAction.charAt(0).toUpperCase() + profile.untrustedCertAction.slice(1)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[10px] text-muted-foreground uppercase">CA Certificate</div>
                          <div className="text-xs font-medium text-blue-400">
                            {profile.caName || 'None'}
                          </div>
                        </div>
                      </div>

                      {/* Exemptions */}
                      {(profile.exemptedCategories.length > 0 || profile.exemptedAddresses.length > 0) && (
                        <div>
                          <div className="text-[10px] text-muted-foreground uppercase mb-2">Exemptions</div>
                          <div className="flex flex-wrap gap-2">
                            {profile.exemptedCategories.map((cat, i) => (
                              <span key={i} className="text-[10px] px-2 py-1 rounded bg-orange-500/10 text-orange-400 border border-orange-500/30">
                                {cat}
                              </span>
                            ))}
                            {profile.exemptedAddresses.map((addr, i) => (
                              <span key={i} className="text-[10px] px-2 py-1 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                                {addr}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Certificates Tab */}
          <TabsContent value="certificates" className="space-y-4 mt-4">
            {/* Toolbar */}
            <div className="forti-toolbar">
              <Button size="sm" className="gap-1.5 bg-[#4caf50] hover:bg-[#43a047]">
                <Plus size={14} />
                Generate
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Upload size={14} />
                Import
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" disabled={selectedCerts.length !== 1}>
                <Download size={14} />
                Export
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5 text-red-400" disabled={selectedCerts.length === 0}>
                <Trash2 size={14} />
                Delete
              </Button>
              <div className="flex-1" />
              <Select value={certType} onValueChange={setCertType}>
                <SelectTrigger className="w-32 h-8">
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="local">Local</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="ca">CA</SelectItem>
                  <SelectItem value="crl">CRL</SelectItem>
                </SelectContent>
              </Select>
              <div className="relative">
                <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input 
                  placeholder="Search certificates..." 
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 h-8 w-48" 
                />
              </div>
            </div>

            {/* Certificates Table */}
            <div className="data-table">
              <table>
                <thead>
                  <tr>
                    <th className="w-10">
                      <Checkbox
                        checked={selectedCerts.length === filteredCertificates.length && filteredCertificates.length > 0}
                        onCheckedChange={(checked) => {
                          setSelectedCerts(checked ? filteredCertificates.map(c => c.id) : []);
                        }}
                      />
                    </th>
                    <th>Name</th>
                    <th>Type</th>
                    <th>Subject</th>
                    <th>Status</th>
                    <th>Valid From</th>
                    <th>Valid To</th>
                    <th>Key Size</th>
                    <th className="w-20">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((cert) => {
                    const daysLeft = getDaysUntilExpiry(cert.validTo);
                    const isExpiringSoon = daysLeft > 0 && daysLeft < 90;
                    
                    return (
                      <tr 
                        key={cert.id}
                        className={cn(selectedCerts.includes(cert.id) && "bg-[#4caf50]/10")}
                      >
                        <td>
                          <Checkbox
                            checked={selectedCerts.includes(cert.id)}
                            onCheckedChange={() => toggleCertSelection(cert.id)}
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <Key size={14} className="text-muted-foreground" />
                            <span className="font-medium">{cert.name}</span>
                          </div>
                        </td>
                        <td>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded border", getCertTypeColor(cert.type))}>
                            {cert.type.toUpperCase()}
                          </span>
                        </td>
                        <td className="text-muted-foreground text-xs max-w-[200px] truncate" title={cert.subject}>
                          {cert.subject}
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <span className={cn("text-[10px] px-2 py-0.5 rounded border", getStatusColor(cert.status))}>
                              {cert.status.toUpperCase()}
                            </span>
                            {isExpiringSoon && (
                              <span title={`Expires in ${daysLeft} days`}>
                                <AlertTriangle size={12} className="text-amber-400" />
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="text-xs">{formatDate(cert.validFrom)}</td>
                        <td className="text-xs">
                          <span className={cn(cert.status === 'expired' && "text-red-400")}>
                            {formatDate(cert.validTo)}
                          </span>
                        </td>
                        <td className="text-xs">{cert.keySize} bit</td>
                        <td>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm"><Eye size={14} /></Button>
                            <Button variant="ghost" size="sm"><Download size={14} /></Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="text-red-400"
                              onClick={() => handleDeleteCert(cert.id)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* CA Certificates Tab */}
          <TabsContent value="ca" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              {certificates.filter(c => c.type === 'ca' || c.type === 'remote').map((cert) => (
                <div key={cert.id} className="section p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg",
                        cert.type === 'ca' ? "bg-purple-500/20" : "bg-cyan-500/20"
                      )}>
                        <FileText size={18} className={cert.type === 'ca' ? "text-purple-400" : "text-cyan-400"} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold">{cert.name}</h3>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded border", getCertTypeColor(cert.type))}>
                            {cert.type.toUpperCase()}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate max-w-[300px]">{cert.subject}</p>
                      </div>
                    </div>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded border", getStatusColor(cert.status))}>
                      {cert.status.toUpperCase()}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Serial Number</div>
                      <div className="font-mono text-muted-foreground">{cert.serialNumber}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Algorithm</div>
                      <div>{cert.signatureAlgorithm}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Valid From</div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-muted-foreground" />
                        {formatDate(cert.validFrom)}
                      </div>
                    </div>
                    <div>
                      <div className="text-[10px] text-muted-foreground uppercase">Valid To</div>
                      <div className="flex items-center gap-1">
                        <Calendar size={12} className="text-muted-foreground" />
                        {formatDate(cert.validTo)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 pt-3 border-t border-border">
                    <div className="text-[10px] text-muted-foreground uppercase mb-1">Key Usage</div>
                    <div className="flex flex-wrap gap-1">
                      {cert.usage.map((u, i) => (
                        <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-muted/30">
                          {u}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end gap-2">
                    <Button variant="outline" size="sm" className="gap-1">
                      <Download size={12} />
                      Export
                    </Button>
                    <Button variant="outline" size="sm" className="gap-1 text-red-400">
                      <Trash2 size={12} />
                      Remove
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Exemptions Tab */}
          <TabsContent value="exemptions" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-6">
              {/* Category Exemptions */}
              <div className="section p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Globe size={16} className="text-orange-400" />
                    <h3 className="text-sm font-bold">Category Exemptions</h3>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus size={12} />
                    Add Category
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Skip SSL inspection for these website categories
                </p>
                <div className="space-y-2">
                  {webCategories.slice(0, 4).map((cat, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/20">
                      <div className="flex items-center gap-2">
                        <EyeOff size={14} className="text-orange-400" />
                        <span className="text-sm">{cat}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-400 h-6 w-6 p-0">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Address Exemptions */}
              <div className="section p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Server size={16} className="text-cyan-400" />
                    <h3 className="text-sm font-bold">Address Exemptions</h3>
                  </div>
                  <Button size="sm" variant="outline" className="gap-1">
                    <Plus size={12} />
                    Add Address
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  Skip SSL inspection for these IP addresses/ranges
                </p>
                <div className="space-y-2">
                  {['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16', 'internal.company.com'].map((addr, i) => (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-muted/20">
                      <div className="flex items-center gap-2">
                        <EyeOff size={14} className="text-cyan-400" />
                        <span className="text-sm font-mono">{addr}</span>
                      </div>
                      <Button variant="ghost" size="sm" className="text-red-400 h-6 w-6 p-0">
                        <Trash2 size={12} />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Edit Modal */}
      <Dialog open={showProfileModal} onOpenChange={setShowProfileModal}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0">
          <div className="bg-gradient-to-r from-[#4caf50] to-[#43a047] p-3">
            <DialogTitle className="text-white text-sm font-bold flex items-center gap-2">
              <Shield size={16} />
              {editingProfile?.name ? `Edit SSL Inspection Profile: ${editingProfile.name}` : 'Create SSL Inspection Profile'}
            </DialogTitle>
          </div>
          
          {editingProfile && (
            <div className="p-4 space-y-4">
              {/* Basic Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">Name *</label>
                  <Input
                    value={editingProfile.name}
                    onChange={(e) => setEditingProfile({...editingProfile, name: e.target.value})}
                    placeholder="Profile name"
                  />
                </div>
                <div>
                  <label className="forti-label">Inspection Mode</label>
                  <Select 
                    value={editingProfile.mode} 
                    onValueChange={(v: 'certificate-inspection' | 'deep-inspection') => setEditingProfile({...editingProfile, mode: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="certificate-inspection">Certificate Inspection</SelectItem>
                      <SelectItem value="deep-inspection">Deep Inspection (MITM)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="forti-label">Comment</label>
                <Input
                  value={editingProfile.comment}
                  onChange={(e) => setEditingProfile({...editingProfile, comment: e.target.value})}
                  placeholder="Description"
                />
              </div>

              {/* Deep Inspection Settings */}
              {editingProfile.mode === 'deep-inspection' && (
                <div className="p-3 rounded border border-purple-500/30 bg-purple-500/5">
                  <div className="flex items-center gap-2 mb-3">
                    <Eye size={14} className="text-purple-400" />
                    <span className="text-sm font-medium text-purple-400">Deep Inspection Settings</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="forti-label">CA Certificate</label>
                      <Select 
                        value={editingProfile.caName} 
                        onValueChange={(v) => setEditingProfile({...editingProfile, caName: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select CA Certificate" />
                        </SelectTrigger>
                        <SelectContent>
                          {certificates.filter(c => c.type === 'ca').map(c => (
                            <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={editingProfile.mitmMode}
                          onCheckedChange={(v) => setEditingProfile({...editingProfile, mitmMode: v})}
                        />
                        <span className="text-xs">Enable MITM</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Security Options */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="forti-label">Untrusted Certificate Action</label>
                  <Select 
                    value={editingProfile.untrustedCertAction} 
                    onValueChange={(v: 'allow' | 'block' | 'ignore') => setEditingProfile({...editingProfile, untrustedCertAction: v})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="block">Block</SelectItem>
                      <SelectItem value="allow">Allow</SelectItem>
                      <SelectItem value="ignore">Ignore</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingProfile.sniCheck}
                      onCheckedChange={(v) => setEditingProfile({...editingProfile, sniCheck: v})}
                    />
                    <span className="text-xs">SNI Check</span>
                  </div>
                </div>
                <div className="flex items-end gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={editingProfile.allowInvalidCert}
                      onCheckedChange={(v) => setEditingProfile({...editingProfile, allowInvalidCert: v})}
                    />
                    <span className="text-xs">Allow Invalid Certs</span>
                  </div>
                </div>
              </div>

              {/* Protocols */}
              <div>
                <label className="forti-label mb-2 block">Inspected Protocols & Ports</label>
                <div className="grid grid-cols-5 gap-3">
                  {Object.entries(editingProfile.protocols).map(([proto, enabled]) => (
                    <div key={proto} className="p-2 rounded border bg-muted/10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-medium">{proto.toUpperCase()}</span>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(v) => setEditingProfile({
                            ...editingProfile,
                            protocols: {...editingProfile.protocols, [proto]: v}
                          })}
                        />
                      </div>
                      <Input
                        className="h-7 text-xs"
                        value={editingProfile.ports[proto as keyof typeof editingProfile.ports]}
                        onChange={(e) => setEditingProfile({
                          ...editingProfile,
                          ports: {...editingProfile.ports, [proto]: e.target.value}
                        })}
                        placeholder="Port"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-[#4caf50] hover:bg-[#43a047]" onClick={saveProfile}>
                  Save
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default SSLInspection;
