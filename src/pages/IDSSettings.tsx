import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { 
  Shield, 
  Search, 
  Download, 
  Upload, 
  RefreshCw,
  AlertTriangle,
  Check,
  X,
  Eye,
  Ban,
  Zap,
  FileText,
  Clock,
  Filter
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';

interface Signature {
  id: string;
  sid: number;
  name: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
  action: 'alert' | 'drop' | 'reject' | 'pass';
  enabled: boolean;
  hits: number;
  lastHit?: Date;
  description: string;
}

const mockSignatures: Signature[] = [
  { id: 'sig-1', sid: 2001219, name: 'ET SCAN SSH Brute Force Attempt', category: 'Attempted Administrator', severity: 'high', action: 'drop', enabled: true, hits: 1250, lastHit: new Date(), description: 'Detects SSH brute force login attempts' },
  { id: 'sig-2', sid: 2003068, name: 'ET MALWARE Trojan.GenericKD C2', category: 'Malware Command and Control', severity: 'critical', action: 'drop', enabled: true, hits: 85, lastHit: new Date(), description: 'Detects communication with known C2 servers' },
  { id: 'sig-3', sid: 2010935, name: 'ET POLICY Tor Exit Node Connection', category: 'Policy Violation', severity: 'medium', action: 'alert', enabled: true, hits: 42, lastHit: new Date(), description: 'Detects connections to Tor exit nodes' },
  { id: 'sig-4', sid: 2019401, name: 'ET SQL Injection UNION SELECT', category: 'Web Application Attack', severity: 'critical', action: 'drop', enabled: true, hits: 156, lastHit: new Date(), description: 'Detects SQL injection attempts' },
  { id: 'sig-5', sid: 2024792, name: 'ET SCAN Nmap SYN Scan', category: 'Detection of Scanning', severity: 'low', action: 'alert', enabled: true, hits: 892, lastHit: new Date(), description: 'Detects Nmap SYN port scanning' },
  { id: 'sig-6', sid: 2025928, name: 'ET EXPLOIT Apache Log4j RCE', category: 'Attempted User Attack', severity: 'critical', action: 'drop', enabled: true, hits: 23, lastHit: new Date(), description: 'Detects Log4Shell exploitation attempts' },
  { id: 'sig-7', sid: 2013028, name: 'ET POLICY DNS Query to .onion', category: 'Policy Violation', severity: 'low', action: 'alert', enabled: false, hits: 5, description: 'Detects DNS queries for .onion domains' },
  { id: 'sig-8', sid: 2027758, name: 'ET MALWARE Ransomware Beacon', category: 'Malware', severity: 'critical', action: 'drop', enabled: true, hits: 12, lastHit: new Date(), description: 'Detects ransomware C2 communication' },
];

const categories = [
  'All Categories',
  'Attempted Administrator',
  'Malware Command and Control',
  'Policy Violation',
  'Web Application Attack',
  'Detection of Scanning',
  'Attempted User Attack',
  'Malware',
];

const IDSSettings = () => {
  const { demoMode } = useDemoMode();
  const [signatures, setSignatures] = useState<Signature[]>(demoMode ? mockSignatures : []);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All Categories');
  const [severity, setSeverity] = useState('all');
  const [idsEnabled, setIdsEnabled] = useState(true);
  const [ipsEnabled, setIpsEnabled] = useState(true);
  const [updating, setUpdating] = useState(false);

  const filtered = signatures.filter(sig => {
    const matchesSearch = search === '' || 
      sig.name.toLowerCase().includes(search.toLowerCase()) ||
      sig.sid.toString().includes(search) ||
      sig.description.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = category === 'All Categories' || sig.category === category;
    const matchesSeverity = severity === 'all' || sig.severity === severity;
    return matchesSearch && matchesCategory && matchesSeverity;
  });

  const stats = {
    total: signatures.length,
    enabled: signatures.filter(s => s.enabled).length,
    critical: signatures.filter(s => s.severity === 'critical').length,
    blocked: signatures.reduce((acc, s) => acc + (s.action === 'drop' ? s.hits : 0), 0),
  };

  const handleToggleSignature = (sigId: string) => {
    setSignatures(prev => prev.map(s =>
      s.id === sigId ? { ...s, enabled: !s.enabled } : s
    ));
  };

  const handleChangeAction = (sigId: string, action: Signature['action']) => {
    setSignatures(prev => prev.map(s =>
      s.id === sigId ? { ...s, action } : s
    ));
    toast.success('Action updated');
  };

  const handleUpdateSignatures = async () => {
    setUpdating(true);
    await new Promise(resolve => setTimeout(resolve, 2000));
    setUpdating(false);
    toast.success('Signatures updated to latest version');
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'tag-critical';
      case 'high': return 'tag-high';
      case 'medium': return 'tag-medium';
      case 'low': return 'tag-low';
      default: return 'tag-info';
    }
  };

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'drop': return <Ban size={12} />;
      case 'reject': return <X size={12} />;
      case 'alert': return <Eye size={12} />;
      default: return <Check size={12} />;
    }
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">Threat Prevention (IDS/IPS)</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Intrusion Detection and Prevention System</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Upload size={14} />
              Import
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="gap-1.5"
              onClick={handleUpdateSignatures}
              disabled={updating}
            >
              <RefreshCw size={14} className={cn(updating && "animate-spin")} />
              {updating ? 'Updating...' : 'Update Signatures'}
            </Button>
          </div>
        </div>

        {/* IDS/IPS Toggle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className={cn(
            "section p-4 flex items-center justify-between",
            idsEnabled && "border-blue-500/30 bg-blue-500/5"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-lg",
                idsEnabled ? "bg-blue-500/20" : "bg-muted"
              )}>
                <Eye size={20} className={idsEnabled ? "text-blue-400" : "text-muted-foreground"} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Intrusion Detection (IDS)</h3>
                <p className="text-xs text-muted-foreground">Monitor and alert on threats</p>
              </div>
            </div>
            <Switch checked={idsEnabled} onCheckedChange={setIdsEnabled} />
          </div>

          <div className={cn(
            "section p-4 flex items-center justify-between",
            ipsEnabled && "border-red-500/30 bg-red-500/5"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "p-2.5 rounded-lg",
                ipsEnabled ? "bg-red-500/20" : "bg-muted"
              )}>
                <Shield size={20} className={ipsEnabled ? "text-red-400" : "text-muted-foreground"} />
              </div>
              <div>
                <h3 className="text-sm font-bold">Intrusion Prevention (IPS)</h3>
                <p className="text-xs text-muted-foreground">Block and reject threats</p>
              </div>
            </div>
            <Switch checked={ipsEnabled} onCheckedChange={setIpsEnabled} />
          </div>
        </div>

        {/* Stats Strip */}
        <div className="action-strip">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-lg font-bold">{stats.total}</div>
              <div className="text-[10px] text-muted-foreground">Total Signatures</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-lg font-bold text-emerald-400">{stats.enabled}</div>
              <div className="text-[10px] text-muted-foreground">Enabled</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-lg font-bold text-red-400">{stats.critical}</div>
              <div className="text-[10px] text-muted-foreground">Critical</div>
            </div>
            <div className="h-8 w-px bg-border" />
            <div className="text-center">
              <div className="text-lg font-bold text-amber-400">{stats.blocked.toLocaleString()}</div>
              <div className="text-[10px] text-muted-foreground">Blocked</div>
            </div>
          </div>
          <div className="flex-1" />
          <div className="text-xs text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </div>
        </div>

        {/* Filter Bar */}
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search signatures..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-9"
            />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-56 h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
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
          <span className="text-xs text-muted-foreground">{filtered.length} signatures</span>
        </div>

        {/* Signatures Table */}
        <div className="section">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-14">Status</th>
                <th className="w-24">SID</th>
                <th>Name</th>
                <th>Category</th>
                <th className="w-24">Severity</th>
                <th className="w-28">Action</th>
                <th className="text-right w-20">Hits</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sig) => (
                <tr key={sig.id} className={cn(!sig.enabled && "opacity-50")}>
                  <td>
                    <Switch
                      checked={sig.enabled}
                      onCheckedChange={() => handleToggleSignature(sig.id)}
                      className="scale-75"
                    />
                  </td>
                  <td className="font-mono text-muted-foreground">{sig.sid}</td>
                  <td>
                    <div>
                      <div className="font-medium text-sm">{sig.name}</div>
                      <div className="text-[10px] text-muted-foreground line-clamp-1">{sig.description}</div>
                    </div>
                  </td>
                  <td className="text-xs text-muted-foreground">{sig.category}</td>
                  <td>
                    <span className={cn("tag", getSeverityColor(sig.severity))}>
                      {sig.severity.toUpperCase()}
                    </span>
                  </td>
                  <td>
                    <Select 
                      value={sig.action} 
                      onValueChange={(value) => handleChangeAction(sig.id, value as Signature['action'])}
                    >
                      <SelectTrigger className="h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alert">
                          <span className="flex items-center gap-1.5">
                            <Eye size={12} /> Alert
                          </span>
                        </SelectItem>
                        <SelectItem value="drop">
                          <span className="flex items-center gap-1.5">
                            <Ban size={12} /> Drop
                          </span>
                        </SelectItem>
                        <SelectItem value="reject">
                          <span className="flex items-center gap-1.5">
                            <X size={12} /> Reject
                          </span>
                        </SelectItem>
                        <SelectItem value="pass">
                          <span className="flex items-center gap-1.5">
                            <Check size={12} /> Pass
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="text-right font-mono text-muted-foreground">
                    {sig.hits.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
};

export default IDSSettings;
