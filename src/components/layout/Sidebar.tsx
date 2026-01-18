import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Shield, 
  Network, 
  Settings,
  Globe,
  Router,
  Lock,
  BarChart3,
  Users,
  Database,
  ChevronDown,
  ChevronRight,
  Server,
  Star,
  Search,
  Layers,
  Monitor,
  ShieldAlert,
  FileText,
  Wifi,
  LucideIcon
} from 'lucide-react';
import { useState } from 'react';

interface NavItem {
  label: string;
  path: string;
  icon?: LucideIcon;
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
      { label: 'Network Topology', path: '/topology', starred: true },
      { label: 'Packet Flow', path: '/packet-flow' },
      { label: 'Fabric Connectors', path: '/connectors' },
    ],
  },
  {
    title: 'FortiView',
    icon: Monitor,
    defaultOpen: false,
    items: [
      { label: 'Traffic', path: '/monitoring/traffic' },
      { label: 'Threats', path: '/threats' },
    ],
  },
  {
    title: 'Network',
    icon: Network,
    defaultOpen: false,
    items: [
      { label: 'Interfaces', path: '/interfaces', starred: true },
      { label: 'DNS', path: '/dns' },
      { label: 'Packet Capture', path: '/monitoring/traffic' },
      { label: 'SD-WAN', path: '/sdwan', starred: true },
      { label: 'Static Routes', path: '/routing' },
      { label: 'Policy Routes', path: '/routing' },
      { label: 'RIP', path: '/routing' },
      { label: 'OSPF', path: '/routing' },
      { label: 'BGP', path: '/routing' },
      { label: 'Multicast', path: '/routing' },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    defaultOpen: false,
    items: [
      { label: 'Feature Visibility', path: '/system/feature-visibility' },
      { label: 'Administrators', path: '/system/admins' },
      { label: 'Admin Profiles', path: '/system/admins' },
      { label: 'Settings', path: '/system/general' },
      { label: 'High Availability', path: '/system/ha', starred: true },
      { label: 'Certificates', path: '/system/certificates' },
      { label: 'Firmware', path: '/system/firmware', starred: true },
    ],
  },
  {
    title: 'Policy & Objects',
    icon: Shield,
    defaultOpen: true,
    items: [
      { label: 'IPv4 Policy', path: '/firewall/rules', starred: true },
      { label: 'Addresses', path: '/firewall/aliases' },
      { label: 'Wildcard FQDN Addresses', path: '/firewall/wildcard-fqdn' },
      { label: 'Internet Service Database', path: '/firewall/internet-service' },
      { label: 'Services', path: '/firewall/services' },
      { label: 'Schedules', path: '/firewall/schedules' },
      { label: 'Virtual IPs', path: '/firewall/virtual-ips' },
      { label: 'IP Pools', path: '/firewall/ip-pools' },
      { label: 'Traffic Shapers', path: '/firewall/traffic-shapers' },
      { label: 'Traffic Shaping Policy', path: '/firewall/traffic-shaping-policy' },
    ],
  },
  {
    title: 'Security Profiles',
    icon: ShieldAlert,
    defaultOpen: false,
    items: [
      { label: 'AntiVirus', path: '/security/antivirus' },
      { label: 'Web Filter', path: '/security/webfilter' },
      { label: 'DNS Filter', path: '/security/dnsfilter' },
      { label: 'Application Control', path: '/security/appcontrol' },
      { label: 'IPS', path: '/security/ids', starred: true },
      { label: 'SSL Inspection', path: '/security/ssl' },
    ],
  },
  {
    title: 'VPN',
    icon: Globe,
    defaultOpen: false,
    items: [
      { label: 'IPsec Tunnels', path: '/vpn/ipsec' },
      { label: 'IPsec Wizard', path: '/vpn/ipsec' },
      { label: 'SSL-VPN Settings', path: '/vpn/ssl' },
      { label: 'SSL-VPN Portals', path: '/vpn/ssl' },
    ],
  },
  {
    title: 'User & Device',
    icon: Users,
    defaultOpen: false,
    items: [
      { label: 'User Definition', path: '/system/users' },
      { label: 'User Groups', path: '/users/groups' },
      { label: 'LDAP Servers', path: '/users/ldap' },
      { label: 'RADIUS Servers', path: '/users/ldap' },
    ],
  },
  {
    title: 'WiFi & Switch Controller',
    icon: Wifi,
    defaultOpen: false,
    items: [
      { label: 'Managed FortiAPs', path: '/wifi', starred: true },
      { label: 'Managed FortiSwitches', path: '/interfaces' },
    ],
  },
  {
    title: 'Log & Report',
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { label: 'Log Viewer', path: '/logs', starred: true },
      { label: 'Forward Traffic', path: '/monitoring/traffic' },
      { label: 'Local Traffic', path: '/monitoring/traffic' },
      { label: 'System Events', path: '/monitoring/logs' },
      { label: 'Report', path: '/reports' },
    ],
  },
  {
    title: 'Monitor',
    icon: Monitor,
    defaultOpen: false,
    items: [
      { label: 'DHCP Monitor', path: '/dhcp' },
      { label: 'Routing Monitor', path: '/routing' },
      { label: 'IPsec Monitor', path: '/vpn/ipsec' },
      { label: 'SSL-VPN Monitor', path: '/vpn/ssl' },
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
    section.directPath === location.pathname || 
    section.items.some(item => location.pathname === item.path);

  return (
    <aside className="fixed left-0 top-0 h-screen w-[200px] flex flex-col z-40" style={{ background: '#1e2d3d' }}>
      {/* Logo Header */}
      <div className="h-9 flex items-center gap-2 px-3" style={{ background: 'linear-gradient(180deg, #2d3e50 0%, #1e2d3d 100%)' }}>
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 bg-[#4caf50] rounded flex items-center justify-center">
            <Shield size={12} className="text-white" />
          </div>
          <span className="text-white text-xs font-bold">Aegis NGFW</span>
        </div>
        <div className="flex-1" />
        <span className="text-[10px] text-gray-400 px-2 py-0.5 bg-white/10 rounded">v1.0</span>
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
                  "flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors border-l-2",
                  isActive(section.directPath)
                    ? "bg-[#4caf50] text-white border-[#4caf50]"
                    : "text-gray-300 hover:bg-[#2a3f54] hover:text-white border-transparent"
                )}
              >
                <SectionIcon size={14} />
                <span>{section.title}</span>
              </Link>
            );
          }

          return (
            <div key={section.title}>
              <button
                onClick={() => toggleSection(section.title)}
                className={cn(
                  "w-full flex items-center justify-between px-3 py-1.5 text-[11px] transition-colors border-l-2",
                  hasActiveItem 
                    ? "text-[#4caf50] border-[#4caf50]" 
                    : "text-gray-300 hover:text-white border-transparent"
                )}
              >
                <div className="flex items-center gap-2">
                  <SectionIcon size={14} />
                  <span>{section.title}</span>
                </div>
                {isExpanded ? (
                  <ChevronDown size={10} className="text-gray-500" />
                ) : (
                  <ChevronRight size={10} className="text-gray-500" />
                )}
              </button>

              {isExpanded && section.items.length > 0 && (
                <ul className="bg-[#16232f]">
                  {section.items.map((item) => (
                    <li key={item.path + item.label}>
                      <Link
                        to={item.path}
                        className={cn(
                          "flex items-center gap-2 pl-8 pr-3 py-1 text-[11px] transition-colors",
                          isActive(item.path) 
                            ? "bg-[#4caf50] text-white" 
                            : "text-gray-400 hover:text-white hover:bg-[#1e2d3d]"
                        )}
                      >
                        <span>{item.label}</span>
                        {item.starred && (
                          <Star size={9} className="ml-auto text-yellow-500 fill-yellow-500" />
                        )}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer Search */}
      <div className="px-2 py-2 border-t border-[#16232f]">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-[#16232f] rounded text-gray-400">
          <Search size={12} />
          <input 
            type="text"
            placeholder="Search"
            className="bg-transparent text-[11px] outline-none flex-1 text-gray-300 placeholder-gray-500"
          />
        </div>
      </div>
    </aside>
  );
}
