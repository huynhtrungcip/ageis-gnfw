import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockVPNTunnels } from '@/data/mockData';
import { cn } from '@/lib/utils';

const VPN = () => {
  const [tunnels] = useState(mockVPNTunnels);
  const [activeTab, setActiveTab] = useState<'ipsec' | 'openvpn' | 'wireguard'>('ipsec');

  const formatBytes = (bytes: number): string => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    return (bytes / 1024).toFixed(2) + ' KB';
  };

  const formatUptime = (seconds: number): string => {
    if (seconds === 0) return '--';
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (days > 0) return `${days}d ${hours}h ${mins}m`;
    return `${hours}h ${mins}m`;
  };

  const filteredTunnels = tunnels.filter(t => t.type === activeTab);

  return (
    <Shell>
      <div className="space-y-6 animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">VPN</h1>
            <p className="text-sm text-muted-foreground">Virtual Private Network tunnels</p>
          </div>
          <div className="flex items-center gap-2">
            <button className="btn-primary text-xs">Add VPN Tunnel</button>
          </div>
        </div>

        {/* VPN Stats */}
        <div className="grid grid-cols-4 gap-4">
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Total Tunnels</div>
            <div className="text-2xl font-bold">{tunnels.length}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Connected</div>
            <div className="text-2xl font-bold text-status-success">{tunnels.filter(t => t.status === 'connected').length}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Total In</div>
            <div className="text-2xl font-bold text-traffic-inbound">{formatBytes(tunnels.reduce((acc, t) => acc + t.bytesIn, 0))}</div>
          </div>
          <div className="metric-card">
            <div className="text-xs text-muted-foreground mb-1">Total Out</div>
            <div className="text-2xl font-bold text-traffic-outbound">{formatBytes(tunnels.reduce((acc, t) => acc + t.bytesOut, 0))}</div>
          </div>
        </div>

        {/* VPN Type Tabs */}
        <div className="flex items-center gap-1 p-1 bg-card rounded-lg border border-border w-fit">
          {[
            { id: 'ipsec', label: 'IPsec', count: tunnels.filter(t => t.type === 'ipsec').length },
            { id: 'openvpn', label: 'OpenVPN', count: tunnels.filter(t => t.type === 'openvpn').length },
            { id: 'wireguard', label: 'WireGuard', count: tunnels.filter(t => t.type === 'wireguard').length },
          ].map((tab) => (
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

        {/* Tunnels List */}
        <div className="space-y-4">
          {filteredTunnels.map((tunnel) => (
            <div key={tunnel.id} className="panel">
              <div className="panel-header">
                <div className="flex items-center gap-3">
                  <span className={cn(
                    "status-dot",
                    tunnel.status === 'connected' ? 'status-online' :
                    tunnel.status === 'connecting' ? 'status-warning' : 'status-offline'
                  )} />
                  <div>
                    <div className="font-medium">{tunnel.name}</div>
                    <div className="text-xs text-muted-foreground">{tunnel.type.toUpperCase()}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-xs px-2 py-1 rounded",
                    tunnel.status === 'connected' ? 'bg-status-success/20 text-status-success' :
                    tunnel.status === 'connecting' ? 'bg-status-warning/20 text-status-warning' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {tunnel.status.toUpperCase()}
                  </span>
                  <button className="btn-secondary text-xs">
                    {tunnel.status === 'connected' ? 'Disconnect' : 'Connect'}
                  </button>
                  <button className="btn-secondary text-xs">Edit</button>
                </div>
              </div>
              <div className="panel-body">
                <div className="grid grid-cols-5 gap-6">
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Remote Gateway</div>
                    <div className="font-mono text-sm">{tunnel.remoteGateway}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Local Network</div>
                    <div className="font-mono text-sm">{tunnel.localNetwork}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Remote Network</div>
                    <div className="font-mono text-sm">{tunnel.remoteNetwork}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Uptime</div>
                    <div className="text-sm">{formatUptime(tunnel.uptime)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground mb-1">Traffic</div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className="text-traffic-inbound">↓ {formatBytes(tunnel.bytesIn)}</span>
                      <span className="text-traffic-outbound">↑ {formatBytes(tunnel.bytesOut)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredTunnels.length === 0 && (
            <div className="panel">
              <div className="panel-body flex items-center justify-center py-12">
                <div className="text-center text-muted-foreground">
                  <div className="text-lg mb-2">No {activeTab.toUpperCase()} tunnels configured</div>
                  <button className="btn-primary text-xs">Add {activeTab.toUpperCase()} Tunnel</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Setup Guide */}
        <div className="panel">
          <div className="panel-header">
            <h3 className="text-sm font-medium">Quick Setup Guide</h3>
          </div>
          <div className="panel-body">
            <div className="grid grid-cols-3 gap-4 text-xs">
              <div className="p-4 bg-secondary/50 rounded">
                <div className="font-medium mb-2">IPsec Site-to-Site</div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Add Phase 1 (IKE)</li>
                  <li>Configure encryption</li>
                  <li>Add Phase 2 (ESP)</li>
                  <li>Define networks</li>
                </ol>
              </div>
              <div className="p-4 bg-secondary/50 rounded">
                <div className="font-medium mb-2">OpenVPN Remote Access</div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Generate certificates</li>
                  <li>Create server config</li>
                  <li>Export client profiles</li>
                  <li>Distribute to users</li>
                </ol>
              </div>
              <div className="p-4 bg-secondary/50 rounded">
                <div className="font-medium mb-2">WireGuard</div>
                <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                  <li>Generate keypairs</li>
                  <li>Add peers</li>
                  <li>Configure allowed IPs</li>
                  <li>Share QR codes</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default VPN;
