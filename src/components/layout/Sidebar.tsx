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
  LineChart,
  Users,
  Database,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Wifi,
  Server,
  Eye
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: React.ReactNode;
}

interface NavSection {
  title: string;
  icon: React.ReactNode;
  items: NavItem[];
  defaultOpen?: boolean;
}

const navigation: NavSection[] = [
  {
    title: 'Dashboard',
    icon: <LayoutDashboard size={14} />,
    defaultOpen: true,
    items: [
      { label: 'Status', path: '/', icon: <Eye size={13} /> },
    ],
  },
  {
    title: 'Network',
    icon: <Network size={14} />,
    defaultOpen: true,
    items: [
      { label: 'Interfaces', path: '/interfaces', icon: <Server size={13} /> },
      { label: 'Routing', path: '/routing', icon: <Router size={13} /> },
      { label: 'DHCP Server', path: '/dhcp', icon: <Database size={13} /> },
    ],
  },
  {
    title: 'Policy & Objects',
    icon: <Shield size={14} />,
    defaultOpen: true,
    items: [
      { label: 'Firewall Policy', path: '/firewall/rules', icon: <Shield size={13} /> },
      { label: 'Addresses', path: '/firewall/aliases', icon: <Network size={13} /> },
      { label: 'Schedules', path: '/firewall/schedules', icon: <Settings size={13} /> },
      { label: 'NAT', path: '/firewall/nat', icon: <ArrowLeftRight size={13} /> },
    ],
  },
  {
    title: 'Security Profiles',
    icon: <Lock size={14} />,
    items: [
      { label: 'Threat Prevention', path: '/security/ids', icon: <Lock size={13} /> },
      { label: 'Threat Monitor', path: '/threats', icon: <AlertTriangle size={13} /> },
      { label: 'Incidents', path: '/incidents', icon: <FileWarning size={13} /> },
    ],
  },
  {
    title: 'VPN',
    icon: <Globe size={14} />,
    items: [
      { label: 'IPsec Tunnels', path: '/vpn/ipsec', icon: <Globe size={13} /> },
    ],
  },
  {
    title: 'User & Device',
    icon: <Users size={14} />,
    items: [
      { label: 'User Management', path: '/system/users', icon: <Users size={13} /> },
    ],
  },
  {
    title: 'Log & Report',
    icon: <BarChart3 size={14} />,
    items: [
      { label: 'Traffic Analysis', path: '/monitoring/traffic', icon: <LineChart size={13} /> },
      { label: 'System Logs', path: '/monitoring/logs', icon: <ScrollText size={13} /> },
      { label: 'Reports', path: '/reports', icon: <BarChart3 size={13} /> },
    ],
  },
  {
    title: 'System',
    icon: <Settings size={14} />,
    items: [
      { label: 'Config Backup', path: '/system/backup', icon: <HardDrive size={13} /> },
      { label: 'Settings', path: '/system/general', icon: <Settings size={13} /> },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    navigation.filter(s => s.defaultOpen).map(s => s.title)
  );

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isSectionActive = (section: NavSection) => 
    section.items.some(item => location.pathname === item.path);

  return (
    <aside className="fixed left-0 top-0 h-screen w-56 bg-sidebar flex flex-col z-40">
      {/* Logo Header */}
      <div className="h-10 flex items-center px-3 bg-[hsl(220,20%,15%)] border-b border-sidebar-border">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-[hsl(var(--forti-green))] rounded flex items-center justify-center">
            <Shield size={14} className="text-white" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-white font-bold text-sm">FortiGate</span>
            <span className="text-sidebar-foreground text-xs">60E</span>
          </div>
        </div>
      </div>

      {/* Device Info */}
      <div className="px-3 py-2 border-b border-sidebar-border bg-[hsl(220,18%,16%)]">
        <div className="text-[10px] text-sidebar-muted">FW-PRIMARY</div>
        <div className="text-xs text-sidebar-foreground font-mono">FG60E4Q17001395</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1">
        {navigation.map((section) => {
          const isExpanded = expandedSections.includes(section.title);
          const hasActiveItem = isSectionActive(section);

          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium transition-colors",
                  hasActiveItem 
                    ? "text-[hsl(var(--sidebar-primary))]" 
                    : "text-sidebar-foreground hover:text-sidebar-accent-foreground"
                )}
              >
                <div className="flex items-center gap-2">
                  <span className={hasActiveItem ? "text-[hsl(var(--sidebar-primary))]" : "text-sidebar-muted"}>
                    {section.icon}
                  </span>
                  <span>{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={12} className="text-sidebar-muted" />
                ) : (
                  <ChevronRight size={12} className="text-sidebar-muted" />
                )}
              </button>

              {isExpanded && (
                <ul className="pb-1">
                  {section.items.map((item) => (
                    <li key={item.path}>
                      <Link
                        to={item.path}
                        className={cn(
                          "nav-item pl-8",
                          isActive(item.path) && "active"
                        )}
                      >
                        <span className={cn(
                          "transition-colors",
                          isActive(item.path) ? "text-white" : "text-sidebar-muted"
                        )}>
                          {item.icon}
                        </span>
                        <span className="text-[12px]">{item.label}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-sidebar-border bg-[hsl(220,18%,16%)]">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[10px] text-sidebar-muted">Firmware</div>
            <div className="text-[11px] text-sidebar-foreground">v7.4.3 build2573</div>
          </div>
          <div className="flex items-center gap-1">
            <span className="status-dot-lg status-healthy" />
            <span className="text-[10px] text-sidebar-foreground">Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
