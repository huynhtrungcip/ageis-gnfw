import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw,
  Search,
  ChevronDown,
  Server,
  Hash,
  Network
} from 'lucide-react';

interface ServiceObject {
  id: string;
  name: string;
  category: string;
  protocol: 'TCP' | 'UDP' | 'TCP/UDP' | 'ICMP' | 'IP';
  destPorts: string;
  sourcePorts: string;
  comment: string;
  references: number;
  isSystem: boolean;
}

const mockServices: ServiceObject[] = [
  { id: '1', name: 'HTTP', category: 'Web Access', protocol: 'TCP', destPorts: '80', sourcePorts: '1-65535', comment: 'Hypertext Transfer Protocol', references: 12, isSystem: true },
  { id: '2', name: 'HTTPS', category: 'Web Access', protocol: 'TCP', destPorts: '443', sourcePorts: '1-65535', comment: 'HTTP Secure', references: 15, isSystem: true },
  { id: '3', name: 'SSH', category: 'Remote Access', protocol: 'TCP', destPorts: '22', sourcePorts: '1-65535', comment: 'Secure Shell', references: 8, isSystem: true },
  { id: '4', name: 'FTP', category: 'File Access', protocol: 'TCP', destPorts: '21', sourcePorts: '1-65535', comment: 'File Transfer Protocol', references: 3, isSystem: true },
  { id: '5', name: 'DNS', category: 'Network Services', protocol: 'TCP/UDP', destPorts: '53', sourcePorts: '1-65535', comment: 'Domain Name System', references: 10, isSystem: true },
  { id: '6', name: 'SMTP', category: 'Email', protocol: 'TCP', destPorts: '25', sourcePorts: '1-65535', comment: 'Simple Mail Transfer Protocol', references: 4, isSystem: true },
  { id: '7', name: 'IMAP', category: 'Email', protocol: 'TCP', destPorts: '143,993', sourcePorts: '1-65535', comment: 'Internet Message Access Protocol', references: 2, isSystem: true },
  { id: '8', name: 'POP3', category: 'Email', protocol: 'TCP', destPorts: '110,995', sourcePorts: '1-65535', comment: 'Post Office Protocol', references: 1, isSystem: true },
  { id: '9', name: 'RDP', category: 'Remote Access', protocol: 'TCP', destPorts: '3389', sourcePorts: '1-65535', comment: 'Remote Desktop Protocol', references: 5, isSystem: true },
  { id: '10', name: 'PING', category: 'Network Services', protocol: 'ICMP', destPorts: '-', sourcePorts: '-', comment: 'ICMP Echo Request', references: 7, isSystem: true },
  { id: '11', name: 'Custom-App-1', category: 'Custom', protocol: 'TCP', destPorts: '8080-8090', sourcePorts: '1-65535', comment: 'Internal application ports', references: 2, isSystem: false },
  { id: '12', name: 'VoIP-Ports', category: 'Custom', protocol: 'UDP', destPorts: '5060-5061,10000-20000', sourcePorts: '1-65535', comment: 'VoIP signaling and media', references: 3, isSystem: false },
];

const Services = () => {
  const [services] = useState<ServiceObject[]>(mockServices);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const categories = ['all', ...Array.from(new Set(services.map(s => s.category)))];

  const filteredServices = services.filter(service => {
    const matchesSearch = searchQuery === '' ||
      service.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      service.comment.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeCategory === 'all' || service.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  const getProtocolColor = (protocol: string) => {
    switch (protocol) {
      case 'TCP': return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'UDP': return 'bg-green-100 text-green-700 border-green-200';
      case 'TCP/UDP': return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'ICMP': return 'bg-orange-100 text-orange-700 border-orange-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
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
                  <Server className="w-3 h-3" />
                  Service
                </button>
                <button className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2">
                  <Network className="w-3 h-3" />
                  Service Group
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

        {/* Category Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeCategory === cat 
                  ? "bg-white text-[hsl(142,70%,35%)] border-[hsl(142,70%,35%)]" 
                  : "text-[#666] border-transparent hover:text-[#333] hover:bg-[#f0f0f0]"
              )}
            >
              {cat === 'all' ? 'All Services' : cat}
              <span className={cn(
                "ml-1.5 px-1.5 py-0.5 text-[10px] rounded",
                activeCategory === cat ? "bg-[hsl(142,70%,35%)]/20 text-[hsl(142,70%,35%)]" : "bg-[#ddd] text-[#666]"
              )}>
                {cat === 'all' ? services.length : services.filter(s => s.category === cat).length}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="p-4">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">
                  <input type="checkbox" className="forti-checkbox" />
                </th>
                <th>Name</th>
                <th>Category</th>
                <th>Protocol</th>
                <th>Destination Port</th>
                <th>Comments</th>
                <th className="text-center">Ref.</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr key={service.id} className={cn(selectedIds.includes(service.id) && "selected")}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(service.id)}
                      onChange={() => handleSelect(service.id)}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Hash className="w-3 h-3 text-amber-600" />
                      <span className="text-[11px] font-medium">{service.name}</span>
                      {service.isSystem && (
                        <span className="text-[9px] px-1 py-0.5 bg-gray-100 text-gray-500 border border-gray-200 rounded">
                          SYSTEM
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="text-[11px] text-[#666]">{service.category}</td>
                  <td>
                    <span className={cn("text-[10px] px-1.5 py-0.5 border", getProtocolColor(service.protocol))}>
                      {service.protocol}
                    </span>
                  </td>
                  <td className="mono text-[11px]">{service.destPorts}</td>
                  <td className="text-[11px] text-[#666]">{service.comment}</td>
                  <td className="text-center">
                    <span className={cn(
                      "text-[11px]",
                      service.references > 0 ? "text-blue-600" : "text-[#999]"
                    )}>
                      {service.references}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredServices.length} services
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default Services;
