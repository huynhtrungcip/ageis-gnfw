import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { cn } from '@/lib/utils';
import { 
  Search, 
  Plus,
  RefreshCw,
  Star,
  Shield,
  Globe,
  MessageSquare,
  Video,
  Music,
  Gamepad2,
  Cloud,
  Mail,
  Download,
  ChevronDown,
  Filter,
  Eye,
  Ban,
  Activity
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';

interface AppSignature {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  technology: string;
  risk: 1 | 2 | 3 | 4 | 5;
  popularity: 1 | 2 | 3 | 4 | 5;
  vendor: string;
  protocols: string[];
  action: 'allow' | 'monitor' | 'block';
  description: string;
}

const mockSignatures: AppSignature[] = [
  { id: 'app-1', name: 'Facebook', category: 'Social.Media', subcategory: 'Social.Networking', technology: 'Browser-Based', risk: 3, popularity: 5, vendor: 'Meta', protocols: ['HTTP', 'HTTPS'], action: 'monitor', description: 'Facebook social networking platform' },
  { id: 'app-2', name: 'YouTube', category: 'Video/Audio', subcategory: 'Streaming.Media', technology: 'Browser-Based', risk: 2, popularity: 5, vendor: 'Google', protocols: ['HTTPS'], action: 'allow', description: 'YouTube video streaming service' },
  { id: 'app-3', name: 'WhatsApp', category: 'Collaboration', subcategory: 'Instant.Messaging', technology: 'Client-Server', risk: 2, popularity: 5, vendor: 'Meta', protocols: ['HTTPS', 'TLS'], action: 'allow', description: 'WhatsApp messaging application' },
  { id: 'app-4', name: 'BitTorrent', category: 'P2P', subcategory: 'File.Sharing', technology: 'Peer-to-Peer', risk: 5, popularity: 4, vendor: 'BitTorrent Inc', protocols: ['TCP', 'UDP'], action: 'block', description: 'BitTorrent peer-to-peer file sharing' },
  { id: 'app-5', name: 'Zoom', category: 'Collaboration', subcategory: 'VoIP/Video.Conferencing', technology: 'Client-Server', risk: 2, popularity: 5, vendor: 'Zoom', protocols: ['HTTPS', 'UDP'], action: 'allow', description: 'Zoom video conferencing' },
  { id: 'app-6', name: 'Dropbox', category: 'Cloud.IT', subcategory: 'Cloud.Storage', technology: 'Client-Server', risk: 3, popularity: 4, vendor: 'Dropbox', protocols: ['HTTPS'], action: 'monitor', description: 'Dropbox cloud storage service' },
  { id: 'app-7', name: 'Spotify', category: 'Video/Audio', subcategory: 'Streaming.Media', technology: 'Client-Server', risk: 2, popularity: 5, vendor: 'Spotify', protocols: ['HTTPS'], action: 'allow', description: 'Spotify music streaming' },
  { id: 'app-8', name: 'Steam', category: 'Game', subcategory: 'Gaming.Platform', technology: 'Client-Server', risk: 3, popularity: 4, vendor: 'Valve', protocols: ['TCP', 'UDP'], action: 'monitor', description: 'Steam gaming platform' },
  { id: 'app-9', name: 'TikTok', category: 'Social.Media', subcategory: 'Social.Networking', technology: 'Browser-Based', risk: 4, popularity: 5, vendor: 'ByteDance', protocols: ['HTTPS'], action: 'block', description: 'TikTok short video platform' },
  { id: 'app-10', name: 'Gmail', category: 'Email', subcategory: 'Webmail', technology: 'Browser-Based', risk: 2, popularity: 5, vendor: 'Google', protocols: ['HTTPS'], action: 'allow', description: 'Gmail email service' },
  { id: 'app-11', name: 'Tor', category: 'Proxy', subcategory: 'Anonymous.Proxy', technology: 'Network-Protocol', risk: 5, popularity: 3, vendor: 'Tor Project', protocols: ['TCP'], action: 'block', description: 'Tor anonymous network' },
  { id: 'app-12', name: 'Netflix', category: 'Video/Audio', subcategory: 'Streaming.Media', technology: 'Browser-Based', risk: 2, popularity: 5, vendor: 'Netflix', protocols: ['HTTPS'], action: 'allow', description: 'Netflix video streaming' },
  { id: 'app-13', name: 'Microsoft Teams', category: 'Collaboration', subcategory: 'VoIP/Video.Conferencing', technology: 'Client-Server', risk: 1, popularity: 5, vendor: 'Microsoft', protocols: ['HTTPS', 'UDP'], action: 'allow', description: 'Microsoft Teams collaboration' },
  { id: 'app-14', name: 'VPN.Tunnel', category: 'VPN', subcategory: 'Encrypted.Tunnel', technology: 'Network-Protocol', risk: 4, popularity: 4, vendor: 'Various', protocols: ['TCP', 'UDP'], action: 'monitor', description: 'Generic VPN tunnel detection' },
  { id: 'app-15', name: 'Slack', category: 'Collaboration', subcategory: 'Instant.Messaging', technology: 'Client-Server', risk: 1, popularity: 4, vendor: 'Salesforce', protocols: ['HTTPS', 'WSS'], action: 'allow', description: 'Slack team messaging' },
];

const categories = [
  { id: 'all', name: 'All Categories', icon: Globe },
  { id: 'Social.Media', name: 'Social Media', icon: MessageSquare },
  { id: 'Video/Audio', name: 'Video/Audio', icon: Video },
  { id: 'Collaboration', name: 'Collaboration', icon: MessageSquare },
  { id: 'P2P', name: 'Peer-to-Peer', icon: Activity },
  { id: 'Cloud.IT', name: 'Cloud IT', icon: Cloud },
  { id: 'Game', name: 'Gaming', icon: Gamepad2 },
  { id: 'Email', name: 'Email', icon: Mail },
  { id: 'Proxy', name: 'Proxy', icon: Shield },
  { id: 'VPN', name: 'VPN', icon: Shield },
];

const ApplicationControl = () => {
  const { demoMode } = useDemoMode();
  const [signatures, setSignatures] = useState<AppSignature[]>(demoMode ? mockSignatures : []);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedRisk, setSelectedRisk] = useState('all');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedRows, setSelectedRows] = useState<string[]>([]);

  const filtered = signatures.filter(sig => {
    const matchesSearch = search === '' || 
      sig.name.toLowerCase().includes(search.toLowerCase()) ||
      sig.vendor.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || sig.category === selectedCategory;
    const matchesRisk = selectedRisk === 'all' || sig.risk === parseInt(selectedRisk);
    const matchesAction = selectedAction === 'all' || sig.action === selectedAction;
    return matchesSearch && matchesCategory && matchesRisk && matchesAction;
  });

  const handleChangeAction = (id: string, action: AppSignature['action']) => {
    setSignatures(prev => prev.map(s => 
      s.id === id ? { ...s, action } : s
    ));
    toast.success('Application action updated');
  };

  const handleBulkAction = (action: AppSignature['action']) => {
    setSignatures(prev => prev.map(s => 
      selectedRows.includes(s.id) ? { ...s, action } : s
    ));
    setSelectedRows([]);
    toast.success(`${selectedRows.length} applications updated`);
  };

  const toggleRowSelection = (id: string) => {
    setSelectedRows(prev => 
      prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]
    );
  };

  const toggleAllRows = () => {
    if (selectedRows.length === filtered.length) {
      setSelectedRows([]);
    } else {
      setSelectedRows(filtered.map(s => s.id));
    }
  };

  const RiskBar = ({ risk }: { risk: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(level => (
        <div 
          key={level}
          className={cn(
            "w-3 h-2 rounded-sm",
            level <= risk 
              ? risk >= 4 ? "bg-red-500" : risk >= 3 ? "bg-amber-500" : "bg-green-500"
              : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );

  const PopularityStars = ({ popularity }: { popularity: number }) => (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(level => (
        <Star 
          key={level}
          size={12}
          className={cn(
            level <= popularity 
              ? "text-amber-400 fill-amber-400" 
              : "text-gray-300"
          )}
        />
      ))}
    </div>
  );

  const ActionBadge = ({ action, onChange }: { action: string; onChange: (a: AppSignature['action']) => void }) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className={cn(
          "forti-tag cursor-pointer flex items-center gap-1",
          action === 'allow' ? "bg-green-100 text-green-700" :
          action === 'monitor' ? "bg-blue-100 text-blue-700" :
          "bg-red-100 text-red-700"
        )}>
          {action === 'allow' && <Eye size={10} />}
          {action === 'monitor' && <Activity size={10} />}
          {action === 'block' && <Ban size={10} />}
          {action.toUpperCase()}
          <ChevronDown size={10} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="bg-white border shadow-lg z-50">
        <DropdownMenuItem onClick={() => onChange('allow')} className="cursor-pointer text-green-700">
          <Eye size={14} className="mr-2" /> Allow
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('monitor')} className="cursor-pointer text-blue-700">
          <Activity size={14} className="mr-2" /> Monitor
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => onChange('block')} className="cursor-pointer text-red-700">
          <Ban size={14} className="mr-2" /> Block
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const stats = {
    total: signatures.length,
    allowed: signatures.filter(s => s.action === 'allow').length,
    monitored: signatures.filter(s => s.action === 'monitor').length,
    blocked: signatures.filter(s => s.action === 'block').length,
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* Toolbar */}
        <div className="forti-toolbar">
          <div className="forti-toolbar-left">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="forti-action-btn forti-action-btn-primary">
                  <Plus size={14} />
                  Create New
                  <ChevronDown size={12} />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="bg-white border shadow-lg z-50">
                <DropdownMenuItem className="cursor-pointer" onClick={() => toast.success('Application Sensor created')}>
                  Application Sensor
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => toast.success('Application Filter created')}>
                  Application Filter
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer" onClick={() => toast.success('Custom Application created')}>
                  Custom Application
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <button className="forti-action-btn" onClick={() => toast.success('Signatures updated')}>
              <RefreshCw size={14} />
              Update Signatures
            </button>

            {selectedRows.length > 0 && (
              <>
                <div className="h-5 w-px bg-border mx-1" />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="forti-action-btn">
                      Set Action
                      <ChevronDown size={12} />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-white border shadow-lg z-50">
                    <DropdownMenuItem onClick={() => handleBulkAction('allow')} className="cursor-pointer text-green-700">
                      Allow Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('monitor')} className="cursor-pointer text-blue-700">
                      Monitor Selected
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleBulkAction('block')} className="cursor-pointer text-red-700">
                      Block Selected
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                <span className="text-xs text-muted-foreground">
                  {selectedRows.length} selected
                </span>
              </>
            )}
          </div>

          <div className="forti-toolbar-right">
            <div className="forti-search">
              <Search size={14} />
              <input
                type="text"
                placeholder="Search applications..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Stats Strip */}
        <div className="summary-strip">
          <div className="summary-item">
            <Globe size={16} className="text-primary" />
            <span className="summary-count">{stats.total}</span>
            <span className="summary-label">Total</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <Eye size={16} className="text-green-600" />
            <span className="summary-count text-green-600">{stats.allowed}</span>
            <span className="summary-label">Allowed</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <Activity size={16} className="text-blue-600" />
            <span className="summary-count text-blue-600">{stats.monitored}</span>
            <span className="summary-label">Monitored</span>
          </div>
          <div className="h-6 w-px bg-border" />
          <div className="summary-item">
            <Ban size={16} className="text-red-600" />
            <span className="summary-count text-red-600">{stats.blocked}</span>
            <span className="summary-label">Blocked</span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
          <Filter size={14} className="text-muted-foreground" />
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-40 h-8 text-xs">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              {categories.map(cat => (
                <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedRisk} onValueChange={setSelectedRisk}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Risk Level" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Risk</SelectItem>
              <SelectItem value="1">Risk 1 (Low)</SelectItem>
              <SelectItem value="2">Risk 2</SelectItem>
              <SelectItem value="3">Risk 3 (Medium)</SelectItem>
              <SelectItem value="4">Risk 4</SelectItem>
              <SelectItem value="5">Risk 5 (Critical)</SelectItem>
            </SelectContent>
          </Select>
          <Select value={selectedAction} onValueChange={setSelectedAction}>
            <SelectTrigger className="w-32 h-8 text-xs">
              <SelectValue placeholder="Action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Actions</SelectItem>
              <SelectItem value="allow">Allow</SelectItem>
              <SelectItem value="monitor">Monitor</SelectItem>
              <SelectItem value="block">Block</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex-1" />
          <span className="text-xs text-muted-foreground">{filtered.length} applications</span>
        </div>

        {/* Table */}
        <div className="section">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10">
                  <input 
                    type="checkbox" 
                    checked={selectedRows.length === filtered.length && filtered.length > 0}
                    onChange={toggleAllRows}
                    className="rounded border-gray-300"
                  />
                </th>
                <th>Application</th>
                <th>Category</th>
                <th>Technology</th>
                <th className="w-28 text-center">Popularity</th>
                <th className="w-24 text-center">Risk</th>
                <th className="w-24 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((sig) => (
                <tr 
                  key={sig.id}
                  className={cn(
                    selectedRows.includes(sig.id) && "data-table-row-selected"
                  )}
                  onClick={() => toggleRowSelection(sig.id)}
                >
                  <td onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="checkbox" 
                      checked={selectedRows.includes(sig.id)}
                      onChange={() => toggleRowSelection(sig.id)}
                      className="rounded border-gray-300"
                    />
                  </td>
                  <td>
                    <div>
                      <div className="font-medium text-sm">{sig.name}</div>
                      <div className="text-xs text-muted-foreground">{sig.vendor}</div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <div className="text-sm">{sig.category}</div>
                      <div className="text-xs text-muted-foreground">{sig.subcategory}</div>
                    </div>
                  </td>
                  <td className="text-sm text-muted-foreground">{sig.technology}</td>
                  <td className="text-center">
                    <div className="flex justify-center">
                      <PopularityStars popularity={sig.popularity} />
                    </div>
                  </td>
                  <td className="text-center">
                    <div className="flex justify-center">
                      <RiskBar risk={sig.risk} />
                    </div>
                  </td>
                  <td className="text-center" onClick={(e) => e.stopPropagation()}>
                    <ActionBadge 
                      action={sig.action} 
                      onChange={(action) => handleChangeAction(sig.id, action)} 
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && (
            <div className="p-12 text-center">
              <Globe size={32} className="mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-sm text-muted-foreground">No applications found</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{filtered.length} of {signatures.length} applications</span>
          <span>Last signature update: Today 08:00</span>
        </div>
      </div>
    </Shell>
  );
};

export default ApplicationControl;
