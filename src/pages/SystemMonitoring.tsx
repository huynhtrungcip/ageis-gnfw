import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';
import { AgentStatus } from '@/components/monitoring/AgentStatus';
import { useLatestMetrics, useTrafficHistory } from '@/hooks/useDashboardData';
import { useDemoMode } from '@/contexts/DemoModeContext';

const SystemMonitoring = () => {
  const { demoMode } = useDemoMode();
  const { data: metrics } = useLatestMetrics();
  const { data: trafficData } = useTrafficHistory(24);

  const [cpuHistory, setCpuHistory] = useState<{ time: string; value: number }[]>([]);
  const [memHistory, setMemHistory] = useState<{ time: string; value: number }[]>([]);

  const cpu = metrics ? { usage: metrics.cpu_usage, cores: metrics.cpu_cores, temperature: metrics.cpu_temperature } : null;
  const memory = metrics ? { total: metrics.memory_total, used: metrics.memory_used, free: metrics.memory_free, cached: metrics.memory_cached } : null;
  const disk = metrics ? { total: metrics.disk_total, used: metrics.disk_used, free: metrics.disk_free } : null;
  const load = metrics ? [metrics.load_1m, metrics.load_5m, metrics.load_15m] as [number, number, number] : null;
  const uptime = metrics?.uptime ?? 0;
  const hostname = metrics?.hostname ?? '—';

  useEffect(() => {
    if (!metrics) return;

    if (demoMode) {
      // Simulate real-time data in demo mode
      const interval = setInterval(() => {
        const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
        setCpuHistory(prev => [...prev.slice(-20), { time, value: 20 + Math.random() * 15 }]);
        setMemHistory(prev => [...prev.slice(-20), { time, value: 35 + Math.random() * 10 }]);
      }, 2000);

      const now = new Date();
      const initial = Array.from({ length: 20 }, (_, i) => ({
        time: new Date(now.getTime() - (19 - i) * 2000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        value: 20 + Math.random() * 15,
      }));
      setCpuHistory(initial);
      setMemHistory(initial.map(d => ({ ...d, value: 35 + Math.random() * 10 })));

      return () => clearInterval(interval);
    } else {
      // Real mode: use actual metric value as single point (agent updates every 30s)
      const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCpuHistory(prev => {
        const next = [...prev.slice(-20), { time, value: metrics.cpu_usage }];
        return next;
      });
      const memPct = Math.round((metrics.memory_used / metrics.memory_total) * 100);
      setMemHistory(prev => {
        const next = [...prev.slice(-20), { time, value: memPct }];
        return next;
      });
    }
  }, [metrics, demoMode]);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days} days, ${hours} hours, ${mins} minutes`;
  };

  const memPercent = memory ? Math.round((memory.used / memory.total) * 100) : 0;
  const diskPercent = disk ? Math.round((disk.used / disk.total) * 100) : 0;

  // Traffic chart data
  const trafficChartData = (trafficData ?? []).map(t => ({
    timestamp: t.recorded_at,
    inbound: t.inbound,
    outbound: t.outbound,
  }));

  if (!metrics) {
    return (
      <Shell>
        <div className="flex items-center justify-center h-64 text-muted-foreground text-sm">
          {demoMode ? 'Loading demo data...' : 'No system metrics available. Ensure the Aegis Agent is running.'}
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <div className="space-y-6 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Monitoring</h1>
            <p className="text-sm text-muted-foreground">
              {demoMode ? 'Demo mode — simulated data' : 'Real-time system performance'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {demoMode && <span className="text-xs px-2 py-1 bg-primary/20 text-primary rounded font-medium">DEMO</span>}
            <span className="text-xs px-2 py-1 bg-[hsl(var(--forti-green))]/20 text-[hsl(var(--forti-green))] rounded animate-pulse">LIVE</span>
            <button className="btn-secondary text-xs">Export Data</button>
          </div>
        </div>

        {/* Agent Status */}
        <AgentStatus />

        {/* System Info */}
        <div className="grid grid-cols-4 gap-4">
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Hostname</div>
            <div className="text-lg font-bold">{hostname}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Uptime</div>
            <div className="text-lg font-bold text-[hsl(var(--forti-green))]">{formatUptime(uptime)}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Load Average</div>
            <div className="text-lg font-bold font-mono">{load?.join(' / ') ?? '—'}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Temperature</div>
            <div className="text-lg font-bold">{cpu?.temperature ?? 0}°C</div>
          </div>
        </div>

        {/* CPU & Memory Graphs */}
        <div className="grid grid-cols-2 gap-6">
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">CPU Usage</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{cpu?.usage ?? 0}%</span>
                <span className="text-xs text-muted-foreground">{cpu?.cores ?? 0} cores</span>
              </div>
            </div>
            <div className="panel-body">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cpuHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#cpuGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">Memory Usage</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{memPercent}%</span>
                <span className="text-xs text-muted-foreground">{memory ? `${(memory.used / 1024).toFixed(1)} / ${(memory.total / 1024).toFixed(1)} GB` : '—'}</span>
              </div>
            </div>
            <div className="panel-body">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={memHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--forti-green))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--forti-green))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--forti-green))" fillOpacity={1} fill="url(#memGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Resource Bars */}
        <div className="grid grid-cols-3 gap-6">
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">CPU</h3>
              <span className={cn(
                "text-xs",
                (cpu?.usage ?? 0) > 80 ? 'text-destructive' : (cpu?.usage ?? 0) > 60 ? 'text-[hsl(40,80%,45%)]' : 'text-[hsl(var(--forti-green))]'
              )}>
                {cpu?.usage ?? 0}%
              </span>
            </div>
            <div className="panel-body">
              <div className="space-y-2">
                {Array.from({ length: cpu?.cores ?? 0 }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">Core {i}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${demoMode ? 15 + Math.random() * 30 : cpu?.usage ?? 0}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">Memory</h3>
              <span className="text-xs">{memory ? `${(memory.total / 1024).toFixed(0)} GB Total` : '—'}</span>
            </div>
            <div className="panel-body">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Used</span>
                    <span>{memory ? `${(memory.used / 1024).toFixed(1)} GB` : '—'}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-[hsl(var(--forti-green))] rounded-full" style={{ width: `${memPercent}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Cached</span>
                    <span>{memory ? `${(memory.cached / 1024).toFixed(1)} GB` : '—'}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 rounded-full" style={{ width: `${memory ? (memory.cached / memory.total) * 100 : 0}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Free</span>
                    <span>{memory ? `${(memory.free / 1024).toFixed(1)} GB` : '—'}</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${memory ? (memory.free / memory.total) * 100 : 0}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">Disk</h3>
              <span className="text-xs">{disk ? `${(disk.total / 1024).toFixed(0)} GB Total` : '—'}</span>
            </div>
            <div className="panel-body">
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                    <circle 
                      cx="64" cy="64" r="56" fill="none" 
                      stroke={diskPercent > 80 ? 'hsl(var(--destructive))' : diskPercent > 60 ? 'hsl(40,80%,50%)' : 'hsl(var(--forti-green))'} 
                      strokeWidth="12" 
                      strokeLinecap="round"
                      strokeDasharray={`${diskPercent * 3.52} 352`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-xl font-bold">{diskPercent}%</span>
                    <span className="text-[10px] text-muted-foreground">Used</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="text-center p-2 bg-secondary/50 rounded">
                  <div className="font-medium">{disk ? `${(disk.used / 1024).toFixed(0)} GB` : '—'}</div>
                  <div className="text-muted-foreground">Used</div>
                </div>
                <div className="text-center p-2 bg-secondary/50 rounded">
                  <div className="font-medium">{disk ? `${(disk.free / 1024).toFixed(0)} GB` : '—'}</div>
                  <div className="text-muted-foreground">Free</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Traffic Overview */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-sm font-medium">Network Traffic (24h)</h3>
          </div>
          <div className="panel-body">
            <div className="h-48">
              {trafficChartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trafficChartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis 
                      dataKey="timestamp"
                      tickFormatter={(val) => new Date(val).toLocaleTimeString('vi-VN', { hour: '2-digit' })}
                      axisLine={false} tickLine={false} 
                      tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} 
                    />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}Mb`} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }} />
                    <Line type="monotone" dataKey="inbound" stroke="hsl(var(--forti-green))" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="outbound" stroke="hsl(210,80%,55%)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  No traffic data available
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default SystemMonitoring;
