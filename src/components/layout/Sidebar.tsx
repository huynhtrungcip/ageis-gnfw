import { Link, useLocation } from 'react-router-dom';
import { AegisLogo } from '@/components/layout/AegisLogo';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, 
  Shield, 
  Network, 
  Settings,
  Globe,
  BarChart3,
  Users,
  ChevronDown,
  ChevronRight,
  Star,
  Search,
  Layers,
  Monitor,
  ShieldAlert,
  ChevronsLeft,
  ChevronsRight,
  LucideIcon
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

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
    ],
  },
  {
    title: 'AegisView',
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
      { label: 'Interface Assignment', path: '/interfaces/assignment' },
      { label: 'DNS', path: '/dns' },
      { label: 'Packet Capture', path: '/packet-capture' },
      { label: 'Static Routes', path: '/routing/static' },
      { label: 'Policy Routes', path: '/routing/policy' },
      { label: 'RIP', path: '/routing/rip' },
      { label: 'OSPF', path: '/routing/ospf' },
      { label: 'BGP', path: '/routing/bgp' },
      { label: 'Multicast', path: '/routing/multicast' },
    ],
  },
  {
    title: 'System',
    icon: Settings,
    defaultOpen: false,
    items: [
      { label: 'Feature Visibility', path: '/system/feature-visibility' },
      { label: 'Administrators', path: '/system/admins' },
      { label: 'Admin Profiles', path: '/system/admin-profiles' },
      { label: 'Settings', path: '/system/general' },
      { label: 'High Availability', path: '/system/ha', starred: true },
      { label: 'Certificates', path: '/system/certificates' },
      { label: 'Firmware', path: '/system/firmware', starred: true },
      { label: 'Config Backup', path: '/system/backup' },
      { label: 'Full System Backup', path: '/system/full-backup', starred: true },
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
    ],
  },
  {
    title: 'User & Device',
    icon: Users,
    defaultOpen: false,
    items: [
      { label: 'User Definition', path: '/system/users' },
      { label: 'User Groups', path: '/users/groups' },
    ],
  },
  {
    title: 'Log & Report',
    icon: BarChart3,
    defaultOpen: false,
    items: [
      { label: 'Log Viewer', path: '/logs', starred: true },
      { label: 'Reports', path: '/reports' },
    ],
  },
  {
    title: 'Monitor',
    icon: Monitor,
    defaultOpen: false,
    items: [
      { label: 'DHCP Monitor', path: '/dhcp' },
      { label: 'Routing Monitor', path: '/monitor/routing' },
      { label: 'IPsec Monitor', path: '/monitor/ipsec' },
    ],
  },
];

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation();
  
  // Initialize with defaultOpen sections
  const getInitialExpanded = () => {
    const defaultExpanded = navigation.filter(s => s.defaultOpen).map(s => s.title);
    // Also expand section containing current route
    navigation.forEach(section => {
      if (section.items.some(item => location.pathname === item.path || location.pathname.startsWith(item.path.split('/').slice(0, 2).join('/')))) {
        if (!defaultExpanded.includes(section.title)) {
          defaultExpanded.push(section.title);
        }
      }
    });
    return defaultExpanded;
  };

  const [expandedSections, setExpandedSections] = useState<string[]>(getInitialExpanded);

  // Auto-expand section when navigating to a route inside it
  useEffect(() => {
    navigation.forEach(section => {
      const hasActiveItem = section.items.some(item => location.pathname === item.path);
      if (hasActiveItem && !expandedSections.includes(section.title)) {
        setExpandedSections(prev => [...prev, section.title]);
      }
    });
  }, [location.pathname]);

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
    <aside className={cn(
      "fixed left-0 top-0 h-screen flex flex-col z-40 transition-all duration-300",
      collapsed ? "w-[48px]" : "w-[200px]"
    )} style={{ background: '#1e2d3d' }}>
      {/* Logo Header */}
      <div className="h-10 flex items-center justify-center border-b border-[#16232f]" style={{ background: 'linear-gradient(135deg, #0d4f3c 0%, #1e2d3d 100%)' }}>
        <AegisLogo size="sm" collapsed={collapsed} />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-1">
        {navigation.map((section) => {
          const isExpanded = expandedSections.includes(section.title);
          const hasActiveItem = isSectionActive(section);
          const SectionIcon = section.icon;

          // Direct link sections (like Dashboard)
          if (section.directPath) {
            const linkContent = (
              <Link
                key={section.title}
                to={section.directPath}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors border-l-2",
                  collapsed && "justify-center px-0",
                  isActive(section.directPath)
                    ? "bg-[#4caf50] text-white border-[#4caf50]"
                    : "text-gray-300 hover:bg-[#2a3f54] hover:text-white border-transparent"
                )}
              >
                <SectionIcon size={14} className="shrink-0" />
                {!collapsed && <span>{section.title}</span>}
              </Link>
            );

            if (collapsed) {
              return (
                <Tooltip key={section.title}>
                  <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{section.title}</TooltipContent>
                </Tooltip>
              );
            }
            return linkContent;
          }

          const sectionButton = (
            <button
              onClick={() => collapsed ? onToggle() : toggleSection(section.title)}
              className={cn(
                "w-full flex items-center justify-between px-3 py-1.5 text-[11px] transition-colors border-l-2",
                collapsed && "justify-center px-0",
                hasActiveItem 
                  ? "text-[#4caf50] border-[#4caf50]" 
                  : "text-gray-300 hover:text-white border-transparent"
              )}
            >
              <div className="flex items-center gap-2">
                <SectionIcon size={14} className="shrink-0" />
                {!collapsed && <span>{section.title}</span>}
              </div>
              {!collapsed && (
                isExpanded ? (
                  <ChevronDown size={10} className="text-gray-500" />
                ) : (
                  <ChevronRight size={10} className="text-gray-500" />
                )
              )}
            </button>
          );

          return (
            <div key={section.title}>
              {collapsed ? (
                <Tooltip>
                  <TooltipTrigger asChild>{sectionButton}</TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">{section.title}</TooltipContent>
                </Tooltip>
              ) : (
                sectionButton
              )}

              {!collapsed && section.items.length > 0 && (
                <ul 
                  className={cn(
                    "bg-[#16232f] overflow-hidden transition-all duration-300 ease-out",
                    isExpanded 
                      ? "max-h-[500px] opacity-100" 
                      : "max-h-0 opacity-0"
                  )}
                >
                  {section.items.map((item, index) => (
                    <li 
                      key={item.path + item.label}
                      className={cn(
                        "transition-all duration-200",
                        isExpanded ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0"
                      )}
                      style={{ transitionDelay: isExpanded ? `${index * 30}ms` : '0ms' }}
                    >
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

      {/* Footer: Toggle button */}
      <div className="px-2 py-2 border-t border-[#16232f]">
        {!collapsed && (
          <div className="flex items-center gap-2 px-2 py-1.5 bg-[#16232f] rounded text-gray-400 mb-2">
            <Search size={12} />
            <input 
              type="text"
              placeholder="Search"
              className="bg-transparent text-[11px] outline-none flex-1 text-gray-300 placeholder-gray-500"
            />
          </div>
        )}
        <button
          onClick={onToggle}
          className={cn(
            "w-full flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:text-white hover:bg-[#2a3f54] rounded transition-colors text-[11px]",
            collapsed && "justify-center"
          )}
        >
          {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
          {!collapsed && <span>Collapse</span>}
        </button>
      </div>
    </aside>
  );
}
