import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockInterfaces } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Plus, Settings } from 'lucide-react';

const Interfaces = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = mockInterfaces.find(i => i.id === selectedId);

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Interfaces</h1>
            <p className="text-sm text-muted-foreground">Network interface configuration</p>
          </div>
          <button className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14} />
            <span>Assign</span>
          </button>
        </div>

        <div className="grid grid-cols-12 gap-5">
          {/* Interface List */}
          <div className="col-span-5">
            <div className="panel">
              <div className="panel-header">
                <span>Configured Interfaces</span>
              </div>
              <div className="divide-y divide-border">
                {mockInterfaces.map((iface) => (
                  <div
                    key={iface.id}
                    onClick={() => setSelectedId(iface.id)}
                    className={cn(
                      "px-4 py-3 cursor-pointer transition-colors",
                      selectedId === iface.id ? "bg-accent" : "hover:bg-accent/50"
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className={cn(
                          "status-indicator",
                          iface.status === 'up' ? 'status-healthy' : 'status-inactive'
                        )} />
                        <div>
                          <div className="font-medium text-sm">{iface.name}</div>
                          <div className="text-xs text-muted-foreground font-mono">{iface.ipAddress}/{iface.subnet.split('.').pop()}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-muted-foreground">{iface.type}</div>
                        <div className="text-xs text-muted-foreground">{iface.speed}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Interface Detail */}
          <div className="col-span-7">
            {selected ? (
              <div className="space-y-4">
                <div className="panel">
                  <div className="panel-header">
                    <span>Configuration</span>
                    <button className="btn btn-ghost flex items-center gap-1.5">
                      <Settings size={14} />
                      <span>Edit</span>
                    </button>
                  </div>
                  <div className="panel-body">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Interface Name</div>
                        <div className="text-sm font-medium">{selected.name}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Type</div>
                        <div className="text-sm">{selected.type}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">IPv4 Address</div>
                        <div className="text-sm font-mono">{selected.ipAddress}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Subnet</div>
                        <div className="text-sm font-mono">{selected.subnet}</div>
                      </div>
                      {selected.gateway && (
                        <div>
                          <div className="text-xs text-muted-foreground mb-1">Gateway</div>
                          <div className="text-sm font-mono">{selected.gateway}</div>
                        </div>
                      )}
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">MTU</div>
                        <div className="text-sm">{selected.mtu}</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <span>Statistics</span>
                  </div>
                  <div className="panel-body">
                    <div className="grid grid-cols-2 gap-6">
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Inbound</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Bytes</span>
                            <span className="font-mono">{formatBytes(selected.rxBytes)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Packets</span>
                            <span className="font-mono">{selected.rxPackets.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-2">Outbound</div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Bytes</span>
                            <span className="font-mono">{formatBytes(selected.txBytes)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">Packets</span>
                            <span className="font-mono">{selected.txPackets.toLocaleString()}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="panel">
                  <div className="panel-header">
                    <span>Hardware</span>
                  </div>
                  <div className="panel-body">
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">MAC Address</div>
                        <div className="font-mono text-xs">{selected.mac}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Speed</div>
                        <div>{selected.speed}</div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Duplex</div>
                        <div className="capitalize">{selected.duplex}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="panel">
                <div className="panel-body flex items-center justify-center py-16">
                  <span className="text-muted-foreground">Select an interface to view details</span>
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
