import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw,
  Search,
  ChevronDown,
  Lock,
  Users,
  Globe,
  Key,
  Monitor
} from 'lucide-react';

interface SSLVPNPortal {
  id: string;
  name: string;
  tunnelMode: boolean;
  webMode: boolean;
  forticlientDownload: boolean;
  splitTunneling: boolean;
  hostCheck: boolean;
  enabled: boolean;
  users: number;
}

interface SSLVPNSettings {
  listenPort: number;
  listenInterface: string;
  serverCertificate: string;
  idleTimeout: number;
  authTimeout: number;
  dnsServer1: string;
  dnsServer2: string;
}

const mockPortals: SSLVPNPortal[] = [
  {
    id: '1',
    name: 'full-access',
    tunnelMode: true,
    webMode: true,
    forticlientDownload: true,
    splitTunneling: false,
    hostCheck: true,
    enabled: true,
    users: 125
  },
  {
    id: '2',
    name: 'web-only',
    tunnelMode: false,
    webMode: true,
    forticlientDownload: false,
    splitTunneling: false,
    hostCheck: false,
    enabled: true,
    users: 45
  },
  {
    id: '3',
    name: 'tunnel-only',
    tunnelMode: true,
    webMode: false,
    forticlientDownload: true,
    splitTunneling: true,
    hostCheck: true,
    enabled: true,
    users: 89
  },
  {
    id: '4',
    name: 'guest-portal',
    tunnelMode: false,
    webMode: true,
    forticlientDownload: false,
    splitTunneling: false,
    hostCheck: false,
    enabled: false,
    users: 0
  },
];

const mockSettings: SSLVPNSettings = {
  listenPort: 443,
  listenInterface: 'wan1',
  serverCertificate: 'Fortinet_Factory',
  idleTimeout: 300,
  authTimeout: 30,
  dnsServer1: '8.8.8.8',
  dnsServer2: '8.8.4.4'
};

const SSLVPNConfig = () => {
  const [portals, setPortals] = useState<SSLVPNPortal[]>(mockPortals);
  const [settings] = useState<SSLVPNSettings>(mockSettings);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'settings' | 'portals'>('portals');

  const togglePortal = (id: string) => {
    setPortals(prev => prev.map(portal => 
      portal.id === id ? { ...portal, enabled: !portal.enabled } : portal
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredPortals = portals.filter(portal => 
    searchQuery === '' ||
    portal.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const tabs = [
    { id: 'portals', label: 'SSL-VPN Portals', icon: Globe },
    { id: 'settings', label: 'Settings', icon: Lock },
  ];

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
          {activeTab === 'portals' && (
            <>
              <button className="forti-toolbar-btn primary">
                <Plus className="w-3 h-3" />
                Create New
              </button>
              <button className="forti-toolbar-btn" disabled={selectedIds.length !== 1}>
                <Edit2 className="w-3 h-3" />
                Edit
              </button>
              <button className="forti-toolbar-btn" disabled={selectedIds.length === 0}>
                <Trash2 className="w-3 h-3" />
                Delete
              </button>
              <div className="forti-toolbar-separator" />
            </>
          )}
          <button className="forti-toolbar-btn">
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex-1" />
          {activeTab === 'portals' && (
            <div className="forti-search">
              <Search className="w-3 h-3 text-[#999]" />
              <input 
                type="text" 
                placeholder="Search..." 
                className="w-40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {tabs.map((tab) => (
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

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="p-4 space-y-4">
            <div className="section">
              <div className="section-header-neutral">
                <span>Connection Settings</span>
              </div>
              <div className="section-body">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#666]">Listen on Port</label>
                    <div className="mono text-[12px] font-medium">{settings.listenPort}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#666]">Listen on Interface</label>
                    <div className="text-[12px] font-medium">{settings.listenInterface}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#666]">Server Certificate</label>
                    <div className="text-[12px] font-medium flex items-center gap-1">
                      <Key className="w-3 h-3 text-green-600" />
                      {settings.serverCertificate}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#666]">Idle Timeout</label>
                    <div className="mono text-[12px] font-medium">{settings.idleTimeout} seconds</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header-neutral">
                <span>DNS Settings</span>
              </div>
              <div className="section-body">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#666]">Primary DNS Server</label>
                    <div className="mono text-[12px] font-medium">{settings.dnsServer1}</div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[11px] text-[#666]">Secondary DNS Server</label>
                    <div className="mono text-[12px] font-medium">{settings.dnsServer2}</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="section">
              <div className="section-header-neutral">
                <span>Active Sessions</span>
              </div>
              <div className="section-body">
                <div className="flex items-center gap-8">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{portals.reduce((a, p) => a + p.users, 0)}</div>
                    <div className="text-[10px] text-[#666]">Connected Users</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{portals.filter(p => p.enabled).length}</div>
                    <div className="text-[10px] text-[#666]">Active Portals</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Portals Tab */}
        {activeTab === 'portals' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input type="checkbox" className="forti-checkbox" />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Name</th>
                  <th>Tunnel Mode</th>
                  <th>Web Mode</th>
                  <th>Split Tunnel</th>
                  <th>Host Check</th>
                  <th className="text-right">Users</th>
                </tr>
              </thead>
              <tbody>
                {filteredPortals.map((portal) => (
                  <tr key={portal.id} className={cn(!portal.enabled && "opacity-60", selectedIds.includes(portal.id) && "selected")}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="forti-checkbox"
                        checked={selectedIds.includes(portal.id)}
                        onChange={() => handleSelect(portal.id)}
                      />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={portal.enabled} 
                        onToggle={() => togglePortal(portal.id)}
                        size="sm"
                      />
                    </td>
                    <td>
                      <div className="flex items-center gap-2">
                        <Globe className="w-3 h-3 text-blue-600" />
                        <span className="text-[11px] font-medium">{portal.name}</span>
                      </div>
                    </td>
                    <td>
                      {portal.tunnelMode ? (
                        <span className="text-green-600 text-[11px]">✓ Enabled</span>
                      ) : (
                        <span className="text-[#999] text-[11px]">Disabled</span>
                      )}
                    </td>
                    <td>
                      {portal.webMode ? (
                        <span className="text-green-600 text-[11px]">✓ Enabled</span>
                      ) : (
                        <span className="text-[#999] text-[11px]">Disabled</span>
                      )}
                    </td>
                    <td>
                      {portal.splitTunneling ? (
                        <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200">Split</span>
                      ) : (
                        <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">Full</span>
                      )}
                    </td>
                    <td>
                      {portal.hostCheck ? (
                        <span className="text-green-600 text-[11px]">✓</span>
                      ) : (
                        <span className="text-[#999] text-[11px]">—</span>
                      )}
                    </td>
                    <td className="text-right">
                      <span className="text-[11px] flex items-center justify-end gap-1">
                        <Users className="w-3 h-3 text-[#999]" />
                        {portal.users}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="text-[11px] text-[#666] mt-2 px-1">
              {filteredPortals.length} SSL-VPN portals
            </div>
          </div>
        )}
      </div>
    </Shell>
  );
};

export default SSLVPNConfig;
