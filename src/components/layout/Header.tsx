import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { mockSystemStatus } from '@/data/mockData';
import { 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  Settings, 
  Key,
  Moon,
  Sun,
  Cpu,
  HardDrive,
  Thermometer
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function Header() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'critical', message: 'SSH Brute Force Attack Detected', time: '2m ago' },
    { id: 2, type: 'high', message: 'C2 Communication Blocked', time: '8m ago' },
    { id: 3, type: 'medium', message: 'Unusual Outbound Traffic', time: '15m ago' },
  ]);

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

  const handleLogout = () => {
    toast.success('Logged out successfully');
  };

  const handleDismissAlert = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alert dismissed');
  };

  const cpuUsage = mockSystemStatus.cpu.usage;
  const memUsage = Math.round((mockSystemStatus.memory.used / mockSystemStatus.memory.total) * 100);
  const cpuTemp = mockSystemStatus.cpu.temperature;

  return (
    <header className="h-12 bg-sidebar border-b border-sidebar-border flex items-center justify-between px-4">
      {/* System Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="status-dot-lg status-healthy" />
          <span className="text-sm font-semibold text-foreground">{mockSystemStatus.hostname}</span>
        </div>
        <div className="h-5 w-px bg-border" />
        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <span className="text-foreground font-medium">Uptime:</span>
            <span>{formatUptime(mockSystemStatus.uptime)}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Cpu size={12} className={cn(cpuUsage > 80 ? "text-status-critical" : "text-muted-foreground")} />
            <span className={cn(cpuUsage > 80 ? "text-status-critical" : "text-muted-foreground")}>
              {cpuUsage}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <HardDrive size={12} className={cn(memUsage > 80 ? "text-status-critical" : "text-muted-foreground")} />
            <span className={cn(memUsage > 80 ? "text-status-critical" : "text-muted-foreground")}>
              {memUsage}%
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <Thermometer size={12} className={cn(cpuTemp > 70 ? "text-status-high" : "text-muted-foreground")} />
            <span className={cn(cpuTemp > 70 ? "text-status-high" : "text-muted-foreground")}>
              {cpuTemp}°C
            </span>
          </div>
        </div>
      </div>

      {/* Right Side */}
      <div className="flex items-center gap-3">
        {/* Alerts Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded transition-colors">
              <Bell size={16} />
              {alerts.length > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-status-critical rounded-full animate-pulse" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b border-border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold">Alerts</span>
                <span className="text-xs text-muted-foreground">{alerts.length} unread</span>
              </div>
            </div>
            {alerts.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-muted-foreground">
                No new alerts
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="px-3 py-2 hover:bg-muted/50 border-b border-border/50 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            alert.type === 'critical' ? "bg-status-critical" :
                            alert.type === 'high' ? "bg-status-high" : "bg-status-medium"
                          )} />
                          <span className="text-xs font-medium">{alert.message}</span>
                        </div>
                        <span className="text-[10px] text-muted-foreground ml-4">{alert.time}</span>
                      </div>
                      <button 
                        onClick={() => handleDismissAlert(alert.id)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-3 py-2 border-t border-border">
              <Link to="/incidents" className="text-xs text-primary hover:underline">
                View all incidents →
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Time */}
        <div className="text-[11px] text-muted-foreground font-mono px-2">
          {currentTime.toLocaleDateString('vi-VN')} {currentTime.toLocaleTimeString('vi-VN')}
        </div>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1.5 hover:bg-muted/50 rounded transition-colors">
              <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                <User size={14} className="text-primary" />
              </div>
              <div className="text-left hidden sm:block">
                <div className="text-xs font-medium">admin</div>
                <div className="text-[10px] text-muted-foreground">Administrator</div>
              </div>
              <ChevronDown size={12} className="text-muted-foreground" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2 border-b border-border">
              <div className="text-sm font-medium">System Administrator</div>
              <div className="text-xs text-muted-foreground">admin@aegis-ngfw.local</div>
            </div>
            <DropdownMenuItem asChild>
              <Link to="/system/users" className="flex items-center gap-2 cursor-pointer">
                <User size={14} />
                <span>User Management</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <Key size={14} />
              <span>Change Password</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/system/general" className="flex items-center gap-2 cursor-pointer">
                <Settings size={14} />
                <span>System Settings</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
