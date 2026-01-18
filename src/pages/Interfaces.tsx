import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockInterfaces } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  RefreshCw, 
  ChevronDown,
  Search,
  Network,
  Server,
  Globe,
  Shield,
  Edit,
  Trash2,
  Wifi
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { NetworkInterface } from '@/types/firewall';

// Extended interface with access options
interface ExtendedInterface extends NetworkInterface {
  access: {
    ping: boolean;
    https: boolean;
    ssh: boolean;
    http: boolean;
    fmgAccess: boolean;
  };
  refs: number;
}

// Convert mock interfaces to extended
const extendInterfaces = (ifaces: NetworkInterface[]): ExtendedInterface[] => {
  return ifaces.map((iface, idx) => ({
    ...iface,
    access: {
      ping: true,
      https: idx < 2,
      ssh: idx < 2,
      http: idx === 0,
      fmgAccess: idx === 0,
    },
    refs: idx === 0 ? 4 : idx < 3 ? Math.floor(Math.random() * 5) : 0,
  }));
};

const Interfaces = () => {
  const [interfaces, setInterfaces] = useState<ExtendedInterface[]>(extendInterfaces(mockInterfaces));
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'type' | 'role' | 'alpha'>('type');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingInterface, setEditingInterface] = useState<ExtendedInterface | null>(null);
  const [newInterface, setNewInterface] = useState({
    name: '',
    type: 'LAN' as 'WAN' | 'LAN' | 'DMZ' | 'OPT',
    ipAddress: '',
    subnet: '255.255.255.0',
    gateway: '',
    mtu: '1500',
    addressingMode: 'DHCP' as 'Manual' | 'DHCP' | 'PPPoE',
    role: 'WAN' as 'WAN' | 'LAN' | 'DMZ' | 'Undefined',
    status: 'up' as 'up' | 'down',
  });
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setInterfaces(prev => prev.map(iface => ({
        ...iface,
        rxBytes: iface.rxBytes + Math.floor(Math.random() * 1000000),
        txBytes: iface.txBytes + Math.floor(Math.random() * 500000),
      })));
      setIsRefreshing(false);
      toast.success('Interface statistics refreshed');
    }, 1000);
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openEditModal = (iface?: ExtendedInterface) => {
    if (iface) {
      setEditingInterface(iface);
      setNewInterface({
        name: iface.name,
        type: iface.type,
        ipAddress: iface.ipAddress,
        subnet: iface.subnet,
        gateway: iface.gateway || '',
        mtu: iface.mtu.toString(),
        addressingMode: 'DHCP',
        role: iface.type === 'OPT' ? 'Undefined' : iface.type,
        status: iface.status === 'disabled' ? 'down' : iface.status,
      });
    } else {
      setEditingInterface(null);
      setNewInterface({
        name: '',
        type: 'LAN',
        ipAddress: '',
        subnet: '255.255.255.0',
        gateway: '',
        mtu: '1500',
        addressingMode: 'DHCP',
        role: 'WAN',
        status: 'up',
      });
    }
    setEditModalOpen(true);
  };

  const handleSaveInterface = () => {
    if (editingInterface) {
      setInterfaces(prev => prev.map(i => 
        i.id === editingInterface.id ? { 
          ...i, 
          name: newInterface.name,
          type: newInterface.type,
          ipAddress: newInterface.ipAddress,
          subnet: newInterface.subnet,
          gateway: newInterface.gateway || undefined,
          mtu: parseInt(newInterface.mtu),
          status: newInterface.status,
        } : i
      ));
      toast.success('Interface updated successfully');
    } else {
      const iface: ExtendedInterface = {
        id: `iface-${Date.now()}`,
        name: newInterface.name,
        type: newInterface.type,
        status: 'up',
        ipAddress: newInterface.ipAddress,
        subnet: newInterface.subnet,
        gateway: newInterface.gateway || undefined,
        mac: `00:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}`.toUpperCase(),
        speed: '1 Gbps',
        duplex: 'full',
        mtu: parseInt(newInterface.mtu),
        rxBytes: 0,
        txBytes: 0,
        rxPackets: 0,
        txPackets: 0,
        access: { ping: true, https: false, ssh: false, http: false, fmgAccess: false },
        refs: 0,
      };
      setInterfaces(prev => [...prev, iface]);
      toast.success('Interface added successfully');
    }
    setEditModalOpen(false);
  };

  const handleDeleteConfirm = () => {
    const protectedIds = interfaces.filter(i => i.type === 'WAN' || i.type === 'LAN').map(i => i.id);
    const deletableIds = selectedIds.filter(id => !protectedIds.includes(id));
    
    if (deletableIds.length === 0) {
      toast.error('Cannot delete WAN/LAN interfaces');
      setDeleteDialogOpen(false);
      return;
    }
    
    setInterfaces(prev => prev.filter(i => !deletableIds.includes(i.id)));
    setSelectedIds([]);
    setDeleteDialogOpen(false);
    toast.success(`${deletableIds.length} interface(s) deleted`);
  };

  const filteredInterfaces = interfaces.filter(i => 
    searchQuery === '' || 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.ipAddress.includes(searchQuery)
  );

  const selectedInterface = selectedIds.length === 1 ? interfaces.find(i => i.id === selectedIds[0]) : null;

  // Stats
  const stats = {
    total: interfaces.length,
    up: interfaces.filter(i => i.status === 'up').length,
    down: interfaces.filter(i => i.status === 'down').length,
    wan: interfaces.filter(i => i.type === 'WAN').length,
    lan: interfaces.filter(i => i.type === 'LAN').length,
  };

  // Access Badge Component
  const AccessBadge = ({ label, active }: { label: string; active: boolean }) => (
    <span className={cn(
      "forti-access-badge",
      active ? label.toLowerCase() : "bg-transparent text-transparent border-transparent"
    )}>
      {label}
    </span>
  );

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <Network size={14} />
            <span className="font-semibold">Interfaces</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="forti-toolbar">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="forti-toolbar-btn primary">
                <Plus size={12} /> Create New <ChevronDown size={10} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48 bg-white border border-[#ccc]">
              <DropdownMenuItem onClick={() => openEditModal()} className="text-[11px] gap-2">
                <Network size={12} />
                Interface
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[11px] gap-2">
                <Server size={12} />
                VLAN
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[11px] gap-2">
                <Globe size={12} />
                Loopback Interface
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[11px] gap-2">
                <Wifi size={12} />
                Zone
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            onClick={() => selectedInterface && openEditModal(selectedInterface)}
            className="forti-toolbar-btn"
            disabled={selectedIds.length !== 1}
          >
            <Edit size={12} />
            Edit
          </button>
          <button 
            onClick={() => setDeleteDialogOpen(true)}
            className="forti-toolbar-btn"
            disabled={selectedIds.length === 0}
          >
            <Trash2 size={12} />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button 
            onClick={handleRefresh}
            className="forti-toolbar-btn"
            disabled={isRefreshing}
          >
            <RefreshCw size={12} className={isRefreshing ? 'animate-spin' : ''} />
            Refresh
          </button>
          
          <div className="flex-1" />

          {/* View Toggle */}
          <div className="forti-view-toggle mr-2">
            <button 
              className={cn("forti-view-btn", viewMode === 'type' && "active")}
              onClick={() => setViewMode('type')}
            >
              By Type
            </button>
            <button 
              className={cn("forti-view-btn", viewMode === 'role' && "active")}
              onClick={() => setViewMode('role')}
            >
              By Role
            </button>
            <button 
              className={cn("forti-view-btn", viewMode === 'alpha' && "active")}
              onClick={() => setViewMode('alpha')}
            >
              Alphabetically
            </button>
          </div>

          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-0 border-x border-[#ddd]">
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <span className="text-lg font-bold text-[#333]">{stats.total}</span>
            <span className="text-[11px] text-[#666]">Total</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-lg font-bold text-green-600">{stats.up}</span>
            <span className="text-[11px] text-[#666]">Up</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
            <span className="text-lg font-bold text-red-600">{stats.down}</span>
            <span className="text-[11px] text-[#666]">Down</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <span className="text-lg font-bold text-blue-600">{stats.wan}</span>
            <span className="text-[11px] text-[#666]">WAN</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white">
            <span className="text-lg font-bold text-purple-600">{stats.lan}</span>
            <span className="text-[11px] text-[#666]">LAN</span>
          </div>
        </div>

        {/* Port Visualization */}
        <div className="bg-white border-x border-b border-[#ddd] py-3 flex justify-center">
          <div className="bg-[#333] rounded px-6 py-3 text-center">
            <div className="flex items-center gap-2 mb-2">
              <Shield size={14} className="text-[#4caf50]" />
              <span className="text-[11px] text-gray-400">AEGIS</span>
              <span className="text-[11px] text-white font-bold">NGFW-500</span>
            </div>
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
                const isUp = i <= stats.up;
                return (
                  <div 
                    key={i}
                    className={cn(
                      "w-5 h-5 border text-[8px] font-bold flex items-center justify-center",
                      isUp 
                        ? "bg-[#4caf50] border-[#388e3c] text-white" 
                        : "bg-[#666] border-[#444] text-[#999]"
                    )}
                  >
                    {i}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interface Table */}
        <table className="data-table">
          <thead>
            <tr>
              <th className="w-10">Status</th>
              <th>Name</th>
              <th>Members</th>
              <th>IP/Netmask</th>
              <th>Type</th>
              <th>Access</th>
              <th className="w-12 text-right">Ref.</th>
            </tr>
          </thead>
          <tbody>
            {/* Group Header - Physical */}
            <tr className="group-header">
              <td colSpan={7} className="py-1 px-2">
                <div className="flex items-center gap-2">
                  <ChevronDown size={12} />
                  <span>Physical ({filteredInterfaces.length})</span>
                </div>
              </td>
            </tr>

            {/* Interface Rows */}
            {filteredInterfaces.map((iface) => (
              <tr 
                key={iface.id}
                onClick={() => handleSelect(iface.id)}
                className={cn(
                  "cursor-pointer",
                  selectedIds.includes(iface.id) && "bg-[#fff8e1]"
                )}
              >
                <td>
                  <span className={cn(
                    "inline-flex items-center justify-center w-5 h-5 rounded-sm text-[10px] font-bold",
                    iface.status === 'up' 
                      ? 'bg-[#4caf50] text-white' 
                      : 'bg-[#ccc] text-[#666]'
                  )}>
                    {iface.status === 'up' ? '⬆' : '⬇'}
                  </span>
                </td>
                <td className="font-medium text-[#111]">{iface.name}</td>
                <td className="text-[#555]">--</td>
                <td className="mono text-[#333]">
                  {iface.ipAddress ? `${iface.ipAddress} ${iface.subnet}` : '0.0.0.0 0.0.0.0'}
                </td>
                <td>
                  <span className="inline-flex items-center gap-1 text-[#333]">
                    <Network size={12} className="text-[#666]" />
                    Physical Interface
                  </span>
                </td>
                <td>
                  <div className="flex items-center gap-0.5">
                    {iface.access.ping && <AccessBadge label="PING" active={true} />}
                    {iface.access.https && <AccessBadge label="HTTPS" active={true} />}
                    {iface.access.ssh && <AccessBadge label="SSH" active={true} />}
                    {iface.access.http && <AccessBadge label="HTTP" active={true} />}
                  </div>
                </td>
                <td className="text-right text-[#666]">{iface.refs}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Interface Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="forti-modal-header">
            <DialogTitle className="text-sm font-semibold">
              {editingInterface ? 'Edit Interface' : 'Create Interface'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="forti-modal-body space-y-4">
            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="forti-label text-right">Interface Name</Label>
              <div className="col-span-2">
                <Input 
                  value={newInterface.name}
                  onChange={(e) => setNewInterface({...newInterface, name: e.target.value})}
                  className="forti-input w-full"
                  placeholder="port1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="forti-label text-right">Role</Label>
              <div className="col-span-2">
                <Select value={newInterface.role} onValueChange={(v) => setNewInterface({...newInterface, role: v as any})}>
                  <SelectTrigger className="forti-select w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#ccc]">
                    <SelectItem value="WAN">WAN</SelectItem>
                    <SelectItem value="LAN">LAN</SelectItem>
                    <SelectItem value="DMZ">DMZ</SelectItem>
                    <SelectItem value="Undefined">Undefined</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="forti-label text-right">Addressing Mode</Label>
              <div className="col-span-2">
                <Select value={newInterface.addressingMode} onValueChange={(v) => setNewInterface({...newInterface, addressingMode: v as any})}>
                  <SelectTrigger className="forti-select w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border border-[#ccc]">
                    <SelectItem value="Manual">Manual</SelectItem>
                    <SelectItem value="DHCP">DHCP</SelectItem>
                    <SelectItem value="PPPoE">PPPoE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="forti-label text-right">IP Address</Label>
              <div className="col-span-2">
                <Input 
                  value={newInterface.ipAddress}
                  onChange={(e) => setNewInterface({...newInterface, ipAddress: e.target.value})}
                  className="forti-input w-full"
                  placeholder="192.168.1.1"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="forti-label text-right">Subnet Mask</Label>
              <div className="col-span-2">
                <Input 
                  value={newInterface.subnet}
                  onChange={(e) => setNewInterface({...newInterface, subnet: e.target.value})}
                  className="forti-input w-full"
                  placeholder="255.255.255.0"
                />
              </div>
            </div>
          </div>

          <div className="forti-modal-footer">
            <button onClick={() => setEditModalOpen(false)} className="forti-btn forti-btn-secondary">
              Cancel
            </button>
            <button onClick={handleSaveInterface} className="forti-btn forti-btn-primary">
              OK
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interface(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} interface(s)? WAN/LAN interfaces cannot be deleted.
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

export default Interfaces;
