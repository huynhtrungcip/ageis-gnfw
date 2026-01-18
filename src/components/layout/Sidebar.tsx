import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Shield, 
  Network, 
  ScrollText, 
  Settings,
  AlertTriangle,
  Globe,
  Router,
  ArrowLeftRight,
  Lock,
  BarChart3,
  Activity,
  FileWarning,
  TrendingUp,
  Lightbulb,
  LineChart
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  muted?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
  priority?: 'high' | 'normal' | 'low';
}

const navigation: NavSection[] = [
  {
    title: 'Overview',
    priority: 'high',
    items: [
      { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={14} /> },
    ],
  },
  {
    title: 'Operations',
    priority: 'high',
    items: [
      { label: 'Threat Monitor', path: '/threats', icon: <AlertTriangle size={14} /> },
      { label: 'Incidents', path: '/incidents', icon: <FileWarning size={14} /> },
    ],
  },
  {
    title: 'Security Policy',
    priority: 'high',
    items: [
      { label: 'Firewall Rules', path: '/firewall/rules', icon: <Shield size={14} /> },
      { label: 'Aliases', path: '/firewall/aliases', icon: <Network size={14} /> },
      { label: 'Schedules', path: '/firewall/schedules', icon: <Settings size={14} /> },
      { label: 'NAT', path: '/firewall/nat', icon: <ArrowLeftRight size={14} /> },
      { label: 'Threat Prevention', path: '/security/ids', icon: <Lock size={14} /> },
    ],
  },
  {
    title: 'Network',
    priority: 'high',
    items: [
      { label: 'Interfaces', path: '/interfaces', icon: <Network size={14} /> },
      { label: 'Routing', path: '/routing', icon: <Router size={14} /> },
      { label: 'VPN', path: '/vpn/ipsec', icon: <Globe size={14} /> },
    ],
  },
  {
    title: 'Insights',
    priority: 'high',
    items: [
      { label: 'Behavioral', path: '/insights/behavioral', icon: <Activity size={14} /> },
      { label: 'Recommendations', path: '/insights/recommendations', icon: <Lightbulb size={14} /> },
      { label: 'Trends', path: '/insights/trends', icon: <TrendingUp size={14} /> },
    ],
  },
  {
    title: 'Monitoring',
    priority: 'high',
    items: [
      { label: 'Traffic Analysis', path: '/monitoring/traffic', icon: <LineChart size={14} /> },
      { label: 'Logs', path: '/monitoring/logs', icon: <ScrollText size={14} /> },
      { label: 'Reports', path: '/reports', icon: <BarChart3 size={14} /> },
    ],
  },
  {
    title: 'System',
    priority: 'high',
    items: [
      { label: 'Config Backup', path: '/system/backup', icon: <Settings size={14} /> },
      { label: 'Settings', path: '/system/general', icon: <Settings size={14} /> },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 bg-sidebar border-r border-sidebar-border z-40 flex flex-col">
      {/* Logo */}
      <div className="h-12 flex items-center px-4 border-b border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-primary rounded-sm flex items-center justify-center">
            <Shield size={16} className="text-primary-foreground" />
          </div>
          <div>
            <div className="text-foreground font-bold text-sm tracking-tight">AEGIS</div>
            <div className="text-[9px] text-muted-foreground uppercase tracking-wider">Next-Gen Firewall</div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2">
        {navigation.map((section) => (
          <div key={section.title}>
            <div className={cn(
              section.priority === 'high' ? "nav-section-highlight" : "nav-section",
              section.priority === 'low' && "opacity-60"
            )}>
              {section.title}
            </div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "nav-item",
                        isActive && "active",
                        item.muted && "text-muted-foreground"
                      )}
                    >
                      <span className={cn(
                        "transition-colors",
                        isActive ? "text-primary" : item.muted ? "opacity-50" : "opacity-70"
                      )}>{item.icon}</span>
                      <span>{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-sidebar-border">
        <div className="text-xs text-muted-foreground">v1.0.0</div>
        <div className="text-[10px] text-muted-foreground/60 mt-0.5">Primary Cluster</div>
      </div>
    </aside>
  );
}
