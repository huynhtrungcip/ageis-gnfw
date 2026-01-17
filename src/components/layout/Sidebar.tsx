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
  Cpu
} from 'lucide-react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navigation: NavSection[] = [
  {
    title: 'Overview',
    items: [
      { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={14} /> },
      { label: 'Threats', path: '/threats', icon: <AlertTriangle size={14} /> },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Policies', path: '/firewall/rules', icon: <Shield size={14} /> },
      { label: 'IDS/IPS', path: '/security/ids', icon: <Lock size={14} /> },
      { label: 'Insights', path: '/ai-security', icon: <Cpu size={14} /> },
    ],
  },
  {
    title: 'Network',
    items: [
      { label: 'Interfaces', path: '/interfaces', icon: <Network size={14} /> },
      { label: 'Routing', path: '/routing', icon: <Router size={14} /> },
      { label: 'NAT', path: '/firewall/nat', icon: <ArrowLeftRight size={14} /> },
      { label: 'VPN', path: '/vpn/ipsec', icon: <Globe size={14} /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Logs', path: '/monitoring/logs', icon: <ScrollText size={14} /> },
      { label: 'Reports', path: '/reports', icon: <BarChart3 size={14} /> },
      { label: 'Settings', path: '/system/general', icon: <Settings size={14} /> },
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
          <div key={section.title}>
            <div className="nav-section">{section.title}</div>
            <ul>
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn("nav-item", isActive && "active")}
                    >
                      <span className="opacity-60">{item.icon}</span>
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
