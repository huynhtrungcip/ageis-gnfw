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
  ArrowUpDown,
  Network
} from 'lucide-react';

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
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const togglePolicy = (id: string) => {
    setPolicies(prev => prev.map(policy => 
      policy.id === id ? { ...policy, enabled: !policy.enabled } : policy
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredPolicies = policies.filter(policy => 
    searchQuery === '' ||
    policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.application.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.trafficShaper.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' B';
  };

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
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
                <th className="w-10">ID</th>
                <th>Name</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Application</th>
                <th>Shaper</th>
                <th className="text-right">Matches</th>
                <th className="text-right">Bytes</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((policy, index) => (
                <tr key={policy.id} className={cn(!policy.enabled && "opacity-60", selectedIds.includes(policy.id) && "selected")}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(policy.id)}
                      onChange={() => handleSelect(policy.id)}
                    />
                  </td>
                  <td>
                    <FortiToggle 
                      enabled={policy.enabled} 
                      onToggle={() => togglePolicy(policy.id)}
                      size="sm"
                    />
                  </td>
                  <td className="text-[11px] text-[#666]">{index + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-3 h-3 text-cyan-600" />
                      <span className="text-[11px] font-medium">{policy.name}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <span className="w-3 h-3 bg-green-400 rounded-sm" />
                        {policy.source}
                      </span>
                      <div className="text-[10px] text-[#999]">{policy.srcInterface}</div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Network className="w-3 h-3" />
                        {policy.destination}
                      </span>
                      <div className="text-[10px] text-[#999]">{policy.dstInterface}</div>
                    </div>
                  </td>
                  <td>
                    <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200">
                      {policy.application}
                    </span>
                  </td>
                  <td>
                    {policy.trafficShaper ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-orange-100 text-orange-700 border border-orange-200">
                        {policy.trafficShaper}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#999]">—</span>
                    )}
                  </td>
                  <td className="text-right text-[11px] text-[#666]">{policy.matches.toLocaleString()}</td>
                  <td className="text-right text-[11px] text-[#666]">{formatBytes(policy.bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredPolicies.length} shaping policies
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default TrafficShapingPolicy;
