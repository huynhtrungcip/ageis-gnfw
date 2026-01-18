import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockVPNTunnels } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  Plus, 
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
  Download,
  Edit2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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
  const [activeTab, setActiveTab] = useState<'ipsec' | 'ssl' | 'monitor'>('ipsec');
  const [search, setSearch] = useState('');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
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
                  onClick={() => { setNewTunnel({ ...newTunnel, type: 'ipsec' }); setModalOpen(true); setShowCreateMenu(false); }}
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                >
                  <Shield className="w-3 h-3" />
                  IPsec Tunnel
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Key className="w-3 h-3" />
                  SSL-VPN Portal
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Users className="w-3 h-3" />
                  SSL-VPN User
                </button>
              </div>
            )}
          </div>
          <button className="forti-toolbar-btn">
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button className="forti-toolbar-btn">
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn">
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {/* Stats Strip - Fixed horizontal layout */}
        <div className="flex items-center gap-4 px-4 py-3 bg-white border-b border-[#ddd]">
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-[hsl(142,70%,35%)]" />
            <span className="text-lg font-bold">{stats.ipsecTotal}</span>
            <span className="text-[11px] text-[#666]">IPsec Tunnels</span>
          </div>
          <div className="w-px h-6 bg-[#ddd]" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-lg font-bold text-green-600">{stats.ipsecUp}</span>
            <span className="text-[11px] text-[#666]">Up</span>
          </div>
          <div className="w-px h-6 bg-[#ddd]" />
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <span className="text-lg font-bold">{stats.sslTotal}</span>
            <span className="text-[11px] text-[#666]">SSL-VPN Users</span>
          </div>
          <div className="w-px h-6 bg-[#ddd]" />
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-green-600" />
            <span className="text-lg font-bold text-green-600">{stats.sslOnline}</span>
            <span className="text-[11px] text-[#666]">Online</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {[
            { id: 'ipsec', label: 'IPsec Tunnels', icon: Shield },
            { id: 'ssl', label: 'SSL-VPN', icon: Key },
            { id: 'monitor', label: 'VPN Monitor', icon: Globe },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeTab === tab.id 
                  ? "bg-white text-[hsl(142,70%,35%)] border-[hsl(142,70%,35%)]" 
                  : "text-[#666] border-transparent hover:text-[#333] hover:bg-[#f0f0f0]"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* IPsec Tab */}
        {activeTab === 'ipsec' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Name</th>
                  <th>Remote Gateway</th>
                  <th>Phase 1</th>
                  <th>Phase 2</th>
                  <th>Uptime</th>
                  <th>Traffic</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTunnels.map((tunnel) => (
                  <tr 
                    key={tunnel.id}
                    className={cn(selectedRows.includes(tunnel.id) && "selected")}
                  >
                    <td>
                      <input 
                        type="checkbox" 
                        checked={selectedRows.includes(tunnel.id)}
                        onChange={() => toggleRowSelection(tunnel.id)}
                        className="forti-checkbox"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "forti-status-dot",
                          tunnel.status === 'connected' ? 'up' :
                          tunnel.status === 'connecting' ? 'warning' : 'down'
                        )} />
                      </div>
                    </td>
                    <td className="text-[11px] font-medium">{tunnel.name}</td>
                    <td className="mono text-[10px]">{tunnel.remoteGateway}</td>
                    <td className="text-[10px] text-[#666]">{tunnel.phase1}</td>
                    <td className="text-[10px] text-[#666]">{tunnel.phase2}</td>
                    <td className="text-[11px]">{formatUptime(tunnel.uptime)}</td>
                    <td>
                      <div className="text-[10px]">
                        <span className="text-green-600">↓{formatBytes(tunnel.bytesIn)}</span>
                        <span className="text-[#999] mx-1">/</span>
                        <span className="text-blue-600">↑{formatBytes(tunnel.bytesOut)}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleConnect(tunnel.id)}
                          className={cn(
                            "p-1 rounded transition-colors",
                            tunnel.status === 'connected' 
                              ? "hover:bg-red-100 text-red-600" 
                              : "hover:bg-green-100 text-green-600"
                          )}
                          title={tunnel.status === 'connected' ? 'Bring Down' : 'Bring Up'}
                        >
                          {tunnel.status === 'connected' ? <Square size={12} /> : <Play size={12} />}
                        </button>
                        <button
                          onClick={() => handleDelete(tunnel.id)}
                          className="p-1 rounded hover:bg-red-100 text-red-600 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[11px] text-[#666] mt-2 px-1">
              {filteredTunnels.length} tunnels
            </div>
          </div>
        )}

        {/* SSL-VPN Tab */}
        {activeTab === 'ssl' && (
          <div className="p-4">
            <div className="section">
              <div className="section-header">
                <span>SSL-VPN Users</span>
                <button className="text-[10px] text-white/80 hover:text-white flex items-center gap-1">
                  <Download size={10} />
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
                          "text-[10px] px-1.5 py-0.5 border",
                          user.status === 'online' 
                            ? "bg-green-100 text-green-700 border-green-200" 
                            : "bg-gray-100 text-gray-500 border-gray-200"
                        )}>
                          {user.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="text-[11px] font-medium">{user.username}</td>
                      <td className="text-[11px] text-[#666]">{user.group}</td>
                      <td className="mono text-[10px]">{user.sourceIp || '--'}</td>
                      <td className="mono text-[10px]">{user.assignedIp || '--'}</td>
                      <td className="text-[11px] text-[#666]">{formatLoginTime(user.loginTime)}</td>
                      <td>
                        {user.status === 'online' ? (
                          <div className="text-[10px]">
                            <span className="text-green-600">↓{formatBytes(user.bytesIn)}</span>
                            <span className="text-[#999] mx-1">/</span>
                            <span className="text-blue-600">↑{formatBytes(user.bytesOut)}</span>
                          </div>
                        ) : (
                          <span className="text-[10px] text-[#999]">--</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VPN Monitor Tab */}
        {activeTab === 'monitor' && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="section">
                <div className="section-header">
                  <span>IPsec Tunnel Status</span>
                </div>
                <div className="section-body">
                  <div className="space-y-2">
                    {tunnels.filter(t => t.type === 'ipsec').map((tunnel) => (
                      <div key={tunnel.id} className="flex items-center justify-between p-2 bg-[#f8f8f8] border border-[#ddd]">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "forti-status-dot",
                            tunnel.status === 'connected' ? 'up' : 'down'
                          )} />
                          <span className="text-[11px] font-medium">{tunnel.name}</span>
                        </div>
                        <div className="text-[10px] text-[#666]">
                          {tunnel.status === 'connected' ? formatUptime(tunnel.uptime) : 'Down'}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <span>SSL-VPN Statistics</span>
                </div>
                <div className="section-body">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                      <div className="text-2xl font-bold text-green-600">{stats.sslOnline}</div>
                      <div className="text-[10px] text-[#666]">Online Users</div>
                    </div>
                    <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                      <div className="text-2xl font-bold">{stats.sslTotal}</div>
                      <div className="text-[10px] text-[#666]">Total Users</div>
                    </div>
                  </div>
                  <table className="widget-table">
                    <tbody>
                      <tr>
                        <td className="widget-label">Max Concurrent</td>
                        <td className="widget-value">100</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Current Sessions</td>
                        <td className="widget-value">{stats.sslOnline}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Available Licenses</td>
                        <td className="widget-value">{100 - stats.sslOnline}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Tunnel Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden">
          <div className="forti-modal-header">
            <DialogTitle className="text-sm">Create IPsec Tunnel</DialogTitle>
          </div>
          <div className="forti-modal-body space-y-4">
            <div>
              <label className="forti-label">Name</label>
              <input
                type="text"
                value={newTunnel.name}
                onChange={(e) => setNewTunnel({ ...newTunnel, name: e.target.value })}
                className="forti-input w-full"
                placeholder="Branch-Office-VPN"
              />
            </div>
            <div>
              <label className="forti-label">Remote Gateway</label>
              <input
                type="text"
                value={newTunnel.remoteGateway}
                onChange={(e) => setNewTunnel({ ...newTunnel, remoteGateway: e.target.value })}
                className="forti-input w-full"
                placeholder="203.113.152.1"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="forti-label">Local Network</label>
                <input
                  type="text"
                  value={newTunnel.localNetwork}
                  onChange={(e) => setNewTunnel({ ...newTunnel, localNetwork: e.target.value })}
                  className="forti-input w-full"
                  placeholder="192.168.1.0/24"
                />
              </div>
              <div>
                <label className="forti-label">Remote Network</label>
                <input
                  type="text"
                  value={newTunnel.remoteNetwork}
                  onChange={(e) => setNewTunnel({ ...newTunnel, remoteNetwork: e.target.value })}
                  className="forti-input w-full"
                  placeholder="10.0.0.0/24"
                />
              </div>
            </div>
          </div>
          <div className="forti-modal-footer">
            <button onClick={() => setModalOpen(false)} className="forti-btn forti-btn-secondary">
              Cancel
            </button>
            <button onClick={handleAddTunnel} className="forti-btn forti-btn-primary">
              Create
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default VPN;
