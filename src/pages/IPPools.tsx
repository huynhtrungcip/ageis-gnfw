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
  Database,
  Layers
} from "lucide-react";
import { useState } from "react";

interface IPPool {
  id: string;
  name: string;
  comments: string;
  type: 'overload' | 'one-to-one' | 'fixed-port-range' | 'port-block-allocation';
  startIP: string;
  endIP: string;
  associatedInterface: string;
  arpReply: boolean;
  enabled: boolean;
  usedIPs: number;
  totalIPs: number;
}

const mockPools: IPPool[] = [
  {
    id: '1',
    name: 'SNAT-Pool-1',
    comments: 'Primary outbound NAT pool',
    type: 'overload',
    startIP: '203.0.113.100',
    endIP: '203.0.113.110',
    associatedInterface: 'wan1',
    arpReply: true,
    enabled: true,
    usedIPs: 8,
    totalIPs: 11
  },
  {
    id: '2',
    name: 'Guest-NAT-Pool',
    comments: 'Guest network NAT pool',
    type: 'one-to-one',
    startIP: '203.0.113.120',
    endIP: '203.0.113.130',
    associatedInterface: 'wan1',
    arpReply: true,
    enabled: true,
    usedIPs: 5,
    totalIPs: 11
  },
  {
    id: '3',
    name: 'VPN-Pool',
    comments: 'VPN client NAT pool',
    type: 'fixed-port-range',
    startIP: '203.0.113.140',
    endIP: '203.0.113.150',
    associatedInterface: 'wan1',
    arpReply: true,
    enabled: true,
    usedIPs: 3,
    totalIPs: 11
  },
  {
    id: '4',
    name: 'Legacy-Pool',
    comments: 'Legacy systems pool',
    type: 'overload',
    startIP: '203.0.113.200',
    endIP: '203.0.113.205',
    associatedInterface: 'wan2',
    arpReply: false,
    enabled: false,
    usedIPs: 0,
    totalIPs: 6
  },
];

const IPPools = () => {
  const [pools, setPools] = useState<IPPool[]>(mockPools);
  const [searchQuery, setSearchQuery] = useState('');

  const togglePool = (id: string) => {
    setPools(prev => prev.map(pool => 
      pool.id === id ? { ...pool, enabled: !pool.enabled } : pool
    ));
  };

  const filteredPools = pools.filter(pool => 
    pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.startIP.includes(searchQuery) ||
    pool.endIP.includes(searchQuery)
  );

  const getTypeLabel = (type: IPPool['type']) => {
    switch (type) {
      case 'overload': return 'Overload';
      case 'one-to-one': return 'One-to-One';
      case 'fixed-port-range': return 'Fixed Port Range';
      case 'port-block-allocation': return 'Port Block Allocation';
    }
  };

  const getTypeBadgeColor = (type: IPPool['type']) => {
    switch (type) {
      case 'overload': return 'bg-blue-500/20 text-blue-400';
      case 'one-to-one': return 'bg-green-500/20 text-green-400';
      case 'fixed-port-range': return 'bg-purple-500/20 text-purple-400';
      case 'port-block-allocation': return 'bg-orange-500/20 text-orange-400';
    }
  };

  const totalIPs = pools.reduce((a, p) => a + p.totalIPs, 0);
  const usedIPs = pools.reduce((a, p) => a + p.usedIPs, 0);

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white">IP Pools</h1>
            <span className="text-xs text-gray-400 px-2 py-0.5 bg-[#1e2d3d] rounded">
              {pools.length} pools
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
              placeholder="Search IP Pools..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 pl-7 pr-3 text-xs bg-[#1e2d3d] border border-[#2a3f54] rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#4caf50]"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Total Pools</div>
            <div className="text-xl font-bold text-white">{pools.length}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Active Pools</div>
            <div className="text-xl font-bold text-green-400">{pools.filter(p => p.enabled).length}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Total IPs</div>
            <div className="text-xl font-bold text-blue-400">{totalIPs}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">IP Usage</div>
            <div className="text-xl font-bold text-purple-400">{Math.round((usedIPs / totalIPs) * 100)}%</div>
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
                <th className="px-3 py-2 font-medium">IP Range</th>
                <th className="px-3 py-2 font-medium">Interface</th>
                <th className="px-3 py-2 font-medium">ARP Reply</th>
                <th className="px-3 py-2 font-medium">Usage</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredPools.map((pool) => (
                <tr 
                  key={pool.id} 
                  className="border-t border-[#2a3f54] hover:bg-[#2a3f54]/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <input type="checkbox" className="rounded bg-[#16232f] border-[#2a3f54]" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Database size={14} className="text-purple-400" />
                      <div>
                        <div className="text-white font-medium">{pool.name}</div>
                        <div className="text-gray-500 text-[10px]">{pool.comments}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${getTypeBadgeColor(pool.type)}`}>
                      {getTypeLabel(pool.type)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="text-white">{pool.startIP}</div>
                    <div className="text-gray-500 text-[10px]">to {pool.endIP}</div>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{pool.associatedInterface}</td>
                  <td className="px-3 py-2">
                    {pool.arpReply ? (
                      <span className="text-green-400">Enable</span>
                    ) : (
                      <span className="text-gray-500">Disable</span>
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#16232f] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(pool.usedIPs / pool.totalIPs) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-[10px]">{pool.usedIPs}/{pool.totalIPs}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <FortiToggle 
                      enabled={pool.enabled} 
                      onToggle={() => togglePool(pool.id)} 
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

export default IPPools;
