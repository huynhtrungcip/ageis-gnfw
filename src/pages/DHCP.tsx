import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockDHCPLeases } from '@/data/mockData';
import { cn } from '@/lib/utils';

const DHCP = () => {
  const [leases] = useState(mockDHCPLeases);
  const [activeTab, setActiveTab] = useState<'server' | 'leases' | 'static'>('server');

  const dhcpConfig = {
    enabled: true,
    interface: 'LAN',
    rangeStart: '192.168.1.100',
    rangeEnd: '192.168.1.200',
    gateway: '192.168.1.1',
    dns1: '8.8.8.8',
    dns2: '8.8.4.4',
    domain: 'local.lan',
    leaseTime: 86400,
  };

  return (
    <Shell>
      <div className="space-y-6 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">DHCP Server</h1>
            <p className="text-sm text-muted-foreground">Dynamic Host Configuration Protocol</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-secondary text-xs">Add Static Mapping</button>
            <button className="btn-primary text-xs">Save Changes</button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border w-fit">
          {[
            { id: 'server', label: 'Server Config' },
            { id: 'leases', label: 'Active Leases' },
            { id: 'static', label: 'Static Mappings' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "px-4 py-2 text-xs font-medium rounded transition-colors",
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground" 
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Server Config */}
        {activeTab === 'server' && (
          <div className="grid grid-cols-2 gap-6">
            <div className="panel">
              <div className="panel-header">
                <h3 className="text-sm font-medium">DHCP Server - LAN</h3>
                <div className="flex items-center gap-2">
                  <span className="status-dot status-online" />
                  <span className="text-xs text-status-success">Active</span>
                </div>
              </div>
              <div className="panel-body space-y-4">
                <div className="flex items-center justify-between p-3 bg-secondary/50 rounded">
                  <span className="text-sm">Enable DHCP Server</span>
                  <button className={cn(
                    "w-10 h-5 rounded-full relative transition-colors",
                    dhcpConfig.enabled ? "bg-status-success" : "bg-muted"
                  )}>
                    <span className={cn(
                      "absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform",
                      dhcpConfig.enabled ? "left-5" : "left-0.5"
                    )} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Range Start</label>
                    <input 
                      type="text" 
                      defaultValue={dhcpConfig.rangeStart}
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Range End</label>
                    <input 
                      type="text" 
                      defaultValue={dhcpConfig.rangeEnd}
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-muted-foreground mb-1">Default Gateway</label>
                  <input 
                    type="text" 
                    defaultValue={dhcpConfig.gateway}
                    className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-mono"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Primary DNS</label>
                    <input 
                      type="text" 
                      defaultValue={dhcpConfig.dns1}
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Secondary DNS</label>
                    <input 
                      type="text" 
                      defaultValue={dhcpConfig.dns2}
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Domain Name</label>
                    <input 
                      type="text" 
                      defaultValue={dhcpConfig.domain}
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-muted-foreground mb-1">Lease Time (seconds)</label>
                    <input 
                      type="number" 
                      defaultValue={dhcpConfig.leaseTime}
                      className="w-full px-3 py-2 bg-input border border-border rounded text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="panel">
                <div className="panel-header">
                  <h3 className="text-sm font-medium">Pool Statistics</h3>
                </div>
                <div className="panel-body">
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-primary">101</div>
                      <div className="text-xs text-muted-foreground">Total IPs</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-status-success">{leases.filter(l => l.status === 'active').length}</div>
                      <div className="text-xs text-muted-foreground">Active</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{101 - leases.length}</div>
                      <div className="text-xs text-muted-foreground">Available</div>
                    </div>
                  </div>
                  <div className="mt-4">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="text-muted-foreground">Pool Usage</span>
                      <span>{Math.round(leases.length / 101 * 100)}%</span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-primary rounded-full" style={{ width: `${leases.length / 101 * 100}%` }} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="panel">
                <div className="panel-header">
                  <h3 className="text-sm font-medium">Additional Options</h3>
                </div>
                <div className="panel-body space-y-3">
                  {[
                    { label: 'TFTP Server', placeholder: 'tftp.local.lan' },
                    { label: 'NTP Server', placeholder: 'ntp.local.lan' },
                    { label: 'WINS Server', placeholder: '192.168.1.10' },
                  ].map((opt) => (
                    <div key={opt.label}>
                      <label className="block text-xs text-muted-foreground mb-1">{opt.label}</label>
                      <input 
                        type="text" 
                        placeholder={opt.placeholder}
                        className="w-full px-3 py-2 bg-input border border-border rounded text-sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leases */}
        {activeTab === 'leases' && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">Active DHCP Leases</h3>
              <button className="text-xs text-primary hover:underline">Refresh</button>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Hostname</th>
                  <th>Lease Start</th>
                  <th>Lease End</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((lease) => (
                  <tr key={lease.ip}>
                    <td className="font-mono text-sm">{lease.ip}</td>
                    <td className="font-mono text-xs">{lease.mac}</td>
                    <td className="text-sm">{lease.hostname}</td>
                    <td className="text-xs">{lease.start.toLocaleString('vi-VN')}</td>
                    <td className="text-xs">{lease.end.toLocaleString('vi-VN')}</td>
                    <td>
                      <span className={cn(
                        "text-xs px-2 py-0.5 rounded",
                        lease.status === 'active' ? 'bg-status-success/20 text-status-success' :
                        lease.status === 'static' ? 'bg-primary/20 text-primary' :
                        'bg-muted text-muted-foreground'
                      )}>
                        {lease.status.toUpperCase()}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-1">
                        <button className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded">Make Static</button>
                        <button className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded">Wake</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Static Mappings */}
        {activeTab === 'static' && (
          <div className="panel">
            <div className="panel-header">
              <h3 className="text-sm font-medium">Static DHCP Mappings</h3>
            </div>
            <table className="data-table">
              <thead>
                <tr>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Hostname</th>
                  <th>Description</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {leases.filter(l => l.status === 'static').map((lease) => (
                  <tr key={lease.ip}>
                    <td className="font-mono text-sm">{lease.ip}</td>
                    <td className="font-mono text-xs">{lease.mac}</td>
                    <td className="text-sm">{lease.hostname}</td>
                    <td className="text-xs text-muted-foreground">Reserved for {lease.hostname}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="px-2 py-1 text-xs bg-secondary hover:bg-secondary/80 rounded">Edit</button>
                        <button className="px-2 py-1 text-xs bg-status-danger/20 text-status-danger hover:bg-status-danger/30 rounded">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default DHCP;
