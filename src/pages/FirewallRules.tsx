import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockFirewallRules } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';

const FirewallRules = () => {
  const [rules] = useState(mockFirewallRules);
  const [iface, setIface] = useState<string>('all');

  const interfaces = ['all', 'WAN', 'LAN', 'DMZ'];
  const filtered = iface === 'all' ? rules : rules.filter(r => r.interface === iface);

  const formatHits = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-base font-bold">Firewall Rules</h1>
          <button className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14} />
            Add Rule
          </button>
        </div>

        {/* Filter Strip */}
        <div className="action-strip">
          <span className="text-xs text-muted-foreground">Filter by interface:</span>
          <div className="flex items-center gap-1">
            {interfaces.map((i) => (
              <button
                key={i}
                onClick={() => setIface(i)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-sm transition-all",
                  iface === i 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {i === 'all' ? 'All Interfaces' : i}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{filtered.length} rules</span>
        </div>

        {/* Rules Table */}
        <div className="section">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-12">#</th>
                <th className="w-14">Status</th>
                <th className="w-24">Action</th>
                <th>Interface</th>
                <th>Protocol</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Description</th>
                <th className="text-right">Hits</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rule, idx) => (
                <tr key={rule.id} className={cn(!rule.enabled && "opacity-50")}>
                  <td className="text-muted-foreground font-mono">{idx + 1}</td>
                  <td>
                    <span className={cn(
                      "status-dot-lg",
                      rule.enabled ? "status-healthy" : "status-inactive"
                    )} />
                  </td>
                  <td>
                    <span className={cn(
                      "tag",
                      rule.action === 'pass' ? "tag-healthy" : rule.action === 'block' ? "tag-critical" : "tag-medium"
                    )}>
                      {rule.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="font-medium">{rule.interface}</td>
                  <td className="mono">{rule.protocol.toUpperCase()}</td>
                  <td className="mono text-muted-foreground">
                    {rule.source.value}{rule.source.port ? `:${rule.source.port}` : ''}
                  </td>
                  <td className="mono text-muted-foreground">
                    {rule.destination.value}{rule.destination.port ? `:${rule.destination.port}` : ''}
                  </td>
                  <td className="max-w-[200px] truncate text-muted-foreground">{rule.description}</td>
                  <td className="text-right mono text-muted-foreground">{formatHits(rule.hits)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
};

export default FirewallRules;
