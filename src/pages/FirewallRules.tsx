import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockFirewallRules } from '@/data/mockData';
import { FirewallRule } from '@/types/firewall';
import { cn } from '@/lib/utils';

const FirewallRules = () => {
  const [rules, setRules] = useState<FirewallRule[]>(mockFirewallRules);
  const [selectedInterface, setSelectedInterface] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);

  const interfaces = ['all', 'WAN', 'LAN', 'DMZ', 'GUEST'];

  const filteredRules = selectedInterface === 'all' 
    ? rules 
    : rules.filter(r => r.interface === selectedInterface);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <Shell>
      <div className="space-y-6 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Firewall Rules</h1>
            <p className="text-sm text-muted-foreground">Manage packet filtering rules</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs">Import Rules</button>
            <button className="btn-primary text-xs" onClick={() => setShowAddModal(true)}>Add Rule</button>
          </div>
        </div>

        {/* Interface Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border w-fit">
          {interfaces.map((iface) => (
            <button
              key={iface}
              onClick={() => setSelectedInterface(iface)}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded transition-colors",
                selectedInterface === iface 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {iface === 'all' ? 'All Interfaces' : iface}
            </button>
          ))}
        </div>

        {/* Rules Table */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-sm font-medium">
              Rules ({filteredRules.length})
            </h3>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>{filteredRules.filter(r => r.enabled).length} enabled</span>
              <span>{filteredRules.filter(r => !r.enabled).length} disabled</span>
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-12">#</th>
                  <th className="w-16">Status</th>
                  <th className="w-20">Action</th>
                  <th className="w-24">Interface</th>
                  <th className="w-20">Protocol</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Description</th>
                  <th className="w-24">Hits</th>
                  <th className="w-32">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule, index) => (
                  <tr key={rule.id} className={cn(!rule.enabled && "opacity-50")}>
                    <td className="font-mono text-muted-foreground">{index + 1}</td>
                    <td>
                      <button
                        onClick={() => toggleRule(rule.id)}
                        className={cn(
                          "w-10 h-5 rounded-full relative transition-colors",
                          rule.enabled ? "bg-status-success" : "bg-muted"
                        )}
                      >
                        <span className={cn(
                          "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                          rule.enabled ? "left-5" : "left-0.5"
                        )} />
                      </button>
                    </td>
                    <td>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded font-medium",
                        rule.action === 'pass' ? "bg-status-success/20 text-status-success" :
                        rule.action === 'block' ? "bg-status-danger/20 text-status-danger" :
                        "bg-status-warning/20 text-status-warning"
                      )}>
                        {rule.action.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <span className={cn(
                        "text-xs px-2 py-1 rounded",
                        rule.interface === 'WAN' ? "bg-primary/20 text-primary" :
                        rule.interface === 'LAN' ? "bg-status-success/20 text-status-success" :
                        rule.interface === 'DMZ' ? "bg-status-warning/20 text-status-warning" :
                        "bg-muted text-muted-foreground"
                      )}>
                        {rule.interface}
                      </span>
                    </td>
                    <td className="font-mono text-xs">{rule.protocol.toUpperCase()}</td>
                    <td className="font-mono text-xs">
                      <div>{rule.source.value}</div>
                      {rule.source.port && <div className="text-muted-foreground">:{rule.source.port}</div>}
                    </td>
                    <td className="font-mono text-xs">
                      <div>{rule.destination.value}</div>
                      {rule.destination.port && <div className="text-muted-foreground">:{rule.destination.port}</div>}
                    </td>
                    <td className="text-xs max-w-[200px] truncate" title={rule.description}>
                      {rule.description}
                    </td>
                    <td className="font-mono text-xs">
                      <div className="flex items-center gap-2">
                        <span>{formatNumber(rule.hits)}</span>
                        {rule.logging && <span className="text-primary">LOG</span>}
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded">Edit</button>
                        <button className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded">Clone</button>
                        <button className="px-2 py-1 text-xs bg-status-danger/20 text-status-danger hover:bg-status-danger/30 rounded">Del</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Quick Tips */}
        <div className="panel">
          <div className="panel-body">
            <div className="flex items-start gap-4 text-xs">
              <div className="flex-1 p-3 bg-primary/5 border border-primary/20 rounded">
                <div className="font-medium text-primary mb-1">Rule Order</div>
                <div className="text-muted-foreground">Rules are evaluated top-to-bottom. First match wins.</div>
              </div>
              <div className="flex-1 p-3 bg-status-warning/5 border border-status-warning/20 rounded">
                <div className="font-medium text-status-warning mb-1">Logging</div>
                <div className="text-muted-foreground">Enable logging only for important rules to avoid performance impact.</div>
              </div>
              <div className="flex-1 p-3 bg-status-success/5 border border-status-success/20 rounded">
                <div className="font-medium text-status-success mb-1">Best Practice</div>
                <div className="text-muted-foreground">Use aliases to group IPs/ports for easier management.</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default FirewallRules;
