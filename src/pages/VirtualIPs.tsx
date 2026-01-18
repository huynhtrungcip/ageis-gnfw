import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  Plus, Edit2, Trash2, RefreshCw, Search, ChevronDown, Globe, ArrowRightLeft, Server, X
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface VirtualIP {
  id: string;
  name: string;
  comments: string;
  type: 'static-nat' | 'load-balance' | 'server-load-balance' | 'access-proxy';
  externalIP: string;
  mappedIP: string;
  interface: string;
  protocol: string;
  externalPort: string;
  mappedPort: string;
  enabled: boolean;
  sessions: number;
}

const initialVIPs: VirtualIP[] = [
  { id: '1', name: 'WebServer-VIP', comments: 'Main web server virtual IP', type: 'static-nat', externalIP: '203.0.113.10', mappedIP: '192.168.1.100', interface: 'wan1', protocol: 'TCP', externalPort: '443', mappedPort: '443', enabled: true, sessions: 1247 },
  { id: '2', name: 'MailServer-VIP', comments: 'Email server SMTP and IMAP', type: 'static-nat', externalIP: '203.0.113.11', mappedIP: '192.168.1.101', interface: 'wan1', protocol: 'TCP', externalPort: '25,143,993', mappedPort: '25,143,993', enabled: true, sessions: 89 },
  { id: '3', name: 'FTP-VIP', comments: 'FTP server access', type: 'static-nat', externalIP: '203.0.113.12', mappedIP: '192.168.1.102', interface: 'wan1', protocol: 'TCP', externalPort: '21', mappedPort: '21', enabled: false, sessions: 0 },
  { id: '4', name: 'LoadBalancer-VIP', comments: 'Load balanced web servers', type: 'load-balance', externalIP: '203.0.113.20', mappedIP: '192.168.1.110-115', interface: 'wan1', protocol: 'TCP', externalPort: '80,443', mappedPort: '80,443', enabled: true, sessions: 3521 },
];

const VirtualIPs = () => {
  const [vips, setVips] = useState<VirtualIP[]>(initialVIPs);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<VirtualIP | null>(null);
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<VirtualIP['type']>('static-nat');
  const [formExternalIP, setFormExternalIP] = useState('');
  const [formMappedIP, setFormMappedIP] = useState('');
  const [formInterface, setFormInterface] = useState('wan1');
  const [formPort, setFormPort] = useState('');
  const [formComments, setFormComments] = useState('');

  const toggleVIP = (id: string) => setVips(prev => prev.map(vip => vip.id === id ? { ...vip, enabled: !vip.enabled } : vip));
  const handleSelect = (id: string) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const handleSelectAll = () => setSelectedIds(selectedIds.length === filteredVIPs.length ? [] : filteredVIPs.map(v => v.id));
  const filteredVIPs = vips.filter(vip => searchQuery === '' || vip.name.toLowerCase().includes(searchQuery.toLowerCase()) || vip.externalIP.includes(searchQuery));
  const getTypeLabel = (type: VirtualIP['type']) => ({ 'static-nat': 'Static NAT', 'load-balance': 'Load Balance', 'server-load-balance': 'Server LB', 'access-proxy': 'Access Proxy' }[type]);

  const openCreateModal = (type: VirtualIP['type']) => { setEditingItem(null); setFormName(''); setFormType(type); setFormExternalIP(''); setFormMappedIP(''); setFormInterface('wan1'); setFormPort(''); setFormComments(''); setModalOpen(true); setShowCreateMenu(false); };
  const openEditModal = () => { if (selectedIds.length !== 1) return; const item = vips.find(v => v.id === selectedIds[0]); if (item) { setEditingItem(item); setFormName(item.name); setFormType(item.type); setFormExternalIP(item.externalIP); setFormMappedIP(item.mappedIP); setFormInterface(item.interface); setFormPort(item.externalPort); setFormComments(item.comments); setModalOpen(true); } };
  const handleSave = () => { if (!formName.trim() || !formExternalIP.trim() || !formMappedIP.trim()) { toast.error('Name, External IP, and Mapped IP are required'); return; } if (editingItem) { setVips(prev => prev.map(v => v.id === editingItem.id ? { ...v, name: formName, type: formType, externalIP: formExternalIP, mappedIP: formMappedIP, interface: formInterface, externalPort: formPort, mappedPort: formPort, comments: formComments } : v)); toast.success(`Updated "${formName}"`); } else { setVips(prev => [...prev, { id: Date.now().toString(), name: formName, type: formType, externalIP: formExternalIP, mappedIP: formMappedIP, interface: formInterface, protocol: 'TCP', externalPort: formPort, mappedPort: formPort, comments: formComments, enabled: true, sessions: 0 }]); toast.success(`Created "${formName}"`); } setModalOpen(false); setSelectedIds([]); };
  const handleDelete = () => { if (selectedIds.length === 0) return; setVips(prev => prev.filter(v => !selectedIds.includes(v.id))); toast.success(`Deleted ${selectedIds.length} item(s)`); setSelectedIds([]); };
  const handleRefresh = () => { setVips([...initialVIPs]); setSelectedIds([]); setSearchQuery(''); toast.success('Data refreshed'); };

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        <div className="forti-toolbar">
          <div className="relative">
            <button className="forti-toolbar-btn primary" onClick={() => setShowCreateMenu(!showCreateMenu)}><Plus className="w-3 h-3" />Create New<ChevronDown className="w-3 h-3" /></button>
            {showCreateMenu && (<div className="absolute top-full left-0 mt-1 bg-white border border-[#ccc] shadow-lg z-50 min-w-[180px]">
              <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2" onClick={() => openCreateModal('static-nat')}><Globe className="w-3 h-3" />Static NAT</button>
              <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2" onClick={() => openCreateModal('load-balance')}><ArrowRightLeft className="w-3 h-3" />Load Balance</button>
              <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2" onClick={() => openCreateModal('server-load-balance')}><Server className="w-3 h-3" />Server Load Balance</button>
            </div>)}
          </div>
          <button className="forti-toolbar-btn" disabled={selectedIds.length !== 1} onClick={openEditModal}><Edit2 className="w-3 h-3" />Edit</button>
          <button className="forti-toolbar-btn" disabled={selectedIds.length === 0} onClick={handleDelete}><Trash2 className="w-3 h-3" />Delete</button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={handleRefresh}><RefreshCw className="w-3 h-3" />Refresh</button>
          <div className="flex-1" />
          <div className="forti-search"><Search className="w-3 h-3 text-[#999]" /><input type="text" placeholder="Search..." className="w-40" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />{searchQuery && <button onClick={() => setSearchQuery('')}><X className="w-3 h-3 text-[#999]" /></button>}</div>
        </div>
        <div className="p-4">
          <table className="data-table">
            <thead><tr><th className="w-8"><input type="checkbox" className="forti-checkbox" checked={selectedIds.length === filteredVIPs.length && filteredVIPs.length > 0} onChange={handleSelectAll} /></th><th className="w-16">Status</th><th>Name</th><th>Type</th><th>External IP</th><th>Mapped IP</th><th>Interface</th><th>Protocol/Port</th><th className="text-right">Sessions</th></tr></thead>
            <tbody>
              {filteredVIPs.map((vip) => (<tr key={vip.id} className={cn(!vip.enabled && "opacity-60", selectedIds.includes(vip.id) && "selected")} onDoubleClick={() => { setSelectedIds([vip.id]); setTimeout(openEditModal, 0); }}>
                <td><input type="checkbox" className="forti-checkbox" checked={selectedIds.includes(vip.id)} onChange={() => handleSelect(vip.id)} /></td>
                <td><FortiToggle enabled={vip.enabled} onToggle={() => toggleVIP(vip.id)} size="sm" /></td>
                <td><div className="flex items-center gap-2"><Globe className="w-3 h-3 text-blue-600" /><div><div className="text-[11px] font-medium">{vip.name}</div><div className="text-[10px] text-[#999]">{vip.comments}</div></div></div></td>
                <td><span className={cn("text-[10px] px-1.5 py-0.5 border", vip.type === 'static-nat' && "bg-blue-100 text-blue-700 border-blue-200", vip.type === 'load-balance' && "bg-purple-100 text-purple-700 border-purple-200")}>{getTypeLabel(vip.type)}</span></td>
                <td className="mono text-[11px]">{vip.externalIP}</td><td className="mono text-[11px]">{vip.mappedIP}</td>
                <td><span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">{vip.interface}</span></td>
                <td className="mono text-[11px]">{vip.protocol}:{vip.externalPort}</td><td className="text-right text-[11px] text-[#666]">{vip.sessions.toLocaleString()}</td>
              </tr>))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">{filteredVIPs.length} virtual IPs{selectedIds.length > 0 && ` (${selectedIds.length} selected)`}</div>
        </div>
      </div>
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader><DialogTitle className="text-sm font-semibold">{editingItem ? 'Edit Virtual IP' : 'New Virtual IP'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-4">
            <div className="grid grid-cols-4 items-center gap-3"><label className="text-xs text-right">Name</label><input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} className="col-span-3 text-xs border rounded px-2 py-1.5" /></div>
            <div className="grid grid-cols-4 items-center gap-3"><label className="text-xs text-right">Type</label><select value={formType} onChange={(e) => setFormType(e.target.value as VirtualIP['type'])} className="col-span-3 text-xs border rounded px-2 py-1.5"><option value="static-nat">Static NAT</option><option value="load-balance">Load Balance</option></select></div>
            <div className="grid grid-cols-4 items-center gap-3"><label className="text-xs text-right">External IP</label><input type="text" value={formExternalIP} onChange={(e) => setFormExternalIP(e.target.value)} className="col-span-3 text-xs border rounded px-2 py-1.5 font-mono" /></div>
            <div className="grid grid-cols-4 items-center gap-3"><label className="text-xs text-right">Mapped IP</label><input type="text" value={formMappedIP} onChange={(e) => setFormMappedIP(e.target.value)} className="col-span-3 text-xs border rounded px-2 py-1.5 font-mono" /></div>
            <div className="grid grid-cols-4 items-center gap-3"><label className="text-xs text-right">Interface</label><select value={formInterface} onChange={(e) => setFormInterface(e.target.value)} className="col-span-3 text-xs border rounded px-2 py-1.5"><option value="wan1">wan1</option><option value="wan2">wan2</option></select></div>
            <div className="grid grid-cols-4 items-center gap-3"><label className="text-xs text-right">Port</label><input type="text" value={formPort} onChange={(e) => setFormPort(e.target.value)} className="col-span-3 text-xs border rounded px-2 py-1.5 font-mono" placeholder="e.g., 443" /></div>
            <div className="grid grid-cols-4 items-center gap-3"><label className="text-xs text-right">Comments</label><input type="text" value={formComments} onChange={(e) => setFormComments(e.target.value)} className="col-span-3 text-xs border rounded px-2 py-1.5" /></div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t"><button onClick={() => setModalOpen(false)} className="px-3 py-1.5 text-xs border rounded hover:bg-muted">Cancel</button><button onClick={handleSave} className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded">{editingItem ? 'Save' : 'Create'}</button></div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default VirtualIPs;
