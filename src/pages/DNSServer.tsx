import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  ChevronDown, Plus, RefreshCw, Search, Edit2, Trash2, 
  Globe, Server, Shield, Database, Settings, Download, Upload, X
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { exportToJSON, exportToCSV, importFromJSON, createFileInput } from '@/lib/exportImport';

interface ForwardZone {
  id: string;
  name: string;
  type: string;
  servers: string[];
  enabled: boolean;
}

interface LocalRecord {
  id: string;
  hostname: string;
  domain: string;
  type: string;
  address: string;
  ttl: number;
  enabled: boolean;
}

interface DNSFilter {
  id: string;
  name: string;
  category: string;
  action: string;
  enabled: boolean;
}

const initialZones: ForwardZone[] = [
  { id: '1', name: 'Default', type: 'forward', servers: ['8.8.8.8', '8.8.4.4'], enabled: true },
  { id: '2', name: 'internal.corp', type: 'forward', servers: ['10.0.0.10'], enabled: true },
  { id: '3', name: 'partner.net', type: 'forward', servers: ['192.168.100.1'], enabled: false },
];

const initialRecords: LocalRecord[] = [
  { id: '1', hostname: 'gateway', domain: 'local.lan', type: 'A', address: '192.168.1.1', ttl: 3600, enabled: true },
  { id: '2', hostname: 'server01', domain: 'local.lan', type: 'A', address: '192.168.1.10', ttl: 3600, enabled: true },
  { id: '3', hostname: 'printer', domain: 'local.lan', type: 'A', address: '192.168.1.50', ttl: 3600, enabled: true },
  { id: '4', hostname: 'www', domain: 'local.lan', type: 'CNAME', address: 'server01.local.lan', ttl: 3600, enabled: true },
  { id: '5', hostname: 'mail', domain: 'local.lan', type: 'MX', address: 'server01.local.lan', ttl: 3600, enabled: false },
];

const initialFilters: DNSFilter[] = [
  { id: '1', name: 'Block Ads', category: 'Advertising', action: 'Block', enabled: true },
  { id: '2', name: 'Block Malware', category: 'Malware', action: 'Block', enabled: true },
  { id: '3', name: 'Block Adult Content', category: 'Adult', action: 'Block', enabled: false },
  { id: '4', name: 'Safe Search', category: 'Search Engines', action: 'Enforce', enabled: true },
  { id: '5', name: 'Block Gambling', category: 'Gambling', action: 'Block', enabled: false },
];

const DNSServer = () => {
  const { demoMode } = useDemoMode();
  const [activeTab, setActiveTab] = useState<'general' | 'forward' | 'local' | 'filter'>('general');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [dnsEnabled, setDnsEnabled] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const [zones, setZones] = useState<ForwardZone[]>(demoMode ? initialZones : []);
  const [records, setRecords] = useState<LocalRecord[]>(demoMode ? initialRecords : []);
  const [filters, setFilters] = useState<DNSFilter[]>(demoMode ? initialFilters : []);

  // Modal states
  const [zoneModalOpen, setZoneModalOpen] = useState(false);
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [filterModalOpen, setFilterModalOpen] = useState(false);
  const [editingZone, setEditingZone] = useState<ForwardZone | null>(null);
  const [editingRecord, setEditingRecord] = useState<LocalRecord | null>(null);
  const [editingFilter, setEditingFilter] = useState<DNSFilter | null>(null);

  // Delete confirmation states
  const [deleteZoneId, setDeleteZoneId] = useState<string | null>(null);
  const [deleteRecordId, setDeleteRecordId] = useState<string | null>(null);
  const [deleteFilterId, setDeleteFilterId] = useState<string | null>(null);

  // Selection states
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [selectedRecords, setSelectedRecords] = useState<string[]>([]);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Form states
  const [zoneForm, setZoneForm] = useState({ name: '', servers: '', enabled: true });
  const [recordForm, setRecordForm] = useState({ hostname: '', domain: 'local.lan', type: 'A', address: '', ttl: 3600, enabled: true });
  const [filterForm, setFilterForm] = useState({ name: '', category: '', action: 'Block', enabled: true });

  const toggleZone = (id: string) => {
    setZones(zones.map(z => z.id === id ? { ...z, enabled: !z.enabled } : z));
  };

  const toggleRecord = (id: string) => {
    setRecords(records.map(r => r.id === id ? { ...r, enabled: !r.enabled } : r));
  };

  const toggleFilter = (id: string) => {
    setFilters(filters.map(f => f.id === id ? { ...f, enabled: !f.enabled } : f));
  };

  // CRUD handlers for zones
  const handleCreateZone = () => {
    setEditingZone(null);
    setZoneForm({ name: '', servers: '', enabled: true });
    setZoneModalOpen(true);
  };

  const handleEditZone = (zone: ForwardZone) => {
    setEditingZone(zone);
    setZoneForm({ name: zone.name, servers: zone.servers.join(', '), enabled: zone.enabled });
    setZoneModalOpen(true);
  };

  const handleSaveZone = () => {
    if (!zoneForm.name || !zoneForm.servers) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingZone) {
      setZones(zones.map(z => z.id === editingZone.id ? {
        ...z,
        name: zoneForm.name,
        servers: zoneForm.servers.split(',').map(s => s.trim()),
        enabled: zoneForm.enabled,
      } : z));
      toast.success('Forward zone updated');
    } else {
      const newZone: ForwardZone = {
        id: Date.now().toString(),
        name: zoneForm.name,
        type: 'forward',
        servers: zoneForm.servers.split(',').map(s => s.trim()),
        enabled: zoneForm.enabled,
      };
      setZones([...zones, newZone]);
      toast.success('Forward zone created');
    }
    setZoneModalOpen(false);
  };

  const handleDeleteZone = () => {
    if (deleteZoneId) {
      setZones(zones.filter(z => z.id !== deleteZoneId));
      toast.success('Forward zone deleted');
      setDeleteZoneId(null);
    }
  };

  // CRUD handlers for records
  const handleCreateRecord = () => {
    setEditingRecord(null);
    setRecordForm({ hostname: '', domain: 'local.lan', type: 'A', address: '', ttl: 3600, enabled: true });
    setRecordModalOpen(true);
  };

  const handleEditRecord = (record: LocalRecord) => {
    setEditingRecord(record);
    setRecordForm({
      hostname: record.hostname,
      domain: record.domain,
      type: record.type,
      address: record.address,
      ttl: record.ttl,
      enabled: record.enabled,
    });
    setRecordModalOpen(true);
  };

  const handleSaveRecord = () => {
    if (!recordForm.hostname || !recordForm.address) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingRecord) {
      setRecords(records.map(r => r.id === editingRecord.id ? { ...r, ...recordForm } : r));
      toast.success('Local record updated');
    } else {
      const newRecord: LocalRecord = {
        id: Date.now().toString(),
        ...recordForm,
      };
      setRecords([...records, newRecord]);
      toast.success('Local record created');
    }
    setRecordModalOpen(false);
  };

  const handleDeleteRecord = () => {
    if (deleteRecordId) {
      setRecords(records.filter(r => r.id !== deleteRecordId));
      toast.success('Local record deleted');
      setDeleteRecordId(null);
    }
  };

  // CRUD handlers for filters
  const handleCreateFilter = () => {
    setEditingFilter(null);
    setFilterForm({ name: '', category: '', action: 'Block', enabled: true });
    setFilterModalOpen(true);
  };

  const handleEditFilter = (filter: DNSFilter) => {
    setEditingFilter(filter);
    setFilterForm({
      name: filter.name,
      category: filter.category,
      action: filter.action,
      enabled: filter.enabled,
    });
    setFilterModalOpen(true);
  };

  const handleSaveFilter = () => {
    if (!filterForm.name || !filterForm.category) {
      toast.error('Please fill all required fields');
      return;
    }

    if (editingFilter) {
      setFilters(filters.map(f => f.id === editingFilter.id ? { ...f, ...filterForm } : f));
      toast.success('DNS filter updated');
    } else {
      const newFilter: DNSFilter = {
        id: Date.now().toString(),
        ...filterForm,
      };
      setFilters([...filters, newFilter]);
      toast.success('DNS filter created');
    }
    setFilterModalOpen(false);
  };

  const handleDeleteFilter = () => {
    if (deleteFilterId) {
      setFilters(filters.filter(f => f.id !== deleteFilterId));
      toast.success('DNS filter deleted');
      setDeleteFilterId(null);
    }
  };

  // Export/Import handlers
  const handleExport = (type: 'zones' | 'records' | 'filters', format: 'json' | 'csv') => {
    let data: any[];
    if (type === 'zones') data = zones;
    else if (type === 'records') data = records;
    else data = filters;
    
    const filename = `dns-${type}-${new Date().toISOString().split('T')[0]}`;
    
    if (format === 'json') {
      exportToJSON(data, `${filename}.json`);
    } else {
      exportToCSV(data, `${filename}.csv`);
    }
    toast.success(`Exported ${data.length} ${type}`);
  };

  const handleImport = (type: 'zones' | 'records' | 'filters') => {
    createFileInput('.json', (file) => {
      if (type === 'zones') {
        importFromJSON<ForwardZone>(file, (data) => {
          setZones([...zones, ...data.map(z => ({ ...z, id: Date.now().toString() + Math.random() }))]);
          toast.success(`Imported ${data.length} zones`);
        }, (error) => toast.error(error));
      } else if (type === 'records') {
        importFromJSON<LocalRecord>(file, (data) => {
          setRecords([...records, ...data.map(r => ({ ...r, id: Date.now().toString() + Math.random() }))]);
          toast.success(`Imported ${data.length} records`);
        }, (error) => toast.error(error));
      } else {
        importFromJSON<DNSFilter>(file, (data) => {
          setFilters([...filters, ...data.map(f => ({ ...f, id: Date.now().toString() + Math.random() }))]);
          toast.success(`Imported ${data.length} filters`);
        }, (error) => toast.error(error));
      }
    });
  };

  const handleRefresh = () => {
    toast.success('Data refreshed');
  };

  // Filter data based on search
  const filteredZones = zones.filter(z => z.name.toLowerCase().includes(searchTerm.toLowerCase()));
  const filteredRecords = records.filter(r => 
    r.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.address.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const filteredFilters = filters.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.category.toLowerCase().includes(searchTerm.toLowerCase())
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
                <button 
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                  onClick={() => { handleCreateZone(); setShowCreateMenu(false); }}
                >
                  <Globe className="w-3 h-3" />
                  Forward Zone
                </button>
                <button 
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                  onClick={() => { handleCreateRecord(); setShowCreateMenu(false); }}
                >
                  <Database className="w-3 h-3" />
                  Local Record
                </button>
                <button 
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                  onClick={() => { handleCreateFilter(); setShowCreateMenu(false); }}
                >
                  <Shield className="w-3 h-3" />
                  DNS Filter
                </button>
              </div>
            )}
          </div>
          <button className="forti-toolbar-btn" onClick={() => {
            if (activeTab === 'forward' && selectedZones.length === 1) {
              const zone = zones.find(z => z.id === selectedZones[0]);
              if (zone) handleEditZone(zone);
            } else if (activeTab === 'local' && selectedRecords.length === 1) {
              const record = records.find(r => r.id === selectedRecords[0]);
              if (record) handleEditRecord(record);
            } else if (activeTab === 'filter' && selectedFilters.length === 1) {
              const filter = filters.find(f => f.id === selectedFilters[0]);
              if (filter) handleEditFilter(filter);
            }
          }}>
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button className="forti-toolbar-btn" onClick={() => {
            if (activeTab === 'forward' && selectedZones.length === 1) {
              setDeleteZoneId(selectedZones[0]);
            } else if (activeTab === 'local' && selectedRecords.length === 1) {
              setDeleteRecordId(selectedRecords[0]);
            } else if (activeTab === 'filter' && selectedFilters.length === 1) {
              setDeleteFilterId(selectedFilters[0]);
            }
          }}>
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={handleRefresh}>
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="relative">
            <button 
              className="forti-toolbar-btn"
              onClick={() => {
                if (activeTab === 'forward') handleExport('zones', 'json');
                else if (activeTab === 'local') handleExport('records', 'json');
                else if (activeTab === 'filter') handleExport('filters', 'json');
              }}
            >
              <Download className="w-3 h-3" />
              Export
            </button>
          </div>
          <button className="forti-toolbar-btn" onClick={() => {
            if (activeTab === 'forward') handleImport('zones');
            else if (activeTab === 'local') handleImport('records');
            else if (activeTab === 'filter') handleImport('filters');
          }}>
            <Upload className="w-3 h-3" />
            Import
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-40"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center bg-[#e8e8e8] border-b border-[#ccc]">
          {[
            { id: 'general', label: 'General Settings', icon: Settings },
            { id: 'forward', label: 'Forward Zones', icon: Globe },
            { id: 'local', label: 'Local Records', icon: Database },
            { id: 'filter', label: 'DNS Filter', icon: Shield },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2 text-[11px] font-medium transition-colors border-b-2",
                activeTab === tab.id 
                  ? "bg-white text-[hsl(142,70%,35%)] border-[hsl(142,70%,35%)]" 
                  : "text-[#666] border-transparent hover:text-[#333] hover:bg-[#f0f0f0]"
              )}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* General Settings Tab */}
        {activeTab === 'general' && (
          <div className="p-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="section">
                <div className="section-header">
                  <span>DNS Server Settings</span>
                </div>
                <div className="section-body space-y-4">
                  <div className="flex items-center justify-between p-3 bg-[#f5f5f5] border border-[#ddd]">
                    <div>
                      <div className="text-[11px] font-medium">Enable DNS Server</div>
                      <div className="text-[10px] text-[#666]">Enable local DNS server for network clients</div>
                    </div>
                    <FortiToggle enabled={dnsEnabled} onToggle={() => setDnsEnabled(!dnsEnabled)} />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="forti-label">Listen on Interface</label>
                      <select className="forti-select w-full">
                        <option>LAN</option>
                        <option>DMZ</option>
                        <option>All Interfaces</option>
                      </select>
                    </div>
                    <div>
                      <label className="forti-label">DNS Port</label>
                      <input type="number" className="forti-input w-full" defaultValue="53" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="forti-label">Cache Size (entries)</label>
                      <input type="number" className="forti-input w-full" defaultValue="10000" />
                    </div>
                    <div>
                      <label className="forti-label">Cache TTL (seconds)</label>
                      <input type="number" className="forti-input w-full" defaultValue="3600" />
                    </div>
                  </div>

                  <div className="flex items-center gap-4 pt-2">
                    <label className="flex items-center gap-2 text-[11px]">
                      <input type="checkbox" className="forti-checkbox" defaultChecked />
                      Enable DNS Cache
                    </label>
                    <label className="flex items-center gap-2 text-[11px]">
                      <input type="checkbox" className="forti-checkbox" defaultChecked />
                      Log DNS Queries
                    </label>
                  </div>
                </div>
              </div>

              <div className="section">
                <div className="section-header">
                  <span>DNS Statistics</span>
                </div>
                <div className="section-body">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                      <div className="text-2xl font-bold text-[hsl(142,70%,35%)]">{demoMode ? '12,458' : '0'}</div>
                      <div className="text-[10px] text-[#666]">Total Queries</div>
                    </div>
                    <div className="p-3 bg-[#f5f5f5] border border-[#ddd] text-center">
                      <div className="text-2xl font-bold text-blue-600">{demoMode ? '89.2%' : '0%'}</div>
                      <div className="text-[10px] text-[#666]">Cache Hit Rate</div>
                    </div>
                  </div>

                  <table className="widget-table">
                    <tbody>
                      <tr>
                        <td className="widget-label">Queries Today</td>
                        <td className="widget-value">{demoMode ? '3,241' : '0'}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Blocked Queries</td>
                        <td className="widget-value text-red-600">{demoMode ? '156' : '0'}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Cache Entries</td>
                        <td className="widget-value">{demoMode ? '4,892' : '0'}</td>
                      </tr>
                      <tr>
                        <td className="widget-label">Upstream Latency</td>
                        <td className="widget-value">{demoMode ? '12ms' : '—'}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Forward Zones Tab */}
        {activeTab === 'forward' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedZones.length === filteredZones.length && filteredZones.length > 0}
                      onChange={(e) => setSelectedZones(e.target.checked ? filteredZones.map(z => z.id) : [])}
                    />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Zone Name</th>
                  <th>Type</th>
                  <th>DNS Servers</th>
                  <th>Priority</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredZones.map((zone) => (
                  <tr key={zone.id} className={cn(!zone.enabled && "opacity-60")}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="forti-checkbox"
                        checked={selectedZones.includes(zone.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedZones([...selectedZones, zone.id]);
                          } else {
                            setSelectedZones(selectedZones.filter(id => id !== zone.id));
                          }
                        }}
                      />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={zone.enabled} 
                        onToggle={() => toggleZone(zone.id)}
                        size="sm"
                      />
                    </td>
                    <td className="text-[11px] font-medium">
                      {zone.name === 'Default' ? (
                        <span className="flex items-center gap-1">
                          <Globe className="w-3 h-3 text-blue-500" />
                          {zone.name} (All queries)
                        </span>
                      ) : zone.name}
                    </td>
                    <td>
                      <span className="text-[10px] px-1.5 py-0.5 bg-purple-100 text-purple-700 border border-purple-200">
                        FORWARD
                      </span>
                    </td>
                    <td className="mono text-[10px]">
                      {zone.servers.join(', ')}
                    </td>
                    <td className="text-[11px]">Normal</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button 
                          className="p-1 hover:bg-[#e0e0e0] rounded"
                          onClick={() => handleEditZone(zone)}
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-[#e0e0e0] rounded"
                          onClick={() => setDeleteZoneId(zone.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Local Records Tab */}
        {activeTab === 'local' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedRecords.length === filteredRecords.length && filteredRecords.length > 0}
                      onChange={(e) => setSelectedRecords(e.target.checked ? filteredRecords.map(r => r.id) : [])}
                    />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Hostname</th>
                  <th>Domain</th>
                  <th>Type</th>
                  <th>Address/Value</th>
                  <th>TTL</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((record) => (
                  <tr key={record.id} className={cn(!record.enabled && "opacity-60")}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="forti-checkbox"
                        checked={selectedRecords.includes(record.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedRecords([...selectedRecords, record.id]);
                          } else {
                            setSelectedRecords(selectedRecords.filter(id => id !== record.id));
                          }
                        }}
                      />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={record.enabled} 
                        onToggle={() => toggleRecord(record.id)}
                        size="sm"
                      />
                    </td>
                    <td className="text-[11px] font-medium">{record.hostname}</td>
                    <td className="text-[11px]">{record.domain}</td>
                    <td>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 border font-mono",
                        record.type === 'A' ? "bg-green-100 text-green-700 border-green-200" :
                        record.type === 'CNAME' ? "bg-blue-100 text-blue-700 border-blue-200" :
                        record.type === 'MX' ? "bg-orange-100 text-orange-700 border-orange-200" :
                        "bg-gray-100 text-gray-700 border-gray-200"
                      )}>
                        {record.type}
                      </span>
                    </td>
                    <td className="mono text-[10px]">{record.address}</td>
                    <td className="text-[11px]">{record.ttl}s</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button 
                          className="p-1 hover:bg-[#e0e0e0] rounded"
                          onClick={() => handleEditRecord(record)}
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-[#e0e0e0] rounded"
                          onClick={() => setDeleteRecordId(record.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* DNS Filter Tab */}
        {activeTab === 'filter' && (
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8">
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedFilters.length === filteredFilters.length && filteredFilters.length > 0}
                      onChange={(e) => setSelectedFilters(e.target.checked ? filteredFilters.map(f => f.id) : [])}
                    />
                  </th>
                  <th className="w-16">Status</th>
                  <th>Name</th>
                  <th>Category</th>
                  <th>Action</th>
                  <th className="w-24">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFilters.map((filter) => (
                  <tr key={filter.id} className={cn(!filter.enabled && "opacity-60")}>
                    <td>
                      <input 
                        type="checkbox" 
                        className="forti-checkbox"
                        checked={selectedFilters.includes(filter.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedFilters([...selectedFilters, filter.id]);
                          } else {
                            setSelectedFilters(selectedFilters.filter(id => id !== filter.id));
                          }
                        }}
                      />
                    </td>
                    <td>
                      <FortiToggle 
                        enabled={filter.enabled} 
                        onToggle={() => toggleFilter(filter.id)}
                        size="sm"
                      />
                    </td>
                    <td className="text-[11px] font-medium">{filter.name}</td>
                    <td className="text-[11px]">{filter.category}</td>
                    <td>
                      <span className={cn(
                        "text-[10px] px-1.5 py-0.5 border",
                        filter.action === 'Block' ? "bg-red-100 text-red-700 border-red-200" :
                        "bg-blue-100 text-blue-700 border-blue-200"
                      )}>
                        {filter.action}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button 
                          className="p-1 hover:bg-[#e0e0e0] rounded"
                          onClick={() => handleEditFilter(filter)}
                        >
                          <Edit2 className="w-3 h-3 text-blue-600" />
                        </button>
                        <button 
                          className="p-1 hover:bg-[#e0e0e0] rounded"
                          onClick={() => setDeleteFilterId(filter.id)}
                        >
                          <Trash2 className="w-3 h-3 text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Zone Modal */}
      <Dialog open={zoneModalOpen} onOpenChange={setZoneModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{editingZone ? 'Edit Forward Zone' : 'Create Forward Zone'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="forti-label">Zone Name *</label>
              <input
                type="text"
                className="forti-input w-full"
                value={zoneForm.name}
                onChange={(e) => setZoneForm({ ...zoneForm, name: e.target.value })}
                placeholder="e.g., internal.corp"
              />
            </div>
            <div>
              <label className="forti-label">DNS Servers * (comma separated)</label>
              <input
                type="text"
                className="forti-input w-full"
                value={zoneForm.servers}
                onChange={(e) => setZoneForm({ ...zoneForm, servers: e.target.value })}
                placeholder="e.g., 8.8.8.8, 8.8.4.4"
              />
            </div>
            <div className="flex items-center gap-2">
              <FortiToggle enabled={zoneForm.enabled} onToggle={() => setZoneForm({ ...zoneForm, enabled: !zoneForm.enabled })} />
              <span className="text-[11px]">Enabled</span>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setZoneModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveZone}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Record Modal */}
      <Dialog open={recordModalOpen} onOpenChange={setRecordModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{editingRecord ? 'Edit Local Record' : 'Create Local Record'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="forti-label">Hostname *</label>
                <input
                  type="text"
                  className="forti-input w-full"
                  value={recordForm.hostname}
                  onChange={(e) => setRecordForm({ ...recordForm, hostname: e.target.value })}
                  placeholder="e.g., server01"
                />
              </div>
              <div>
                <label className="forti-label">Domain</label>
                <input
                  type="text"
                  className="forti-input w-full"
                  value={recordForm.domain}
                  onChange={(e) => setRecordForm({ ...recordForm, domain: e.target.value })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="forti-label">Record Type</label>
                <select
                  className="forti-select w-full"
                  value={recordForm.type}
                  onChange={(e) => setRecordForm({ ...recordForm, type: e.target.value })}
                >
                  <option value="A">A</option>
                  <option value="AAAA">AAAA</option>
                  <option value="CNAME">CNAME</option>
                  <option value="MX">MX</option>
                  <option value="TXT">TXT</option>
                </select>
              </div>
              <div>
                <label className="forti-label">TTL (seconds)</label>
                <input
                  type="number"
                  className="forti-input w-full"
                  value={recordForm.ttl}
                  onChange={(e) => setRecordForm({ ...recordForm, ttl: parseInt(e.target.value) })}
                />
              </div>
            </div>
            <div>
              <label className="forti-label">Address/Value *</label>
              <input
                type="text"
                className="forti-input w-full"
                value={recordForm.address}
                onChange={(e) => setRecordForm({ ...recordForm, address: e.target.value })}
                placeholder="e.g., 192.168.1.10"
              />
            </div>
            <div className="flex items-center gap-2">
              <FortiToggle enabled={recordForm.enabled} onToggle={() => setRecordForm({ ...recordForm, enabled: !recordForm.enabled })} />
              <span className="text-[11px]">Enabled</span>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setRecordModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveRecord}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={filterModalOpen} onOpenChange={setFilterModalOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle>{editingFilter ? 'Edit DNS Filter' : 'Create DNS Filter'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="forti-label">Filter Name *</label>
              <input
                type="text"
                className="forti-input w-full"
                value={filterForm.name}
                onChange={(e) => setFilterForm({ ...filterForm, name: e.target.value })}
                placeholder="e.g., Block Malware"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="forti-label">Category *</label>
                <select
                  className="forti-select w-full"
                  value={filterForm.category}
                  onChange={(e) => setFilterForm({ ...filterForm, category: e.target.value })}
                >
                  <option value="">Select category</option>
                  <option value="Malware">Malware</option>
                  <option value="Phishing">Phishing</option>
                  <option value="Advertising">Advertising</option>
                  <option value="Adult">Adult</option>
                  <option value="Gambling">Gambling</option>
                  <option value="Social Media">Social Media</option>
                  <option value="Streaming">Streaming</option>
                  <option value="Search Engines">Search Engines</option>
                </select>
              </div>
              <div>
                <label className="forti-label">Action</label>
                <select
                  className="forti-select w-full"
                  value={filterForm.action}
                  onChange={(e) => setFilterForm({ ...filterForm, action: e.target.value })}
                >
                  <option value="Block">Block</option>
                  <option value="Allow">Allow</option>
                  <option value="Monitor">Monitor</option>
                  <option value="Enforce">Enforce</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FortiToggle enabled={filterForm.enabled} onToggle={() => setFilterForm({ ...filterForm, enabled: !filterForm.enabled })} />
              <span className="text-[11px]">Enabled</span>
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <Button variant="outline" size="sm" onClick={() => setFilterModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleSaveFilter}>Save</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialogs */}
      <AlertDialog open={!!deleteZoneId} onOpenChange={() => setDeleteZoneId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Forward Zone</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this forward zone? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteZone} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteRecordId} onOpenChange={() => setDeleteRecordId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Local Record</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this local record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteRecord} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteFilterId} onOpenChange={() => setDeleteFilterId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete DNS Filter</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this DNS filter? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteFilter} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default DNSServer;
