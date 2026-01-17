import { mockSystemStatus } from '@/data/mockData';

export function SystemMetrics() {
  const { cpu, memory, disk } = mockSystemStatus;
  
  const memoryPercent = Math.round((memory.used / memory.total) * 100);
  const diskPercent = Math.round((disk.used / disk.total) * 100);

  const metrics = [
    { 
      label: 'CPU Usage', 
      value: cpu.usage, 
      unit: '%', 
      subtext: `${cpu.cores} Cores • ${cpu.temperature}°C`,
      color: cpu.usage > 80 ? 'var(--status-danger)' : cpu.usage > 60 ? 'var(--status-warning)' : 'var(--status-success)'
    },
    { 
      label: 'Memory', 
      value: memoryPercent, 
      unit: '%', 
      subtext: `${(memory.used / 1024).toFixed(1)} / ${(memory.total / 1024).toFixed(1)} GB`,
      color: memoryPercent > 80 ? 'var(--status-danger)' : memoryPercent > 60 ? 'var(--status-warning)' : 'var(--status-success)'
    },
    { 
      label: 'Disk', 
      value: diskPercent, 
      unit: '%', 
      subtext: `${(disk.used / 1024).toFixed(0)} / ${(disk.total / 1024).toFixed(0)} GB`,
      color: diskPercent > 80 ? 'var(--status-danger)' : diskPercent > 60 ? 'var(--status-warning)' : 'var(--status-success)'
    },
  ];

  return (
    <div className="panel">
      <div className="panel-header">
        <h3 className="text-sm font-medium">System Resources</h3>
      </div>
      <div className="panel-body space-y-4">
        {metrics.map((metric) => (
          <div key={metric.label}>
            <div className="flex justify-between items-baseline mb-1.5">
              <span className="text-xs text-muted-foreground">{metric.label}</span>
              <span className="text-sm font-medium font-mono">{metric.value}{metric.unit}</span>
            </div>
            <div className="traffic-bar">
              <div 
                className="traffic-bar-fill" 
                style={{ 
                  width: `${metric.value}%`,
                  backgroundColor: `hsl(${metric.color})`
                }} 
              />
            </div>
            <div className="text-[10px] text-muted-foreground mt-1">{metric.subtext}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
