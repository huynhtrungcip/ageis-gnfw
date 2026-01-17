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
  Lightbulb
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
    priority: 'normal',
    items: [
      { label: 'Firewall Rules', path: '/firewall/rules', icon: <Shield size={14} /> },
      { label: 'NAT', path: '/firewall/nat', icon: <ArrowLeftRight size={14} /> },
      { label: 'Threat Prevention', path: '/security/ids', icon: <Lock size={14} /> },
    ],
  },
  {
    title: 'Network',
    priority: 'normal',
    items: [
      { label: 'Interfaces', path: '/interfaces', icon: <Network size={14} /> },
      { label: 'Routing', path: '/routing', icon: <Router size={14} /> },
      { label: 'VPN', path: '/vpn/ipsec', icon: <Globe size={14} /> },
    ],
  },
  {
    title: 'Insights',
    priority: 'low',
    items: [
      { label: 'Behavioral', path: '/insights/behavioral', icon: <Activity size={12} />, muted: true },
      { label: 'Recommendations', path: '/insights/recommendations', icon: <Lightbulb size={12} />, muted: true },
      { label: 'Trends', path: '/insights/trends', icon: <TrendingUp size={12} />, muted: true },
    ],
  },
  {
    title: 'System',
    priority: 'low',
    items: [
      { label: 'Logs', path: '/monitoring/logs', icon: <ScrollText size={12} />, muted: true },
      { label: 'Reports', path: '/reports', icon: <BarChart3 size={12} />, muted: true },
      { label: 'Settings', path: '/system/general', icon: <Settings size={12} />, muted: true },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-44 bg-sidebar border-r border-sidebar-border z-40 flex flex-col">
      {/* Logo */}
      <div className="h-10 flex items-center px-3 border-b border-sidebar-border">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-primary flex items-center justify-center">
            <Shield size={12} className="text-primary-foreground" />
          </div>
          <span className="text-foreground font-semibold text-xs">AEGIS NGFW</span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1 px-1">
        {navigation.map((section) => (
          <div key={section.title} className={cn(
            section.priority === 'low' && "opacity-70"
          )}>
            <div className={cn(
              "nav-section",
              section.priority === 'high' && "text-foreground font-medium"
            )}>{section.title}</div>
            <ul>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "nav-item",
                        isActive && "active",
                        item.muted && "text-muted-foreground text-[11px]"
                      )}
                    >
                      <span className={cn(
                        item.muted ? "opacity-40" : "opacity-60"
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
      <div className="px-2 py-2 border-t border-sidebar-border text-[10px] text-muted-foreground">
        v1.0.0 | Primary
      </div>
    </aside>
  );
}
