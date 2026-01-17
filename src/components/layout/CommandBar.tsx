import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';

export function CommandBar() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <header className="command-bar">
      <div className="flex items-center gap-3 text-xs">
        <div className="flex items-center gap-1.5">
          <span className="status-dot status-healthy" />
          <span className="text-muted-foreground">PRIMARY</span>
        </div>
        <span className="text-border">|</span>
        <span className="text-muted-foreground">Uptime: 30d 5h</span>
        <span className="text-muted-foreground">Sessions: 12,847</span>
      </div>

      <div className="flex items-center gap-3 text-xs">
        <button className="flex items-center gap-1 text-status-critical">
          <Bell size={12} />
          <span>3</span>
        </button>
        <span className="text-muted-foreground font-mono">
          {currentTime.toLocaleTimeString('en-US', { hour12: false })}
        </span>
        <span className="text-muted-foreground">admin</span>
      </div>
    </header>
  );
}
