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
  FileWarning,
  LineChart,
  Users,
  Database,
  HardDrive,
  ChevronDown,
  ChevronRight,
  Server,
  Star,
  Search,
  Zap,
  Layers,
  Monitor,
  ShieldAlert,
  FileText,
  Bookmark,
  LucideIcon
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  starred?: boolean;
}

interface NavSection {
  title: string;
  icon: LucideIcon;
  items: NavItem[];
  defaultOpen?: boolean;
  directPath?: string;
}

const navigation: NavSection[] = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    directPath: '/',
    defaultOpen: false,
    items: [],
  },
  {
    title: 'Security Fabric',
    icon: Layers,
    defaultOpen: false,
    items: [
      { label: 'Physical Topology', path: '/topology', icon: Network },
      { label: 'Fabric Connectors', path: '/connectors', icon: Zap },
    ],
  },
  {
    title: 'Network',
    icon: Network,
    defaultOpen: true,
    items: [
      { label: 'Interfaces', path: '/interfaces', icon: Server, starred: true },
      { label: 'DNS', path: '/dns', icon: Globe },
      { label: 'SD-WAN', path: '/sdwan', icon: Globe },
      { label: 'Static Routes', path: '/routing', icon: Router },
      { label: 'DHCP Server', path: '/dhcp', icon: Database },
    ],
  },
  {
    title: 'Policy & Objects',
    icon: Shield,
    defaultOpen: true,
    items: [
      { label: 'Firewall Policy', path: '/firewall/rules', icon: Shield, starred: true },
      { label: 'Addresses', path: '/firewall/aliases', icon: Network },
      { label: 'Services', path: '/firewall/services', icon: Server },
      { label: 'Schedules', path: '/firewall/schedules', icon: Settings },
      { label: 'Virtual IPs', path: '/firewall/nat', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Security Profiles',
    icon: ShieldAlert,
    defaultOpen: false,
    items: [
      { label: 'AntiVirus', path: '/security/antivirus', icon: Shield },
      { label: 'Web Filter', path: '/security/webfilter', icon: Globe },
      { label: 'IPS', path: '/security/ids', icon: Lock, starred: true },
      { label: 'Application Control', path: '/security/appcontrol', icon: Layers },
    ],
  },
  {
    title: 'VPN',
    icon: Globe,
    defaultOpen: false,
    items: [
      { label: 'IPsec Tunnels', path: '/vpn/ipsec', icon: Globe },
      { label: 'SSL-VPN', path: '/vpn/ssl', icon: Lock },
    ],
  },
  {
    title: 'User & Authentication',
    icon: Users,
    defaultOpen: false,
    items: [
      { label: 'User Definition', path: '/system/users', icon: Users },
      { label: 'User Groups', path: '/users/groups', icon: Users },
      { label: 'LDAP Servers', path: '/users/ldap', icon: Server },
    ],
  },
  {
    title: 'Log & Report',
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { label: 'Forward Traffic', path: '/monitoring/traffic', icon: LineChart },
      { label: 'System Events', path: '/monitoring/logs', icon: ScrollText },
      { label: 'Security Events', path: '/threats', icon: AlertTriangle, starred: true },
      { label: 'Reports', path: '/reports', icon: BarChart3 },
    ],
  },
  {
    title: 'Monitor',
    icon: Monitor,
    defaultOpen: false,
    items: [
      { label: 'Threat Monitor', path: '/incidents', icon: FileWarning },
      { label: 'IPsec Monitor', path: '/monitor/ipsec', icon: Globe },
      { label: 'Routing Monitor', path: '/monitor/routing', icon: Router },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    defaultOpen: false,
    items: [
      { label: 'Administrators', path: '/system/admins', icon: Users },
      { label: 'Firmware', path: '/system/firmware', icon: HardDrive },
      { label: 'Configuration', path: '/system/backup', icon: FileText },
      { label: 'Settings', path: '/system/general', icon: Settings },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [expandedSections, setExpandedSections] = useState<string[]>(
    navigation.filter(s => s.defaultOpen).map(s => s.title)
  );
  const [searchQuery, setSearchQuery] = useState('');

  const toggleSection = (title: string) => {
    setExpandedSections(prev => 
      prev.includes(title) 
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const isActive = (path: string) => location.pathname === path;
  const isSectionActive = (section: NavSection) => 
    section.directPath === location.pathname || 
    section.items.some(item => location.pathname === item.path);

  // Get starred items for favorites bar
  const starredItems = navigation.flatMap(s => s.items.filter(i => i.starred));

  return (
    <aside className="fixed left-0 top-0 h-screen w-[220px] bg-[#2c3e50] flex flex-col z-40">
      {/* Logo Header - Dark top bar */}
      <div className="h-11 flex items-center justify-between px-3 bg-[#1a252f] border-b border-[#1a252f]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[#4caf50] rounded flex items-center justify-center">
            <Shield size={15} className="text-white" />
          </div>
          <div>
            <div className="text-white font-bold text-[13px] leading-tight">Aegis NGFW</div>
            <div className="text-[9px] text-gray-400 font-mono">AEGIS-FW-001</div>
          </div>
        </div>
        <button className="text-gray-400 hover:text-white p-1">
          <Search size={14} />
        </button>
      </div>

      {/* Favorites Bar */}
      <div className="px-2 py-1.5 bg-[#34495e] border-b border-[#2c3e50] flex items-center gap-1">
        <Bookmark size={11} className="text-yellow-500 mr-1" />
        {starredItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "p-1.5 rounded text-gray-300 hover:bg-[#4caf50] hover:text-white transition-colors",
                isActive(item.path) && "bg-[#4caf50] text-white"
              )}
              title={item.label}
            >
              <IconComponent size={13} />
            </Link>
          );
        })}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1">
        {navigation.map((section) => {
          const isExpanded = expandedSections.includes(section.title);
          const hasActiveItem = isSectionActive(section);
          const SectionIcon = section.icon;

          // Direct link sections (like Dashboard)
          if (section.directPath) {
            return (
              <Link
                key={section.title}
                to={section.directPath}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 text-[12px] font-medium transition-colors mx-1 rounded",
                  isActive(section.directPath)
                    ? "bg-[#4caf50] text-white"
                    : "text-gray-300 hover:bg-[#34495e] hover:text-white"
                )}
              >
                <SectionIcon size={14} className={isActive(section.directPath) ? "text-white" : "text-gray-400"} />
                <span>{section.title}</span>
              </Link>
            );
          }

          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-2 text-[12px] font-medium transition-colors",
                  hasActiveItem 
                    ? "text-[#4caf50]" 
                    : "text-gray-300 hover:text-white"
                )}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon size={14} className={hasActiveItem ? "text-[#4caf50]" : "text-gray-400"} />
                  <span>{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={12} className="text-gray-500" />
                ) : (
                  <ChevronRight size={12} className="text-gray-500" />
                )}
              </button>

              {isExpanded && section.items.length > 0 && (
                <ul className="pb-1">
                  {section.items.map((item) => {
                    const ItemIcon = item.icon;
                    return (
                      <li key={item.path}>
                        <Link
                          to={item.path}
                          className={cn(
                            "flex items-center gap-2 pl-9 pr-3 py-1.5 text-[11px] transition-colors",
                            isActive(item.path) 
                              ? "bg-[#4caf50] text-white mx-1 rounded" 
                              : "text-gray-400 hover:text-white hover:bg-[#34495e] mx-1 rounded"
                          )}
                        >
                          <ItemIcon size={12} className={isActive(item.path) ? "text-white" : "text-gray-500"} />
                          <span>{item.label}</span>
                          {item.starred && (
                            <Star size={9} className="ml-auto text-yellow-500 fill-yellow-500" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Status */}
      <div className="px-3 py-2 bg-[#1a252f] border-t border-[#1a252f]">
        <div className="flex items-center justify-between text-[10px]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4caf50]" />
            <span className="text-gray-400">System: Online</span>
          </div>
          <span className="text-gray-500">v1.0.0</span>
        </div>
        <div className="flex items-center justify-between text-[9px] text-gray-500 mt-1">
          <span>Uptime: 45d 12h 30m</span>
          <span>CPU: 23%</span>
        </div>
      </div>
    </aside>
  );
}
