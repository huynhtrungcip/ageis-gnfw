import { useState, useEffect } from 'react';
import { mockSystemStatus } from '@/data/mockData';
import { Bell, ChevronDown } from 'lucide-react';

interface CommandBarProps {
  alertCount?: number;
}

export function CommandBar({ alertCount = 3 }: CommandBarProps) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="command-bar">
      {/* Left - Cluster Info */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="status-indicator status-healthy" />
          <span className="text-sm font-medium">Cluster: PRIMARY</span>
        </div>
        <div className="h-4 w-px bg-border" />
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span>Uptime: 30d 5h</span>
          <span>Sessions: 12,847</span>
        </div>
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {/* Alerts */}
        {alertCount > 0 && (
          <button className="flex items-center gap-2 px-2.5 py-1 text-xs bg-status-critical/10 text-status-critical rounded hover:bg-status-critical/20 transition-colors">
            <Bell size={14} />
            <span>{alertCount} Alerts</span>
          </button>
        )}

        {/* Time */}
        <div className="text-xs text-muted-foreground font-mono">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </div>

        {/* User */}
        <button className="flex items-center gap-2 px-2 py-1 rounded hover:bg-accent transition-colors">
          <div className="w-6 h-6 rounded bg-secondary flex items-center justify-center text-xs font-medium">
            A
          </div>
          <span className="text-sm">admin</span>
          <ChevronDown size={14} className="text-muted-foreground" />
        </button>
      </div>
    </header>
  );
}
