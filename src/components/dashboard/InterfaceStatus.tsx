import { mockInterfaces } from '@/data/mockData';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return bytes + ' B';
}

export function InterfaceStatus() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="text-sm font-medium">Network Interfaces</h3>
        <span className="text-xs text-muted-foreground">{mockInterfaces.length} interfaces</span>
      </div>
      <div className="divide-y divide-border">
        {mockInterfaces.map((iface) => (
          <div key={iface.id} className="p-4 hover:bg-secondary/30 transition-colors">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "status-dot",
                  iface.status === 'up' ? 'status-online' : 
                  iface.status === 'down' ? 'status-danger' : 'status-offline'
                )} />
                <div>
                  <span className="font-medium text-sm">{iface.name}</span>
                  <span className={cn(
                    "ml-2 text-[10px] px-1.5 py-0.5 rounded",
                    iface.type === 'WAN' ? 'bg-primary/20 text-primary' :
                    iface.type === 'LAN' ? 'bg-status-success/20 text-status-success' :
                    iface.type === 'DMZ' ? 'bg-status-warning/20 text-status-warning' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {iface.type}
                  </span>
                </div>
              </div>
              <span className="text-xs text-muted-foreground">{iface.speed}</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <div className="text-muted-foreground mb-0.5">IP Address</div>
                <div className="font-mono">{iface.ipAddress}</div>
              </div>
              <div>
                <div className="text-muted-foreground mb-0.5">MAC</div>
                <div className="font-mono text-[11px]">{iface.mac}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
              <div className="flex items-center justify-between bg-traffic-inbound/10 rounded px-2 py-1.5">
                <span className="text-traffic-inbound">IN</span>
                <span className="font-mono">{formatBytes(iface.rxBytes)}</span>
              </div>
              <div className="flex items-center justify-between bg-traffic-outbound/10 rounded px-2 py-1.5">
                <span className="text-traffic-outbound">OUT</span>
                <span className="font-mono">{formatBytes(iface.txBytes)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
