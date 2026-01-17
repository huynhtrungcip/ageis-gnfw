import { mockVPNTunnels } from '@/data/mockData';
import { cn } from '@/lib/utils';

function formatBytes(bytes: number): string {
  if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(1) + ' GB';
  if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
  return (bytes / 1024).toFixed(1) + ' KB';
}

function formatUptime(seconds: number): string {
  if (seconds === 0) return '--';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

export function VPNStatus() {
  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="text-sm font-medium">VPN Tunnels</h3>
        <span className="text-xs text-muted-foreground">
          {mockVPNTunnels.filter(v => v.status === 'connected').length}/{mockVPNTunnels.length} connected
        </span>
      </div>
      <div className="divide-y divide-border">
        {mockVPNTunnels.map((vpn) => (
          <div key={vpn.id} className="p-4 hover:bg-secondary/30 transition-colors">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className={cn(
                  "status-dot",
                  vpn.status === 'connected' ? 'status-online' : 
                  vpn.status === 'connecting' ? 'status-warning' : 'status-offline'
                )} />
                <span className="font-medium text-sm">{vpn.name}</span>
                <span className="text-[10px] px-1.5 py-0.5 bg-muted text-muted-foreground rounded uppercase">
                  {vpn.type}
                </span>
              </div>
              <span className={cn(
                "text-[10px] px-1.5 py-0.5 rounded",
                vpn.status === 'connected' ? 'bg-status-success/20 text-status-success' :
                vpn.status === 'connecting' ? 'bg-status-warning/20 text-status-warning' :
                'bg-muted text-muted-foreground'
              )}>
                {vpn.status.toUpperCase()}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-2 text-xs mb-2">
              <div>
                <span className="text-muted-foreground">Remote: </span>
                <span className="font-mono">{vpn.remoteGateway}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Uptime: </span>
                <span>{formatUptime(vpn.uptime)}</span>
              </div>
            </div>

            {vpn.status === 'connected' && (
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="flex items-center justify-between bg-traffic-inbound/10 rounded px-2 py-1">
                  <span className="text-traffic-inbound">IN</span>
                  <span className="font-mono">{formatBytes(vpn.bytesIn)}</span>
                </div>
                <div className="flex items-center justify-between bg-traffic-outbound/10 rounded px-2 py-1">
                  <span className="text-traffic-outbound">OUT</span>
                  <span className="font-mono">{formatBytes(vpn.bytesOut)}</span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
