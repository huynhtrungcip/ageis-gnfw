import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockInterfaces } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Plus, RefreshCw } from 'lucide-react';
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

const Interfaces = () => {
  const [interfaces, setInterfaces] = useState(mockInterfaces);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [newInterface, setNewInterface] = useState({
    name: '',
    type: 'ethernet',
    ipAddress: '',
    subnet: '255.255.255.0',
    mtu: '1500',
  });
  
  const selected = interfaces.find(i => i.id === selectedId);

  const fmtBytes = (b: number) => {
    if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB';
    if (b >= 1048576) return (b / 1048576).toFixed(0) + ' MB';
    return (b / 1024).toFixed(0) + ' KB';
  };

  const upCount = interfaces.filter(i => i.status === 'up').length;
  const downCount = interfaces.filter(i => i.status === 'down').length;

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setInterfaces(prev => prev.map(iface => ({
        ...iface,
        rxBytes: iface.rxBytes + Math.floor(Math.random() * 1000000),
        txBytes: iface.txBytes + Math.floor(Math.random() * 500000),
        rxPackets: iface.rxPackets + Math.floor(Math.random() * 1000),
        txPackets: iface.txPackets + Math.floor(Math.random() * 500),
      })));
      setIsRefreshing(false);
      toast.success('Interface statistics refreshed');
    }, 1000);
  };

  const handleAddInterface = () => {
    if (!newInterface.name || !newInterface.ipAddress) {
      toast.error('Name and IP Address are required');
      return;
    }
    const iface = {
      id: `iface-${Date.now()}`,
      name: newInterface.name,
      type: newInterface.type as 'ethernet' | 'vlan' | 'bridge' | 'loopback',
      status: 'up' as const,
      ipAddress: newInterface.ipAddress,
      subnet: newInterface.subnet,
      mac: `00:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}:${Math.random().toString(16).slice(2, 4)}`.toUpperCase(),
      speed: '1 Gbps',
      duplex: 'full' as const,
      mtu: parseInt(newInterface.mtu),
      rxBytes: 0,
      txBytes: 0,
      rxPackets: 0,
      txPackets: 0,
    };
    setInterfaces(prev => [...prev, iface]);
    setModalOpen(false);
    setNewInterface({ name: '', type: 'ethernet', ipAddress: '', subnet: '255.255.255.0', mtu: '1500' });
    toast.success('Interface added successfully');
  };

  const handleEditInterface = () => {
    if (!selected) return;
    setInterfaces(prev => prev.map(i => 
      i.id === selected.id ? { 
        ...i, 
        name: newInterface.name,
        type: newInterface.type as 'ethernet' | 'vlan' | 'bridge' | 'loopback',
        ipAddress: newInterface.ipAddress,
        subnet: newInterface.subnet,
        mtu: parseInt(newInterface.mtu) 
      } : i
    ));
    setEditModalOpen(false);
    toast.success('Interface updated successfully');
  };

  const openEditModal = () => {
    if (!selected) return;
    setNewInterface({
      name: selected.name,
      type: selected.type,
      ipAddress: selected.ipAddress,
      subnet: selected.subnet,
      mtu: selected.mtu.toString(),
    });
    setEditModalOpen(true);
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">Network Interfaces</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Physical and virtual interface configuration</p>
          </div>
          <div className="flex items-center gap-2">
            <button 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="btn btn-ghost flex items-center gap-2"
            >
              <RefreshCw size={14} className={cn(isRefreshing && "animate-spin")} />
              {isRefreshing ? 'Refreshing...' : 'Refresh'}
            </button>
            <button 
              onClick={() => setModalOpen(true)}
              className="btn btn-primary flex items-center gap-2"
            >
              <Plus size={14} />
              Add Interface
            </button>
          </div>
        </div>

        {/* Summary Strip */}
        <div className="summary-strip">
          <div className="summary-item">
            <span className="status-dot-lg status-healthy" />
            <span className="summary-count text-status-healthy">{upCount}</span>
            <span className="summary-label">Active</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <span className="status-dot-lg status-inactive" />
            <span className="summary-count text-muted-foreground">{downCount}</span>
            <span className="summary-label">Down</span>
          </div>
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">{interfaces.length} interfaces configured</span>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* List */}
          <div className="col-span-5">
            <div className="section">
              <div className="section-header">
                <span>Configured Interfaces</span>
              </div>
              <div className="divide-y divide-border/40">
                {interfaces.map((iface) => (
                  <div
                    key={iface.id}
                    onClick={() => setSelectedId(iface.id)}
                    className={cn(
                      "px-4 py-3 flex items-center justify-between cursor-pointer transition-all duration-100",
                      selectedId === iface.id 
                        ? "bg-primary/10 border-l-2 border-l-primary" 
                        : "hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <span className={cn("status-dot-lg", iface.status === 'up' ? 'status-healthy' : 'status-inactive')} />
                      <div>
                        <div className="font-medium">{iface.name}</div>
                        <div className="mono text-xs text-muted-foreground">{iface.ipAddress}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={cn(
                        "tag",
                        iface.status === 'up' ? 'tag-healthy' : 'bg-muted text-muted-foreground'
                      )}>
                        {iface.status.toUpperCase()}
                      </span>
                      <div className="text-xs text-muted-foreground mt-1">{iface.type}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Detail */}
          <div className="col-span-7">
            {selected ? (
              <div className="space-y-4">
                {/* Config */}
                <div className="section">
                  <div className="section-header">
                    <span>Configuration</span>
                    <button onClick={openEditModal} className="btn btn-ghost text-xs">Edit</button>
                  </div>
                  <div className="section-body">
                    <div className="info-grid grid-cols-2">
                      <div className="info-item">
                        <div className="info-label">Name</div>
                        <div className="info-value">{selected.name}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Type</div>
                        <div className="info-value">{selected.type}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">IPv4 Address</div>
                        <div className="info-value mono">{selected.ipAddress}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Subnet Mask</div>
                        <div className="info-value mono">{selected.subnet}</div>
                      </div>
                      {selected.gateway && (
                        <div className="info-item">
                          <div className="info-label">Gateway</div>
                          <div className="info-value mono">{selected.gateway}</div>
                        </div>
                      )}
                      <div className="info-item">
                        <div className="info-label">MTU</div>
                        <div className="info-value">{selected.mtu}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="section">
                  <div className="section-header">Traffic Statistics</div>
                  <div className="section-body">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="stat-card border-l-2 border-l-status-healthy">
                        <div className="text-xs text-muted-foreground uppercase mb-2">Inbound</div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bytes</span>
                            <span className="font-semibold">{fmtBytes(selected.rxBytes)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Packets</span>
                            <span className="font-semibold">{selected.rxPackets.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div className="stat-card border-l-2 border-l-primary">
                        <div className="text-xs text-muted-foreground uppercase mb-2">Outbound</div>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Bytes</span>
                            <span className="font-semibold">{fmtBytes(selected.txBytes)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Packets</span>
                            <span className="font-semibold">{selected.txPackets.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hardware */}
                <div className="section">
                  <div className="section-header">Hardware Information</div>
                  <div className="section-body">
                    <div className="info-grid grid-cols-3">
                      <div className="info-item">
                        <div className="info-label">MAC Address</div>
                        <div className="info-value mono text-xs">{selected.mac}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Speed</div>
                        <div className="info-value">{selected.speed}</div>
                      </div>
                      <div className="info-item">
                        <div className="info-label">Duplex</div>
                        <div className="info-value capitalize">{selected.duplex}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="section">
                <div className="section-body py-16 text-center">
                  <div className="text-muted-foreground">Select an interface to view details</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Interface Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add Interface</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                placeholder="eth2"
                value={newInterface.name}
                onChange={(e) => setNewInterface(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={newInterface.type} 
                onValueChange={(v) => setNewInterface(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethernet">Ethernet</SelectItem>
                  <SelectItem value="vlan">VLAN</SelectItem>
                  <SelectItem value="bridge">Bridge</SelectItem>
                  <SelectItem value="loopback">Loopback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input 
                placeholder="192.168.1.1"
                value={newInterface.ipAddress}
                onChange={(e) => setNewInterface(prev => ({ ...prev, ipAddress: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Subnet Mask</Label>
              <Input 
                placeholder="255.255.255.0"
                value={newInterface.subnet}
                onChange={(e) => setNewInterface(prev => ({ ...prev, subnet: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>MTU</Label>
              <Input 
                type="number"
                placeholder="1500"
                value={newInterface.mtu}
                onChange={(e) => setNewInterface(prev => ({ ...prev, mtu: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
              <Button onClick={handleAddInterface}>Add Interface</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Interface Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Interface</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input 
                value={newInterface.name}
                onChange={(e) => setNewInterface(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Type</Label>
              <Select 
                value={newInterface.type} 
                onValueChange={(v) => setNewInterface(prev => ({ ...prev, type: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethernet">Ethernet</SelectItem>
                  <SelectItem value="vlan">VLAN</SelectItem>
                  <SelectItem value="bridge">Bridge</SelectItem>
                  <SelectItem value="loopback">Loopback</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>IP Address</Label>
              <Input 
                value={newInterface.ipAddress}
                onChange={(e) => setNewInterface(prev => ({ ...prev, ipAddress: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Subnet Mask</Label>
              <Input 
                value={newInterface.subnet}
                onChange={(e) => setNewInterface(prev => ({ ...prev, subnet: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>MTU</Label>
              <Input 
                type="number"
                value={newInterface.mtu}
                onChange={(e) => setNewInterface(prev => ({ ...prev, mtu: e.target.value }))}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" onClick={() => setEditModalOpen(false)}>Cancel</Button>
              <Button onClick={handleEditInterface}>Save Changes</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default Interfaces;
