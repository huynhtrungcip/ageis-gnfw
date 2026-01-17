import { useState, useEffect } from 'react';
import { mockSystemStatus } from '@/data/mockData';

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    return `${days}d ${hours}h ${mins}m`;
  };

  return (
    <header className="h-14 bg-card border-b border-border flex items-center justify-between px-6">
      {/* System Info */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="status-dot status-online" />
          <span className="text-sm font-medium">{mockSystemStatus.hostname}</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <div>
            <span className="text-foreground">Uptime:</span> {formatUptime(mockSystemStatus.uptime)}
          </div>
          <div>
            <span className="text-foreground">CPU:</span> {mockSystemStatus.cpu.usage}%
          </div>
          <div>
            <span className="text-foreground">RAM:</span> {Math.round(mockSystemStatus.memory.used / mockSystemStatus.memory.total * 100)}%
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-4">
        {/* Alerts */}
        <button className="relative px-3 py-1.5 text-xs bg-severity-critical/10 text-severity-critical rounded hover:bg-severity-critical/20 transition-colors">
          3 Alerts
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-severity-critical rounded-full animate-pulse" />
        </button>

        {/* Time */}
        <div className="text-xs text-muted-foreground font-mono">
          {currentTime.toLocaleDateString('vi-VN')} {currentTime.toLocaleTimeString('vi-VN')}
        </div>

        {/* User */}
        <div className="flex items-center gap-2 pl-4 border-l border-border">
          <div className="w-8 h-8 rounded bg-secondary flex items-center justify-center">
            <span className="text-xs font-medium">AD</span>
          </div>
          <div className="text-xs">
            <div className="font-medium">admin</div>
            <div className="text-muted-foreground">Administrator</div>
          </div>
        </div>
      </div>
    </header>
  );
}
