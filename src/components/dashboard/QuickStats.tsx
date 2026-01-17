import { mockFirewallRules, mockNATRules, mockVPNTunnels, mockDHCPLeases, mockAIAnalysis } from '@/data/mockData';
import { cn } from '@/lib/utils';

export function QuickStats() {
  const stats = [
    {
      label: 'Firewall Rules',
      value: mockFirewallRules.length,
      subtext: `${mockFirewallRules.filter(r => r.enabled).length} active`,
      trend: 'neutral',
    },
    {
      label: 'NAT Rules',
      value: mockNATRules.length,
      subtext: `${mockNATRules.filter(r => r.enabled).length} active`,
      trend: 'neutral',
    },
    {
      label: 'VPN Tunnels',
      value: mockVPNTunnels.filter(v => v.status === 'connected').length,
      subtext: `of ${mockVPNTunnels.length} tunnels`,
      trend: 'up',
    },
    {
      label: 'DHCP Leases',
      value: mockDHCPLeases.filter(l => l.status === 'active').length,
      subtext: `${mockDHCPLeases.filter(l => l.status === 'static').length} static`,
      trend: 'neutral',
    },
    {
      label: 'Threats Blocked',
      value: mockAIAnalysis.threatsBlocked,
      subtext: 'today',
      trend: 'up',
    },
    {
      label: 'AI Accuracy',
      value: '98.5%',
      subtext: 'detection rate',
      trend: 'up',
    },
  ];

  return (
    <div className="grid grid-cols-6 gap-4">
      {stats.map((stat) => (
        <div key={stat.label} className="metric-card">
          <div className="text-xs text-muted-foreground mb-1">{stat.label}</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{stat.value}</span>
            {stat.trend === 'up' && <span className="text-status-success text-xs">↑</span>}
            {stat.trend === 'down' && <span className="text-status-danger text-xs">↓</span>}
          </div>
          <div className="text-[10px] text-muted-foreground mt-1">{stat.subtext}</div>
        </div>
      ))}
    </div>
  );
}
