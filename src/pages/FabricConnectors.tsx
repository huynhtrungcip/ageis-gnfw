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
  Link2,
  Cloud,
  Shield,
  Activity
} from 'lucide-react';

interface FabricConnector {
  id: string;
  name: string;
  type: 'sdn' | 'cloud' | 'threat-feed' | 'automation';
  provider: string;
  status: 'connected' | 'disconnected' | 'error';
  lastSync: string;
  enabled: boolean;
  objects: number;
}

const mockConnectors: FabricConnector[] = [
  {
    id: '1',
    name: 'AWS-Connector',
    type: 'cloud',
    provider: 'Amazon Web Services',
    status: 'connected',
    lastSync: '2 min ago',
    enabled: true,
    objects: 156
  },
  {
    id: '2',
    name: 'Azure-Connector',
    type: 'cloud',
    provider: 'Microsoft Azure',
    status: 'connected',
    lastSync: '5 min ago',
    enabled: true,
    objects: 89
  },
  {
    id: '3',
    name: 'VMware-SDN',
    type: 'sdn',
    provider: 'VMware NSX',
    status: 'connected',
    lastSync: '1 min ago',
    enabled: true,
    objects: 234
  },
  {
    id: '4',
    name: 'Aegis Guard Feed',
    type: 'threat-feed',
    provider: 'Aegis Guard',
    status: 'connected',
    lastSync: '30 sec ago',
    enabled: true,
    objects: 45678
  },
  {
    id: '5',
    name: 'GCP-Connector',
    type: 'cloud',
    provider: 'Google Cloud Platform',
    status: 'disconnected',
    lastSync: '2 hours ago',
    enabled: false,
    objects: 0
  },
  {
    id: '6',
    name: 'STIX-TAXII-Feed',
    type: 'threat-feed',
    provider: 'External TAXII Server',
    status: 'error',
    lastSync: 'Failed',
    enabled: true,
    objects: 0
  },
];

const FabricConnectors = () => {
  const [connectors, setConnectors] = useState<FabricConnector[]>(mockConnectors);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const toggleConnector = (id: string) => {
    setConnectors(prev => prev.map(conn => 
      conn.id === id ? { ...conn, enabled: !conn.enabled } : conn
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredConnectors = connectors.filter(conn => 
    searchQuery === '' ||
    conn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conn.provider.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusBadge = (status: FabricConnector['status']) => {
    switch (status) {
      case 'connected':
        return <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 w-fit"><Activity className="w-3 h-3" /> Connected</span>;
      case 'disconnected':
        return <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-600 border border-gray-200">Disconnected</span>;
      case 'error':
        return <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-200">Error</span>;
    }
  };

  const getTypeIcon = (type: FabricConnector['type']) => {
    switch (type) {
      case 'cloud': return <Cloud className="w-3 h-3 text-blue-600" />;
      case 'sdn': return <Link2 className="w-3 h-3 text-purple-600" />;
      case 'threat-feed': return <Shield className="w-3 h-3 text-red-600" />;
      case 'automation': return <Activity className="w-3 h-3 text-green-600" />;
    }
  };

  const getTypeLabel = (type: FabricConnector['type']) => {
    switch (type) {
      case 'cloud': return 'Cloud';
      case 'sdn': return 'SDN';
      case 'threat-feed': return 'Threat Feed';
      case 'automation': return 'Automation';
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
              <div className="absolute top-full left-0 mt-1 bg-white border border-[#ccc] shadow-lg z-50 min-w-[200px]">
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Cloud className="w-3 h-3" />
                  Cloud Connector
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Link2 className="w-3 h-3" />
                  SDN Connector
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  Threat Feed
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
            Sync All
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
                <th>Provider</th>
                <th>Connection</th>
                <th>Last Sync</th>
                <th className="text-right">Objects</th>
              </tr>
            </thead>
            <tbody>
              {filteredConnectors.map((connector) => (
                <tr key={connector.id} className={cn(!connector.enabled && "opacity-60", selectedIds.includes(connector.id) && "selected")}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(connector.id)}
                      onChange={() => handleSelect(connector.id)}
                    />
                  </td>
                  <td>
                    <FortiToggle 
                      enabled={connector.enabled} 
                      onToggle={() => toggleConnector(connector.id)}
                      size="sm"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      {getTypeIcon(connector.type)}
                      <span className="text-[11px] font-medium">{connector.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-700 border border-gray-200">
                      {getTypeLabel(connector.type)}
                    </span>
                  </td>
                  <td className="text-[11px] text-[#666]">{connector.provider}</td>
                  <td>{getStatusBadge(connector.status)}</td>
                  <td className="text-[11px] text-[#666]">{connector.lastSync}</td>
                  <td className="text-right text-[11px] text-[#666]">{connector.objects.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredConnectors.length} fabric connectors
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default FabricConnectors;
