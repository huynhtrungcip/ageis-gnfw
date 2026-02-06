import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useInterfaces } from '@/hooks/useDashboardData';

function formatSpeed(bytesPerSec: number): string {
  if (bytesPerSec >= 1073741824) return (bytesPerSec / 1073741824).toFixed(1) + ' Gbps';
  if (bytesPerSec >= 1048576) return (bytesPerSec / 1048576).toFixed(0) + ' Mbps';
  return (bytesPerSec / 1024).toFixed(0) + ' Kbps';
}

export function NetworkHealth() {
  const { data: ifaces = [] } = useInterfaces();

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>Network Health</span>
        <Link to="/interfaces" className="text-xs text-primary hover:underline flex items-center gap-1">
          Details <ChevronRight size={12} />
        </Link>
      </div>
      <div className="divide-y divide-border">
        {ifaces.slice(0, 4).map((iface) => (
          <div key={iface.id} className="px-4 py-3 hover:bg-accent/50 cursor-pointer transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={cn(
                  "status-indicator",
                  iface.status === 'up' ? 'status-healthy' : 'status-inactive'
                )} />
                <div>
                  <div className="text-sm font-medium">{iface.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{iface.ip_address ?? '—'}</div>
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  "text-xs",
                  iface.status === 'up' ? 'text-status-healthy' : 'text-status-inactive'
                )}>
                  {iface.status.toUpperCase()}
                </div>
                <div className="text-xs text-muted-foreground">{iface.speed ?? '—'}</div>
              </div>
            </div>
            {iface.status === 'up' && (
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                <span>↓ {formatSpeed((iface.rx_bytes ?? 0) / 86400)}</span>
                <span>↑ {formatSpeed((iface.tx_bytes ?? 0) / 86400)}</span>
              </div>
            )}
          </div>
        ))}
        {ifaces.length === 0 && (
          <div className="p-4 text-sm text-muted-foreground text-center">No interfaces found</div>
        )}
      </div>
    </div>
  );
}
