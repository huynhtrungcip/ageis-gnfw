import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface NavSection {
  title: string;
  items: NavItem[];
}

interface NavItem {
  label: string;
  path: string;
  badge?: string;
}

const navigation: NavSection[] = [
  {
    title: 'OVERVIEW',
    items: [
      { label: 'Dashboard', path: '/' },
      { label: 'AI Security Center', path: '/ai-security', badge: 'AI' },
    ],
  },
  {
    title: 'NETWORK',
    items: [
      { label: 'Interfaces', path: '/interfaces' },
      { label: 'Routing', path: '/routing' },
      { label: 'DHCP Server', path: '/dhcp' },
      { label: 'DNS', path: '/dns' },
    ],
  },
  {
    title: 'FIREWALL',
    items: [
      { label: 'Rules', path: '/firewall/rules' },
      { label: 'NAT', path: '/firewall/nat' },
      { label: 'Aliases', path: '/firewall/aliases' },
      { label: 'Schedules', path: '/firewall/schedules' },
    ],
  },
  {
    title: 'VPN',
    items: [
      { label: 'IPsec', path: '/vpn/ipsec' },
      { label: 'OpenVPN', path: '/vpn/openvpn' },
      { label: 'WireGuard', path: '/vpn/wireguard' },
    ],
  },
  {
    title: 'SECURITY',
    items: [
      { label: 'IDS/IPS', path: '/security/ids' },
      { label: 'Threat Detection', path: '/security/threats' },
      { label: 'Web Filter', path: '/security/webfilter' },
    ],
  },
  {
    title: 'MONITORING',
    items: [
      { label: 'Traffic Graphs', path: '/monitoring/traffic' },
      { label: 'System Logs', path: '/monitoring/logs' },
      { label: 'Firewall Logs', path: '/monitoring/firewall-logs' },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'General Setup', path: '/system/general' },
      { label: 'Users', path: '/system/users' },
      { label: 'Certificates', path: '/system/certificates' },
      { label: 'Backup/Restore', path: '/system/backup' },
    ],
  },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside 
      className={cn(
        "fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border z-40 transition-all duration-300 flex flex-col",
        collapsed ? "w-16" : "w-60"
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-sidebar-border">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">NG</span>
            </div>
            <div>
              <span className="text-foreground font-semibold text-sm">NGFW</span>
              <span className="text-primary text-xs ml-1">Pro</span>
            </div>
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-sidebar-accent text-sidebar-foreground"
        >
          <span className="text-xs">{collapsed ? '»' : '«'}</span>
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        {navigation.map((section) => (
          <div key={section.title} className="mb-4">
            {!collapsed && (
              <div className="px-4 mb-2">
                <span className="text-[10px] font-semibold text-muted-foreground tracking-wider">
                  {section.title}
                </span>
              </div>
            )}
            <ul className="space-y-0.5 px-2">
              {section.items.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      className={cn(
                        "nav-item",
                        isActive && "active",
                        collapsed && "justify-center px-2"
                      )}
                      title={collapsed ? item.label : undefined}
                    >
                      <span className={cn(
                        "text-sm",
                        collapsed && "text-xs"
                      )}>
                        {collapsed ? item.label.charAt(0) : item.label}
                      </span>
                      {!collapsed && item.badge && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-primary/20 text-primary rounded">
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border">
        {!collapsed && (
          <div className="text-[10px] text-muted-foreground">
            <div>Version 1.0.0</div>
            <div>© 2024 NGFW Pro</div>
          </div>
        )}
      </div>
    </aside>
  );
}
