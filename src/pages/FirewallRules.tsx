import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockFirewallRules } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Plus, GripVertical, MoreHorizontal } from 'lucide-react';

const FirewallRules = () => {
  const [rules] = useState(mockFirewallRules);
  const [selectedInterface, setSelectedInterface] = useState<string>('all');

  const interfaces = ['all', 'WAN', 'LAN', 'DMZ'];
  
  const filteredRules = selectedInterface === 'all' 
    ? rules 
    : rules.filter(r => r.interface === selectedInterface);

  const formatHits = (hits: number) => {
    if (hits >= 1000000) return (hits / 1000000).toFixed(1) + 'M';
    if (hits >= 1000) return (hits / 1000).toFixed(1) + 'K';
    return hits.toString();
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold">Firewall Policies</h1>
            <p className="text-sm text-muted-foreground">Packet filtering rules</p>
          </div>
          <button className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14} />
            <span>Add Rule</span>
          </button>
        </div>

        {/* Interface Tabs */}
        <div className="flex items-center gap-1">
          {interfaces.map((iface) => (
            <button
              key={iface}
              onClick={() => setSelectedInterface(iface)}
              className={cn(
                "px-3 py-1.5 text-xs rounded transition-colors",
                selectedInterface === iface 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
              )}
            >
              {iface === 'all' ? 'All Interfaces' : iface}
            </button>
          ))}
        </div>

        {/* Rules Table */}
        <div className="panel">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8"></th>
                <th className="w-16">Status</th>
                <th className="w-20">Action</th>
                <th className="w-20">Interface</th>
                <th className="w-24">Protocol</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Description</th>
                <th className="w-20">Hits</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {filteredRules.map((rule, index) => (
                <tr key={rule.id} className={cn(!rule.enabled && "opacity-50")}>
                  <td>
                    <GripVertical size={14} className="text-muted-foreground cursor-grab" />
                  </td>
                  <td>
                    <span className={cn(
                      "status-indicator",
                      rule.enabled ? "status-healthy" : "status-inactive"
                    )} />
                  </td>
                  <td>
                    <span className={cn(
                      "tag",
                      rule.action === 'pass' ? "tag-healthy" :
                      rule.action === 'block' ? "tag-critical" : "tag-medium"
                    )}>
                      {rule.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="text-xs">{rule.interface}</td>
                  <td className="text-xs font-mono">{rule.protocol.toUpperCase()}</td>
                  <td className="font-mono text-xs">
                    <div>{rule.source.value}</div>
                    {rule.source.port && <div className="text-muted-foreground">:{rule.source.port}</div>}
                  </td>
                  <td className="font-mono text-xs">
                    <div>{rule.destination.value}</div>
                    {rule.destination.port && <div className="text-muted-foreground">:{rule.destination.port}</div>}
                  </td>
                  <td className="text-xs max-w-[200px] truncate">{rule.description}</td>
                  <td className="font-mono text-xs text-muted-foreground">{formatHits(rule.hits)}</td>
                  <td>
                    <button className="p-1 hover:bg-accent rounded">
                      <MoreHorizontal size={14} className="text-muted-foreground" />
                    </button>
                  </td>
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
