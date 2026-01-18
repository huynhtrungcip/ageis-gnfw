import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockInterfaces } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Wifi, 
  ChevronDown,
  CheckCircle2,
  XCircle,
  Search,
  Network,
  Server,
  Globe,
  Shield
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
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

  const handleSelectAll = () => {
    if (selectedIds.length === interfaces.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(interfaces.map(i => i.id));
    }
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

  const handleDeleteSelected = () => {
    const protectedIds = interfaces.filter(i => i.type === 'WAN' || i.type === 'LAN').map(i => i.id);
    const deletableIds = selectedIds.filter(id => !protectedIds.includes(id));
    
    if (deletableIds.length === 0) {
      toast.error('Cannot delete WAN/LAN interfaces');
      return;
    }
    
    setInterfaces(prev => prev.filter(i => !deletableIds.includes(i.id)));
    setSelectedIds([]);
    toast.success(`${deletableIds.length} interface(s) deleted`);
  };

  const filteredInterfaces = interfaces.filter(i => 
    searchQuery === '' || 
    i.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    i.ipAddress.includes(searchQuery)
  );

  const selectedInterface = selectedIds.length === 1 ? interfaces.find(i => i.id === selectedIds[0]) : null;

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
        {/* Port Visualization Header */}
        <div className="widget mb-3">
          <div className="widget-body flex items-center justify-center py-4">
            <div className="bg-[#333] rounded px-6 py-3 text-center">
              <div className="flex items-center gap-2 mb-2">
                <Shield size={14} className="text-[#4caf50]" />
                <span className="text-[11px] text-gray-400">AEGIS</span>
                <span className="text-[11px] text-white font-bold">NGFW-500</span>
              </div>
              <div className="flex items-center gap-1 mb-1">
                <span className="text-[9px] text-gray-500 w-8">1</span>
                <span className="text-[9px] text-gray-500 w-5">3</span>
                <span className="text-[9px] text-gray-500 w-5">5</span>
                <span className="text-[9px] text-gray-500 w-5">7</span>
                <span className="text-[9px] text-gray-500 w-5">9</span>
              </div>
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => {
                  const isUp = i <= 4;
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
              <div className="flex items-center gap-1 mt-1">
                <span className="text-[9px] text-gray-500 w-8">2</span>
                <span className="text-[9px] text-gray-500 w-5">4</span>
                <span className="text-[9px] text-gray-500 w-5">6</span>
                <span className="text-[9px] text-gray-500 w-5">8</span>
                <span className="text-[9px] text-gray-500 w-5">10</span>
              </div>
            </div>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-0.5 px-1 py-1 bg-[#f0f0f0] border border-[#ccc]">
          {/* Create New Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="forti-toolbar-btn primary">
                <Plus size={12} /> Create New <ChevronDown size={10} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
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
              <DropdownMenuItem className="text-[11px] gap-2">
                <Server size={12} />
                Aggregate
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[11px] gap-2">
                <Server size={12} />
                Redundant Interface
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[11px] gap-2">
                <Globe size={12} />
                Software Switch
              </DropdownMenuItem>
              <DropdownMenuItem className="text-[11px] gap-2">
                <Shield size={12} />
                Hardware Switch
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <button 
            onClick={() => selectedInterface && openEditModal(selectedInterface)}
            className="forti-toolbar-btn"
            disabled={selectedIds.length !== 1}
          >
            ✏️ Edit
          </button>
          <button 
            onClick={handleDeleteSelected}
            className="forti-toolbar-btn"
            disabled={selectedIds.length === 0}
          >
            🗑️ Delete
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
        </div>

        {/* Interface Table */}
        <div className="border border-[#ccc] border-t-0">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">
                  <span className="text-[10px]">▼</span>
                </th>
                <th className="w-12">
                  <span className="flex items-center gap-1">
                    ▼ Status
                  </span>
                </th>
                <th>
                  <span className="flex items-center gap-1">
                    ▼ Name
                  </span>
                </th>
                <th>
                  <span className="flex items-center gap-1">
                    ▼ Members
                  </span>
                </th>
                <th>
                  <span className="flex items-center gap-1">
                    IP/Netmask
                  </span>
                </th>
                <th>
                  <span className="flex items-center gap-1">
                    ▼ Type
                  </span>
                </th>
                <th>
                  <span className="flex items-center gap-1">
                    Access
                  </span>
                </th>
                <th className="w-12 text-right">
                  <span className="flex items-center gap-1 justify-end">
                    ▼ Ref.
                  </span>
                </th>
              </tr>
            </thead>
            <tbody>
              {/* Group Header - Physical */}
              <tr className="group-header">
                <td colSpan={8} className="py-1 px-2">
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
                  <td className="text-center">
                    <div className="flex items-center gap-1">
                      <span className={cn(
                        "w-2.5 h-2.5 rounded-full",
                        iface.status === 'up' ? 'bg-[#4caf50]' : 'bg-[#ccc]'
                      )} />
                    </div>
                  </td>
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
                  <td>
                    <span className="font-medium text-[11px]">{iface.name}</span>
                  </td>
                  <td className="text-[11px] text-[#999]">--</td>
                  <td className="font-mono text-[11px]">
                    {iface.ipAddress ? `${iface.ipAddress} ${iface.subnet}` : '0.0.0.0 0.0.0.0'}
                  </td>
                  <td className="text-[11px]">
                    <span className="inline-flex items-center gap-1">
                      <Network size={12} className="text-[#999]" />
                      Physical Interface
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-0.5">
                      {iface.access.ping && <AccessBadge label="PING" active={true} />}
                      {iface.access.https && <AccessBadge label="HTTPS" active={true} />}
                      {iface.access.ssh && <AccessBadge label="SSH" active={true} />}
                      {iface.access.http && <AccessBadge label="HTTP" active={true} />}
                      {iface.access.fmgAccess && <AccessBadge label="FMG-Access" active={true} />}
                    </div>
                  </td>
                  <td className="text-right text-[11px] text-[#666]">{iface.refs}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Interface Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-2 bg-gradient-to-r from-[hsl(142,70%,35%)] to-[hsl(142,60%,45%)] text-white">
            <DialogTitle className="text-sm font-semibold">
              {editingInterface ? 'Edit Interface' : 'Create Interface'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Interface Name */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="text-xs text-right text-muted-foreground">Interface Name</Label>
              <div className="col-span-2">
                <Input 
                  value={newInterface.name}
                  onChange={(e) => setNewInterface(prev => ({ ...prev, name: e.target.value }))}
                  className="h-8 text-xs"
                  placeholder="port1"
                />
              </div>
            </div>

            {/* Alias */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="text-xs text-right text-muted-foreground">Alias</Label>
              <div className="col-span-2">
                <Input className="h-8 text-xs" placeholder="WAN Interface" />
              </div>
            </div>

            {/* Link Status */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="text-xs text-right text-muted-foreground">Link Status</Label>
              <div className="col-span-2 flex items-center gap-2">
                <span className={cn(
                  "inline-flex items-center gap-1.5 text-xs",
                  newInterface.status === 'up' ? 'text-green-600' : 'text-gray-500'
                )}>
                  {newInterface.status === 'up' ? (
                    <CheckCircle2 size={14} />
                  ) : (
                    <XCircle size={14} />
                  )}
                  {newInterface.status === 'up' ? 'Up' : 'Down'}
                </span>
              </div>
            </div>

            {/* Type */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="text-xs text-right text-muted-foreground">Type</Label>
              <div className="col-span-2 text-xs text-foreground">Physical Interface</div>
            </div>

            <div className="border-t border-border pt-4">
              {/* Role */}
              <div className="grid grid-cols-3 gap-3 items-center mb-4">
                <Label className="text-xs text-right text-muted-foreground">Role</Label>
                <div className="col-span-2">
                  <Select 
                    value={newInterface.role} 
                    onValueChange={(v: 'WAN' | 'LAN' | 'DMZ' | 'Undefined') => setNewInterface(prev => ({ ...prev, role: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="WAN">WAN</SelectItem>
                      <SelectItem value="LAN">LAN</SelectItem>
                      <SelectItem value="DMZ">DMZ</SelectItem>
                      <SelectItem value="Undefined">Undefined</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Administrative Access */}
              <div className="grid grid-cols-3 gap-3 items-start mb-4">
                <Label className="text-xs text-right text-muted-foreground pt-1">Administrative Access</Label>
                <div className="col-span-2 flex flex-wrap gap-3">
                  <label className="flex items-center gap-1.5 text-xs">
                    <Checkbox defaultChecked /> HTTPS
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <Checkbox defaultChecked /> SSH
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <Checkbox defaultChecked /> PING
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <Checkbox /> HTTP
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <Checkbox /> TELNET
                  </label>
                  <label className="flex items-center gap-1.5 text-xs">
                    <Checkbox /> SNMP
                  </label>
                </div>
              </div>
            </div>

            <div className="border-t border-border pt-4">
              <div className="font-medium text-xs mb-3 flex items-center gap-2">
                <ChevronDown size={12} />
                Address
              </div>

              {/* Addressing Mode */}
              <div className="grid grid-cols-3 gap-3 items-center mb-4">
                <Label className="text-xs text-right text-muted-foreground">Addressing mode</Label>
                <div className="col-span-2">
                  <Tabs 
                    value={newInterface.addressingMode} 
                    onValueChange={(v) => setNewInterface(prev => ({ ...prev, addressingMode: v as 'Manual' | 'DHCP' | 'PPPoE' }))}
                  >
                    <TabsList className="h-8">
                      <TabsTrigger value="Manual" className="text-xs h-7 px-3">Manual</TabsTrigger>
                      <TabsTrigger value="DHCP" className="text-xs h-7 px-3">DHCP</TabsTrigger>
                      <TabsTrigger value="PPPoE" className="text-xs h-7 px-3">PPPoE</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>

              {newInterface.addressingMode === 'Manual' && (
                <>
                  <div className="grid grid-cols-3 gap-3 items-center mb-4">
                    <Label className="text-xs text-right text-muted-foreground">IP/Netmask</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <Input 
                        value={newInterface.ipAddress}
                        onChange={(e) => setNewInterface(prev => ({ ...prev, ipAddress: e.target.value }))}
                        className="h-8 text-xs flex-1" 
                        placeholder="192.168.1.1"
                      />
                      <span className="text-xs">/</span>
                      <Input 
                        value={newInterface.subnet}
                        onChange={(e) => setNewInterface(prev => ({ ...prev, subnet: e.target.value }))}
                        className="h-8 text-xs flex-1" 
                        placeholder="255.255.255.0"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center mb-4">
                    <Label className="text-xs text-right text-muted-foreground">Gateway</Label>
                    <div className="col-span-2">
                      <Input 
                        value={newInterface.gateway}
                        onChange={(e) => setNewInterface(prev => ({ ...prev, gateway: e.target.value }))}
                        className="h-8 text-xs" 
                        placeholder="192.168.1.254"
                      />
                    </div>
                  </div>
                </>
              )}

              {newInterface.addressingMode === 'DHCP' && (
                <>
                  <div className="grid grid-cols-3 gap-3 items-center mb-4">
                    <Label className="text-xs text-right text-muted-foreground">Status</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <CheckCircle2 size={14} className="text-green-600" />
                      <span className="text-xs text-green-600">Connected</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3 items-center mb-4">
                    <Label className="text-xs text-right text-muted-foreground">Obtained IP/Netmask</Label>
                    <div className="col-span-2 flex items-center gap-2">
                      <span className="text-xs font-mono">192.168.1.10 / 255.255.255.0</span>
                      <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">Renew</Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="flex justify-center gap-2 px-4 py-3 bg-[#f5f5f5] border-t border-[#ddd]">
            <Button 
              onClick={handleSaveInterface}
              className="forti-btn forti-btn-primary"
            >
              OK
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
              className="forti-btn forti-btn-secondary"
            >
              Cancel
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default Interfaces;
