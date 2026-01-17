import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockInterfaces } from '@/data/mockData';
import { NetworkInterface } from '@/types/firewall';
import { cn } from '@/lib/utils';

const Interfaces = () => {
  const [interfaces] = useState<NetworkInterface[]>(mockInterfaces);
  const [selectedInterface, setSelectedInterface] = useState<NetworkInterface | null>(null);

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const formatPackets = (num: number): string => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  return (
    <Shell>
      <div className="space-y-6 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Network Interfaces</h1>
            <p className="text-sm text-muted-foreground">Configure network interfaces and VLANs</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs">Add VLAN</button>
            <button className="btn-primary text-xs">Assign Interface</button>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          {/* Interface List */}
          <div className="col-span-5">
            <div className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-medium">Interfaces</h3>
                <span className="text-xs text-muted-foreground">{interfaces.length} configured</span>
              </div>
              <div className="divide-y divide-border">
                {interfaces.map((iface) => (
                  <div 
                    key={iface.id}
                    onClick={() => setSelectedInterface(iface)}
                    className={cn(
                      "p-4 cursor-pointer transition-colors",
                      selectedInterface?.id === iface.id 
                        ? "bg-primary/10 border-l-2 border-primary" 
                        : "hover:bg-secondary/50"
                    )}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "status-dot",
                          iface.status === 'up' ? 'status-online' : 
                          iface.status === 'down' ? 'status-danger' : 'status-offline'
                        )} />
                        <div>
                          <div className="font-medium">{iface.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{iface.mac}</div>
                        </div>
                      </div>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        iface.type === 'WAN' ? "bg-primary/20 text-primary" :
                        iface.type === 'LAN' ? "bg-status-success/20 text-status-success" :
                        iface.type === 'DMZ' ? "bg-status-warning/20 text-status-warning" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {iface.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-muted-foreground">IP: </span>
                        <span className="font-mono">{iface.ipAddress}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Speed: </span>
                        <span>{iface.speed}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interface Details */}
          <div className="col-span-7">
            {selectedInterface ? (
              <div className="space-y-4">
                {/* General Settings */}
                <div className="panel">
                  <div className="panel-header">
                    <h3 className="text-sm font-medium">General Configuration</h3>
                    <button className="btn-primary text-xs">Save Changes</button>
                  </div>
                  <div className="panel-body">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Interface Name</label>
                        <input 
                          type="text" 
                          defaultValue={selectedInterface.name}
                          className="w-full px-3 py-2 bg-input border border-border rounded text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Type</label>
                        <select className="w-full px-3 py-2 bg-input border border-border rounded text-sm">
                          <option value="static">Static IPv4</option>
                          <option value="dhcp">DHCP</option>
                          <option value="pppoe">PPPoE</option>
                          <option value="none">None</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">IPv4 Address</label>
                        <input 
                          type="text" 
                          defaultValue={selectedInterface.ipAddress}
                          className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">Subnet Mask</label>
                        <input 
                          type="text" 
                          defaultValue={selectedInterface.subnet}
                          className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-mono"
                        />
                      </div>
                      {selectedInterface.gateway && (
                        <div>
                          <label className="block text-xs text-muted-foreground mb-1">Gateway</label>
                          <input 
                            type="text" 
                            defaultValue={selectedInterface.gateway}
                            className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-mono"
                          />
                        </div>
                      )}
                      <div>
                        <label className="block text-xs text-muted-foreground mb-1">MTU</label>
                        <input 
                          type="number" 
                          defaultValue={selectedInterface.mtu}
                          className="w-full px-3 py-2 bg-input border border-border rounded text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Statistics */}
                <div className="panel">
                  <div className="panel-header">
                    <h3 className="text-sm font-medium">Traffic Statistics</h3>
                    <button className="text-xs text-primary hover:underline">Reset Counters</button>
                  </div>
                  <div className="panel-body">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs text-muted-foreground mb-3">INBOUND</div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Bytes</span>
                            <span className="font-mono text-traffic-inbound">{formatBytes(selectedInterface.rxBytes)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Packets</span>
                            <span className="font-mono">{formatPackets(selectedInterface.rxPackets)}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-3">OUTBOUND</div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm">Bytes</span>
                            <span className="font-mono text-traffic-outbound">{formatBytes(selectedInterface.txBytes)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-sm">Packets</span>
                            <span className="font-mono">{formatPackets(selectedInterface.txPackets)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hardware Info */}
                <div className="panel">
                  <div className="panel-header">
                    <h3 className="text-sm font-medium">Hardware Information</h3>
                  </div>
                  <div className="panel-body">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">MAC Address</div>
                        <div className="font-mono">{selectedInterface.mac}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Speed</div>
                        <div>{selectedInterface.speed}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Duplex</div>
                        <div className="capitalize">{selectedInterface.duplex}</div>
                      </div>
                      {selectedInterface.vlan && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">VLAN Tag</div>
                          <div>{selectedInterface.vlan}</div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel">
                <div className="panel-body flex items-center justify-center py-24">
                  <div className="text-center text-muted-foreground">
                    <div className="text-lg mb-2">Select an interface</div>
                    <div className="text-sm">Click on an interface to view and edit its configuration</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default Interfaces;
