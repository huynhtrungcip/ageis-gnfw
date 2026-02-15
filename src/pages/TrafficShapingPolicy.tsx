import { useState, useEffect } from 'react';
import { useTrafficShapingPolicies } from '@/hooks/useDbData';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/formatters';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  RefreshCw,
  Search,
  ArrowUpDown,
  Network
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

interface ShapingPolicy {
  id: string;
  name: string;
  srcInterface: string;
  dstInterface: string;
  source: string;
  destination: string;
  service: string;
  application: string;
  trafficShaper: string;
  reverseShaper: string;
  perIPShaper: string;
  enabled: boolean;
  matches: number;
  bytes: number;
}

const TrafficShapingPolicy = () => {
  const { data: dbPolicies } = useTrafficShapingPolicies();
  const [policies, setPolicies] = useState<ShapingPolicy[]>([]);

  useEffect(() => {
    if (dbPolicies) {
      setPolicies(dbPolicies.map((p: any) => ({
        id: p.id,
        name: p.name,
        srcInterface: p.src_interface,
        dstInterface: p.dst_interface,
        source: p.source,
        destination: p.destination,
        service: p.service,
        application: p.application,
        trafficShaper: p.traffic_shaper,
        reverseShaper: p.reverse_shaper,
        perIPShaper: p.per_ip_shaper,
        enabled: p.enabled,
        matches: p.matches,
        bytes: p.bytes,
      })));
    }
  }, [dbPolicies]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<ShapingPolicy | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formSrcInterface, setFormSrcInterface] = useState('LAN (port1)');
  const [formDstInterface, setFormDstInterface] = useState('WAN1 (wan1)');
  const [formSource, setFormSource] = useState('all');
  const [formDestination, setFormDestination] = useState('all');
  const [formService, setFormService] = useState('ALL');
  const [formApplication, setFormApplication] = useState('');
  const [formShaper, setFormShaper] = useState('');
  const [formReverseShaper, setFormReverseShaper] = useState('');
  const [formPerIPShaper, setFormPerIPShaper] = useState('');

  const togglePolicy = (id: string) => {
    setPolicies(prev => prev.map(policy => 
      policy.id === id ? { ...policy, enabled: !policy.enabled } : policy
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const openCreateModal = () => {
    setEditingPolicy(null);
    setFormName(''); setFormSrcInterface('LAN (port1)'); setFormDstInterface('WAN1 (wan1)');
    setFormSource('all'); setFormDestination('all'); setFormService('ALL');
    setFormApplication(''); setFormShaper(''); setFormReverseShaper(''); setFormPerIPShaper('');
    setModalOpen(true);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) return;
    const p = policies.find(p => p.id === selectedIds[0]);
    if (!p) return;
    setEditingPolicy(p);
    setFormName(p.name); setFormSrcInterface(p.srcInterface); setFormDstInterface(p.dstInterface);
    setFormSource(p.source); setFormDestination(p.destination); setFormService(p.service);
    setFormApplication(p.application); setFormShaper(p.trafficShaper);
    setFormReverseShaper(p.reverseShaper); setFormPerIPShaper(p.perIPShaper);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!formName.trim()) { toast.error('Name is required'); return; }
    if (editingPolicy) {
      setPolicies(prev => prev.map(p => p.id === editingPolicy.id ? {
        ...p, name: formName, srcInterface: formSrcInterface, dstInterface: formDstInterface,
        source: formSource, destination: formDestination, service: formService,
        application: formApplication, trafficShaper: formShaper,
        reverseShaper: formReverseShaper, perIPShaper: formPerIPShaper,
      } : p));
      toast.success(`Policy "${formName}" updated`);
    } else {
      const newPolicy: ShapingPolicy = {
        id: `tsp-${Date.now()}`, name: formName, srcInterface: formSrcInterface,
        dstInterface: formDstInterface, source: formSource, destination: formDestination,
        service: formService, application: formApplication, trafficShaper: formShaper,
        reverseShaper: formReverseShaper, perIPShaper: formPerIPShaper,
        enabled: true, matches: 0, bytes: 0,
      };
      setPolicies(prev => [...prev, newPolicy]);
      toast.success(`Policy "${formName}" created`);
    }
    setModalOpen(false);
  };

  const filteredPolicies = policies.filter(policy => 
    searchQuery === '' ||
    policy.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.application.toLowerCase().includes(searchQuery.toLowerCase()) ||
    policy.trafficShaper.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Shell>
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn primary" onClick={openCreateModal}>
            <Plus className="w-3 h-3" />
            Create New
          </button>
          <button className="forti-toolbar-btn" disabled={selectedIds.length !== 1} onClick={openEditModal}>
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button 
            className="forti-toolbar-btn" 
            disabled={selectedIds.length === 0}
            onClick={() => {
              setPolicies(prev => prev.filter(p => !selectedIds.includes(p.id)));
              toast.success(`Deleted ${selectedIds.length} policy(ies)`);
              setSelectedIds([]);
            }}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={() => toast.success('Data refreshed')}>
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
                <th className="w-10">ID</th>
                <th>Name</th>
                <th>Source</th>
                <th>Destination</th>
                <th>Application</th>
                <th>Shaper</th>
                <th className="text-right">Matches</th>
                <th className="text-right">Bytes</th>
              </tr>
            </thead>
            <tbody>
              {filteredPolicies.map((policy, index) => (
                <tr key={policy.id} className={cn(!policy.enabled && "opacity-60", selectedIds.includes(policy.id) && "selected")}>
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(policy.id)}
                      onChange={() => handleSelect(policy.id)}
                    />
                  </td>
                  <td>
                    <FortiToggle 
                      enabled={policy.enabled} 
                      onToggle={() => togglePolicy(policy.id)}
                      size="sm"
                    />
                  </td>
                  <td className="text-[11px] text-[#666]">{index + 1}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <ArrowUpDown className="w-3 h-3 text-cyan-600" />
                      <span className="text-[11px] font-medium">{policy.name}</span>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <span className="w-3 h-3 bg-green-400 rounded-sm" />
                        {policy.source}
                      </span>
                      <div className="text-[10px] text-[#999]">{policy.srcInterface}</div>
                    </div>
                  </td>
                  <td>
                    <div>
                      <span className="inline-flex items-center gap-1 text-[11px]">
                        <Network className="w-3 h-3" />
                        {policy.destination}
                      </span>
                      <div className="text-[10px] text-[#999]">{policy.dstInterface}</div>
                    </div>
                  </td>
                  <td>
                    <span className="forti-tag bg-purple-100 text-purple-700 border-purple-200">
                      {policy.application}
                    </span>
                  </td>
                  <td>
                    {policy.trafficShaper ? (
                      <span className="forti-tag bg-orange-100 text-orange-700 border-orange-200">
                        {policy.trafficShaper}
                      </span>
                    ) : (
                      <span className="text-[10px] text-[#999]">—</span>
                    )}
                  </td>
                  <td className="text-right text-[11px] text-[#666]">{policy.matches.toLocaleString()}</td>
                  <td className="text-right text-[11px] text-[#666]">{formatBytes(policy.bytes)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredPolicies.length} shaping policies
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="max-w-lg p-0 gap-0 overflow-hidden">
          <DialogHeader className="forti-modal-header">
            <DialogTitle className="text-sm font-semibold">
              {editingPolicy ? 'Edit Shaping Policy' : 'Create Shaping Policy'}
            </DialogTitle>
          </DialogHeader>
          <div className="forti-modal-body space-y-3">
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="forti-label text-right">Name</label>
              <div className="col-span-2">
                <input className="forti-input w-full" value={formName} onChange={e => setFormName(e.target.value)} placeholder="Policy name" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="forti-label text-right">Source Interface</label>
              <div className="col-span-2">
                <input className="forti-input w-full" value={formSrcInterface} onChange={e => setFormSrcInterface(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="forti-label text-right">Dest Interface</label>
              <div className="col-span-2">
                <input className="forti-input w-full" value={formDstInterface} onChange={e => setFormDstInterface(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="forti-label text-right">Source</label>
              <div className="col-span-2">
                <input className="forti-input w-full" value={formSource} onChange={e => setFormSource(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="forti-label text-right">Destination</label>
              <div className="col-span-2">
                <input className="forti-input w-full" value={formDestination} onChange={e => setFormDestination(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="forti-label text-right">Application</label>
              <div className="col-span-2">
                <input className="forti-input w-full" value={formApplication} onChange={e => setFormApplication(e.target.value)} placeholder="e.g. YouTube, VoIP" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="forti-label text-right">Traffic Shaper</label>
              <div className="col-span-2">
                <input className="forti-input w-full" value={formShaper} onChange={e => setFormShaper(e.target.value)} placeholder="Shaper name" />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="forti-label text-right">Reverse Shaper</label>
              <div className="col-span-2">
                <input className="forti-input w-full" value={formReverseShaper} onChange={e => setFormReverseShaper(e.target.value)} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 items-center">
              <label className="forti-label text-right">Per-IP Shaper</label>
              <div className="col-span-2">
                <input className="forti-input w-full" value={formPerIPShaper} onChange={e => setFormPerIPShaper(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="forti-modal-footer">
            <button className="forti-toolbar-btn" onClick={() => setModalOpen(false)}>Cancel</button>
            <button className="forti-toolbar-btn primary" onClick={handleSave}>
              {editingPolicy ? 'Save' : 'Create'}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </Shell>
  );
};

export default TrafficShapingPolicy;
