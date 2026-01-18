import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockVPNTunnels } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  ChevronDown, 
  RefreshCw,
  Play,
  Square,
  Shield,
  Key,
  Globe,
  Users,
  Download
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface VPNTunnel {
  id: string;
  name: string;
  type: 'ipsec' | 'openvpn' | 'wireguard';
  status: 'connected' | 'disconnected' | 'connecting';
  remoteGateway: string;
  localNetwork: string;
  remoteNetwork: string;
  uptime: number;
  bytesIn: number;
  bytesOut: number;
  phase1: string;
  phase2: string;
}

interface SSLVPNUser {
  id: string;
  username: string;
  group: string;
  status: 'online' | 'offline';
  sourceIp: string;
  assignedIp: string;
  loginTime: Date | null;
  bytesIn: number;
  bytesOut: number;
}

const mockSSLUsers: SSLVPNUser[] = [
  { id: 'ssl-1', username: 'john.doe', group: 'Remote-Workers', status: 'online', sourceIp: '103.45.67.89', assignedIp: '10.212.134.5', loginTime: new Date(Date.now() - 3600000), bytesIn: 125000000, bytesOut: 45000000 },
  { id: 'ssl-2', username: 'jane.smith', group: 'Remote-Workers', status: 'online', sourceIp: '42.118.92.45', assignedIp: '10.212.134.6', loginTime: new Date(Date.now() - 7200000), bytesIn: 89000000, bytesOut: 23000000 },
  { id: 'ssl-3', username: 'bob.wilson', group: 'IT-Admin', status: 'online', sourceIp: '183.91.12.78', assignedIp: '10.212.134.7', loginTime: new Date(Date.now() - 1800000), bytesIn: 234000000, bytesOut: 156000000 },
  { id: 'ssl-4', username: 'alice.jones', group: 'Remote-Workers', status: 'offline', sourceIp: '', assignedIp: '', loginTime: null, bytesIn: 0, bytesOut: 0 },
  { id: 'ssl-5', username: 'charlie.brown', group: 'Contractors', status: 'offline', sourceIp: '', assignedIp: '', loginTime: null, bytesIn: 0, bytesOut: 0 },
];

const VPN = () => {
  const [tunnels, setTunnels] = useState<VPNTunnel[]>(mockVPNTunnels.map(t => ({
    ...t,
    phase1: 'aes256-sha256-modp2048',
    phase2: 'aes256-sha256',
  })));
  const [sslUsers] = useState<SSLVPNUser[]>(mockSSLUsers);
  const [activeTab, setActiveTab] = useState('ipsec');
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingTunnel, setEditingTunnel] = useState<VPNTunnel | null>(null);
  const [newTunnel, setNewTunnel] = useState({
    name: '',
    type: 'ipsec' as 'ipsec' | 'openvpn' | 'wireguard',
    remoteGateway: '',
    localNetwork: '',
    remoteNetwork: '',
  });

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const formatUptime = (seconds: number): string => {
    if (seconds === 0) return '--';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const formatLoginTime = (date: Date | null) => {
    if (!date) return '--';
    const diff = Date.now() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return `${hours}h ${mins % 60}m ago`;
    return `${mins}m ago`;
  };

  const filteredTunnels = tunnels.filter(t => {
    if (activeTab === 'ipsec') return t.type === 'ipsec';
    if (activeTab === 'ssl') return false;
    return true;
  }).filter(t => 
    search === '' || t.name.toLowerCase().includes(search.toLowerCase())
  );

  const filteredSSLUsers = sslUsers.filter(u =>
    search === '' || u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleConnect = (tunnelId: string) => {
    setTunnels(prev => prev.map(t => {
      if (t.id === tunnelId) {
        if (t.status === 'connected') {
          toast.success(`Disconnected from ${t.name}`);
          return { ...t, status: 'disconnected' as const, uptime: 0 };
        } else {
          toast.success(`Connecting to ${t.name}...`);
          setTimeout(() => {
            setTunnels(p => p.map(tunnel => 
              tunnel.id === tunnelId ? { ...tunnel, status: 'connected' as const, uptime: 1 } : tunnel
            ));
            toast.success(`Connected to ${t.name}`);
          }, 2000);
          return { ...t, status: 'connecting' as const };
        }
      }
      return t;
    }));
  };

  const handleAddTunnel = () => {
    if (!newTunnel.name || !newTunnel.remoteGateway) {
      toast.error('Name and Remote Gateway are required');
      return;
    }
    const tunnel: VPNTunnel = {
      id: `vpn-${Date.now()}`,
      name: newTunnel.name,
      type: newTunnel.type,
      status: 'disconnected',
      remoteGateway: newTunnel.remoteGateway,
      localNetwork: newTunnel.localNetwork || '192.168.1.0/24',
      remoteNetwork: newTunnel.remoteNetwork || '10.0.0.0/24',
      uptime: 0,
      bytesIn: 0,
      bytesOut: 0,
      phase1: 'aes256-sha256-modp2048',
      phase2: 'aes256-sha256',
    };
    setTunnels(prev => [...prev, tunnel]);
    setModalOpen(false);
    setNewTunnel({ name: '', type: 'ipsec', remoteGateway: '', localNetwork: '', remoteNetwork: '' });
    toast.success('VPN tunnel created');
  };

  const handleDelete = (id: string) => {
    setTunnels(prev => prev.filter(t => t.id !== id));
    setSelectedRows(prev => prev.filter(r => r !== id));
    toast.success('VPN tunnel deleted');
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const stats = {
    ipsecTotal: tunnels.filter(t => t.type === 'ipsec').length,
    ipsecUp: tunnels.filter(t => t.type === 'ipsec' && t.status === 'connected').length,
    sslTotal: sslUsers.length,
    sslOnline: sslUsers.filter(u => u.status === 'online').length,
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="forti-toolbar">
          <div className="forti-toolbar-left">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="forti-action-btn forti-action-btn-primary">
                  <Plus size={14} />
                  Create New
                  <ChevronDown size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border shadow-lg z-50">
                <DropdownMenuItem onClick={() => { setNewTunnel({ ...newTunnel, type: 'ipsec' }); setModalOpen(true); }} className="cursor-pointer">
                  <Shield size={14} className="mr-2" />
                  IPsec Tunnel
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Key size={14} className="mr-2" />
                  SSL-VPN Portal
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer">
                  <Users size={14} className="mr-2" />
                  SSL-VPN User
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {selectedRows.length > 0 && (
              <>
                <button 
                  onClick={() => selectedRows.forEach(id => handleConnect(id))}
                  className="forti-action-btn"
                >
                  <Play size={14} />
                  Bring Up
                </button>
                <button 
                  onClick={() => selectedRows.forEach(id => handleDelete(id))}
                  className="forti-action-btn"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </>
            )}

            <button className="forti-action-btn">
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>

          <div className="forti-toolbar-right">
            <div className="forti-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="summary-strip">
          <div className="summary-item">
            <Shield size={16} className="text-primary" />
            <span className="summary-count">{stats.ipsecTotal}</span>
            <span className="summary-label">IPsec Tunnels</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <span className="status-dot-lg status-healthy" />
            <span className="summary-count text-status-healthy">{stats.ipsecUp}</span>
            <span className="summary-label">Up</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <Key size={16} className="text-blue-600" />
            <span className="summary-count">{stats.sslTotal}</span>
            <span className="summary-label">SSL-VPN Users</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <Users size={16} className="text-green-600" />
            <span className="summary-count text-green-600">{stats.sslOnline}</span>
            <span className="summary-label">Online</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-muted/50">
            <TabsTrigger value="ipsec" className="gap-1.5">
              <Shield size={14} />
              IPsec Tunnels
            </TabsTrigger>
            <TabsTrigger value="ssl" className="gap-1.5">
              <Key size={14} />
              SSL-VPN
            </TabsTrigger>
            <TabsTrigger value="monitor" className="gap-1.5">
              <Globe size={14} />
              VPN Monitor
            </TabsTrigger>
          </TabsList>

          {/* IPsec Tab */}
          <TabsContent value="ipsec" className="mt-4">
            <div className="section">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-10">
                      <input type="checkbox" className="rounded border-gray-300" />
                    </th>
                    <th className="w-16">Status</th>
                    <th>Name</th>
                    <th>Remote Gateway</th>
                    <th>Phase 1</th>
                    <th>Phase 2</th>
                    <th className="w-24">Uptime</th>
                    <th className="w-32">Traffic</th>
                    <th className="w-24">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTunnels.map((tunnel) => (
                    <tr 
                      key={tunnel.id}
                      className={cn(
                        selectedRows.includes(tunnel.id) && "data-table-row-selected"
                      )}
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <input 
                          type="checkbox" 
                          checked={selectedRows.includes(tunnel.id)}
                          onChange={() => toggleRowSelection(tunnel.id)}
                          className="rounded border-gray-300"
                        />
                      </td>
                      <td>
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "status-dot-lg",
                            tunnel.status === 'connected' ? 'status-healthy' :
                            tunnel.status === 'connecting' ? 'status-medium' : 'status-inactive'
                          )} />
                        </div>
                      </td>
                      <td className="font-medium">{tunnel.name}</td>
                      <td className="font-mono text-sm text-muted-foreground">{tunnel.remoteGateway}</td>
                      <td className="text-xs text-muted-foreground">{tunnel.phase1}</td>
                      <td className="text-xs text-muted-foreground">{tunnel.phase2}</td>
                      <td className="text-sm">{formatUptime(tunnel.uptime)}</td>
                      <td>
                        <div className="text-xs">
                          <span className="text-green-600">↓{formatBytes(tunnel.bytesIn)}</span>
                          <span className="text-muted-foreground mx-1">/</span>
                          <span className="text-blue-600">↑{formatBytes(tunnel.bytesOut)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleConnect(tunnel.id)}
                            className={cn(
                              "p-1.5 rounded transition-colors",
                              tunnel.status === 'connected' 
                                ? "hover:bg-red-100 text-red-600" 
                                : "hover:bg-green-100 text-green-600"
                            )}
                            title={tunnel.status === 'connected' ? 'Bring Down' : 'Bring Up'}
                          >
                            {tunnel.status === 'connected' ? <Square size={14} /> : <Play size={14} />}
                          </button>
                          <button
                            onClick={() => handleDelete(tunnel.id)}
                            className="p-1.5 rounded hover:bg-red-100 text-red-600 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredTunnels.length === 0 && (
                <div className="p-12 text-center">
                  <Shield size={32} className="mx-auto text-muted-foreground/50 mb-3" />
                  <p className="text-sm text-muted-foreground">No IPsec tunnels configured</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* SSL-VPN Tab */}
          <TabsContent value="ssl" className="mt-4">
            <div className="section">
              <div className="section-header">
                <span>SSL-VPN Users</span>
                <button className="forti-action-btn text-xs">
                  <Download size={12} />
                  Export
                </button>
              </div>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-16">Status</th>
                    <th>Username</th>
                    <th>Group</th>
                    <th>Source IP</th>
                    <th>Assigned IP</th>
                    <th>Login Time</th>
                    <th>Traffic</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSSLUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <span className={cn(
                          "forti-tag",
                          user.status === 'online' 
                            ? "bg-green-100 text-green-700" 
                            : "bg-gray-100 text-gray-500"
                        )}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="font-medium">{user.username}</td>
                      <td className="text-muted-foreground">{user.group}</td>
                      <td className="font-mono text-sm text-muted-foreground">
                        {user.sourceIp || '--'}
                      </td>
                      <td className="font-mono text-sm text-muted-foreground">
                        {user.assignedIp || '--'}
                      </td>
                      <td className="text-sm text-muted-foreground">
                        {formatLoginTime(user.loginTime)}
                      </td>
                      <td>
                        {user.status === 'online' ? (
                          <div className="text-xs">
                            <span className="text-green-600">↓{formatBytes(user.bytesIn)}</span>
                            <span className="text-muted-foreground mx-1">/</span>
                            <span className="text-blue-600">↑{formatBytes(user.bytesOut)}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>

          {/* Monitor Tab */}
          <TabsContent value="monitor" className="mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="section">
                <div className="section-header">
                  <span>IPsec Status</span>
                </div>
                <div className="p-4 space-y-3">
                  {tunnels.filter(t => t.type === 'ipsec').map(tunnel => (
                    <div key={tunnel.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "status-dot-lg",
                          tunnel.status === 'connected' ? 'status-healthy' : 'status-inactive'
                        )} />
                        <div>
                          <div className="font-medium text-sm">{tunnel.name}</div>
                          <div className="text-xs text-muted-foreground">{tunnel.remoteGateway}</div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className={cn(
                          tunnel.status === 'connected' ? "text-green-600" : "text-muted-foreground"
                        )}>
                          {tunnel.status.toUpperCase()}
                        </div>
                        <div className="text-muted-foreground">{formatUptime(tunnel.uptime)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <span>SSL-VPN Sessions</span>
                </div>
                <div className="p-4 space-y-3">
                  {sslUsers.filter(u => u.status === 'online').map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users size={14} className="text-primary" />
                        </div>
                        <div>
                          <div className="font-medium text-sm">{user.username}</div>
                          <div className="text-xs text-muted-foreground">{user.group}</div>
                        </div>
                      </div>
                      <div className="text-right text-xs">
                        <div className="text-muted-foreground">{user.assignedIp}</div>
                        <div className="text-muted-foreground">{formatLoginTime(user.loginTime)}</div>
                      </div>
                    </div>
                  ))}
                  {sslUsers.filter(u => u.status === 'online').length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No active SSL-VPN sessions
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filteredTunnels.length} tunnels</span>
          {selectedRows.length > 0 && (
            <span>{selectedRows.length} selected</span>
          )}
        </div>
      </div>

      {/* Add Tunnel Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield size={18} />
              New IPsec Tunnel
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                placeholder="Site-to-Site VPN"
                value={newTunnel.name}
                onChange={(e) => setNewTunnel(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Remote Gateway</Label>
              <Input 
                placeholder="vpn.example.com or IP address"
                value={newTunnel.remoteGateway}
                onChange={(e) => setNewTunnel(prev => ({ ...prev, remoteGateway: e.target.value }))}
                className="font-mono"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Local Subnet</Label>
                <Input 
                  placeholder="192.168.1.0/24"
                  value={newTunnel.localNetwork}
                  onChange={(e) => setNewTunnel(prev => ({ ...prev, localNetwork: e.target.value }))}
                  className="font-mono"
                />
              </div>
              <div className="space-y-2">
                <Label>Remote Subnet</Label>
                <Input 
                  placeholder="10.0.0.0/24"
                  value={newTunnel.remoteNetwork}
                  onChange={(e) => setNewTunnel(prev => ({ ...prev, remoteNetwork: e.target.value }))}
                  className="font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTunnel} className="bg-[#4caf50] hover:bg-[#43a047]">OK</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default VPN;
