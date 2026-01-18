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
  Globe,
  Shield,
  AlertTriangle,
  Ban
} from 'lucide-react';

interface DNSFilterProfile {
  id: string;
  name: string;
  comment: string;
  domainFilter: boolean;
  fortiGuardCategory: boolean;
  safeSearch: boolean;
  youtubeRestrict: boolean;
  logAllDomains: boolean;
  enabled: boolean;
  blockedCategories: number;
  references: number;
}

const mockProfiles: DNSFilterProfile[] = [
  {
    id: '1',
    name: 'default',
    comment: 'Default DNS filter profile',
    domainFilter: true,
    fortiGuardCategory: true,
    safeSearch: true,
    youtubeRestrict: false,
    logAllDomains: true,
    enabled: true,
    blockedCategories: 12,
    references: 8
  },
  {
    id: '2',
    name: 'strict',
    comment: 'Strict filtering for guest network',
    domainFilter: true,
    fortiGuardCategory: true,
    safeSearch: true,
    youtubeRestrict: true,
    logAllDomains: true,
    enabled: true,
    blockedCategories: 24,
    references: 3
  },
  {
    id: '3',
    name: 'minimal',
    comment: 'Minimal filtering for trusted users',
    domainFilter: true,
    fortiGuardCategory: false,
    safeSearch: false,
    youtubeRestrict: false,
    logAllDomains: false,
    enabled: true,
    blockedCategories: 5,
    references: 2
  },
  {
    id: '4',
    name: 'kids-safe',
    comment: 'Child-safe browsing profile',
    domainFilter: true,
    fortiGuardCategory: true,
    safeSearch: true,
    youtubeRestrict: true,
    logAllDomains: true,
    enabled: true,
    blockedCategories: 32,
    references: 1
  },
];

const DNSFilter = () => {
  const [profiles, setProfiles] = useState<DNSFilterProfile[]>(mockProfiles);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showCreateMenu, setShowCreateMenu] = useState(false);

  const toggleProfile = (id: string) => {
    setProfiles(prev => prev.map(profile => 
      profile.id === id ? { ...profile, enabled: !profile.enabled } : profile
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const filteredProfiles = profiles.filter(profile => 
    searchQuery === '' ||
    profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    profile.comment.toLowerCase().includes(searchQuery.toLowerCase())
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
                  DNS Filter Profile
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
                <th>FortiGuard</th>
                <th>Safe Search</th>
                <th>YouTube Restrict</th>
                <th>Blocked Categories</th>
                <th className="text-center">Ref.</th>
              </tr>
            </thead>
            <tbody>
              {filteredProfiles.map((profile) => (
                <tr key={profile.id} className={cn(!profile.enabled && "opacity-60", selectedIds.includes(profile.id) && "selected")}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(profile.id)}
                      onChange={() => handleSelect(profile.id)}
                    />
                  </td>
                  <td>
                    <FortiToggle 
                      enabled={profile.enabled} 
                      onToggle={() => toggleProfile(profile.id)}
                      size="sm"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Globe className="w-3 h-3 text-cyan-600" />
                      <div>
                        <div className="text-[11px] font-medium">{profile.name}</div>
                        <div className="text-[10px] text-[#999]">{profile.comment}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    {profile.fortiGuardCategory ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-green-100 text-green-700 border border-green-200 flex items-center gap-1 w-fit">
                        <Shield className="w-3 h-3" /> Enabled
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#999]">Disabled</span>
                    )}
                  </td>
                  <td>
                    {profile.safeSearch ? (
                      <span className="text-green-600 text-[11px]">✓ On</span>
                    ) : (
                      <span className="text-[#999] text-[11px]">Off</span>
                    )}
                  </td>
                  <td>
                    {profile.youtubeRestrict ? (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-100 text-red-700 border border-red-200 flex items-center gap-1 w-fit">
                        <Ban className="w-3 h-3" /> Strict
                      </span>
                    ) : (
                      <span className="text-[#999] text-[11px]">None</span>
                    )}
                  </td>
                  <td>
                    <span className={cn(
                      "text-[11px] font-medium",
                      profile.blockedCategories > 20 ? "text-red-600" :
                      profile.blockedCategories > 10 ? "text-orange-600" : "text-blue-600"
                    )}>
                      {profile.blockedCategories}
                    </span>
                  </td>
                  <td className="text-center">
                    <span className={cn(
                      "text-[11px]",
                      profile.references > 0 ? "text-blue-600" : "text-[#999]"
                    )}>
                      {profile.references}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredProfiles.length} DNS filter profiles
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default DNSFilter;
