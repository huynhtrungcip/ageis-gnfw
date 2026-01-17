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
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-sm font-semibold">Policies</h1>
          <button className="btn btn-primary flex items-center gap-1">
            <Plus size={12} />
            Add
          </button>
        </div>

        <div className="flex items-center gap-1">
          {interfaces.map((i) => (
            <button
              key={i}
              onClick={() => setIface(i)}
              className={cn(
                "px-2 py-1 text-[11px]",
                iface === i ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-accent"
              )}
            >
              {i === 'all' ? 'All' : i}
            </button>
          ))}
        </div>

        <div className="section">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">#</th>
                <th className="w-12"></th>
                <th>Action</th>
                <th>Interface</th>
                <th>Protocol</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Description</th>
                <th>Hits</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((rule, idx) => (
                <tr key={rule.id} className={cn(!rule.enabled && "opacity-40")}>
                  <td className="text-muted-foreground">{idx + 1}</td>
                  <td>
                    <span className={cn("status-dot", rule.enabled ? "status-healthy" : "status-inactive")} />
                  </td>
                  <td>
                    <span className={cn(
                      "tag",
                      rule.action === 'pass' ? "tag-healthy" : rule.action === 'block' ? "tag-critical" : "tag-medium"
                    )}>
                      {rule.action.toUpperCase()}
                    </span>
                  </td>
                  <td>{rule.interface}</td>
                  <td className="font-mono text-[11px]">{rule.protocol.toUpperCase()}</td>
                  <td className="font-mono text-[11px] text-muted-foreground">
                    {rule.source.value}{rule.source.port ? `:${rule.source.port}` : ''}
                  </td>
                  <td className="font-mono text-[11px] text-muted-foreground">
                    {rule.destination.value}{rule.destination.port ? `:${rule.destination.port}` : ''}
                  </td>
                  <td className="max-w-[180px] truncate">{rule.description}</td>
                  <td className="font-mono text-muted-foreground">{formatHits(rule.hits)}</td>
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
