import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  Bell, 
  User, 
  ChevronDown, 
  LogOut, 
  Key,
  ChevronRight,
  Home,
  Database,
  TestTube,
  Settings,
  Terminal,
  Maximize,
  Minimize,
  HelpCircle,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AegisLogo } from './AegisLogo';
import { toast } from 'sonner';
import { CLIConsole } from './CLIConsole';
import { HelpPanel } from './HelpPanel';

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

interface HeaderProps {
  sidebarCollapsed?: boolean;
}

const mockAlerts = [
  { id: 1, type: 'critical', message: 'High CPU usage detected', time: '2m ago', link: '/monitoring/traffic' },
  { id: 2, type: 'high', message: 'New firmware available', time: '1h ago', link: '/system/firmware' },
  { id: 3, type: 'medium', message: '3 blocked intrusion attempts', time: '15m ago', link: '/threats' },
  { id: 4, type: 'low', message: 'Backup completed successfully', time: '3h ago', link: '/system/full-backup' },
];

export function Header({ sidebarCollapsed = false }: HeaderProps) {
  const location = useLocation();
  const { demoMode, setDemoMode } = useDemoMode();
  const [cliOpen, setCliOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const navigate = useNavigate();
  const [alerts, setAlerts] = useState(() => {
    if (!demoMode) return [];
    const dismissed = JSON.parse(sessionStorage.getItem('aegis_dismissed_alerts') || '[]') as number[];
    return mockAlerts.filter(a => !dismissed.includes(a.id));
  });

  const { signOut, user } = useAuth();

  // Fullscreen
  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        toast.error('Fullscreen not supported in this browser');
      });
    } else {
      document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === '`') {
        e.preventDefault();
        setCliOpen(prev => !prev);
      }
      if (e.ctrlKey && e.key === 'h') {
        e.preventDefault();
        setHelpOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    await signOut();
    toast.success('Logged out successfully');
  };

  const dismissAlertById = (id: number) => {
    const dismissed = JSON.parse(sessionStorage.getItem('aegis_dismissed_alerts') || '[]') as number[];
    if (!dismissed.includes(id)) {
      sessionStorage.setItem('aegis_dismissed_alerts', JSON.stringify([...dismissed, id]));
    }
    setAlerts(prev => prev.filter(a => a.id !== id));
  };

  const handleDismissAlert = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    dismissAlertById(id);
  };

  const handleAlertClick = (alert: { id: number; link: string }) => {
    dismissAlertById(alert.id);
    navigate(alert.link);
  };

  const handleClearAllAlerts = () => {
    const allIds = alerts.map(a => a.id);
    sessionStorage.setItem('aegis_dismissed_alerts', JSON.stringify(allIds));
    setAlerts([]);
  };

  const handleToggleDemoMode = () => {
    const newMode = !demoMode;
    setDemoMode(newMode);
    toast.success(newMode ? 'Switched to Mock Data mode' : 'Switched to Live Data mode', {
      description: newMode 
        ? 'Using demo data for all pages' 
        : 'Using real system data (requires Aegis Agent)',
    });
  };

  // Breadcrumbs
  const getBreadcrumbs = () => {
    const path = location.pathname;
    if (path === '/') return [{ label: 'Dashboard', path: '/' }];

    const segments = path.split('/').filter(Boolean);
    const breadcrumbs: { label: string; path: string }[] = [];

    if (segments.length > 0) {
      const section = sectionMap[segments[0]];
      if (section) breadcrumbs.push({ label: section, path: `/${segments[0]}` });
    }

    const pageLabel = pathToLabel[path];
    if (pageLabel) breadcrumbs.push({ label: pageLabel, path });

    return breadcrumbs.length > 0 ? breadcrumbs : [{ label: 'Dashboard', path: '/' }];
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <>
      <header className="h-9 flex items-center justify-between px-3 sticky top-0 z-30" style={{ background: 'linear-gradient(180deg, #2d3e50 0%, #1e2d3d 100%)' }}>
        {/* Left: Logo (when sidebar collapsed) + Breadcrumb Navigation */}
        <div className="flex items-center gap-2">
          {sidebarCollapsed && (
            <>
              <AegisLogo size="sm" />
              <div className="w-px h-4 bg-gray-600" />
            </>
          )}
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
                <span className="text-[10px] text-gray-400">AEGIS-NGFW-500</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">Hostname: AEGIS-NGFW-500</p>
              <p className="text-muted-foreground">Tên định danh của thiết bị firewall đang được quản lý</p>
            </TooltipContent>
          </Tooltip>

          {/* Data Mode */}
          <div className="w-px h-4 bg-gray-600 ml-1" />
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleToggleDemoMode}
                className={cn(
                  "flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-medium transition-colors",
                  demoMode 
                    ? "bg-amber-500/20 text-amber-400 hover:bg-amber-500/30" 
                    : "bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30"
                )}
              >
                {demoMode ? <TestTube size={10} /> : <Database size={10} />}
                {demoMode ? 'MOCK' : 'LIVE'}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              <p className="font-medium">{demoMode ? 'Mock Data Mode' : 'Live Data Mode'}</p>
              <p className="text-muted-foreground">
                {demoMode 
                  ? 'Đang sử dụng dữ liệu demo. Click để chuyển sang dữ liệu thật.' 
                  : 'Đang sử dụng dữ liệu thực. Click để chuyển sang demo.'}
              </p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Right: Tools + Alerts + User */}
        <div className="flex items-center gap-1">
          {/* CLI Console */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setCliOpen(true)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <Terminal size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              CLI Console <kbd className="ml-1 px-1 py-0.5 bg-muted border rounded text-[9px] font-mono">Ctrl+`</kbd>
            </TooltipContent>
          </Tooltip>

          {/* Fullscreen */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={toggleFullscreen}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'} <kbd className="ml-1 px-1 py-0.5 bg-muted border rounded text-[9px] font-mono">F11</kbd>
            </TooltipContent>
          </Tooltip>

          {/* Help */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => setHelpOpen(true)}
                className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded transition-colors"
              >
                <HelpCircle size={14} />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              Help <kbd className="ml-1 px-1 py-0.5 bg-muted border rounded text-[9px] font-mono">Ctrl+H</kbd>
            </TooltipContent>
          </Tooltip>

          <div className="w-px h-4 bg-gray-600 mx-1" />

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
              <div className="px-3 py-2 border-b border-[#ddd] bg-[#f5f5f5] flex items-center justify-between">
                <span className="text-xs font-semibold text-[#333]">Alert Messages</span>
                {alerts.length > 0 && (
                  <button 
                    onClick={handleClearAllAlerts}
                    className="text-[10px] text-[hsl(142,70%,35%)] hover:underline"
                  >
                    Clear all
                  </button>
                )}
              </div>
              {alerts.length === 0 ? (
                <div className="px-3 py-4 text-center text-xs text-gray-500">
                  No alerts
                </div>
              ) : (
                <div className="max-h-64 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div 
                      key={alert.id}
                      onClick={() => handleAlertClick(alert)}
                      className="px-3 py-2 hover:bg-[#e8f5e9] border-b border-[#eee] last:border-b-0 flex items-start justify-between cursor-pointer transition-colors"
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
                    </div>
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
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel className="text-[10px] text-muted-foreground font-normal">
                {user?.email || 'admin@aegis.local'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/system/admins" className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <User size={12} />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/system/general" className="flex items-center gap-2 cursor-pointer text-[11px]">
                  <Settings size={12} />
                  <span>System Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-[11px]">
                <Key size={12} />
                <span>Change Password</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={handleToggleDemoMode}
                className="flex items-center gap-2 cursor-pointer text-[11px]"
              >
                {demoMode ? <Database size={12} /> : <TestTube size={12} />}
                <div className="flex flex-col">
                  <span>{demoMode ? 'Switch to Live Data' : 'Switch to Mock Data'}</span>
                  <span className="text-[9px] text-muted-foreground">
                    {demoMode ? 'Use real system metrics' : 'Use demo data for testing'}
                  </span>
                </div>
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

      {/* Dialogs */}
      <CLIConsole open={cliOpen} onOpenChange={setCliOpen} />
      <HelpPanel open={helpOpen} onOpenChange={setHelpOpen} />
    </>
  );
}
