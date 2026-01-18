import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockDHCPLeases } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { ChevronDown, Plus, RefreshCw, Search, Edit2, Trash2, Server, Network, Settings, X, Download, Upload, Copy, GripVertical } from 'lucide-react';
import { toast } from 'sonner';
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

interface DHCPServer {
  id: string;
  interface: string;
  enabled: boolean;
  rangeStart: string;
  rangeEnd: string;
  gateway: string;
  netmask: string;
  dns1: string;
  dns2: string;
  domain: string;
  leaseTime: number;
  activeLeases: number;
  totalPool: number;
}

interface StaticMapping {
  id: string;
  name: string;
  mac: string;
  ip: string;
  interface: string;
  enabled: boolean;
  description: string;
}

const initialServers: DHCPServer[] = [
  {
    id: 'lan',
    interface: 'LAN',
    enabled: true,
    rangeStart: '192.168.1.100',
    rangeEnd: '192.168.1.200',
    gateway: '192.168.1.1',
    netmask: '255.255.255.0',
    dns1: '8.8.8.8',
    dns2: '8.8.4.4',
    domain: 'local.lan',
    leaseTime: 86400,
    activeLeases: 45,
    totalPool: 101,
  },
  {
    id: 'dmz',
    interface: 'DMZ',
    enabled: false,
    rangeStart: '10.0.0.100',
    rangeEnd: '10.0.0.150',
    gateway: '10.0.0.1',
    netmask: '255.255.255.0',
    dns1: '8.8.8.8',
    dns2: '8.8.4.4',
    domain: 'dmz.local',
    leaseTime: 43200,
    activeLeases: 0,
    totalPool: 51,
  }
];

const initialMappings: StaticMapping[] = [
  { id: '1', name: 'Server-Web', mac: '00:1A:2B:3C:4D:5E', ip: '192.168.1.10', interface: 'LAN', enabled: true, description: 'Web Server' },
  { id: '2', name: 'Printer-HP', mac: '00:1A:2B:3C:4D:5F', ip: '192.168.1.20', interface: 'LAN', enabled: true, description: 'HP Printer' },
];

const interfaces = ['LAN', 'DMZ', 'WAN1', 'WAN2', 'Internal', 'Guest'];

// Sortable Row Component
interface SortableMappingRowProps {
  mapping: StaticMapping;
  toggleMapping: (id: string) => void;
  handleEditMapping: (mapping: StaticMapping) => void;
  handleDeleteConfirm: (type: 'server' | 'mapping', id: string) => void;
}

const SortableMappingRow = ({ mapping, toggleMapping, handleEditMapping, handleDeleteConfirm }: SortableMappingRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: mapping.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <tr ref={setNodeRef} style={style} className={cn(!mapping.enabled && "opacity-60", isDragging && "bg-blue-50")}>
      <td>
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-[#f0f0f0]">
          <GripVertical className="w-3 h-3 text-[#999]" />
        </button>
      </td>
      <td>
        <input type="checkbox" className="forti-checkbox" />
      </td>
      <td>
        <FortiToggle 
          enabled={mapping.enabled} 
          onToggle={() => toggleMapping(mapping.id)}
          size="sm"
        />
      </td>
      <td className="text-[11px] font-medium text-[#111]">{mapping.name}</td>
      <td className="mono text-[#111]">{mapping.ip}</td>
      <td className="mono text-[10px] text-[#333]">{mapping.mac}</td>
      <td>
        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
          {mapping.interface}
        </span>
      </td>
      <td className="text-[11px] text-[#333]">{mapping.description}</td>
      <td>
        <div className="flex items-center gap-1">
          <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => handleEditMapping(mapping)}>
            <Edit2 className="w-3 h-3 text-[#666]" />
          </button>
          <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => handleDeleteConfirm('mapping', mapping.id)}>
            <Trash2 className="w-3 h-3 text-red-500" />
          </button>
        </div>
      </td>
    </tr>
  );
};

const DHCP = () => {
  const [leases] = useState(mockDHCPLeases);
  const [activeTab, setActiveTab] = useState<'server' | 'leases' | 'static'>('server');
  const [servers, setServers] = useState<DHCPServer[]>(initialServers);
  const [mappings, setMappings] = useState<StaticMapping[]>(initialMappings);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  // Modal states
  const [showServerModal, setShowServerModal] = useState(false);
  const [showMappingModal, setShowMappingModal] = useState(false);
  const [editingServer, setEditingServer] = useState<DHCPServer | null>(null);
  const [editingMapping, setEditingMapping] = useState<StaticMapping | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{ type: 'server' | 'mapping'; id: string } | null>(null);
  
  // Server form
  const [serverForm, setServerForm] = useState<Partial<DHCPServer>>({});
  
  // Mapping form
  const [mappingForm, setMappingForm] = useState<Partial<StaticMapping>>({});

  const toggleServer = (id: string) => {
    setServers(servers.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
    toast.success('Server status updated');
  };

  const toggleMapping = (id: string) => {
    setMappings(mappings.map(m => m.id === id ? { ...m, enabled: !m.enabled } : m));
    toast.success('Mapping status updated');
  };

  // Server CRUD
  const handleCreateServer = () => {
    setEditingServer(null);
    setServerForm({
      interface: 'LAN',
      enabled: true,
      rangeStart: '',
      rangeEnd: '',
      gateway: '',
      netmask: '255.255.255.0',
      dns1: '8.8.8.8',
      dns2: '8.8.4.4',
      domain: '',
      leaseTime: 86400,
    });
    setShowServerModal(true);
  };

  const handleEditServer = (server: DHCPServer) => {
    setEditingServer(server);
    setServerForm(server);
    setShowServerModal(true);
  };

  const handleSaveServer = () => {
    if (!serverForm.rangeStart || !serverForm.rangeEnd || !serverForm.gateway) {
      toast.error('Address range and gateway are required');
      return;
    }

    if (editingServer) {
      setServers(prev => prev.map(s => 
        s.id === editingServer.id ? { ...s, ...serverForm } as DHCPServer : s
      ));
      toast.success('DHCP server updated');
    } else {
      const newServer: DHCPServer = {
        id: Date.now().toString(),
        activeLeases: 0,
        totalPool: 100,
        ...serverForm as DHCPServer,
      };
      setServers(prev => [...prev, newServer]);
      toast.success('DHCP server created');
    }
    setShowServerModal(false);
  };

  // Mapping CRUD
  const handleCreateMapping = () => {
    setEditingMapping(null);
    setMappingForm({
      name: '',
      mac: '',
      ip: '',
      interface: 'LAN',
      enabled: true,
      description: '',
    });
    setShowMappingModal(true);
  };

  const handleEditMapping = (mapping: StaticMapping) => {
    setEditingMapping(mapping);
    setMappingForm(mapping);
    setShowMappingModal(true);
  };

  const handleSaveMapping = () => {
    if (!mappingForm.name || !mappingForm.mac || !mappingForm.ip) {
      toast.error('Name, MAC and IP are required');
      return;
    }

    if (editingMapping) {
      setMappings(prev => prev.map(m => 
        m.id === editingMapping.id ? { ...m, ...mappingForm } as StaticMapping : m
      ));
      toast.success('Static mapping updated');
    } else {
      const newMapping: StaticMapping = {
        id: Date.now().toString(),
        ...mappingForm as StaticMapping,
      };
      setMappings(prev => [...prev, newMapping]);
      toast.success('Static mapping created');
    }
    setShowMappingModal(false);
  };

  const handleDeleteConfirm = (type: 'server' | 'mapping', id: string) => {
    setItemToDelete({ type, id });
    setDeleteConfirmOpen(true);
  };

  const handleDelete = () => {
    if (itemToDelete) {
      if (itemToDelete.type === 'server') {
        setServers(prev => prev.filter(s => s.id !== itemToDelete.id));
      } else {
        setMappings(prev => prev.filter(m => m.id !== itemToDelete.id));
      }
      toast.success(`${itemToDelete.type === 'server' ? 'DHCP Server' : 'Static mapping'} deleted`);
    }
    setDeleteConfirmOpen(false);
    setItemToDelete(null);
  };

  const handleExport = () => {
    const data = { servers, mappings, leases };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dhcp_config.json';
    a.click();
    toast.success('DHCP configuration exported');
  };

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const data = JSON.parse(e.target?.result as string);
            if (data.servers) setServers(data.servers);
            if (data.mappings) setMappings(data.mappings);
            toast.success('DHCP configuration imported');
          } catch {
            toast.error('Invalid file format');
          }
        };
        reader.readAsText(file);
      }
    };
    input.click();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setMappings((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        const newItems = arrayMove(items, oldIndex, newIndex);
        toast.success('Order updated');
        return newItems;
      });
    }
  };

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn primary" onClick={activeTab === 'static' ? handleCreateMapping : handleCreateServer}>
            <Plus className="w-3 h-3" />
            Create New
          </button>
          <button className="forti-toolbar-btn">
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button className="forti-toolbar-btn text-red-600">
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={handleExport}>
            <Download className="w-3 h-3" />
            Export
          </button>
          <button className="forti-toolbar-btn" onClick={handleImport}>
            <Upload className="w-3 h-3" />
            Import
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={() => toast.success('DHCP data refreshed')}>
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-40"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {[
            { id: 'server', label: 'DHCP Servers', icon: Server },
            { id: 'leases', label: 'Address Leases', icon: Network },
            { id: 'static', label: 'Static Mappings', icon: Settings },
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

        {/* DHCP Servers Tab */}
        {activeTab === 'server' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Interface</th>
                  <th>Address Range</th>
                  <th>Gateway</th>
                  <th>DNS Servers</th>
                  <th>Domain</th>
                  <th>Lease Time</th>
                  <th>Pool Usage</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.id} className={cn(!server.enabled && "opacity-60")}>
                    <td>
                      <input type="checkbox" className="forti-checkbox" />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={server.enabled} 
                        onToggle={() => toggleServer(server.id)}
                        size="sm"
                      />
                    </td>
                    <td>
                      <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                        {server.interface}
                      </span>
                    </td>
                    <td className="mono text-[#111]">
                      {server.rangeStart} - {server.rangeEnd}
                    </td>
                    <td className="mono text-[#111]">{server.gateway}</td>
                    <td className="mono text-[10px] text-[#333]">
                      {server.dns1}, {server.dns2}
                    </td>
                    <td className="text-[11px] text-[#333]">{server.domain}</td>
                    <td className="text-[11px] text-[#333]">{server.leaseTime}s</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="forti-progress w-20">
                          <div 
                            className={cn(
                              "forti-progress-bar",
                              (server.activeLeases / server.totalPool) > 0.8 ? "red" :
                              (server.activeLeases / server.totalPool) > 0.5 ? "orange" : "green"
                            )}
                            style={{ width: `${(server.activeLeases / server.totalPool) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#333]">
                          {server.activeLeases}/{server.totalPool}
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => handleEditServer(server)}>
                          <Edit2 className="w-3 h-3 text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]" onClick={() => handleDeleteConfirm('server', server.id)}>
                          <Trash2 className="w-3 h-3 text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Leases Tab */}
        {activeTab === 'leases' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Hostname</th>
                  <th>Interface</th>
                  <th>Lease Start</th>
                  <th>Lease Expires</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.ip}>
                    <td>
                      <input type="checkbox" className="forti-checkbox" />
                    </td>
                    <td className="mono text-[#111]">{lease.ip}</td>
                    <td className="mono text-[10px] text-[#333]">{lease.mac}</td>
                    <td className="text-[11px] text-[#333]">{lease.hostname}</td>
                    <td>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                        LAN
                      </span>
                    </td>
                    <td className="text-[10px] text-[#333]">
                      {lease.start.toLocaleString('vi-VN')}
                    </td>
                    <td className="text-[10px] text-[#333]">
                      {lease.end.toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 border",
                        lease.status === 'static' 
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {lease.status === 'static' ? 'STATIC' : 'DYNAMIC'}
                      </span>
                    </td>
                    <td>
                      <div className="forti-status">
                        <span className={cn(
                          "forti-status-dot",
                          lease.status === 'active' ? "up" : 
                          lease.status === 'expired' ? "down" : "warning"
                        )} />
                        <span className="capitalize text-[#333]">{lease.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Static Mappings Tab */}
        {activeTab === 'static' && (
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
                    <th>IP Address</th>
                    <th>MAC Address</th>
                    <th>Interface</th>
                    <th>Description</th>
                    <th className="w-20">Actions</th>
                  </tr>
                </thead>
                <SortableContext items={mappings.map(m => m.id)} strategy={verticalListSortingStrategy}>
                  <tbody>
                    {mappings.map((mapping) => (
                      <SortableMappingRow
                        key={mapping.id}
                        mapping={mapping}
                        toggleMapping={toggleMapping}
                        handleEditMapping={handleEditMapping}
                        handleDeleteConfirm={handleDeleteConfirm}
                      />
                    ))}
                  </tbody>
                </SortableContext>
              </table>
            </DndContext>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-3 py-2 bg-[#f5f5f5] border border-t-0 border-[#ddd] text-[11px] text-[#333]">
          <span>
            {activeTab === 'server' && `Total: ${servers.length} DHCP servers`}
            {activeTab === 'leases' && `Total: ${leases.length} leases`}
            {activeTab === 'static' && `Total: ${mappings.length} static mappings`}
          </span>
        </div>
      </div>

      {/* Server Modal */}
      {showServerModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#ccc] shadow-xl w-[600px]">
            <div className="forti-modal-header flex items-center justify-between">
              <span>{editingServer ? 'Edit DHCP Server' : 'Create DHCP Server'}</span>
              <button onClick={() => setShowServerModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="forti-modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">Interface *</label>
                  <select
                    className="forti-select w-full"
                    value={serverForm.interface || 'LAN'}
                    onChange={(e) => setServerForm({ ...serverForm, interface: e.target.value })}
                  >
                    {interfaces.map(iface => (
                      <option key={iface} value={iface}>{iface}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center gap-2 pt-5">
                  <FortiToggle 
                    enabled={serverForm.enabled ?? true} 
                    onToggle={() => setServerForm({ ...serverForm, enabled: !serverForm.enabled })} 
                  />
                  <span className="text-[11px] text-[#333]">Enable DHCP Server</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">Range Start *</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="192.168.1.100"
                    value={serverForm.rangeStart || ''}
                    onChange={(e) => setServerForm({ ...serverForm, rangeStart: e.target.value })}
                  />
                </div>
                <div>
                  <label className="forti-label">Range End *</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="192.168.1.200"
                    value={serverForm.rangeEnd || ''}
                    onChange={(e) => setServerForm({ ...serverForm, rangeEnd: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">Gateway *</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="192.168.1.1"
                    value={serverForm.gateway || ''}
                    onChange={(e) => setServerForm({ ...serverForm, gateway: e.target.value })}
                  />
                </div>
                <div>
                  <label className="forti-label">Netmask</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="255.255.255.0"
                    value={serverForm.netmask || '255.255.255.0'}
                    onChange={(e) => setServerForm({ ...serverForm, netmask: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">DNS Server 1</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="8.8.8.8"
                    value={serverForm.dns1 || '8.8.8.8'}
                    onChange={(e) => setServerForm({ ...serverForm, dns1: e.target.value })}
                  />
                </div>
                <div>
                  <label className="forti-label">DNS Server 2</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="8.8.4.4"
                    value={serverForm.dns2 || '8.8.4.4'}
                    onChange={(e) => setServerForm({ ...serverForm, dns2: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">Domain Name</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="local.lan"
                    value={serverForm.domain || ''}
                    onChange={(e) => setServerForm({ ...serverForm, domain: e.target.value })}
                  />
                </div>
                <div>
                  <label className="forti-label">Lease Time (seconds)</label>
                  <input
                    type="number"
                    className="forti-input w-full"
                    value={serverForm.leaseTime || 86400}
                    onChange={(e) => setServerForm({ ...serverForm, leaseTime: parseInt(e.target.value) })}
                  />
                </div>
              </div>
            </div>
            <div className="forti-modal-footer">
              <button className="forti-btn forti-btn-secondary" onClick={() => setShowServerModal(false)}>
                Cancel
              </button>
              <button className="forti-btn forti-btn-primary" onClick={handleSaveServer}>
                {editingServer ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mapping Modal */}
      {showMappingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white border border-[#ccc] shadow-xl w-[500px]">
            <div className="forti-modal-header flex items-center justify-between">
              <span>{editingMapping ? 'Edit Static Mapping' : 'Create Static Mapping'}</span>
              <button onClick={() => setShowMappingModal(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="forti-modal-body space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">Name *</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="Server-Name"
                    value={mappingForm.name || ''}
                    onChange={(e) => setMappingForm({ ...mappingForm, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="forti-label">Interface</label>
                  <select
                    className="forti-select w-full"
                    value={mappingForm.interface || 'LAN'}
                    onChange={(e) => setMappingForm({ ...mappingForm, interface: e.target.value })}
                  >
                    {interfaces.map(iface => (
                      <option key={iface} value={iface}>{iface}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="forti-label">MAC Address *</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="00:1A:2B:3C:4D:5E"
                    value={mappingForm.mac || ''}
                    onChange={(e) => setMappingForm({ ...mappingForm, mac: e.target.value })}
                  />
                </div>
                <div>
                  <label className="forti-label">IP Address *</label>
                  <input
                    type="text"
                    className="forti-input w-full"
                    placeholder="192.168.1.10"
                    value={mappingForm.ip || ''}
                    onChange={(e) => setMappingForm({ ...mappingForm, ip: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="forti-label">Description</label>
                <input
                  type="text"
                  className="forti-input w-full"
                  placeholder="Description"
                  value={mappingForm.description || ''}
                  onChange={(e) => setMappingForm({ ...mappingForm, description: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-2">
                <FortiToggle 
                  enabled={mappingForm.enabled ?? true} 
                  onToggle={() => setMappingForm({ ...mappingForm, enabled: !mappingForm.enabled })} 
                />
                <span className="text-[11px] text-[#333]">Enable Mapping</span>
              </div>
            </div>
            <div className="forti-modal-footer">
              <button className="forti-btn forti-btn-secondary" onClick={() => setShowMappingModal(false)}>
                Cancel
              </button>
              <button className="forti-btn forti-btn-primary" onClick={handleSaveMapping}>
                {editingMapping ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {itemToDelete?.type === 'server' ? 'DHCP Server' : 'Static Mapping'}</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this {itemToDelete?.type === 'server' ? 'DHCP server' : 'static mapping'}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default DHCP;