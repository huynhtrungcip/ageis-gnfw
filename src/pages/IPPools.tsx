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
  Database,
  Layers
} from 'lucide-react';

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
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const togglePool = (id: string) => {
    setPools(prev => prev.map(pool => 
      pool.id === id ? { ...pool, enabled: !pool.enabled } : pool
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredPools = pools.filter(pool => 
    searchQuery === '' ||
    pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.startIP.includes(searchQuery) ||
    pool.endIP.includes(searchQuery)
  );

  const getTypeLabel = (type: IPPool['type']) => {
    switch (type) {
      case 'overload': return 'Overload';
      case 'one-to-one': return 'One-to-One';
      case 'fixed-port-range': return 'Fixed Port Range';
      case 'port-block-allocation': return 'Port Block';
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
                  <Database className="w-3 h-3" />
                  Overload
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Layers className="w-3 h-3" />
                  One-to-One
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Database className="w-3 h-3" />
                  Fixed Port Range
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
                <th>Start IP</th>
                <th>End IP</th>
                <th>Interface</th>
                <th>ARP Reply</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              {filteredPools.map((pool) => (
                <tr key={pool.id} className={cn(!pool.enabled && "opacity-60", selectedIds.includes(pool.id) && "selected")}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(pool.id)}
                      onChange={() => handleSelect(pool.id)}
                    />
                  </td>
                  <td>
                    <FortiToggle 
                      enabled={pool.enabled} 
                      onToggle={() => togglePool(pool.id)}
                      size="sm"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3 text-purple-600" />
                      <div>
                        <div className="text-[11px] font-medium">{pool.name}</div>
                        <div className="text-[10px] text-[#999]">{pool.comments}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 border",
                      pool.type === 'overload' && "bg-blue-100 text-blue-700 border-blue-200",
                      pool.type === 'one-to-one' && "bg-green-100 text-green-700 border-green-200",
                      pool.type === 'fixed-port-range' && "bg-purple-100 text-purple-700 border-purple-200",
                      pool.type === 'port-block-allocation' && "bg-orange-100 text-orange-700 border-orange-200"
                    )}>
                      {getTypeLabel(pool.type)}
                    </span>
                  </td>
                  <td className="mono text-[11px]">{pool.startIP}</td>
                  <td className="mono text-[11px]">{pool.endIP}</td>
                  <td>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                      {pool.associatedInterface}
                    </span>
                  </td>
                  <td>
                    {pool.arpReply ? (
                      <span className="text-[10px] text-green-600">Enable</span>
                    ) : (
                      <span className="text-[10px] text-[#999]">Disable</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(pool.usedIPs / pool.totalIPs) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#666]">{pool.usedIPs}/{pool.totalIPs}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredPools.length} IP pools
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default IPPools;
