import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  Key,
  HelpCircle,
  Terminal,
  Maximize2,
  ChevronRight,
  Home,
  Menu
} from 'lucide-react';

interface HeaderProps {
  onToggleSidebar: () => void;
  sidebarCollapsed: boolean;
}
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// Breadcrumb mapping
const pathToLabel: Record<string, string> = {
  '/': 'Dashboard',
  '/threats': 'Threats',
  '/incidents': 'Incidents',
  '/firewall': 'Policy & Objects',
  '/firewall/rules': 'IPv4 Policy',
  '/firewall/aliases': 'Addresses',
  '/firewall/wildcard-fqdn': 'Wildcard FQDN',
  
  '/firewall/services': 'Services',
  '/firewall/schedules': 'Schedules',
  '/firewall/virtual-ips': 'Virtual IPs',
  '/firewall/ip-pools': 'IP Pools',
  '/firewall/traffic-shapers': 'Traffic Shapers',
  '/firewall/traffic-shaping-policy': 'Traffic Shaping Policy',
  '/firewall/nat': 'NAT',
  '/security': 'Security Profiles',
  '/security/ids': 'IPS',
  '/security/antivirus': 'AntiVirus',
  '/security/webfilter': 'Web Filter',
  '/security/dnsfilter': 'DNS Filter',
  '/security/appcontrol': 'Application Control',
  '/security/ssl': 'SSL Inspection',
  '/vpn': 'VPN',
  '/vpn/ipsec': 'IPsec Tunnels',
  
  '/system': 'System',
  '/system/general': 'Settings',
  '/system/admins': 'Administrators',
  '/system/firmware': 'Firmware',
  '/system/ha': 'High Availability',
  '/system/certificates': 'Certificates',
  '/system/feature-visibility': 'Feature Visibility',
  '/system/users': 'User Definition',
  '/system/backup': 'Config Backup',
  '/system/full-backup': 'Full System Backup',
  '/users': 'User & Device',
  '/users/groups': 'User Groups',
  
  '/interfaces': 'Interfaces',
  '/routing': 'Routing',
  '/dns': 'DNS',
  '/dhcp': 'DHCP',
  '/topology': 'Network Topology',
  '/packet-flow': 'Packet Flow',
  '/logs': 'Log Viewer',
  '/reports': 'Reports',
  '/monitoring': 'Monitoring',
  '/monitoring/traffic': 'Traffic Analysis',
  '/monitoring/logs': 'System Logs',
};

const sectionMap: Record<string, string> = {
  'firewall': 'Policy & Objects',
  'security': 'Security Profiles',
  'vpn': 'VPN',
  'system': 'System',
  'users': 'User & Device',
  'monitoring': 'Monitor',
  'insights': 'AI Insights',
};

export function Header({ onToggleSidebar, sidebarCollapsed }: HeaderProps) {
  const location = useLocation();
  const [alerts, setAlerts] = useState([
    { id: 1, type: 'critical', message: 'High CPU usage detected', time: '2m ago', link: '/monitoring/traffic' },
    { id: 2, type: 'high', message: 'New firmware available', time: '1h ago', link: '/system/firmware' },
    { id: 3, type: 'medium', message: '3 blocked intrusion attempts', time: '15m ago', link: '/threats' },
    { id: 4, type: 'low', message: 'Backup completed successfully', time: '3h ago', link: '/system/full-backup' },
  ]);

  const { signOut, user, roles } = useAuth();

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  const handleDismissAlert = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  // Generate breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') {
      return [{ label: 'Dashboard', path: '/' }];
    }

    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: { label: string; path: string }[] = [];

    // Add section
    if (segments.length > 0) {
      const section = sectionMap[segments[0]];
      if (section) {
        breadcrumbs.push({ label: section, path: `/${segments[0]}` });
      }
    }

    // Add page
    const pageLabel = pathToLabel[path];
    if (pageLabel) {
      breadcrumbs.push({ label: pageLabel, path });
    }

    return breadcrumbs.length > 0 ? breadcrumbs : [{ label: 'Dashboard', path: '/' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="h-9 flex items-center justify-between px-3" style={{ background: 'linear-gradient(180deg, #2d3e50 0%, #1e2d3d 100%)' }}>
      {/* Left: Toggle + Breadcrumb Navigation */}
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleSidebar}
          className="p-1 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <Menu size={14} />
        </button>
        <Link to="/" className="text-gray-400 hover:text-white transition-colors">
          <Home size={14} />
        </Link>
        {breadcrumbs.map((crumb, index) => (
          <div key={crumb.path} className="flex items-center gap-2">
            <ChevronRight size={12} className="text-gray-600" />
            {index === breadcrumbs.length - 1 ? (
              <span className="text-[11px] text-white font-medium">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="text-[11px] text-gray-400 hover:text-white transition-colors">
                {crumb.label}
              </Link>
            )}
          </div>
        ))}
        <div className="w-px h-4 bg-gray-600 ml-2" />
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="flex items-center gap-1.5 cursor-default">
              <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
              <span className="text-[10px] text-gray-400">AEGIS-PRIMARY</span>
            </div>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            <p className="font-medium">Hostname: AEGIS-PRIMARY</p>
            <p className="text-muted-foreground">Tên định danh của thiết bị firewall đang được quản lý</p>
          </TooltipContent>
        </Tooltip>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1">
        {/* CLI Console */}
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="CLI Console">
          <Terminal size={14} />
        </button>

        {/* Fullscreen */}
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Fullscreen">
          <Maximize2 size={14} />
        </button>

        {/* Help */}
        <button className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors" title="Help">
          <HelpCircle size={14} />
        </button>

        {/* Alerts */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="relative p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors">
              <Bell size={14} />
              {alerts.length > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-red-500 rounded-full text-[8px] text-white font-bold flex items-center justify-center">
                  {alerts.length}
                </span>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <div className="px-3 py-2 border-b border-[#ddd] bg-[#f5f5f5]">
              <span className="text-xs font-semibold text-[#333]">Alert Messages</span>
            </div>
            {alerts.length === 0 ? (
              <div className="px-3 py-4 text-center text-xs text-gray-500">
                No alerts
              </div>
            ) : (
              <div className="max-h-64 overflow-y-auto">
                {alerts.map((alert) => (
                  <Link 
                    key={alert.id}
                    to={alert.link}
                    className="px-3 py-2 hover:bg-[#e8f5e9] border-b border-[#eee] last:border-b-0 flex items-start justify-between cursor-pointer block transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full mt-1 shrink-0",
                        alert.type === 'critical' ? "bg-red-500" : 
                        alert.type === 'high' ? "bg-orange-500" :
                        alert.type === 'medium' ? "bg-yellow-500" : "bg-blue-500"
                      )} />
                      <div>
                        <div className="text-[11px] text-[#333]">{alert.message}</div>
                        <div className="text-[10px] text-gray-400">{alert.time}</div>
                      </div>
                    </div>
                    <button 
                      onClick={(e) => handleDismissAlert(alert.id, e)}
                      className="text-gray-400 hover:text-red-600 text-xs ml-2 shrink-0"
                    >
                      ×
                    </button>
                  </Link>
                ))}
              </div>
            )}
            <div className="px-3 py-2 border-t border-[#ddd] bg-[#f5f5f5]">
              <Link to="/logs" className="text-[10px] text-[hsl(142,70%,35%)] hover:underline">
                View all logs →
              </Link>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-gray-600 mx-1" />

        {/* User */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-1.5 px-2 py-1 hover:bg-white/10 rounded transition-colors">
              <div className="w-5 h-5 rounded-full bg-[#4caf50] flex items-center justify-center">
                <User size={10} className="text-white" />
              </div>
              <span className="text-[11px] text-white">{user?.email?.split('@')[0] || 'admin'}</span>
              <ChevronDown size={10} className="text-gray-400" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <DropdownMenuItem asChild>
              <Link to="/system/admins" className="flex items-center gap-2 cursor-pointer text-[11px]">
                <User size={12} />
                <span>Profile</span>
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-[11px]">
              <Key size={12} />
              <span>Change Password</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              className="flex items-center gap-2 cursor-pointer text-[11px] text-red-600 focus:text-red-600"
            >
              <LogOut size={12} />
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
