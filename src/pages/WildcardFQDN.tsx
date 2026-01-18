import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { Plus, Edit2, Trash2, Search, Globe, RefreshCw, ChevronDown, ExternalLink } from 'lucide-react';

interface WildcardFQDN {
  id: string;
  name: string;
  fqdn: string;
  interface: string;
  comment: string;
  visibility: boolean;
  references: number;
}

const mockFQDNs: WildcardFQDN[] = [
  {
    id: '1',
    name: 'google-services',
    fqdn: '*.google.com',
    interface: 'any',
    comment: 'All Google services',
    visibility: true,
    references: 5
  },
  {
    id: '2',
    name: 'microsoft-update',
    fqdn: '*.update.microsoft.com',
    interface: 'any',
    comment: 'Windows Update servers',
    visibility: true,
    references: 3
  },
  {
    id: '3',
    name: 'office365',
    fqdn: '*.office365.com',
    interface: 'any',
    comment: 'Microsoft Office 365',
    visibility: true,
    references: 4
  },
  {
    id: '4',
    name: 'aws-services',
    fqdn: '*.amazonaws.com',
    interface: 'wan1',
    comment: 'Amazon Web Services',
    visibility: true,
    references: 2
  },
  {
    id: '5',
    name: 'github',
    fqdn: '*.github.com',
    interface: 'any',
    comment: 'GitHub repositories',
    visibility: true,
    references: 1
  },
];

const WildcardFQDN = () => {
  const [fqdns, setFqdns] = useState<WildcardFQDN[]>(mockFQDNs);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredFQDNs = fqdns.filter(fqdn => 
    searchQuery === '' ||
    fqdn.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    fqdn.fqdn.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
                  <Globe className="w-3 h-3" />
                  Wildcard FQDN
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
                <th>Name</th>
                <th>Wildcard FQDN</th>
                <th>Interface</th>
                <th>Comments</th>
                <th className="text-center">Ref.</th>
              </tr>
            </thead>
            <tbody>
              {filteredFQDNs.map((fqdn) => (
                <tr key={fqdn.id} className={cn(selectedIds.includes(fqdn.id) && "selected")}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(fqdn.id)}
                      onChange={() => handleSelect(fqdn.id)}
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-purple-600" />
                      <span className="text-[11px] font-medium">{fqdn.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="mono text-[11px] flex items-center gap-1">
                      <ExternalLink className="w-3 h-3 text-[#999]" />
                      {fqdn.fqdn}
                    </span>
                  </td>
                  <td>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                      {fqdn.interface}
                    </span>
                  </td>
                  <td className="text-[11px] text-[#666]">{fqdn.comment}</td>
                  <td className="text-center">
                    <span className={cn(
                      "text-[11px]",
                      fqdn.references > 0 ? "text-blue-600" : "text-[#999]"
                    )}>
                      {fqdn.references}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredFQDNs.length} wildcard FQDN addresses
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default WildcardFQDN;
