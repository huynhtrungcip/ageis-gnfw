import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockNATRules } from '@/data/mockData';
import { NATRule } from '@/types/firewall';
import { cn } from '@/lib/utils';

const NATConfig = () => {
  const [rules, setRules] = useState<NATRule[]>(mockNATRules);
  const [activeTab, setActiveTab] = useState<'port-forward' | 'outbound' | '1:1' | 'npt'>('port-forward');

  const tabs = [
    { id: 'port-forward', label: 'Port Forward', count: rules.filter(r => r.type === 'port-forward').length },
    { id: 'outbound', label: 'Outbound NAT', count: rules.filter(r => r.type === 'outbound').length },
    { id: '1:1', label: '1:1 NAT', count: rules.filter(r => r.type === '1:1').length },
    { id: 'npt', label: 'NPt (IPv6)', count: rules.filter(r => r.type === 'npt').length },
  ];

  const filteredRules = rules.filter(r => r.type === activeTab);

  const toggleRule = (id: string) => {
    setRules(rules.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  return (
    <Shell>
      <div className="space-y-6 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">NAT Configuration</h1>
            <p className="text-sm text-muted-foreground">Network Address Translation rules</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary text-xs">Add NAT Rule</button>
          </div>
        </div>

        {/* NAT Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded transition-colors flex items-center gap-2",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {tab.label}
              <span className={cn(
                "px-1.5 py-0.5 rounded text-[10px]",
                activeTab === tab.id ? "bg-primary-foreground/20" : "bg-muted"
              )}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Port Forward Table */}
        {activeTab === 'port-forward' && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">Port Forward Rules</h3>
              <span className="text-xs text-muted-foreground">Forward external ports to internal hosts</span>
            </div>
            <div className="overflow-x-auto">
              <table className="data-table">
                <thead>
                  <tr>
                    <th className="w-16">Status</th>
                    <th>Interface</th>
                    <th>Protocol</th>
                    <th>External Port</th>
                    <th>Internal Address</th>
                    <th>Internal Port</th>
                    <th>Description</th>
                    <th className="w-32">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRules.map((rule) => (
                    <tr key={rule.id} className={cn(!rule.enabled && "opacity-50")}>
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
                        <span className="text-xs px-2 py-1 rounded bg-primary/20 text-primary">
                          {rule.interface}
                        </span>
                      </td>
                      <td className="font-mono text-xs">{rule.protocol.toUpperCase()}</td>
                      <td className="font-mono text-xs">{rule.externalPort}</td>
                      <td className="font-mono text-xs">{rule.internalAddress}</td>
                      <td className="font-mono text-xs">{rule.internalPort}</td>
                      <td className="text-xs">{rule.description}</td>
                      <td>
                        <div className="flex items-center gap-1">
                          <button className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded">Edit</button>
                          <button className="px-2 py-1 text-xs bg-status-danger/20 text-status-danger hover:bg-status-danger/30 rounded">Del</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Outbound NAT */}
        {activeTab === 'outbound' && (
          <div className="space-y-4">
            <div className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-medium">Outbound NAT Mode</h3>
              </div>
              <div className="panel-body">
                <div className="grid grid-cols-3 gap-4">
                  {['Automatic', 'Hybrid', 'Manual'].map((mode) => (
                    <label key={mode} className="flex items-start gap-3 p-4 bg-secondary/50 rounded-lg cursor-pointer hover:bg-secondary transition-colors">
                      <input type="radio" name="nat-mode" defaultChecked={mode === 'Automatic'} className="mt-1" />
                      <div>
                        <div className="font-medium text-sm">{mode} Outbound NAT</div>
                        <div className="text-xs text-muted-foreground mt-1">
                          {mode === 'Automatic' && 'System automatically creates outbound NAT rules'}
                          {mode === 'Hybrid' && 'Automatic rules plus manual mappings'}
                          {mode === 'Manual' && 'Full manual control over outbound NAT'}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-medium">Outbound NAT Mappings</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Status</th>
                      <th>Interface</th>
                      <th>Source</th>
                      <th>Source Port</th>
                      <th>Destination</th>
                      <th>NAT Address</th>
                      <th>Description</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rules.filter(r => r.type === 'outbound').map((rule) => (
                      <tr key={rule.id}>
                        <td>
                          <span className="status-dot status-online" />
                        </td>
                        <td className="text-xs">{rule.interface}</td>
                        <td className="font-mono text-xs">{rule.internalAddress}</td>
                        <td className="font-mono text-xs">*</td>
                        <td className="font-mono text-xs">*</td>
                        <td className="font-mono text-xs">{rule.externalAddress}</td>
                        <td className="text-xs">{rule.description}</td>
                        <td>
                          <button className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded">Edit</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 1:1 NAT */}
        {activeTab === '1:1' && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">1:1 NAT Mappings</h3>
              <span className="text-xs text-muted-foreground">Map external IP to internal IP</span>
            </div>
            <div className="panel-body">
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <div className="text-lg mb-2">No 1:1 NAT rules configured</div>
                  <button className="btn-primary text-xs">Add 1:1 NAT Rule</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* NPt */}
        {activeTab === 'npt' && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">NPt (Network Prefix Translation)</h3>
              <span className="text-xs text-muted-foreground">IPv6 prefix translation</span>
            </div>
            <div className="panel-body">
              <div className="flex items-center justify-center py-12 text-muted-foreground">
                <div className="text-center">
                  <div className="text-lg mb-2">No NPt rules configured</div>
                  <button className="btn-primary text-xs">Add NPt Rule</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default NATConfig;
