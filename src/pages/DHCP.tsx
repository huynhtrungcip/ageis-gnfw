import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockDHCPLeases } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { ChevronDown, Plus, RefreshCw, Search, Edit2, Trash2, Server, Network, Settings } from 'lucide-react';

const DHCP = () => {
  const [leases, setLeases] = useState(mockDHCPLeases);
  const [activeTab, setActiveTab] = useState<'server' | 'leases' | 'static'>('server');
  const [dhcpEnabled, setDhcpEnabled] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const dhcpServers = [
    {
      id: 'lan',
      interface: 'LAN',
      enabled: true,
      rangeStart: '192.168.1.100',
      rangeEnd: '192.168.1.200',
      gateway: '192.168.1.1',
      dns1: '8.8.8.8',
      dns2: '8.8.4.4',
      domain: 'local.lan',
      leaseTime: 86400,
      activeLeases: 45,
      totalPool: 101,
    },
    {
      id: 'dmz',
      interface: 'DMZ',
      enabled: false,
      rangeStart: '10.0.0.100',
      rangeEnd: '10.0.0.150',
      gateway: '10.0.0.1',
      dns1: '8.8.8.8',
      dns2: '8.8.4.4',
      domain: 'dmz.local',
      leaseTime: 43200,
      activeLeases: 0,
      totalPool: 51,
    }
  ];

  const [servers, setServers] = useState(dhcpServers);

  const toggleServer = (id: string) => {
    setServers(servers.map(s => s.id === id ? { ...s, enabled: !s.enabled } : s));
  };

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
          <div className="relative">
            <button 
              className="forti-toolbar-btn primary"
              onClick={() => setShowCreateMenu(!showCreateMenu)}
            >
              <Plus className="w-3 h-3" />
              Create New
              <ChevronDown className="w-3 h-3" />
            </button>
            {showCreateMenu && (
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#ccc] shadow-lg z-50 min-w-[180px]">
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Server className="w-3 h-3" />
                  DHCP Server
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Network className="w-3 h-3" />
                  Static Mapping
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Settings className="w-3 h-3" />
                  DHCP Relay
                </button>
              </div>
            )}
          </div>
          <button className="forti-toolbar-btn">
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button className="forti-toolbar-btn">
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn">
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input type="text" placeholder="Search..." className="w-40" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {[
            { id: 'server', label: 'DHCP Servers', icon: Server },
            { id: 'leases', label: 'Address Leases', icon: Network },
            { id: 'static', label: 'Static Mappings', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeTab === tab.id 
                  ? "bg-white text-[hsl(142,70%,35%)] border-[hsl(142,70%,35%)]" 
                  : "text-[#666] border-transparent hover:text-[#333] hover:bg-[#f0f0f0]"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* DHCP Servers Tab */}
        {activeTab === 'server' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Interface</th>
                  <th>Address Range</th>
                  <th>Gateway</th>
                  <th>DNS Servers</th>
                  <th>Domain</th>
                  <th>Lease Time</th>
                  <th>Pool Usage</th>
                </tr>
              </thead>
              <tbody>
                {servers.map((server) => (
                  <tr key={server.id} className={cn(!server.enabled && "opacity-60")}>
                    <td>
                      <input type="checkbox" className="forti-checkbox" />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={server.enabled} 
                        onToggle={() => toggleServer(server.id)}
                        size="sm"
                      />
                    </td>
                    <td>
                      <span className="text-[11px] px-2 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                        {server.interface}
                      </span>
                    </td>
                    <td className="mono">
                      {server.rangeStart} - {server.rangeEnd}
                    </td>
                    <td className="mono">{server.gateway}</td>
                    <td className="mono text-[10px]">
                      {server.dns1}, {server.dns2}
                    </td>
                    <td className="text-[11px]">{server.domain}</td>
                    <td className="text-[11px]">{server.leaseTime}s</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="forti-progress w-20">
                          <div 
                            className={cn(
                              "forti-progress-bar",
                              (server.activeLeases / server.totalPool) > 0.8 ? "red" :
                              (server.activeLeases / server.totalPool) > 0.5 ? "orange" : "green"
                            )}
                            style={{ width: `${(server.activeLeases / server.totalPool) * 100}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-[#666]">
                          {server.activeLeases}/{server.totalPool}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Server Details Panel */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="section">
                <div className="section-header">
                  <span>DHCP Server Configuration - LAN</span>
                </div>
                <div className="section-body">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="forti-label">Mode</label>
                      <select className="forti-select w-full">
                        <option>Server</option>
                        <option>Relay</option>
                      </select>
                    </div>
                    <div className="flex items-center gap-2 pt-4">
                      <FortiToggle enabled={dhcpEnabled} onToggle={() => setDhcpEnabled(!dhcpEnabled)} />
                      <span className="text-[11px]">Enable DHCP Server</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="forti-label">Address Range</label>
                      <div className="flex items-center gap-2">
                        <input type="text" className="forti-input flex-1" defaultValue="192.168.1.100" />
                        <span className="text-[11px]">-</span>
                        <input type="text" className="forti-input flex-1" defaultValue="192.168.1.200" />
                      </div>
                    </div>
                    <div>
                      <label className="forti-label">Netmask</label>
                      <input type="text" className="forti-input w-full" defaultValue="255.255.255.0" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="forti-label">Default Gateway</label>
                      <input type="text" className="forti-input w-full" defaultValue="192.168.1.1" />
                    </div>
                    <div>
                      <label className="forti-label">DNS Server 1</label>
                      <input type="text" className="forti-input w-full" defaultValue="8.8.8.8" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="forti-label">DNS Server 2</label>
                      <input type="text" className="forti-input w-full" defaultValue="8.8.4.4" />
                    </div>
                    <div>
                      <label className="forti-label">Domain Name</label>
                      <input type="text" className="forti-input w-full" defaultValue="local.lan" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="forti-label">Lease Time (seconds)</label>
                      <input type="number" className="forti-input w-full" defaultValue="86400" />
                    </div>
                    <div>
                      <label className="forti-label">NTP Server</label>
                      <input type="text" className="forti-input w-full" placeholder="Optional" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <span>Pool Statistics</span>
                </div>
                <div className="section-body">
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div className="p-3 bg-[#f5f5f5] border border-[#ddd]">
                      <div className="text-2xl font-bold text-[hsl(142,70%,35%)]">101</div>
                      <div className="text-[10px] text-[#666]">Total Pool Size</div>
                    </div>
                    <div className="p-3 bg-[#f5f5f5] border border-[#ddd]">
                      <div className="text-2xl font-bold text-blue-600">45</div>
                      <div className="text-[10px] text-[#666]">Active Leases</div>
                    </div>
                    <div className="p-3 bg-[#f5f5f5] border border-[#ddd]">
                      <div className="text-2xl font-bold text-[#666]">56</div>
                      <div className="text-[10px] text-[#666]">Available</div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-[#666]">Pool Usage</span>
                      <span className="font-medium">44.5%</span>
                    </div>
                    <div className="forti-progress">
                      <div className="forti-progress-bar green" style={{ width: '44.5%' }} />
                    </div>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="text-[11px] font-semibold text-[#333]">Additional Options</div>
                    <table className="widget-table">
                      <tbody>
                        <tr>
                          <td className="widget-label">TFTP Server</td>
                          <td className="widget-value">-</td>
                        </tr>
                        <tr>
                          <td className="widget-label">WINS Server</td>
                          <td className="widget-value">-</td>
                        </tr>
                        <tr>
                          <td className="widget-label">Time Server</td>
                          <td className="widget-value">-</td>
                        </tr>
                        <tr>
                          <td className="widget-label">SIP Server</td>
                          <td className="widget-value">-</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Leases Tab */}
        {activeTab === 'leases' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Hostname</th>
                  <th>Interface</th>
                  <th>Lease Start</th>
                  <th>Lease Expires</th>
                  <th>Type</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {leases.map((lease, idx) => (
                  <tr key={lease.ip}>
                    <td>
                      <input type="checkbox" className="forti-checkbox" />
                    </td>
                    <td className="mono">{lease.ip}</td>
                    <td className="mono text-[10px]">{lease.mac}</td>
                    <td className="text-[11px]">{lease.hostname}</td>
                    <td>
                      <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                        LAN
                      </span>
                    </td>
                    <td className="text-[10px] text-[#666]">
                      {lease.start.toLocaleString('vi-VN')}
                    </td>
                    <td className="text-[10px] text-[#666]">
                      {lease.end.toLocaleString('vi-VN')}
                    </td>
                    <td>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 border",
                        lease.status === 'static' 
                          ? "bg-purple-100 text-purple-700 border-purple-200"
                          : "bg-gray-100 text-gray-600 border-gray-200"
                      )}>
                        {lease.status === 'static' ? 'STATIC' : 'DYNAMIC'}
                      </span>
                    </td>
                    <td>
                      <div className="forti-status">
                        <span className={cn(
                          "forti-status-dot",
                          lease.status === 'active' ? "up" : 
                          lease.status === 'expired' ? "down" : "warning"
                        )} />
                        <span className="capitalize">{lease.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Static Mappings Tab */}
        {activeTab === 'static' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Name</th>
                  <th>IP Address</th>
                  <th>MAC Address</th>
                  <th>Interface</th>
                  <th>Description</th>
                </tr>
              </thead>
              <tbody>
                {leases.filter(l => l.status === 'static').length > 0 ? (
                  leases.filter(l => l.status === 'static').map((lease) => (
                    <tr key={lease.ip}>
                      <td>
                        <input type="checkbox" className="forti-checkbox" />
                      </td>
                      <td>
                        <FortiToggle enabled={true} size="sm" />
                      </td>
                      <td className="text-[11px] font-medium">{lease.hostname}</td>
                      <td className="mono">{lease.ip}</td>
                      <td className="mono text-[10px]">{lease.mac}</td>
                      <td>
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                          LAN
                        </span>
                      </td>
                      <td className="text-[11px] text-[#666]">Reserved for {lease.hostname}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center py-8 text-[#666]">
                      <div className="text-[11px]">No static mappings configured</div>
                      <button className="forti-btn forti-btn-primary mt-2">
                        <Plus className="w-3 h-3 inline mr-1" />
                        Add Static Mapping
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default DHCP;
