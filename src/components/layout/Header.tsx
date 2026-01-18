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
  AlertTriangle,
  Globe,
  Wifi,
  RefreshCw
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
    const pathMap: Record<string, string[]> = {
      '/': ['Dashboard', 'Status'],
      '/interfaces': ['Network', 'Interfaces'],
      '/routing': ['Network', 'Static Routes'],
      '/dhcp': ['Network', 'DHCP Server'],
      '/firewall/rules': ['Policy & Objects', 'Firewall Policy'],
      '/firewall/aliases': ['Policy & Objects', 'Addresses'],
      '/firewall/schedules': ['Policy & Objects', 'Schedules'],
      '/firewall/nat': ['Policy & Objects', 'Virtual IPs'],
      '/security/ids': ['Security Profiles', 'IPS'],
      '/threats': ['Log & Report', 'Security Events'],
      '/incidents': ['Monitor', 'Threat Monitor'],
      '/vpn/ipsec': ['VPN', 'IPsec Tunnels'],
      '/system/users': ['User & Authentication', 'User Definition'],
      '/monitoring/traffic': ['Log & Report', 'Forward Traffic'],
      '/monitoring/logs': ['Log & Report', 'System Events'],
      '/reports': ['Log & Report', 'Reports'],
      '/system/backup': ['System', 'Configuration'],
      '/system/general': ['System', 'Settings'],
    };
    return pathMap[location.pathname] || ['Dashboard'];
  };

  const breadcrumb = getPageTitle();

  return (
    <header className="h-10 bg-[#f5f5f5] border-b border-[#ddd] flex items-center justify-between px-4">
      {/* Left: Breadcrumb */}
      <div className="flex items-center gap-2 text-[12px]">
        {breadcrumb.map((item, idx) => (
          <span key={idx} className="flex items-center gap-2">
            {idx > 0 && <span className="text-gray-400">&gt;</span>}
            <span className={idx === breadcrumb.length - 1 ? "text-gray-800 font-medium" : "text-gray-500"}>
              {item}
            </span>
          </span>
        ))}
      </div>

      {/* Center: Search */}
      <div className="flex-1 max-w-sm mx-6">
        <div className="flex items-center gap-2 px-3 py-1 bg-white rounded border border-[#ddd]">
          <Search size={13} className="text-gray-400" />
          <input 
            type="text" 
            placeholder="Search" 
            className="bg-transparent text-[12px] text-gray-700 placeholder-gray-400 outline-none flex-1"
          />
        </div>
      </div>

      {/* Right: Status & Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Status */}
        <div className="flex items-center gap-3 text-[10px] text-gray-500">
          <div className="flex items-center gap-1">
            <Wifi size={12} className="text-green-500" />
            <span>WAN1</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe size={12} className="text-blue-500" />
            <span>103.159.54.219</span>
          </div>
        </div>

        <div className="w-px h-5 bg-gray-300" />

        {/* Refresh */}
        <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
          <RefreshCw size={14} />
        </button>

        {/* Help */}
        <button className="p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
          <HelpCircle size={14} />
        </button>

        {/* Alerts Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-1.5 text-gray-500 hover:text-gray-700 hover:bg-gray-200 rounded transition-colors">
              <Bell size={14} />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <div className="px-3 py-2 border-b border-border bg-gray-50">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} className="text-orange-500" />
                  Alert Messages
                </span>
                <span className="text-xs text-gray-500">{alerts.length} new</span>
              </div>
            </div>
            {alerts.length === 0 ? (
              <div className="px-3 py-6 text-center text-sm text-gray-500">
                No new alerts
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {alerts.map((alert) => (
                  <div 
                    key={alert.id}
                    className="px-3 py-2 hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "w-2 h-2 rounded-full",
                            alert.type === 'critical' ? "bg-red-500" :
                            alert.type === 'high' ? "bg-orange-500" : "bg-yellow-500"
                          )} />
                          <span className="text-xs font-medium text-gray-700">{alert.message}</span>
                        </div>
                        <span className="text-[10px] text-gray-400 ml-4">{alert.time}</span>
                      </div>
                      <button 
                        onClick={() => handleDismissAlert(alert.id)}
                        className="text-gray-400 hover:text-gray-600 text-sm"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="px-3 py-2 border-t border-gray-200 bg-gray-50">
              <Link to="/incidents" className="text-xs text-[#4caf50] hover:underline">
                View all alerts →
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-5 bg-gray-300" />

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 px-2 py-1 hover:bg-gray-200 rounded transition-colors">
              <div className="w-6 h-6 rounded-full bg-[#4caf50] flex items-center justify-center">
                <User size={12} className="text-white" />
              </div>
              <span className="text-[12px] text-gray-700 font-medium">admin</span>
              <ChevronDown size={12} className="text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <div className="px-3 py-2 border-b border-gray-200 bg-gray-50">
              <div className="text-sm font-medium text-gray-700">Administrator</div>
              <div className="text-xs text-gray-500">admin@aegis-ngfw.local</div>
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
              className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
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
