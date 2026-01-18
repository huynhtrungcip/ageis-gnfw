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
  ArrowUpDown,
  Network,
  ArrowRight
} from "lucide-react";
import { useState } from "react";

interface ShapingPolicy {
  id: string;
  name: string;
  srcInterface: string;
  dstInterface: string;
  source: string;
  destination: string;
  service: string;
  application: string;
  trafficShaper: string;
  reverseShaper: string;
  perIPShaper: string;
  enabled: boolean;
  matches: number;
  bytes: number;
}

const mockPolicies: ShapingPolicy[] = [
  {
    id: '1',
    name: 'VoIP-Priority',
    srcInterface: 'lan',
    dstInterface: 'wan1',
    source: 'all',
    destination: 'all',
    service: 'SIP, RTP',
    application: 'VoIP',
    trafficShaper: 'high-priority',
    reverseShaper: 'high-priority',
    perIPShaper: 'voip-shaper',
    enabled: true,
    matches: 145892,
    bytes: 2147483648
  },
  {
    id: '2',
    name: 'Video-Streaming',
    srcInterface: 'lan',
    dstInterface: 'wan1',
    source: 'all',
    destination: 'all',
    service: 'HTTPS',
    application: 'YouTube, Netflix',
    trafficShaper: 'medium-priority',
    reverseShaper: 'medium-priority',
    perIPShaper: '',
    enabled: true,
    matches: 89234,
    bytes: 10737418240
  },
  {
    id: '3',
    name: 'Guest-Limit',
    srcInterface: 'guest',
    dstInterface: 'wan1',
    source: 'Guest-Network',
    destination: 'all',
    service: 'ALL',
    application: 'all',
    trafficShaper: 'low-priority',
    reverseShaper: 'low-priority',
    perIPShaper: 'guest-limit',
    enabled: true,
    matches: 234521,
    bytes: 5368709120
  },
  {
    id: '4',
    name: 'Backup-Traffic',
    srcInterface: 'dmz',
    dstInterface: 'wan2',
    source: 'Backup-Servers',
    destination: 'Cloud-Backup',
    service: 'HTTPS, SSH',
    application: 'all',
    trafficShaper: 'backup-shaper',
    reverseShaper: '',
    perIPShaper: '',
    enabled: true,
    matches: 12456,
    bytes: 21474836480
  },
  {
    id: '5',
    name: 'P2P-Block',
    srcInterface: 'lan',
    dstInterface: 'wan1',
    source: 'all',
    destination: 'all',
    service: 'ALL',
    application: 'BitTorrent, P2P',
    trafficShaper: '',
    reverseShaper: '',
    perIPShaper: '',
    enabled: false,
    matches: 0,
    bytes: 0
  },
];

const TrafficShapingPolicy = () => {
  const [policies, setPolicies] = useState<ShapingPolicy[]>(mockPolicies);
  const [searchQuery, setSearchQuery] = useState('');

  const togglePolicy = (id: string) => {
    setPolicies(prev => prev.map(policy => 
      policy.id === id ? { ...policy, enabled: !policy.enabled } : policy
    ));
  };

  const filteredPolicies = policies.filter(policy => 
    policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.application.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.trafficShaper.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) {
      return `${(bytes / 1073741824).toFixed(1)} GB`;
    }
    if (bytes >= 1048576) {
      return `${(bytes / 1048576).toFixed(1)} MB`;
    }
    if (bytes >= 1024) {
      return `${(bytes / 1024).toFixed(1)} KB`;
    }
    return `${bytes} B`;
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white">Traffic Shaping Policy</h1>
            <span className="text-xs text-gray-400 px-2 py-0.5 bg-[#1e2d3d] rounded">
              {policies.length} policies
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
              placeholder="Search Policies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 pl-7 pr-3 text-xs bg-[#1e2d3d] border border-[#2a3f54] rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#4caf50]"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Total Policies</div>
            <div className="text-xl font-bold text-white">{policies.length}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Active</div>
            <div className="text-xl font-bold text-green-400">{policies.filter(p => p.enabled).length}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Total Matches</div>
            <div className="text-xl font-bold text-blue-400">{policies.reduce((a, p) => a + p.matches, 0).toLocaleString()}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Total Traffic</div>
            <div className="text-xl font-bold text-purple-400">{formatBytes(policies.reduce((a, p) => a + p.bytes, 0))}</div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-[#1e2d3d] rounded border border-[#2a3f54] overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#16232f] text-gray-400 text-left">
                <th className="px-3 py-2 font-medium w-10"></th>
                <th className="px-3 py-2 font-medium">ID</th>
                <th className="px-3 py-2 font-medium">Name</th>
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 font-medium text-center">→</th>
                <th className="px-3 py-2 font-medium">Destination</th>
                <th className="px-3 py-2 font-medium">Application</th>
                <th className="px-3 py-2 font-medium">Shaper</th>
                <th className="px-3 py-2 font-medium">Matches</th>
                <th className="px-3 py-2 font-medium">Bytes</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((policy, index) => (
                <tr 
                  key={policy.id} 
                  className="border-t border-[#2a3f54] hover:bg-[#2a3f54]/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <input type="checkbox" className="rounded bg-[#16232f] border-[#2a3f54]" />
                  </td>
                  <td className="px-3 py-2 text-gray-400">{index + 1}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <ArrowUpDown size={14} className="text-cyan-400" />
                      <span className="text-white font-medium">{policy.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-white">{policy.source}</div>
                    <div className="text-gray-500 text-[10px]">{policy.srcInterface}</div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    <ArrowRight size={12} className="text-gray-500 mx-auto" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-white">{policy.destination}</div>
                    <div className="text-gray-500 text-[10px]">{policy.dstInterface}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-2 py-0.5 rounded text-[10px] bg-purple-500/20 text-purple-400">
                      {policy.application}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    {policy.trafficShaper ? (
                      <span className="px-2 py-0.5 rounded text-[10px] bg-orange-500/20 text-orange-400">
                        {policy.trafficShaper}
                      </span>
                    ) : (
                      <span className="text-gray-500">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-gray-300">{policy.matches.toLocaleString()}</td>
                  <td className="px-3 py-2 text-gray-300">{formatBytes(policy.bytes)}</td>
                  <td className="px-3 py-2">
                    <FortiToggle 
                      enabled={policy.enabled} 
                      onToggle={() => togglePolicy(policy.id)} 
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

export default TrafficShapingPolicy;
