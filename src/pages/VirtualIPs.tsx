import { Shell } from "@/components/layout/Shell";
import { Button } from "@/components/ui/button";
import { FortiToggle } from "@/components/ui/forti-toggle";
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw,
  Search,
  ChevronDown,
  Globe,
  ArrowRight
} from "lucide-react";
import { useState } from "react";

interface VirtualIP {
  id: string;
  name: string;
  comments: string;
  type: 'static-nat' | 'load-balance' | 'server-load-balance' | 'access-proxy';
  externalIP: string;
  mappedIP: string;
  interface: string;
  protocol: 'TCP' | 'UDP' | 'SCTP' | 'ICMP' | 'ALL';
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
    mappedIP: '192.168.1.110-192.168.1.115',
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

  const toggleVIP = (id: string) => {
    setVips(prev => prev.map(vip => 
      vip.id === id ? { ...vip, enabled: !vip.enabled } : vip
    ));
  };

  const filteredVIPs = vips.filter(vip => 
    vip.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    vip.externalIP.includes(searchQuery) ||
    vip.mappedIP.includes(searchQuery)
  );

  const getTypeLabel = (type: VirtualIP['type']) => {
    switch (type) {
      case 'static-nat': return 'Static NAT';
      case 'load-balance': return 'Load Balance';
      case 'server-load-balance': return 'Server Load Balance';
      case 'access-proxy': return 'Access Proxy';
    }
  };

  const getTypeBadgeColor = (type: VirtualIP['type']) => {
    switch (type) {
      case 'static-nat': return 'bg-blue-500/20 text-blue-400';
      case 'load-balance': return 'bg-purple-500/20 text-purple-400';
      case 'server-load-balance': return 'bg-orange-500/20 text-orange-400';
      case 'access-proxy': return 'bg-green-500/20 text-green-400';
    }
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white">Virtual IPs</h1>
            <span className="text-xs text-gray-400 px-2 py-0.5 bg-[#1e2d3d] rounded">
              {vips.length} entries
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button size="sm" className="h-7 text-xs bg-[#4caf50] hover:bg-[#45a049] text-white">
              <Plus size={12} className="mr-1" />
              Create New
              <ChevronDown size={10} className="ml-1" />
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs border-[#2a3f54] text-gray-300 hover:bg-[#2a3f54]">
              <Edit2 size={12} />
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs border-[#2a3f54] text-gray-300 hover:bg-[#2a3f54]">
              <Trash2 size={12} />
            </Button>
            <Button size="sm" variant="outline" className="h-7 text-xs border-[#2a3f54] text-gray-300 hover:bg-[#2a3f54]">
              <RefreshCw size={12} />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-xs">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search Virtual IPs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 pl-7 pr-3 text-xs bg-[#1e2d3d] border border-[#2a3f54] rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#4caf50]"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Total VIPs</div>
            <div className="text-xl font-bold text-white">{vips.length}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Active</div>
            <div className="text-xl font-bold text-green-400">{vips.filter(v => v.enabled).length}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Total Sessions</div>
            <div className="text-xl font-bold text-blue-400">{vips.reduce((a, v) => a + v.sessions, 0).toLocaleString()}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Load Balanced</div>
            <div className="text-xl font-bold text-purple-400">{vips.filter(v => v.type === 'load-balance').length}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1e2d3d] rounded border border-[#2a3f54] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#16232f] text-gray-400 text-left">
                <th className="px-3 py-2 font-medium w-10"></th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Type</th>
                <th className="px-3 py-2 font-medium">External IP/Port</th>
                <th className="px-3 py-2 font-medium text-center">→</th>
                <th className="px-3 py-2 font-medium">Mapped IP/Port</th>
                <th className="px-3 py-2 font-medium">Interface</th>
                <th className="px-3 py-2 font-medium">Sessions</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredVIPs.map((vip) => (
                <tr 
                  key={vip.id} 
                  className="border-t border-[#2a3f54] hover:bg-[#2a3f54]/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <input type="checkbox" className="rounded bg-[#16232f] border-[#2a3f54]" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Globe size={14} className="text-blue-400" />
                      <div>
                        <div className="text-white font-medium">{vip.name}</div>
                        <div className="text-gray-500 text-[10px]">{vip.comments}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${getTypeBadgeColor(vip.type)}`}>
                      {getTypeLabel(vip.type)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-white">{vip.externalIP}</div>
                    <div className="text-gray-500 text-[10px]">{vip.protocol}:{vip.externalPort}</div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <ArrowRight size={12} className="text-gray-500 mx-auto" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-white">{vip.mappedIP}</div>
                    <div className="text-gray-500 text-[10px]">{vip.protocol}:{vip.mappedPort}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{vip.interface}</td>
                  <td className="px-3 py-2 text-gray-300">{vip.sessions.toLocaleString()}</td>
                  <td className="px-3 py-2">
                    <FortiToggle 
                      enabled={vip.enabled} 
                      onToggle={() => toggleVIP(vip.id)} 
                    />
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

export default VirtualIPs;
