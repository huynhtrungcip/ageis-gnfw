import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockVPNTunnels } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Plus, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
}

const VPN = () => {
  const [tunnels, setTunnels] = useState<VPNTunnel[]>(mockVPNTunnels);
  const [activeTab, setActiveTab] = useState<'ipsec' | 'openvpn' | 'wireguard'>('ipsec');
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
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

  const filteredTunnels = tunnels.filter(t => t.type === activeTab);

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
    };
    setTunnels(prev => [...prev, tunnel]);
    setModalOpen(false);
    setNewTunnel({ name: '', type: 'ipsec', remoteGateway: '', localNetwork: '', remoteNetwork: '' });
    toast.success('VPN tunnel added successfully');
  };

  const handleEditTunnel = () => {
    if (!editingTunnel) return;
    setTunnels(prev => prev.map(t => 
      t.id === editingTunnel.id ? {
        ...t,
        name: newTunnel.name,
        remoteGateway: newTunnel.remoteGateway,
        localNetwork: newTunnel.localNetwork,
        remoteNetwork: newTunnel.remoteNetwork,
      } : t
    ));
    setEditModalOpen(false);
    setEditingTunnel(null);
    toast.success('VPN tunnel updated successfully');
  };

  const openEditModal = (tunnel: VPNTunnel) => {
    setEditingTunnel(tunnel);
    setNewTunnel({
      name: tunnel.name,
      type: tunnel.type,
      remoteGateway: tunnel.remoteGateway,
      localNetwork: tunnel.localNetwork,
      remoteNetwork: tunnel.remoteNetwork,
    });
    setEditModalOpen(true);
  };

  return (
    <Shell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">VPN</h1>
            <p className="text-sm text-muted-foreground">Virtual Private Network tunnels</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModalOpen(true)} className="btn btn-primary text-xs flex items-center gap-1.5">
              <Plus size={14} />
              Add VPN Tunnel
            </button>
          </div>
        </div>

        {/* VPN Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="stat-card">
            <div className="text-xs text-muted-foreground mb-1">Total Tunnels</div>
            <div className="text-2xl font-bold">{tunnels.length}</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-muted-foreground mb-1">Connected</div>
            <div className="text-2xl font-bold text-status-healthy">{tunnels.filter(t => t.status === 'connected').length}</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-muted-foreground mb-1">Total In</div>
            <div className="text-2xl font-bold text-green-500">{formatBytes(tunnels.reduce((acc, t) => acc + t.bytesIn, 0))}</div>
          </div>
          <div className="stat-card">
            <div className="text-xs text-muted-foreground mb-1">Total Out</div>
            <div className="text-2xl font-bold text-blue-500">{formatBytes(tunnels.reduce((acc, t) => acc + t.bytesOut, 0))}</div>
          </div>
        </div>

        {/* VPN Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border w-fit">
          {[
            { id: 'ipsec', label: 'IPsec', count: tunnels.filter(t => t.type === 'ipsec').length },
            { id: 'openvpn', label: 'OpenVPN', count: tunnels.filter(t => t.type === 'openvpn').length },
            { id: 'wireguard', label: 'WireGuard', count: tunnels.filter(t => t.type === 'wireguard').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'ipsec' | 'openvpn' | 'wireguard')}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded transition-colors flex items-center gap-2",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {tab.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px]",
                activeTab === tab.id ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Tunnels List */}
        <div className="space-y-4">
          {filteredTunnels.map((tunnel) => (
            <div key={tunnel.id} className="section">
              <div className="section-header">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "status-dot-lg",
                    tunnel.status === 'connected' ? 'status-healthy' :
                    tunnel.status === 'connecting' ? 'status-medium' : 'status-inactive'
                  )} />
                  <div>
                    <div className="font-medium">{tunnel.name}</div>
                    <div className="text-xs text-muted-foreground">{tunnel.type.toUpperCase()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    tunnel.status === 'connected' ? 'bg-status-healthy/20 text-status-healthy' :
                    tunnel.status === 'connecting' ? 'bg-status-medium/20 text-status-medium' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {tunnel.status.toUpperCase()}
                  </span>
                  <button 
                    onClick={() => handleConnect(tunnel.id)}
                    className="btn btn-outline text-xs"
                  >
                    {tunnel.status === 'connected' ? 'Disconnect' : tunnel.status === 'connecting' ? 'Connecting...' : 'Connect'}
                  </button>
                  <button 
                    onClick={() => openEditModal(tunnel)}
                    className="btn btn-ghost text-xs flex items-center gap-1"
                  >
                    <Pencil size={12} />
                    Edit
                  </button>
                </div>
              </div>
              <div className="section-body">
                <div className="grid grid-cols-5 gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Remote Gateway</div>
                    <div className="font-mono text-sm">{tunnel.remoteGateway}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Local Network</div>
                    <div className="font-mono text-sm">{tunnel.localNetwork}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Remote Network</div>
                    <div className="font-mono text-sm">{tunnel.remoteNetwork}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                    <div className="text-sm">{formatUptime(tunnel.uptime)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Traffic</div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-green-500">↓ {formatBytes(tunnel.bytesIn)}</span>
                      <span className="text-blue-500">↑ {formatBytes(tunnel.bytesOut)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredTunnels.length === 0 && (
            <div className="section">
              <div className="section-body flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg mb-2">No {activeTab.toUpperCase()} tunnels configured</div>
                  <button 
                    onClick={() => {
                      setNewTunnel(prev => ({ ...prev, type: activeTab }));
                      setModalOpen(true);
                    }}
                    className="btn btn-primary text-xs"
                  >
                    Add {activeTab.toUpperCase()} Tunnel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Setup Guide */}
        <div className="section">
          <div className="section-header">
            <h3 className="text-sm font-medium">Quick Setup Guide</h3>
          </div>
          <div className="section-body">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-secondary/50 rounded">
                <div className="font-medium mb-2">IPsec Site-to-Site</div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Add Phase 1 (IKE)</li>
                  <li>Configure encryption</li>
                  <li>Add Phase 2 (ESP)</li>
                  <li>Define networks</li>
                </ol>
              </div>
              <div className="p-4 bg-secondary/50 rounded">
                <div className="font-medium mb-2">OpenVPN Remote Access</div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Generate certificates</li>
                  <li>Create server config</li>
                  <li>Export client profiles</li>
                  <li>Distribute to users</li>
                </ol>
              </div>
              <div className="p-4 bg-secondary/50 rounded">
                <div className="font-medium mb-2">WireGuard</div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Generate keypairs</li>
                  <li>Add peers</li>
                  <li>Configure allowed IPs</li>
                  <li>Share QR codes</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Tunnel Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add VPN Tunnel</DialogTitle>
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
              <Label>Type</Label>
              <Select 
                value={newTunnel.type} 
                onValueChange={(v: 'ipsec' | 'openvpn' | 'wireguard') => setNewTunnel(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ipsec">IPsec</SelectItem>
                  <SelectItem value="openvpn">OpenVPN</SelectItem>
                  <SelectItem value="wireguard">WireGuard</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Remote Gateway</Label>
              <Input 
                placeholder="vpn.example.com"
                value={newTunnel.remoteGateway}
                onChange={(e) => setNewTunnel(prev => ({ ...prev, remoteGateway: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Local Network</Label>
              <Input 
                placeholder="192.168.1.0/24"
                value={newTunnel.localNetwork}
                onChange={(e) => setNewTunnel(prev => ({ ...prev, localNetwork: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Remote Network</Label>
              <Input 
                placeholder="10.0.0.0/24"
                value={newTunnel.remoteNetwork}
                onChange={(e) => setNewTunnel(prev => ({ ...prev, remoteNetwork: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddTunnel}>Add Tunnel</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Tunnel Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit VPN Tunnel</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={newTunnel.name}
                onChange={(e) => setNewTunnel(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Remote Gateway</Label>
              <Input 
                value={newTunnel.remoteGateway}
                onChange={(e) => setNewTunnel(prev => ({ ...prev, remoteGateway: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Local Network</Label>
              <Input 
                value={newTunnel.localNetwork}
                onChange={(e) => setNewTunnel(prev => ({ ...prev, localNetwork: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Remote Network</Label>
              <Input 
                value={newTunnel.remoteNetwork}
                onChange={(e) => setNewTunnel(prev => ({ ...prev, remoteNetwork: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleEditTunnel}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default VPN;
