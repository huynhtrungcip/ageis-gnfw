import { useState } from 'react';
import { StatsBar } from '@/components/ui/stats-bar';
import { Shell } from '@/components/layout/Shell';
import { mockVPNTunnels } from '@/data/mockData';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { cn } from '@/lib/utils';
import { formatBytes, formatUptimeShort as formatUptime } from '@/lib/formatters';
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
  Edit2,
  GripVertical
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

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

// Sortable VPN Tunnel Row
interface SortableTunnelRowProps {
  tunnel: VPNTunnel;
  selectedRows: string[];
  toggleRowSelection: (id: string) => void;
  handleConnect: (id: string) => void;
  handleDelete: (id: string) => void;
}

const SortableTunnelRow = ({ tunnel, selectedRows, toggleRowSelection, handleConnect, handleDelete }: SortableTunnelRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tunnel.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr 
      ref={setNodeRef}
      style={style}
      className={cn(selectedRows.includes(tunnel.id) && "selected", isDragging && "bg-blue-50")}
    >
      <td>
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-[#f0f0f0]">
          <GripVertical className="w-3 h-3 text-[#999]" />
        </button>
      </td>
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
      <td className="text-[11px] font-medium text-[#111]">{tunnel.name}</td>
      <td className="mono text-[10px] text-[#333]">{tunnel.remoteGateway}</td>
      <td className="text-[10px] text-[#333]">{tunnel.phase1}</td>
      <td className="text-[10px] text-[#333]">{tunnel.phase2}</td>
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
  );
};

const VPN = () => {
  const { demoMode } = useDemoMode();
  const [tunnels, setTunnels] = useState<VPNTunnel[]>(demoMode ? mockVPNTunnels.map(t => ({
    ...t,
    phase1: 'aes256-sha256-modp2048',
    phase2: 'aes256-sha256',
  })) : []);
  const [activeTab, setActiveTab] = useState<'ipsec' | 'monitor'>('ipsec');
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

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  



  const filteredTunnels = tunnels.filter(t => {
    if (activeTab === 'ipsec') return t.type === 'ipsec';
    return true;
  }).filter(t => 
    search === '' || t.name.toLowerCase().includes(search.toLowerCase())
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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setTunnels((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        toast.success('Order updated');
        return newItems;
      });
    }
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const stats = {
    ipsecTotal: tunnels.filter(t => t.type === 'ipsec').length,
    ipsecUp: tunnels.filter(t => t.type === 'ipsec' && t.status === 'connected').length,
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
                <button 
                  onClick={() => { setNewTunnel({ ...newTunnel, type: 'wireguard' }); setModalOpen(true); setShowCreateMenu(false); }}
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                >
                  <Key className="w-3 h-3" />
                  WireGuard Tunnel
                </button>
              </div>
            )}
          </div>
          <button 
            className="forti-toolbar-btn" 
            disabled={selectedRows.length !== 1}
            onClick={() => { 
              const t = tunnels.find(t => t.id === selectedRows[0]); 
              if (t) toast.info(`Editing "${t.name}"...`); 
            }}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button 
            className="forti-toolbar-btn" 
            disabled={selectedRows.length === 0}
            onClick={() => {
              setTunnels(prev => prev.filter(t => !selectedRows.includes(t.id)));
              toast.success(`Deleted ${selectedRows.length} tunnel(s)`);
              setSelectedRows([]);
            }}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={() => toast.success('VPN data refreshed')}>
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

        {/* Stats Strip */}
        <StatsBar items={[
          { icon: Shield, value: stats.ipsecTotal, label: 'IPsec Tunnels', color: 'text-[hsl(142,70%,35%)]' },
          { iconNode: <span className="w-2.5 h-2.5 rounded-full bg-green-500" />, value: stats.ipsecUp, label: 'Up', color: 'text-green-600' },
        ]} />

        {/* Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {[
            { id: 'ipsec', label: 'IPsec Tunnels', icon: Shield },
            { id: 'monitor', label: 'VPN Monitor', icon: Globe },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeTab === tab.id 
                  ? "bg-white text-[hsl(142,70%,35%)] border-[hsl(142,70%,35%)]" 
                  : "text-[#333] border-transparent hover:text-[#111] hover:bg-[#f0f0f0]"
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
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-6"></th>
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
                <SortableContext items={filteredTunnels.map(t => t.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {filteredTunnels.map((tunnel) => (
                      <SortableTunnelRow
                        key={tunnel.id}
                        tunnel={tunnel}
                        selectedRows={selectedRows}
                        toggleRowSelection={toggleRowSelection}
                        handleConnect={handleConnect}
                        handleDelete={handleDelete}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
            <div className="text-[11px] text-[#666] mt-2 px-1">
              {filteredTunnels.length} tunnels
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
                  <span>VPN Summary</span>
                </div>
                <div className="section-body">
                  <table className="widget-table">
                    <tbody>
                      <tr>
                        <td className="widget-label">Total Tunnels</td>
                        <td className="widget-value">{tunnels.length}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Connected</td>
                        <td className="widget-value text-green-600">{tunnels.filter(t => t.status === 'connected').length}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Disconnected</td>
                        <td className="widget-value text-red-600">{tunnels.filter(t => t.status === 'disconnected').length}</td>
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
