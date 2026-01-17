import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockSystemStatus, mockTrafficStats } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

const SystemMonitoring = () => {
  const [cpuHistory, setCpuHistory] = useState<{ time: string; value: number }[]>([]);
  const [memHistory, setMemHistory] = useState<{ time: string; value: number }[]>([]);
  const { cpu, memory, disk, load, uptime } = mockSystemStatus;

  useEffect(() => {
    // Simulate real-time data
    const interval = setInterval(() => {
      const time = new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCpuHistory(prev => [...prev.slice(-20), { time, value: 20 + Math.random() * 15 }]);
      setMemHistory(prev => [...prev.slice(-20), { time, value: 35 + Math.random() * 10 }]);
    }, 2000);

    // Initial data
    const now = new Date();
    const initial = Array.from({ length: 20 }, (_, i) => ({
      time: new Date(now.getTime() - (19 - i) * 2000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      value: 20 + Math.random() * 15,
    }));
    setCpuHistory(initial);
    setMemHistory(initial.map(d => ({ ...d, value: 35 + Math.random() * 10 })));

    return () => clearInterval(interval);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days} days, ${hours} hours, ${mins} minutes`;
  };

  const memPercent = Math.round((memory.used / memory.total) * 100);
  const diskPercent = Math.round((disk.used / disk.total) * 100);

  return (
    <Shell>
      <div className="space-y-6 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">System Monitoring</h1>
            <p className="text-sm text-muted-foreground">Real-time system performance</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs px-2 py-1 bg-status-success/20 text-status-success rounded animate-pulse">LIVE</span>
            <button className="btn-secondary text-xs">Export Data</button>
          </div>
        </div>

        {/* System Info */}
        <div className="grid grid-cols-4 gap-4">
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Hostname</div>
            <div className="text-lg font-bold">{mockSystemStatus.hostname}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Uptime</div>
            <div className="text-lg font-bold text-status-success">{formatUptime(uptime)}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Load Average</div>
            <div className="text-lg font-bold font-mono">{load.join(' / ')}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Temperature</div>
            <div className="text-lg font-bold">{cpu.temperature}°C</div>
          </div>
        </div>

        {/* CPU & Memory Graphs */}
        <div className="grid grid-cols-2 gap-6">
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">CPU Usage</h3>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold">{cpu.usage}%</span>
                <span className="text-xs text-muted-foreground">{cpu.cores} cores</span>
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
                <span className="text-xs text-muted-foreground">{(memory.used / 1024).toFixed(1)} / {(memory.total / 1024).toFixed(1)} GB</span>
              </div>
            </div>
            <div className="panel-body">
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={memHistory} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="memGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--status-success))" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="hsl(var(--status-success))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}%`} />
                    <Area type="monotone" dataKey="value" stroke="hsl(var(--status-success))" fillOpacity={1} fill="url(#memGradient)" strokeWidth={2} />
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
                cpu.usage > 80 ? 'text-status-danger' : cpu.usage > 60 ? 'text-status-warning' : 'text-status-success'
              )}>
                {cpu.usage}%
              </span>
            </div>
            <div className="panel-body">
              <div className="space-y-2">
                {Array.from({ length: cpu.cores }, (_, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-12">Core {i}</span>
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${15 + Math.random() * 30}%` }}
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
              <span className="text-xs">{(memory.total / 1024).toFixed(0)} GB Total</span>
            </div>
            <div className="panel-body">
              <div className="space-y-3">
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Used</span>
                    <span>{(memory.used / 1024).toFixed(1)} GB</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-status-success rounded-full" style={{ width: `${memPercent}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Cached</span>
                    <span>{(memory.cached / 1024).toFixed(1)} GB</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-primary/50 rounded-full" style={{ width: `${(memory.cached / memory.total) * 100}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">Free</span>
                    <span>{(memory.free / 1024).toFixed(1)} GB</span>
                  </div>
                  <div className="h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-muted-foreground/30 rounded-full" style={{ width: `${(memory.free / memory.total) * 100}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">Disk</h3>
              <span className="text-xs">{(disk.total / 1024).toFixed(0)} GB Total</span>
            </div>
            <div className="panel-body">
              <div className="flex items-center justify-center mb-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90">
                    <circle cx="64" cy="64" r="56" fill="none" stroke="hsl(var(--muted))" strokeWidth="12" />
                    <circle 
                      cx="64" cy="64" r="56" fill="none" 
                      stroke={diskPercent > 80 ? 'hsl(var(--status-danger))' : diskPercent > 60 ? 'hsl(var(--status-warning))' : 'hsl(var(--status-success))'} 
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
                  <div className="font-medium">{(disk.used / 1024).toFixed(0)} GB</div>
                  <div className="text-muted-foreground">Used</div>
                </div>
                <div className="text-center p-2 bg-secondary/50 rounded">
                  <div className="font-medium">{(disk.free / 1024).toFixed(0)} GB</div>
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
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockTrafficStats} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                  <XAxis 
                    dataKey="timestamp"
                    tickFormatter={(val) => new Date(val).toLocaleTimeString('vi-VN', { hour: '2-digit' })}
                    axisLine={false} tickLine={false} 
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} 
                  />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `${v}Mb`} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--popover))', border: '1px solid hsl(var(--border))', borderRadius: '6px', fontSize: '11px' }} />
                  <Line type="monotone" dataKey="inbound" stroke="hsl(var(--traffic-inbound))" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="outbound" stroke="hsl(var(--traffic-outbound))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default SystemMonitoring;
