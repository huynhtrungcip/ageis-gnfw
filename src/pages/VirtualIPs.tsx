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
  Globe,
  ArrowRightLeft,
  Server
} from 'lucide-react';

interface VirtualIP {
  id: string;
  name: string;
  comments: string;
  type: 'static-nat' | 'load-balance' | 'server-load-balance' | 'access-proxy';
  externalIP: string;
  mappedIP: string;
  interface: string;
  protocol: string;
  externalPort: string;
  mappedPort: string;
  enabled: boolean;
  sessions: number;
}

const mockVIPs: VirtualIP[] = [
  {
    id: '1',
    name: 'WebServer-VIP',
    comments: 'Main web server virtual IP',
    type: 'static-nat',
    externalIP: '203.0.113.10',
    mappedIP: '192.168.1.100',
    interface: 'wan1',
    protocol: 'TCP',
    externalPort: '443',
    mappedPort: '443',
    enabled: true,
    sessions: 1247
  },
  {
    id: '2',
    name: 'MailServer-VIP',
    comments: 'Email server SMTP and IMAP',
    type: 'static-nat',
    externalIP: '203.0.113.11',
    mappedIP: '192.168.1.101',
    interface: 'wan1',
    protocol: 'TCP',
    externalPort: '25,143,993',
    mappedPort: '25,143,993',
    enabled: true,
    sessions: 89
  },
  {
    id: '3',
    name: 'FTP-VIP',
    comments: 'FTP server access',
    type: 'static-nat',
    externalIP: '203.0.113.12',
    mappedIP: '192.168.1.102',
    interface: 'wan1',
    protocol: 'TCP',
    externalPort: '21',
    mappedPort: '21',
    enabled: false,
    sessions: 0
  },
  {
    id: '4',
    name: 'LoadBalancer-VIP',
    comments: 'Load balanced web servers',
    type: 'load-balance',
    externalIP: '203.0.113.20',
    mappedIP: '192.168.1.110-115',
    interface: 'wan1',
    protocol: 'TCP',
    externalPort: '80,443',
    mappedPort: '80,443',
    enabled: true,
    sessions: 3521
  },
];

const VirtualIPs = () => {
  const [vips, setVips] = useState<VirtualIP[]>(mockVIPs);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleVIP = (id: string) => {
    setVips(prev => prev.map(vip => 
      vip.id === id ? { ...vip, enabled: !vip.enabled } : vip
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredVIPs = vips.filter(vip => 
    searchQuery === '' ||
    vip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vip.externalIP.includes(searchQuery) ||
    vip.mappedIP.includes(searchQuery)
  );

  const getTypeLabel = (type: VirtualIP['type']) => {
    switch (type) {
      case 'static-nat': return 'Static NAT';
      case 'load-balance': return 'Load Balance';
      case 'server-load-balance': return 'Server LB';
      case 'access-proxy': return 'Access Proxy';
    }
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
                  Static NAT
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <ArrowRightLeft className="w-3 h-3" />
                  Load Balance
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Server className="w-3 h-3" />
                  Server Load Balance
                </button>
              </div>
            )}
          </div>
          <button className="forti-toolbar-btn" disabled={selectedIds.length !== 1}>
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button className="forti-toolbar-btn" disabled={selectedIds.length === 0}>
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
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="p-4">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">
                  <input type="checkbox" className="forti-checkbox" />
                </th>
                <th className="w-16">Status</th>
                <th>Name</th>
                <th>Type</th>
                <th>External IP</th>
                <th>Mapped IP</th>
                <th>Interface</th>
                <th>Protocol/Port</th>
                <th className="text-right">Sessions</th>
              </tr>
            </thead>
            <tbody>
              {filteredVIPs.map((vip) => (
                <tr key={vip.id} className={cn(!vip.enabled && "opacity-60", selectedIds.includes(vip.id) && "selected")}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(vip.id)}
                      onChange={() => handleSelect(vip.id)}
                    />
                  </td>
                  <td>
                    <FortiToggle 
                      enabled={vip.enabled} 
                      onToggle={() => toggleVIP(vip.id)}
                      size="sm"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-blue-600" />
                      <div>
                        <div className="text-[11px] font-medium">{vip.name}</div>
                        <div className="text-[10px] text-[#999]">{vip.comments}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 border",
                      vip.type === 'static-nat' && "bg-blue-100 text-blue-700 border-blue-200",
                      vip.type === 'load-balance' && "bg-purple-100 text-purple-700 border-purple-200",
                      vip.type === 'server-load-balance' && "bg-orange-100 text-orange-700 border-orange-200",
                      vip.type === 'access-proxy' && "bg-green-100 text-green-700 border-green-200"
                    )}>
                      {getTypeLabel(vip.type)}
                    </span>
                  </td>
                  <td className="mono text-[11px]">{vip.externalIP}</td>
                  <td className="mono text-[11px]">{vip.mappedIP}</td>
                  <td>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                      {vip.interface}
                    </span>
                  </td>
                  <td className="mono text-[11px]">{vip.protocol}:{vip.externalPort}</td>
                  <td className="text-right text-[11px] text-[#666]">{vip.sessions.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredVIPs.length} virtual IPs
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default VirtualIPs;
