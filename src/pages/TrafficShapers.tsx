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
  Gauge,
  ArrowUpDown
} from "lucide-react";
import { useState } from "react";

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

  const toggleShaper = (id: string) => {
    setShapers(prev => prev.map(shaper => 
      shaper.id === id ? { ...shaper, enabled: !shaper.enabled } : shaper
    ));
  };

  const filteredShapers = shapers.filter(shaper => 
    shaper.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getPriorityColor = (priority: TrafficShaper['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500/20 text-red-400';
      case 'medium': return 'bg-yellow-500/20 text-yellow-400';
      case 'low': return 'bg-blue-500/20 text-blue-400';
    }
  };

  const formatBandwidth = (kbps: number) => {
    if (kbps >= 1000) {
      return `${(kbps / 1000).toFixed(1)} Mbps`;
    }
    return `${kbps} Kbps`;
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-white">Traffic Shapers</h1>
            <span className="text-xs text-gray-400 px-2 py-0.5 bg-[#1e2d3d] rounded">
              {shapers.length} shapers
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
              placeholder="Search Traffic Shapers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-7 pl-7 pr-3 text-xs bg-[#1e2d3d] border border-[#2a3f54] rounded text-gray-300 placeholder-gray-500 focus:outline-none focus:border-[#4caf50]"
            />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Total Shapers</div>
            <div className="text-xl font-bold text-white">{shapers.length}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Active</div>
            <div className="text-xl font-bold text-green-400">{shapers.filter(s => s.enabled).length}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Shared</div>
            <div className="text-xl font-bold text-blue-400">{shapers.filter(s => s.type === 'shared').length}</div>
          </div>
          <div className="bg-[#1e2d3d] rounded p-3 border border-[#2a3f54]">
            <div className="text-[10px] text-gray-400 uppercase mb-1">Per-IP</div>
            <div className="text-xl font-bold text-purple-400">{shapers.filter(s => s.type === 'per-ip').length}</div>
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
                <th className="px-3 py-2 font-medium">Guaranteed</th>
                <th className="px-3 py-2 font-medium">Maximum</th>
                <th className="px-3 py-2 font-medium">Burst</th>
                <th className="px-3 py-2 font-medium">Priority</th>
                <th className="px-3 py-2 font-medium">Current Usage</th>
                <th className="px-3 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredShapers.map((shaper) => (
                <tr 
                  key={shaper.id} 
                  className="border-t border-[#2a3f54] hover:bg-[#2a3f54]/30 transition-colors"
                >
                  <td className="px-3 py-2">
                    <input type="checkbox" className="rounded bg-[#16232f] border-[#2a3f54]" />
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <Gauge size={14} className="text-orange-400" />
                      <span className="text-white font-medium">{shaper.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${
                      shaper.type === 'shared' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'
                    }`}>
                      {shaper.type === 'shared' ? 'Shared' : 'Per-IP'}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-300">{formatBandwidth(shaper.guaranteedBandwidth)}</td>
                  <td className="px-3 py-2 text-gray-300">{formatBandwidth(shaper.maximumBandwidth)}</td>
                  <td className="px-3 py-2 text-gray-300">{formatBandwidth(shaper.burstBandwidth)}</td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] ${getPriorityColor(shaper.priority)}`}>
                      {shaper.priority.charAt(0).toUpperCase() + shaper.priority.slice(1)}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-[#16232f] rounded-full overflow-hidden max-w-[60px]">
                        <div 
                          className="h-full bg-green-500 rounded-full"
                          style={{ width: `${(shaper.currentUsage / shaper.maximumBandwidth) * 100}%` }}
                        />
                      </div>
                      <span className="text-gray-400 text-[10px]">{formatBandwidth(shaper.currentUsage)}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <FortiToggle 
                      enabled={shaper.enabled} 
                      onToggle={() => toggleShaper(shaper.id)} 
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

export default TrafficShapers;
