import { Shell } from '@/components/layout/Shell';
import { Settings, Globe, RefreshCw, Save, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FortiToggle } from '@/components/ui/forti-toggle';

interface BGPNeighbor {
  id: string;
  ip: string;
  remoteAS: number;
  description: string;
  status: 'established' | 'active' | 'idle';
  uptime: string;
  prefixesReceived: number;
}

const BGPConfig = () => {
  const [enabled, setEnabled] = useState(true);
  const [localAS, setLocalAS] = useState(65001);
  const [routerId, setRouterId] = useState('10.0.0.1');
  const [neighbors] = useState<BGPNeighbor[]>([
    { id: '1', ip: '192.168.1.1', remoteAS: 65002, description: 'ISP Primary', status: 'established', uptime: '5d 12h', prefixesReceived: 125000 },
    { id: '2', ip: '192.168.2.1', remoteAS: 65003, description: 'ISP Backup', status: 'established', uptime: '3d 8h', prefixesReceived: 98500 },
    { id: '3', ip: '10.10.10.1', remoteAS: 65004, description: 'Partner Network', status: 'idle', uptime: '-', prefixesReceived: 0 },
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'established': return 'bg-green-100 text-green-700';
      case 'active': return 'bg-yellow-100 text-yellow-700';
      default: return 'bg-red-100 text-red-700';
    }
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe size={18} className="text-primary" />
            <h1 className="text-base font-semibold text-foreground">BGP Configuration</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
              <Save size={12} />
              Apply
            </button>
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-muted/30 border border-border rounded p-3">
            <div className="text-xs text-muted-foreground">Local AS</div>
            <div className="text-lg font-bold text-foreground">{localAS}</div>
          </div>
          <div className="bg-muted/30 border border-border rounded p-3">
            <div className="text-xs text-muted-foreground">Neighbors</div>
            <div className="text-lg font-bold text-foreground">{neighbors.length}</div>
          </div>
          <div className="bg-muted/30 border border-border rounded p-3">
            <div className="text-xs text-muted-foreground">Established</div>
            <div className="text-lg font-bold text-green-600">{neighbors.filter(n => n.status === 'established').length}</div>
          </div>
          <div className="bg-muted/30 border border-border rounded p-3">
            <div className="text-xs text-muted-foreground">Total Prefixes</div>
            <div className="text-lg font-bold text-foreground">{neighbors.reduce((acc, n) => acc + n.prefixesReceived, 0).toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          {/* Basic Settings */}
          <div className="border border-border rounded">
            <div className="bg-muted/50 px-3 py-2 border-b border-border">
              <h2 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Settings size={12} />
                Basic Settings
              </h2>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Enable BGP</span>
                <FortiToggle enabled={enabled} onToggle={() => setEnabled(!enabled)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Local AS</span>
                <input 
                  type="number" 
                  value={localAS}
                  onChange={(e) => setLocalAS(parseInt(e.target.value))}
                  className="w-24 text-xs border border-border rounded px-2 py-1 bg-background font-mono"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Router ID</span>
                <input 
                  type="text" 
                  value={routerId}
                  onChange={(e) => setRouterId(e.target.value)}
                  className="w-28 text-xs border border-border rounded px-2 py-1 bg-background font-mono"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Keepalive</span>
                <input type="number" defaultValue={60} className="w-20 text-xs border border-border rounded px-2 py-1 bg-background" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Hold Time</span>
                <input type="number" defaultValue={180} className="w-20 text-xs border border-border rounded px-2 py-1 bg-background" />
              </div>
            </div>
          </div>

          {/* Neighbors */}
          <div className="col-span-2 border border-border rounded">
            <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-semibold text-foreground">BGP Neighbors</h2>
              <button className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded">
                <Plus size={12} />
                Add Neighbor
              </button>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Neighbor IP</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Remote AS</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Description</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Uptime</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Prefixes</th>
                  <th className="w-10"></th>
                </tr>
              </thead>
              <tbody>
                {neighbors.map((neighbor) => (
                  <tr key={neighbor.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-mono">{neighbor.ip}</td>
                    <td className="px-3 py-2 font-mono">{neighbor.remoteAS}</td>
                    <td className="px-3 py-2 text-muted-foreground">{neighbor.description}</td>
                    <td className="px-3 py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStatusColor(neighbor.status)}`}>
                        {neighbor.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{neighbor.uptime}</td>
                    <td className="px-3 py-2">{neighbor.prefixesReceived.toLocaleString()}</td>
                    <td className="px-3 py-2">
                      <button className="p-1 text-destructive hover:bg-destructive/10 rounded">
                        <Trash2 size={10} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default BGPConfig;
