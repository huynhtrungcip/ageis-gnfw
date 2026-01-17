import { mockSystemStatus, mockVPNTunnels } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function SystemStatus() {
  const { cpu, memory, disk } = mockSystemStatus;
  const memPercent = Math.round((memory.used / memory.total) * 100);
  const connectedVPNs = mockVPNTunnels.filter(v => v.status === 'connected').length;

  const metrics = [
    { 
      label: 'CPU', 
      value: cpu.usage, 
      suffix: '%',
      status: cpu.usage > 80 ? 'critical' : cpu.usage > 60 ? 'medium' : 'healthy'
    },
    { 
      label: 'Memory', 
      value: memPercent, 
      suffix: '%',
      status: memPercent > 80 ? 'critical' : memPercent > 60 ? 'medium' : 'healthy'
    },
    { 
      label: 'Sessions', 
      value: '12.8K', 
      suffix: '',
      status: 'healthy'
    },
    { 
      label: 'VPN', 
      value: connectedVPNs, 
      suffix: `/${mockVPNTunnels.length}`,
      status: connectedVPNs === mockVPNTunnels.length ? 'healthy' : connectedVPNs > 0 ? 'medium' : 'inactive'
    },
  ];

  return (
    <div className="panel h-full">
      <div className="panel-header">
        <span>System Status</span>
      </div>
      <div className="panel-body">
        <div className="grid grid-cols-2 gap-4">
          {metrics.map((metric) => (
            <div key={metric.label} className="space-y-1">
              <div className="text-xs text-muted-foreground">{metric.label}</div>
              <div className="flex items-baseline gap-1">
                <span className={cn(
                  "text-xl font-semibold",
                  metric.status === 'critical' ? 'text-status-critical' :
                  metric.status === 'medium' ? 'text-status-medium' :
                  metric.status === 'healthy' ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {metric.value}
                </span>
                <span className="text-sm text-muted-foreground">{metric.suffix}</span>
              </div>
              {typeof metric.value === 'number' && (
                <div className="h-1 bg-border rounded-full overflow-hidden">
                  <div 
                    className={cn(
                      "h-full rounded-full transition-all",
                      metric.status === 'critical' ? 'bg-status-critical' :
                      metric.status === 'medium' ? 'bg-status-medium' : 'bg-status-healthy'
                    )}
                    style={{ width: `${metric.value}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
