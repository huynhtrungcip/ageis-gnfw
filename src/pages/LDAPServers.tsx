import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw,
  Search,
  ChevronDown,
  Server,
  Shield,
  CheckCircle,
  XCircle,
  Activity
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface AuthServer {
  id: string;
  name: string;
  type: 'ldap' | 'radius';
  server: string;
  port: number;
  baseDN?: string;
  secret?: string;
  status: 'online' | 'offline' | 'unknown';
  enabled: boolean;
  users: number;
  lastTest: string;
}

const mockServers: AuthServer[] = [
  {
    id: '1',
    name: 'AD-Primary',
    type: 'ldap',
    server: '192.168.1.10',
    port: 389,
    baseDN: 'DC=company,DC=local',
    status: 'online',
    enabled: true,
    users: 1250,
    lastTest: '5 min ago'
  },
  {
    id: '2',
    name: 'AD-Secondary',
    type: 'ldap',
    server: '192.168.1.11',
    port: 389,
    baseDN: 'DC=company,DC=local',
    status: 'online',
    enabled: true,
    users: 1250,
    lastTest: '5 min ago'
  },
  {
    id: '3',
    name: 'LDAPS-Server',
    type: 'ldap',
    server: '192.168.1.12',
    port: 636,
    baseDN: 'DC=secure,DC=company,DC=local',
    status: 'online',
    enabled: true,
    users: 450,
    lastTest: '10 min ago'
  },
  {
    id: '4',
    name: 'RADIUS-Primary',
    type: 'radius',
    server: '192.168.1.20',
    port: 1812,
    status: 'online',
    enabled: true,
    users: 0,
    lastTest: '2 min ago'
  },
  {
    id: '5',
    name: 'RADIUS-VPN',
    type: 'radius',
    server: '192.168.1.21',
    port: 1812,
    status: 'offline',
    enabled: false,
    users: 0,
    lastTest: '1 hour ago'
  },
  {
    id: '6',
    name: 'Guest-RADIUS',
    type: 'radius',
    server: '10.0.1.50',
    port: 1812,
    status: 'unknown',
    enabled: true,
    users: 0,
    lastTest: 'Never'
  },
];

const LDAPServers = () => {
  const [servers, setServers] = useState<AuthServer[]>(mockServers);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [activeTab, setActiveTab] = useState<'ldap' | 'radius'>('ldap');
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<AuthServer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    server: '',
    port: 389,
    baseDN: '',
    type: 'ldap' as 'ldap' | 'radius',
  });

  const toggleServer = (id: string) => {
    setServers(prev => prev.map(server => 
      server.id === id ? { ...server, enabled: !server.enabled } : server
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredServers.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredServers.map(s => s.id));
    }
  };

  const openCreateModal = (type: 'ldap' | 'radius') => {
    setEditingServer(null);
    setFormData({
      name: '',
      server: '',
      port: type === 'ldap' ? 389 : 1812,
      baseDN: '',
      type,
    });
    setModalOpen(true);
    setShowCreateMenu(false);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) return;
    const server = servers.find(s => s.id === selectedIds[0]);
    if (!server) return;
    setEditingServer(server);
    setFormData({
      name: server.name,
      server: server.server,
      port: server.port,
      baseDN: server.baseDN || '',
      type: server.type,
    });
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.server.trim()) {
      toast.error('Name and Server are required');
      return;
    }
    if (editingServer) {
      setServers(prev => prev.map(s =>
        s.id === editingServer.id
          ? { ...s, name: formData.name, server: formData.server, port: formData.port, baseDN: formData.baseDN }
          : s
      ));
      toast.success('Server updated successfully');
    } else {
      const newServer: AuthServer = {
        id: `server-${Date.now()}`,
        name: formData.name,
        type: formData.type,
        server: formData.server,
        port: formData.port,
        baseDN: formData.type === 'ldap' ? formData.baseDN : undefined,
        status: 'unknown',
        enabled: true,
        users: 0,
        lastTest: 'Never',
      };
      setServers(prev => [...prev, newServer]);
      toast.success('Server created successfully');
    }
    setModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    setServers(prev => prev.filter(s => !selectedIds.includes(s.id)));
    setSelectedIds([]);
    setDeleteDialogOpen(false);
    toast.success(`${selectedIds.length} server(s) deleted`);
  };

  const handleTest = () => {
    toast.success('Testing connection...');
    setTimeout(() => {
      setServers(prev => prev.map(s => 
        selectedIds.includes(s.id) ? { ...s, status: 'online', lastTest: 'Just now' } : s
      ));
      toast.success('Connection test successful');
    }, 1500);
  };

  const handleRefresh = () => {
    toast.success('Servers refreshed');
  };

  const filteredServers = servers.filter(server => {
    const matchesSearch = searchQuery === '' ||
      server.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      server.server.includes(searchQuery);
    const matchesTab = server.type === activeTab;
    return matchesSearch && matchesTab;
  });

  const getStatusBadge = (status: AuthServer['status']) => {
    switch (status) {
      case 'online':
        return <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 w-fit"><CheckCircle className="w-3 h-3" /> Online</span>;
      case 'offline':
        return <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 w-fit"><XCircle className="w-3 h-3" /> Offline</span>;
      case 'unknown':
        return <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">Unknown</span>;
    }
  };

  const tabs = [
    { id: 'ldap', label: 'LDAP Servers', count: servers.filter(s => s.type === 'ldap').length },
    { id: 'radius', label: 'RADIUS Servers', count: servers.filter(s => s.type === 'radius').length },
  ];

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
          <div className="relative">
            <button 
              className="forti-toolbar-btn primary"
              onClick={() => setShowCreateMenu(!showCreateMenu)}
            >
              <Plus className="w-3 h-3" />
              Create New
              <ChevronDown className="w-3 h-3" />
            </button>
            {showCreateMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#ccc] shadow-lg z-50 min-w-[180px]">
                <button 
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                  onClick={() => openCreateModal('ldap')}
                >
                  <Server className="w-3 h-3" />
                  LDAP Server
                </button>
                <button 
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                  onClick={() => openCreateModal('radius')}
                >
                  <Shield className="w-3 h-3" />
                  RADIUS Server
                </button>
              </div>
            )}
          </div>
          <button 
            className="forti-toolbar-btn" 
            disabled={selectedIds.length !== 1}
            onClick={openEditModal}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button 
            className="forti-toolbar-btn" 
            disabled={selectedIds.length === 0}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button 
            className="forti-toolbar-btn"
            disabled={selectedIds.length === 0}
            onClick={handleTest}
          >
            <Activity className="w-3 h-3" />
            Test
          </button>
          <button className="forti-toolbar-btn" onClick={handleRefresh}>
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id as any); setSelectedIds([]); }}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeTab === tab.id 
                  ? "bg-white text-[hsl(142,70%,35%)] border-[hsl(142,70%,35%)]" 
                  : "text-[#666] border-transparent hover:text-[#333] hover:bg-[#f0f0f0]"
              )}
            >
              {tab.id === 'ldap' ? <Server className="w-3.5 h-3.5" /> : <Shield className="w-3.5 h-3.5" />}
              {tab.label}
              <span className={cn(
                "px-1.5 py-0.5 text-[10px] rounded",
                activeTab === tab.id ? "bg-[hsl(142,70%,35%)]/20 text-[hsl(142,70%,35%)]" : "bg-[#ddd] text-[#666]"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="p-4">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">
                  <input 
                    type="checkbox" 
                    className="forti-checkbox"
                    checked={selectedIds.length === filteredServers.length && filteredServers.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="w-16">Status</th>
                <th>Name</th>
                <th>Server</th>
                <th>Port</th>
                {activeTab === 'ldap' && <th>Base DN</th>}
                <th>Connection</th>
                <th>Last Test</th>
                {activeTab === 'ldap' && <th className="text-right">Users</th>}
              </tr>
            </thead>
            <tbody>
              {filteredServers.map((server) => (
                <tr 
                  key={server.id} 
                  className={cn(!server.enabled && "opacity-60", selectedIds.includes(server.id) && "selected")}
                  onDoubleClick={() => { setSelectedIds([server.id]); openEditModal(); }}
                >
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(server.id)}
                      onChange={() => handleSelect(server.id)}
                    />
                  </td>
                  <td>
                    <FortiToggle 
                      enabled={server.enabled} 
                      onToggle={() => toggleServer(server.id)}
                      size="sm"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {server.type === 'ldap' ? (
                        <Server className="w-3 h-3 text-blue-600" />
                      ) : (
                        <Shield className="w-3 h-3 text-purple-600" />
                      )}
                      <span className="text-[11px] font-medium">{server.name}</span>
                    </div>
                  </td>
                  <td className="mono text-[11px]">{server.server}</td>
                  <td className="mono text-[11px]">{server.port}</td>
                  {activeTab === 'ldap' && (
                    <td className="mono text-[10px] text-[#666]">{server.baseDN}</td>
                  )}
                  <td>{getStatusBadge(server.status)}</td>
                  <td className="text-[11px] text-[#666]">{server.lastTest}</td>
                  {activeTab === 'ldap' && (
                    <td className="text-right text-[11px] text-[#666]">{server.users.toLocaleString()}</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredServers.length} {activeTab === 'ldap' ? 'LDAP' : 'RADIUS'} servers
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {formData.type === 'ldap' ? <Server className="w-4 h-4" /> : <Shield className="w-4 h-4" />}
              {editingServer ? `Edit ${formData.type.toUpperCase()} Server` : `Create ${formData.type.toUpperCase()} Server`}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Server name"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Server IP/Hostname</Label>
                <Input
                  value={formData.server}
                  onChange={(e) => setFormData({ ...formData, server: e.target.value })}
                  placeholder="192.168.1.10"
                />
              </div>
              <div className="space-y-2">
                <Label>Port</Label>
                <Input
                  type="number"
                  value={formData.port}
                  onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            {formData.type === 'ldap' && (
              <div className="space-y-2">
                <Label>Base DN</Label>
                <Input
                  value={formData.baseDN}
                  onChange={(e) => setFormData({ ...formData, baseDN: e.target.value })}
                  placeholder="DC=company,DC=local"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>
              {editingServer ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Server(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} server(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default LDAPServers;
