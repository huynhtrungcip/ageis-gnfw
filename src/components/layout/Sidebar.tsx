import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Shield, 
  Network, 
  ScrollText, 
  Settings,
  AlertTriangle,
  FileText,
  Globe,
  Router,
  ArrowLeftRight,
  Lock,
  Activity,
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
      { label: 'Dashboard', path: '/', icon: <LayoutDashboard size={16} /> },
      { label: 'Threat Monitor', path: '/threats', icon: <AlertTriangle size={16} /> },
    ],
  },
  {
    title: 'Security',
    items: [
      { label: 'Policies', path: '/firewall/rules', icon: <Shield size={16} /> },
      { label: 'Threat Prevention', path: '/security/ids', icon: <Lock size={16} /> },
      { label: 'AI Insights', path: '/ai-security', icon: <Cpu size={16} /> },
    ],
  },
  {
    title: 'Network',
    items: [
      { label: 'Interfaces', path: '/interfaces', icon: <Network size={16} /> },
      { label: 'Routing', path: '/routing', icon: <Router size={16} /> },
      { label: 'NAT', path: '/firewall/nat', icon: <ArrowLeftRight size={16} /> },
      { label: 'VPN', path: '/vpn/ipsec', icon: <Globe size={16} /> },
    ],
  },
  {
    title: 'System',
    items: [
      { label: 'Logs', path: '/monitoring/logs', icon: <ScrollText size={16} /> },
      { label: 'Reports', path: '/reports', icon: <BarChart3 size={16} /> },
      { label: 'Settings', path: '/system/general', icon: <Settings size={16} /> },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-screen w-52 bg-sidebar border-r border-sidebar-border z-40 flex flex-col">
      {/* Logo */}
      <div className="h-12 flex items-center px-4 border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
            <Shield size={14} className="text-primary-foreground" />
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-foreground font-semibold text-sm">Aegis</span>
            <span className="text-muted-foreground text-xs">NGFW</span>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-2 px-2">
        {navigation.map((section) => (
          <div key={section.title}>
            <div className="nav-section">{section.title}</div>
            <ul className="space-y-0.5">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn("nav-item", isActive && "active")}
                    >
                      <span className="text-current opacity-70">{item.icon}</span>
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
      <div className="p-3 border-t border-sidebar-border">
        <div className="text-[10px] text-muted-foreground">
          <div>Aegis NGFW v1.0</div>
          <div className="opacity-60">Enterprise AI-Assisted Firewall</div>
        </div>
      </div>
    </aside>
  );
}
