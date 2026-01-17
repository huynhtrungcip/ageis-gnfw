import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockInterfaces } from '@/data/mockData';
import { cn } from '@/lib/utils';

const Interfaces = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = mockInterfaces.find(i => i.id === selectedId);

  const fmtBytes = (b: number) => {
    if (b >= 1073741824) return (b / 1073741824).toFixed(1) + ' GB';
    if (b >= 1048576) return (b / 1048576).toFixed(0) + ' MB';
    return (b / 1024).toFixed(0) + ' KB';
  };

  return (
    <Shell>
      <div className="space-y-3">
        <h1 className="text-sm font-semibold">Interfaces</h1>

        <div className="grid grid-cols-12 gap-3">
          {/* List */}
          <div className="col-span-5">
            <div className="section">
              <div className="section-header">Configured</div>
              {mockInterfaces.map((iface) => (
                <div
                  key={iface.id}
                  onClick={() => setSelectedId(iface.id)}
                  className={cn(
                    "list-row flex items-center justify-between cursor-pointer",
                    selectedId === iface.id && "bg-accent"
                  )}
                >
                  <div className="flex items-center gap-2">
                    <span className={cn("status-dot", iface.status === 'up' ? 'status-healthy' : 'status-inactive')} />
                    <span className="text-xs font-medium">{iface.name}</span>
                    <span className="font-mono text-[10px] text-muted-foreground">{iface.ipAddress}</span>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{iface.type}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Detail */}
          <div className="col-span-7">
            {selected ? (
              <div className="space-y-3">
                <div className="section">
                  <div className="section-header">Configuration</div>
                  <div className="section-body space-y-1 text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">Name</span><span>{selected.name}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span>{selected.type}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">IPv4</span><span className="font-mono">{selected.ipAddress}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Subnet</span><span className="font-mono">{selected.subnet}</span></div>
                    {selected.gateway && <div className="flex justify-between"><span className="text-muted-foreground">Gateway</span><span className="font-mono">{selected.gateway}</span></div>}
                    <div className="flex justify-between"><span className="text-muted-foreground">MTU</span><span>{selected.mtu}</span></div>
                  </div>
                </div>
                <div className="section">
                  <div className="section-header">Statistics</div>
                  <div className="section-body text-xs">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">Inbound</div>
                        <div>Bytes: {fmtBytes(selected.rxBytes)}</div>
                        <div>Packets: {selected.rxPackets.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-muted-foreground mb-1">Outbound</div>
                        <div>Bytes: {fmtBytes(selected.txBytes)}</div>
                        <div>Packets: {selected.txPackets.toLocaleString()}</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="section">
                  <div className="section-header">Hardware</div>
                  <div className="section-body text-xs">
                    <div className="flex justify-between"><span className="text-muted-foreground">MAC</span><span className="font-mono text-[11px]">{selected.mac}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Speed</span><span>{selected.speed}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Duplex</span><span className="capitalize">{selected.duplex}</span></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="section">
                <div className="section-body py-8 text-center text-xs text-muted-foreground">
                  Select an interface
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
