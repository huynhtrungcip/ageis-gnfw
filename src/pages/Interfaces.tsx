import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockInterfaces } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  RefreshCw, 
  Trash2, 
  Power, 
  PowerOff, 
  Wifi, 
  Settings,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Edit
} from 'lucide-react';
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
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { NetworkInterface } from '@/types/firewall';

const Interfaces = () => {
  const [interfaces, setInterfaces] = useState<NetworkInterface[]>(mockInterfaces);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
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
  
  const selected = interfaces.find(i => i.id === selectedId);

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

  const openEditModal = (iface?: NetworkInterface) => {
    if (iface) {
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
    if (selected) {
      setInterfaces(prev => prev.map(i => 
        i.id === selected.id ? { 
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
      const iface: NetworkInterface = {
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
      };
      setInterfaces(prev => [...prev, iface]);
      toast.success('Interface added successfully');
    }
    setEditModalOpen(false);
  };

  const handleToggleStatus = (ifaceId: string) => {
    setInterfaces(prev => prev.map(i => {
      if (i.id === ifaceId) {
        const newStatus = i.status === 'up' ? 'down' : 'up';
        toast.success(`Interface ${i.name} is now ${newStatus}`);
        return { ...i, status: newStatus };
      }
      return i;
    }));
  };

  const handleDeleteInterface = (ifaceId: string) => {
    const iface = interfaces.find(i => i.id === ifaceId);
    if (iface && (iface.type === 'WAN' || iface.type === 'LAN')) {
      toast.error(`Cannot delete ${iface.type} interface`);
      return;
    }
    setInterfaces(prev => prev.filter(i => i.id !== ifaceId));
    if (selectedId === ifaceId) setSelectedId(null);
    toast.success('Interface deleted');
  };

  return (
    <Shell>
      <div className="space-y-3">
        {/* Interface List Table */}
        <div className="widget">
          <div className="widget-header">
            <span>Physical Interface</span>
          </div>
          <div className="forti-toolbar">
            <button 
              onClick={() => openEditModal()}
              className="forti-toolbar-btn primary"
            >
              + Create New
            </button>
            <button 
              onClick={() => selected && openEditModal(selected)}
              className="forti-toolbar-btn"
              disabled={!selected}
            >
              ✏️ Edit
            </button>
            <button 
              onClick={() => selected && handleDeleteInterface(selected.id)}
              className="forti-toolbar-btn"
              disabled={!selected || selected.type === 'WAN' || selected.type === 'LAN'}
            >
              🗑️ Delete
            </button>
            <div className="flex-1" />
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="forti-toolbar-btn"
            >
              <RefreshCw size={12} className={cn(isRefreshing && "animate-spin")} />
              Refresh
            </button>
            <div className="forti-search">
              <input type="text" placeholder="Search" className="w-32" />
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Name</th>
                <th>Type</th>
                <th>Members</th>
                <th>IP/Netmask</th>
                <th>Administrative Access</th>
                <th>Status</th>
                <th className="text-right">Ref.</th>
              </tr>
            </thead>
            <tbody>
              {interfaces.map((iface) => (
                <tr 
                  key={iface.id}
                  onClick={() => setSelectedId(iface.id)}
                  className={cn(
                    "cursor-pointer",
                    selectedId === iface.id && "selected"
                  )}
                >
                  <td>
                    <input 
                      type="checkbox" 
                      checked={selectedId === iface.id}
                      onChange={() => setSelectedId(iface.id)}
                      className="rounded"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Wifi size={14} className={iface.status === 'up' ? 'text-green-600' : 'text-gray-400'} />
                      <span className="font-medium">{iface.name}</span>
                    </div>
                  </td>
                  <td className="text-muted-foreground">Physical Interface</td>
                  <td className="text-muted-foreground">--</td>
                  <td className="font-mono text-xs">{iface.ipAddress}/{iface.subnet === '255.255.255.0' ? '24' : '16'}</td>
                  <td className="text-muted-foreground text-xs">HTTPS SSH PING</td>
                  <td>
                    <span className={cn(
                      "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
                      iface.status === 'up' 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    )}>
                      <span className={cn(
                        "w-1.5 h-1.5 rounded-full",
                        iface.status === 'up' ? 'bg-green-500' : 'bg-gray-400'
                      )} />
                      {iface.status === 'up' ? 'Up' : 'Down'}
                    </span>
                  </td>
                  <td className="text-right text-muted-foreground">0</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-3 py-2 text-[11px] text-muted-foreground bg-muted border-t border-border">
            {interfaces.length} entries
          </div>
        </div>
      </div>

      {/* FortiGate-style Edit Interface Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="px-4 py-2 bg-gradient-to-r from-[hsl(142,70%,35%)] to-[hsl(142,60%,45%)] text-white">
            <DialogTitle className="text-sm font-semibold">
              {selected ? 'Edit Interface' : 'Create Interface'}
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
                  placeholder="wan1 (04:D5:90:F3:D0:0C)"
                />
              </div>
            </div>

            {/* Alias */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="text-xs text-right text-muted-foreground">Alias</Label>
              <div className="col-span-2">
                <Input className="h-8 text-xs" placeholder="Spectrum" />
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

            {/* Estimated Bandwidth */}
            <div className="grid grid-cols-3 gap-3 items-center">
              <Label className="text-xs text-right text-muted-foreground">Estimated Bandwidth</Label>
              <div className="col-span-2 flex items-center gap-2">
                <Input type="number" defaultValue="0" className="h-8 text-xs w-20" />
                <span className="text-xs text-muted-foreground">Mbps Upstream</span>
                <Input type="number" defaultValue="0" className="h-8 text-xs w-20" />
                <span className="text-xs text-muted-foreground">Mbps Downstream</span>
              </div>
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

              {/* Tags */}
              <div className="grid grid-cols-3 gap-3 items-center mb-4">
                <Label className="text-xs text-right text-muted-foreground">Tags</Label>
                <div className="col-span-2">
                  <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                    <Plus size={12} /> Add Tag/Category...
                  </Button>
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

              {/* Status */}
              <div className="grid grid-cols-3 gap-3 items-center mb-4">
                <Label className="text-xs text-right text-muted-foreground">Status</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <CheckCircle2 size={14} className="text-green-600" />
                  <span className="text-xs text-green-600">Connected</span>
                </div>
              </div>

              {/* Obtained IP */}
              <div className="grid grid-cols-3 gap-3 items-center mb-4">
                <Label className="text-xs text-right text-muted-foreground">Obtained IP/Netmask</Label>
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-xs font-mono">{newInterface.ipAddress || '10.10.120.3/255.255.255.0'}</span>
                  <Button variant="ghost" size="sm" className="h-6 text-xs text-primary">Renew</Button>
                </div>
              </div>

              {/* Expiry Date */}
              <div className="grid grid-cols-3 gap-3 items-center mb-4">
                <Label className="text-xs text-right text-muted-foreground">Expiry Date</Label>
                <div className="col-span-2 text-xs font-mono text-muted-foreground">
                  {new Date().toLocaleString()}
                </div>
              </div>

              {/* Acquired DNS */}
              <div className="grid grid-cols-3 gap-3 items-center mb-4">
                <Label className="text-xs text-right text-muted-foreground">Acquired DNS</Label>
                <div className="col-span-2 text-xs font-mono text-muted-foreground">
                  8.8.8.8, 1.1.1.1
                </div>
              </div>

              {/* Default Gateway */}
              <div className="grid grid-cols-3 gap-3 items-center mb-4">
                <Label className="text-xs text-right text-muted-foreground">Default Gateway</Label>
                <div className="col-span-2 text-xs font-mono text-muted-foreground">
                  {newInterface.gateway || '10.10.120.1'}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 px-4 py-3 bg-muted border-t border-border">
            <Button 
              onClick={handleSaveInterface}
              className="bg-[hsl(142,70%,35%)] hover:bg-[hsl(142,75%,28%)] text-white h-8"
            >
              OK
            </Button>
            <Button 
              variant="outline" 
              onClick={() => setEditModalOpen(false)}
              className="h-8"
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
