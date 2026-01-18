import { Shell } from '@/components/layout/Shell';
import { Plus, Edit, Trash2, RefreshCw, Search, Network, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { cn } from '@/lib/utils';

interface StaticRoute {
  id: string;
  destination: string;
  gateway: string;
  interface: string;
  distance: number;
  priority: number;
  status: 'enabled' | 'disabled';
  comment: string;
}

const mockRoutes: StaticRoute[] = [
  { id: '1', destination: '0.0.0.0/0', gateway: '192.168.1.1', interface: 'wan1', distance: 10, priority: 0, status: 'enabled', comment: 'Default Gateway' },
  { id: '2', destination: '10.0.0.0/8', gateway: '192.168.100.1', interface: 'internal', distance: 10, priority: 0, status: 'enabled', comment: 'Internal Network' },
  { id: '3', destination: '172.16.0.0/12', gateway: '192.168.100.254', interface: 'dmz', distance: 10, priority: 0, status: 'enabled', comment: 'DMZ Route' },
  { id: '4', destination: '192.168.50.0/24', gateway: '192.168.1.254', interface: 'wan2', distance: 20, priority: 5, status: 'disabled', comment: 'Backup Route' },
];

const StaticRoutes = () => {
  const [routes, setRoutes] = useState<StaticRoute[]>(mockRoutes);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const toggleRoute = (id: string) => {
    setRoutes(prev => prev.map(r => 
      r.id === id ? { ...r, status: r.status === 'enabled' ? 'disabled' : 'enabled' } : r
    ));
  };

  const filteredRoutes = routes.filter(r => 
    r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.gateway.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.interface.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network size={18} className="text-primary" />
            <h1 className="text-base font-semibold text-foreground">Static Routes</h1>
            <span className="text-xs text-muted-foreground">({routes.length})</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between bg-muted/30 border border-border rounded px-2 py-1.5">
          <div className="flex items-center gap-1">
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
              <Plus size={12} />
              Create New
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80" disabled={selectedIds.length === 0}>
              <Edit size={12} />
              Edit
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20" disabled={selectedIds.length === 0}>
              <Trash2 size={12} />
              Delete
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search routes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-7 pr-3 py-1 text-xs bg-background border border-border rounded w-48 focus:outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="border border-border rounded overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-muted/50 border-b border-border">
                <th className="w-8 px-2 py-2">
                  <input type="checkbox" className="rounded" />
                </th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Destination</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Gateway</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Interface</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Distance</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Priority</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Comment</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-2 py-2 text-center">
                    <input type="checkbox" className="rounded" />
                  </td>
                  <td className="px-3 py-2">
                    <FortiToggle 
                      enabled={route.status === 'enabled'} 
                      onToggle={() => toggleRoute(route.id)} 
                    />
                  </td>
                  <td className="px-3 py-2 font-mono text-foreground">{route.destination}</td>
                  <td className="px-3 py-2 font-mono text-foreground flex items-center gap-1">
                    <ArrowRight size={10} className="text-muted-foreground" />
                    {route.gateway}
                  </td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{route.interface}</span>
                  </td>
                  <td className="px-3 py-2 text-muted-foreground">{route.distance}</td>
                  <td className="px-3 py-2 text-muted-foreground">{route.priority}</td>
                  <td className="px-3 py-2 text-muted-foreground">{route.comment}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
};

export default StaticRoutes;
