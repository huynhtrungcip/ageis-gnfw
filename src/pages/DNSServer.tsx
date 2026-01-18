import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  ChevronDown, Plus, RefreshCw, Search, Edit2, Trash2, 
  Globe, Server, Shield, Database, Settings 
} from 'lucide-react';

const DNSServer = () => {
  const [activeTab, setActiveTab] = useState<'general' | 'forward' | 'local' | 'filter'>('general');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [dnsEnabled, setDnsEnabled] = useState(true);

  const forwardZones = [
    { id: '1', name: 'Default', type: 'forward', servers: ['8.8.8.8', '8.8.4.4'], enabled: true },
    { id: '2', name: 'internal.corp', type: 'forward', servers: ['10.0.0.10'], enabled: true },
    { id: '3', name: 'partner.net', type: 'forward', servers: ['192.168.100.1'], enabled: false },
  ];

  const localRecords = [
    { id: '1', hostname: 'gateway', domain: 'local.lan', type: 'A', address: '192.168.1.1', ttl: 3600, enabled: true },
    { id: '2', hostname: 'server01', domain: 'local.lan', type: 'A', address: '192.168.1.10', ttl: 3600, enabled: true },
    { id: '3', hostname: 'printer', domain: 'local.lan', type: 'A', address: '192.168.1.50', ttl: 3600, enabled: true },
    { id: '4', hostname: 'www', domain: 'local.lan', type: 'CNAME', address: 'server01.local.lan', ttl: 3600, enabled: true },
    { id: '5', hostname: 'mail', domain: 'local.lan', type: 'MX', address: 'server01.local.lan', ttl: 3600, enabled: false },
  ];

  const dnsFilters = [
    { id: '1', name: 'Block Ads', category: 'Advertising', action: 'Block', enabled: true },
    { id: '2', name: 'Block Malware', category: 'Malware', action: 'Block', enabled: true },
    { id: '3', name: 'Block Adult Content', category: 'Adult', action: 'Block', enabled: false },
    { id: '4', name: 'Safe Search', category: 'Search Engines', action: 'Enforce', enabled: true },
    { id: '5', name: 'Block Gambling', category: 'Gambling', action: 'Block', enabled: false },
  ];

  const [zones, setZones] = useState(forwardZones);
  const [records, setRecords] = useState(localRecords);
  const [filters, setFilters] = useState(dnsFilters);

  const toggleZone = (id: string) => {
    setZones(zones.map(z => z.id === id ? { ...z, enabled: !z.enabled } : z));
  };

  const toggleRecord = (id: string) => {
    setRecords(records.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const toggleFilter = (id: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
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
                  <Globe className="w-3 h-3" />
                  Forward Zone
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Local Record
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  DNS Filter
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
            { id: 'general', label: 'General Settings', icon: Settings },
            { id: 'forward', label: 'Forward Zones', icon: Globe },
            { id: 'local', label: 'Local Records', icon: Database },
            { id: 'filter', label: 'DNS Filter', icon: Shield },
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

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="section">
                <div className="section-header">
                  <span>DNS Server Settings</span>
                </div>
                <div className="section-body space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#f5f5f5] border border-[#ddd]">
                    <div>
                      <div className="text-[11px] font-medium">Enable DNS Server</div>
                      <div className="text-[10px] text-[#666]">Enable local DNS server for network clients</div>
                    </div>
                    <FortiToggle enabled={dnsEnabled} onToggle={() => setDnsEnabled(!dnsEnabled)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="forti-label">Listen on Interface</label>
                      <select className="forti-select w-full">
                        <option>LAN</option>
                        <option>DMZ</option>
                        <option>All Interfaces</option>
                      </select>
                    </div>
                    <div>
                      <label className="forti-label">DNS Port</label>
                      <input type="number" className="forti-input w-full" defaultValue="53" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="forti-label">Cache Size (entries)</label>
                      <input type="number" className="forti-input w-full" defaultValue="10000" />
                    </div>
                    <div>
                      <label className="forti-label">Cache TTL (seconds)</label>
                      <input type="number" className="forti-input w-full" defaultValue="3600" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 text-[11px]">
                      <input type="checkbox" className="forti-checkbox" defaultChecked />
                      Enable DNS Cache
                    </label>
                    <label className="flex items-center gap-2 text-[11px]">
                      <input type="checkbox" className="forti-checkbox" defaultChecked />
                      Log DNS Queries
                    </label>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <span>DNS Statistics</span>
                </div>
                <div className="section-body">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                      <div className="text-2xl font-bold text-[hsl(142,70%,35%)]">12,458</div>
                      <div className="text-[10px] text-[#666]">Total Queries</div>
                    </div>
                    <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                      <div className="text-2xl font-bold text-blue-600">89.2%</div>
                      <div className="text-[10px] text-[#666]">Cache Hit Rate</div>
                    </div>
                  </div>

                  <table className="widget-table">
                    <tbody>
                      <tr>
                        <td className="widget-label">Queries Today</td>
                        <td className="widget-value">3,241</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Blocked Queries</td>
                        <td className="widget-value text-red-600">156</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Cache Entries</td>
                        <td className="widget-value">4,892</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Upstream Latency</td>
                        <td className="widget-value">12ms</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forward Zones Tab */}
        {activeTab === 'forward' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Zone Name</th>
                  <th>Type</th>
                  <th>DNS Servers</th>
                  <th>Priority</th>
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} className={cn(!zone.enabled && "opacity-60")}>
                    <td>
                      <input type="checkbox" className="forti-checkbox" />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={zone.enabled} 
                        onToggle={() => toggleZone(zone.id)}
                        size="sm"
                      />
                    </td>
                    <td className="text-[11px] font-medium">
                      {zone.name === 'Default' ? (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-blue-500" />
                          {zone.name} (All queries)
                        </span>
                      ) : zone.name}
                    </td>
                    <td>
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200">
                        FORWARD
                      </span>
                    </td>
                    <td className="mono text-[10px]">
                      {zone.servers.join(', ')}
                    </td>
                    <td className="text-[11px]">Normal</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Local Records Tab */}
        {activeTab === 'local' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Hostname</th>
                  <th>Domain</th>
                  <th>Type</th>
                  <th>Address/Value</th>
                  <th>TTL</th>
                </tr>
              </thead>
              <tbody>
                {records.map((record) => (
                  <tr key={record.id} className={cn(!record.enabled && "opacity-60")}>
                    <td>
                      <input type="checkbox" className="forti-checkbox" />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={record.enabled} 
                        onToggle={() => toggleRecord(record.id)}
                        size="sm"
                      />
                    </td>
                    <td className="text-[11px] font-medium">{record.hostname}</td>
                    <td className="text-[11px]">{record.domain}</td>
                    <td>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 border font-mono",
                        record.type === 'A' ? "bg-green-100 text-green-700 border-green-200" :
                        record.type === 'CNAME' ? "bg-blue-100 text-blue-700 border-blue-200" :
                        record.type === 'MX' ? "bg-orange-100 text-orange-700 border-orange-200" :
                        "bg-gray-100 text-gray-700 border-gray-200"
                      )}>
                        {record.type}
                      </span>
                    </td>
                    <td className="mono text-[10px]">{record.address}</td>
                    <td className="text-[11px]">{record.ttl}s</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DNS Filter Tab */}
        {activeTab === 'filter' && (
          <div className="p-4">
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="section">
                <div className="section-header-neutral">
                  <span>Security Filters</span>
                </div>
                <div className="section-body space-y-2">
                  {filters.filter(f => ['Malware', 'Phishing'].includes(f.category) || f.name.includes('Malware')).map((filter) => (
                    <div key={filter.id} className="forti-feature-item">
                      <div>
                        <div className="text-[11px] font-medium">{filter.name}</div>
                        <div className="text-[10px] text-[#666]">{filter.category}</div>
                      </div>
                      <FortiToggle 
                        enabled={filter.enabled} 
                        onToggle={() => toggleFilter(filter.id)}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="section-header-neutral">
                  <span>Content Filters</span>
                </div>
                <div className="section-body space-y-2">
                  {filters.filter(f => ['Adult', 'Gambling', 'Advertising'].includes(f.category) || f.name.includes('Ads') || f.name.includes('Adult') || f.name.includes('Gambling')).map((filter) => (
                    <div key={filter.id} className="forti-feature-item">
                      <div>
                        <div className="text-[11px] font-medium">{filter.name}</div>
                        <div className="text-[10px] text-[#666]">{filter.category}</div>
                      </div>
                      <FortiToggle 
                        enabled={filter.enabled} 
                        onToggle={() => toggleFilter(filter.id)}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="section">
                <div className="section-header-neutral">
                  <span>Policy Enforcement</span>
                </div>
                <div className="section-body space-y-2">
                  {filters.filter(f => f.action === 'Enforce' || f.category === 'Search Engines').map((filter) => (
                    <div key={filter.id} className="forti-feature-item">
                      <div>
                        <div className="text-[11px] font-medium">{filter.name}</div>
                        <div className="text-[10px] text-[#666]">{filter.category}</div>
                      </div>
                      <FortiToggle 
                        enabled={filter.enabled} 
                        onToggle={() => toggleFilter(filter.id)}
                        size="sm"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header">
                <span>DNS Filter Statistics</span>
              </div>
              <div className="section-body">
                <div className="grid grid-cols-4 gap-4">
                  <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                    <div className="text-xl font-bold text-red-600">156</div>
                    <div className="text-[10px] text-[#666]">Blocked Today</div>
                  </div>
                  <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                    <div className="text-xl font-bold text-orange-600">89</div>
                    <div className="text-[10px] text-[#666]">Ads Blocked</div>
                  </div>
                  <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                    <div className="text-xl font-bold text-purple-600">34</div>
                    <div className="text-[10px] text-[#666]">Malware Blocked</div>
                  </div>
                  <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                    <div className="text-xl font-bold text-blue-600">33</div>
                    <div className="text-[10px] text-[#666]">Other Categories</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default DNSServer;
