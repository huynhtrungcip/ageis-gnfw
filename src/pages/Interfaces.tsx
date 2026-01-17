import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockInterfaces } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Plus, RefreshCw } from 'lucide-react';

const Interfaces = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = mockInterfaces.find(i => i.id === selectedId);

  const fmtBytes = (b: number) => {
    if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB';
    if (b >= 1048576) return (b / 1048576).toFixed(0) + ' MB';
    return (b / 1024).toFixed(0) + ' KB';
  };

  // Summary counts
  const upCount = mockInterfaces.filter(i => i.status === 'up').length;
  const downCount = mockInterfaces.filter(i => i.status === 'down').length;

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
            <button className="btn btn-ghost flex items-center gap-2">
              <RefreshCw size={14} />
              Refresh
            </button>
            <button className="btn btn-primary flex items-center gap-2">
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
          <span className="text-sm text-muted-foreground">{mockInterfaces.length} interfaces configured</span>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* List */}
          <div className="col-span-5">
            <div className="section">
              <div className="section-header">
                <span>Configured Interfaces</span>
              </div>
              <div className="divide-y divide-border/40">
                {mockInterfaces.map((iface) => (
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
                    <button className="btn btn-ghost text-xs">Edit</button>
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
    </Shell>
  );
};

export default Interfaces;
