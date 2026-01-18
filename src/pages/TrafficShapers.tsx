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
  Gauge
} from 'lucide-react';

interface TrafficShaper {
  id: string;
  name: string;
  type: 'shared' | 'per-ip';
  guaranteedBandwidth: number;
  maximumBandwidth: number;
  burstBandwidth: number;
  priority: 'high' | 'medium' | 'low';
  perPolicy: boolean;
  diffservForward: boolean;
  enabled: boolean;
  currentUsage: number;
}

const mockShapers: TrafficShaper[] = [
  {
    id: '1',
    name: 'high-priority',
    type: 'shared',
    guaranteedBandwidth: 500,
    maximumBandwidth: 1000,
    burstBandwidth: 1200,
    priority: 'high',
    perPolicy: true,
    diffservForward: false,
    enabled: true,
    currentUsage: 456
  },
  {
    id: '2',
    name: 'medium-priority',
    type: 'shared',
    guaranteedBandwidth: 200,
    maximumBandwidth: 500,
    burstBandwidth: 600,
    priority: 'medium',
    perPolicy: true,
    diffservForward: false,
    enabled: true,
    currentUsage: 312
  },
  {
    id: '3',
    name: 'low-priority',
    type: 'shared',
    guaranteedBandwidth: 50,
    maximumBandwidth: 200,
    burstBandwidth: 250,
    priority: 'low',
    perPolicy: true,
    diffservForward: false,
    enabled: true,
    currentUsage: 89
  },
  {
    id: '4',
    name: 'voip-shaper',
    type: 'per-ip',
    guaranteedBandwidth: 100,
    maximumBandwidth: 150,
    burstBandwidth: 200,
    priority: 'high',
    perPolicy: false,
    diffservForward: true,
    enabled: true,
    currentUsage: 45
  },
  {
    id: '5',
    name: 'guest-limit',
    type: 'per-ip',
    guaranteedBandwidth: 10,
    maximumBandwidth: 50,
    burstBandwidth: 60,
    priority: 'low',
    perPolicy: false,
    diffservForward: false,
    enabled: true,
    currentUsage: 28
  },
  {
    id: '6',
    name: 'backup-shaper',
    type: 'shared',
    guaranteedBandwidth: 100,
    maximumBandwidth: 300,
    burstBandwidth: 350,
    priority: 'low',
    perPolicy: true,
    diffservForward: false,
    enabled: false,
    currentUsage: 0
  },
];

const TrafficShapers = () => {
  const [shapers, setShapers] = useState<TrafficShaper[]>(mockShapers);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleShaper = (id: string) => {
    setShapers(prev => prev.map(shaper => 
      shaper.id === id ? { ...shaper, enabled: !shaper.enabled } : shaper
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredShapers = shapers.filter(shaper => 
    searchQuery === '' ||
    shaper.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatBandwidth = (kbps: number) => {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(0)} Mbps`;
    }
    return `${kbps} Kbps`;
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
                  <Gauge className="w-3 h-3" />
                  Shared Shaper
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Gauge className="w-3 h-3" />
                  Per-IP Shaper
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
                <th>Guaranteed</th>
                <th>Maximum</th>
                <th>Burst</th>
                <th>Priority</th>
                <th>Current Usage</th>
              </tr>
            </thead>
            <tbody>
              {filteredShapers.map((shaper) => (
                <tr key={shaper.id} className={cn(!shaper.enabled && "opacity-60", selectedIds.includes(shaper.id) && "selected")}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(shaper.id)}
                      onChange={() => handleSelect(shaper.id)}
                    />
                  </td>
                  <td>
                    <FortiToggle 
                      enabled={shaper.enabled} 
                      onToggle={() => toggleShaper(shaper.id)}
                      size="sm"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Gauge className="w-3 h-3 text-orange-600" />
                      <span className="text-[11px] font-medium">{shaper.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 border",
                      shaper.type === 'shared' && "bg-blue-100 text-blue-700 border-blue-200",
                      shaper.type === 'per-ip' && "bg-purple-100 text-purple-700 border-purple-200"
                    )}>
                      {shaper.type === 'shared' ? 'Shared' : 'Per-IP'}
                    </span>
                  </td>
                  <td className="mono text-[11px]">{formatBandwidth(shaper.guaranteedBandwidth)}</td>
                  <td className="mono text-[11px]">{formatBandwidth(shaper.maximumBandwidth)}</td>
                  <td className="mono text-[11px]">{formatBandwidth(shaper.burstBandwidth)}</td>
                  <td>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 border",
                      shaper.priority === 'high' && "bg-red-100 text-red-700 border-red-200",
                      shaper.priority === 'medium' && "bg-yellow-100 text-yellow-700 border-yellow-200",
                      shaper.priority === 'low' && "bg-blue-100 text-blue-700 border-blue-200"
                    )}>
                      {shaper.priority.charAt(0).toUpperCase() + shaper.priority.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden">
                        <div 
                          className={cn(
                            "h-full rounded-full",
                            shaper.currentUsage / shaper.maximumBandwidth > 0.8 ? "bg-red-500" :
                            shaper.currentUsage / shaper.maximumBandwidth > 0.5 ? "bg-yellow-500" : "bg-green-500"
                          )}
                          style={{ width: `${Math.min((shaper.currentUsage / shaper.maximumBandwidth) * 100, 100)}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#666]">{formatBandwidth(shaper.currentUsage)}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredShapers.length} traffic shapers
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default TrafficShapers;
