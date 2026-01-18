import { Shell } from '@/components/layout/Shell';
import { Plus, Edit, Trash2, RefreshCw, Search, Route, ArrowRight } from 'lucide-react';
import { useState } from 'react';
import { FortiToggle } from '@/components/ui/forti-toggle';

interface PolicyRoute {
  id: string;
  seq: number;
  incoming: string;
  source: string;
  destination: string;
  protocol: string;
  gateway: string;
  outInterface: string;
  status: 'enabled' | 'disabled';
  comment: string;
}

const mockPolicyRoutes: PolicyRoute[] = [
  { id: '1', seq: 1, incoming: 'internal', source: '10.0.1.0/24', destination: '0.0.0.0/0', protocol: 'any', gateway: '192.168.1.1', outInterface: 'wan1', status: 'enabled', comment: 'Force WAN1 for subnet' },
  { id: '2', seq: 2, incoming: 'internal', source: '10.0.2.0/24', destination: '0.0.0.0/0', protocol: 'any', gateway: '192.168.2.1', outInterface: 'wan2', status: 'enabled', comment: 'Force WAN2 for subnet' },
  { id: '3', seq: 3, incoming: 'dmz', source: '0.0.0.0/0', destination: '10.10.10.0/24', protocol: 'TCP/443', gateway: '192.168.100.1', outInterface: 'internal', status: 'disabled', comment: 'HTTPS to internal' },
];

const PolicyRoutes = () => {
  const [routes, setRoutes] = useState<PolicyRoute[]>(mockPolicyRoutes);
  const [searchQuery, setSearchQuery] = useState('');

  const toggleRoute = (id: string) => {
    setRoutes(prev => prev.map(r => 
      r.id === id ? { ...r, status: r.status === 'enabled' ? 'disabled' : 'enabled' } : r
    ));
  };

  const filteredRoutes = routes.filter(r => 
    r.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.destination.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.comment.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <div className="space-y-3">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Route size={18} className="text-primary" />
            <h1 className="text-base font-semibold text-foreground">Policy Routes</h1>
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
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80">
              <Edit size={12} />
              Edit
            </button>
            <button className="flex items-center gap-1.5 px-2.5 py-1 text-xs bg-destructive/10 text-destructive rounded hover:bg-destructive/20">
              <Trash2 size={12} />
              Delete
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search..."
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
                <th className="w-8 px-2 py-2"><input type="checkbox" className="rounded" /></th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Seq</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Incoming</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Source</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Destination</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Protocol</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Gateway</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Out Interface</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Comment</th>
              </tr>
            </thead>
            <tbody>
              {filteredRoutes.map((route) => (
                <tr key={route.id} className="border-b border-border hover:bg-muted/30">
                  <td className="px-2 py-2 text-center"><input type="checkbox" className="rounded" /></td>
                  <td className="px-3 py-2 text-foreground font-medium">{route.seq}</td>
                  <td className="px-3 py-2">
                    <FortiToggle enabled={route.status === 'enabled'} onToggle={() => toggleRoute(route.id)} />
                  </td>
                  <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{route.incoming}</span></td>
                  <td className="px-3 py-2 font-mono text-foreground">{route.source}</td>
                  <td className="px-3 py-2 font-mono text-foreground">{route.destination}</td>
                  <td className="px-3 py-2 text-muted-foreground">{route.protocol}</td>
                  <td className="px-3 py-2 font-mono text-foreground">{route.gateway}</td>
                  <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-green-100 text-green-700 rounded text-[10px]">{route.outInterface}</span></td>
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

export default PolicyRoutes;
