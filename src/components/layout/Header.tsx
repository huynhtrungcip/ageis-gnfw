import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { mockSystemStatus } from '@/data/mockData';
import { 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  Settings, 
  Key,
  Search,
  HelpCircle,
  Menu,
  AlertTriangle
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
  const location = useLocation();
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

  const handleLogout = () => {
    toast.success('Logged out successfully');
  };

  const handleDismissAlert = (id: number) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    toast.success('Alert dismissed');
  };

  // Get page title from path
  const getPageTitle = () => {
    const pathMap: Record<string, string> = {
      '/': 'Dashboard',
      '/interfaces': 'Network > Interfaces',
      '/routing': 'Network > Routing',
      '/dhcp': 'Network > DHCP Server',
      '/firewall/rules': 'Policy & Objects > Firewall Policy',
      '/firewall/aliases': 'Policy & Objects > Addresses',
      '/firewall/schedules': 'Policy & Objects > Schedules',
      '/firewall/nat': 'Policy & Objects > NAT',
      '/security/ids': 'Security Profiles > Threat Prevention',
      '/threats': 'Security Profiles > Threat Monitor',
      '/incidents': 'Security Profiles > Incidents',
      '/vpn/ipsec': 'VPN > IPsec Tunnels',
      '/system/users': 'User & Device > User Management',
      '/monitoring/traffic': 'Log & Report > Traffic Analysis',
      '/monitoring/logs': 'Log & Report > System Logs',
      '/reports': 'Log & Report > Reports',
      '/system/backup': 'System > Config Backup',
      '/system/general': 'System > Settings',
    };
    return pathMap[location.pathname] || 'Dashboard';
  };

  return (
    <header className="h-10 bg-[hsl(220,20%,22%)] border-b border-[hsl(220,18%,18%)] flex items-center justify-between px-4">
      {/* Left: Navigation breadcrumb */}
      <div className="flex items-center gap-3">
        <Menu size={16} className="text-gray-400 cursor-pointer hover:text-white" />
        <div className="text-white text-sm font-medium">{getPageTitle()}</div>
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-md mx-8">
        <div className="flex items-center gap-2 px-3 py-1 bg-[hsl(220,18%,28%)] rounded border border-[hsl(220,15%,35%)]">
          <Search size={14} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent text-sm text-white placeholder-gray-500 outline-none flex-1"
          />
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-2">
        {/* Help */}
        <button className="p-1.5 text-gray-400 hover:text-white transition-colors">
          <HelpCircle size={16} />
        </button>

        {/* Alerts Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-1.5 text-gray-400 hover:text-white transition-colors">
              <Bell size={16} />
              {alerts.length > 0 && (
                <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b border-border bg-muted">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="text-orange-500" />
                  Alerts
                </span>
                <span className="text-xs text-muted-foreground">{alerts.length} new</span>
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
                    className="px-3 py-2 hover:bg-muted border-b border-border/50 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            alert.type === 'critical' ? "bg-red-500" :
                            alert.type === 'high' ? "bg-orange-500" : "bg-yellow-500"
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
            <div className="px-3 py-2 border-t border-border bg-muted">
              <Link to="/incidents" className="text-xs text-[hsl(var(--forti-green))] hover:underline">
                View all alerts →
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-[hsl(220,15%,30%)]" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 hover:bg-[hsl(220,18%,28%)] rounded transition-colors">
              <div className="w-6 h-6 rounded-full bg-[hsl(var(--forti-green))] flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
              <span className="text-sm text-white">admin</span>
              <ChevronDown size={12} className="text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2 border-b border-border bg-muted">
            <div className="text-sm font-medium">Administrator</div>
            <div className="text-xs text-muted-foreground">admin@aegis-ngfw.local</div>
            </div>
            <DropdownMenuItem asChild>
              <Link to="/system/users" className="flex items-center gap-2 cursor-pointer">
                <User size={14} />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
              <Key size={14} />
              <span>Change Password</span>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link to="/system/general" className="flex items-center gap-2 cursor-pointer">
                <Settings size={14} />
                <span>Settings</span>
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
