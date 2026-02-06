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
  Database,
  Layers,
  X,
  Download,
  Upload,
  GripVertical
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { exportToJSON, exportToCSV, importFromJSON, createFileInput } from '@/lib/exportImport';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface IPPool {
  id: string;
  name: string;
  comments: string;
  type: 'overload' | 'one-to-one' | 'fixed-port-range' | 'port-block-allocation';
  startIP: string;
  endIP: string;
  associatedInterface: string;
  arpReply: boolean;
  enabled: boolean;
  usedIPs: number;
  totalIPs: number;
}

const initialPools: IPPool[] = [
  {
    id: '1',
    name: 'SNAT-Pool-1',
    comments: 'Primary outbound NAT pool',
    type: 'overload',
    startIP: '203.0.113.100',
    endIP: '203.0.113.110',
    associatedInterface: 'wan1',
    arpReply: true,
    enabled: true,
    usedIPs: 8,
    totalIPs: 11
  },
  {
    id: '2',
    name: 'Guest-NAT-Pool',
    comments: 'Guest network NAT pool',
    type: 'one-to-one',
    startIP: '203.0.113.120',
    endIP: '203.0.113.130',
    associatedInterface: 'wan1',
    arpReply: true,
    enabled: true,
    usedIPs: 5,
    totalIPs: 11
  },
  {
    id: '3',
    name: 'VPN-Pool',
    comments: 'VPN client NAT pool',
    type: 'fixed-port-range',
    startIP: '203.0.113.140',
    endIP: '203.0.113.150',
    associatedInterface: 'wan1',
    arpReply: true,
    enabled: true,
    usedIPs: 3,
    totalIPs: 11
  },
  {
    id: '4',
    name: 'Legacy-Pool',
    comments: 'Legacy systems pool',
    type: 'overload',
    startIP: '203.0.113.200',
    endIP: '203.0.113.205',
    associatedInterface: 'wan2',
    arpReply: false,
    enabled: false,
    usedIPs: 0,
    totalIPs: 6
  },
];

interface SortablePoolRowProps {
  pool: IPPool;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDoubleClick: () => void;
  getTypeLabel: (type: IPPool['type']) => string;
}

const SortablePoolRow = ({ pool, isSelected, onSelect, onToggle, onDoubleClick, getTypeLabel }: SortablePoolRowProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: pool.id });
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 };

  return (
    <tr ref={setNodeRef} style={style} className={cn(!pool.enabled && "opacity-60", isSelected && "selected")} onDoubleClick={onDoubleClick}>
      <td className="w-6 cursor-grab" {...attributes} {...listeners}><GripVertical className="w-3 h-3 text-[#999]" /></td>
      <td><input type="checkbox" className="forti-checkbox" checked={isSelected} onChange={() => onSelect(pool.id)} /></td>
      <td><FortiToggle enabled={pool.enabled} onToggle={() => onToggle(pool.id)} size="sm" /></td>
      <td>
        <div className="flex items-center gap-2">
          <Database className="w-3 h-3 text-purple-600" />
          <div><div className="text-[11px] font-medium">{pool.name}</div><div className="text-[10px] text-[#999]">{pool.comments}</div></div>
        </div>
      </td>
      <td>
        <span className={cn("text-[10px] px-1.5 py-0.5 border",
          pool.type === 'overload' && "bg-blue-100 text-blue-700 border-blue-200",
          pool.type === 'one-to-one' && "bg-green-100 text-green-700 border-green-200",
          pool.type === 'fixed-port-range' && "bg-purple-100 text-purple-700 border-purple-200",
          pool.type === 'port-block-allocation' && "bg-orange-100 text-orange-700 border-orange-200"
        )}>{getTypeLabel(pool.type)}</span>
      </td>
      <td className="mono text-[11px]">{pool.startIP}</td>
      <td className="mono text-[11px]">{pool.endIP}</td>
      <td><span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">{pool.associatedInterface}</span></td>
      <td>{pool.arpReply ? <span className="text-[10px] text-green-600">Enable</span> : <span className="text-[10px] text-[#999]">Disable</span>}</td>
      <td>
        <div className="flex items-center gap-2">
          <div className="w-16 h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(pool.usedIPs / pool.totalIPs) * 100}%` }} /></div>
          <span className="text-[10px] text-[#666]">{pool.usedIPs}/{pool.totalIPs}</span>
        </div>
      </td>
    </tr>
  );
};

const IPPools = () => {
  const [pools, setPools] = useState<IPPool[]>(initialPools);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IPPool | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const [formName, setFormName] = useState('');
  const [formComments, setFormComments] = useState('');
  const [formType, setFormType] = useState<IPPool['type']>('overload');
  const [formStartIP, setFormStartIP] = useState('');
  const [formEndIP, setFormEndIP] = useState('');
  const [formInterface, setFormInterface] = useState('wan1');
  const [formArpReply, setFormArpReply] = useState(true);

  const sensors = useSensors(useSensor(PointerSensor), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setPools((items) => {
        const oldIndex = items.findIndex((i) => i.id === active.id);
        const newIndex = items.findIndex((i) => i.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success('Order updated');
    }
  };

  const getTypeLabel = (type: IPPool['type']) => {
    switch (type) {
      case 'overload': return 'Overload';
      case 'one-to-one': return 'One-to-One';
      case 'fixed-port-range': return 'Fixed Port Range';
      case 'port-block-allocation': return 'Port Block';
    }
  };

  const togglePool = (id: string) => {
    setPools(prev => prev.map(pool => 
      pool.id === id ? { ...pool, enabled: !pool.enabled } : pool
    ));
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredPools.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredPools.map(p => p.id));
    }
  };

  const filteredPools = pools.filter(pool => 
    searchQuery === '' ||
    pool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    pool.startIP.includes(searchQuery) ||
    pool.endIP.includes(searchQuery)
  );



  const openCreateModal = (type: IPPool['type']) => {
    setEditingItem(null);
    setFormName('');
    setFormComments('');
    setFormType(type);
    setFormStartIP('');
    setFormEndIP('');
    setFormInterface('wan1');
    setFormArpReply(true);
    setModalOpen(true);
    setShowCreateMenu(false);
  };

  const openEditModal = () => {
    if (selectedIds.length !== 1) return;
    const item = pools.find(p => p.id === selectedIds[0]);
    if (item) {
      setEditingItem(item);
      setFormName(item.name);
      setFormComments(item.comments);
      setFormType(item.type);
      setFormStartIP(item.startIP);
      setFormEndIP(item.endIP);
      setFormInterface(item.associatedInterface);
      setFormArpReply(item.arpReply);
      setModalOpen(true);
    }
  };

  const handleSave = () => {
    if (!formName.trim() || !formStartIP.trim() || !formEndIP.trim()) {
      toast.error('Name, Start IP, and End IP are required');
      return;
    }

    // Calculate total IPs
    const startParts = formStartIP.split('.').map(Number);
    const endParts = formEndIP.split('.').map(Number);
    const totalIPs = endParts[3] - startParts[3] + 1;

    if (editingItem) {
      setPools(prev => prev.map(p => 
        p.id === editingItem.id 
          ? { ...p, name: formName, comments: formComments, type: formType, startIP: formStartIP, endIP: formEndIP, associatedInterface: formInterface, arpReply: formArpReply, totalIPs }
          : p
      ));
      toast.success(`Updated "${formName}" successfully`);
    } else {
      const newItem: IPPool = {
        id: Date.now().toString(),
        name: formName,
        comments: formComments,
        type: formType,
        startIP: formStartIP,
        endIP: formEndIP,
        associatedInterface: formInterface,
        arpReply: formArpReply,
        enabled: true,
        usedIPs: 0,
        totalIPs: totalIPs > 0 ? totalIPs : 1
      };
      setPools(prev => [...prev, newItem]);
      toast.success(`Created "${formName}" successfully`);
    }
    setModalOpen(false);
    setSelectedIds([]);
  };

  const handleDeleteConfirm = () => {
    const hasUsed = pools.some(p => selectedIds.includes(p.id) && p.usedIPs > 0);
    if (hasUsed) {
      toast.error('Cannot delete pools that have IPs in use');
      setDeleteDialogOpen(false);
      return;
    }

    setPools(prev => prev.filter(p => !selectedIds.includes(p.id)));
    toast.success(`Deleted ${selectedIds.length} pool(s) successfully`);
    setSelectedIds([]);
    setDeleteDialogOpen(false);
  };

  const handleRefresh = () => {
    setPools([...initialPools]);
    setSelectedIds([]);
    setSearchQuery('');
    toast.success('Data refreshed');
  };

  const handleExportJSON = () => {
    exportToJSON(pools, 'ip-pools-config.json');
    toast.success(`Exported ${pools.length} IP pools to JSON`);
  };

  const handleExportCSV = () => {
    const csvData = pools.map(p => ({
      name: p.name,
      type: p.type,
      startIP: p.startIP,
      endIP: p.endIP,
      interface: p.associatedInterface,
      arpReply: p.arpReply,
      enabled: p.enabled,
      usedIPs: p.usedIPs,
      totalIPs: p.totalIPs,
    }));
    exportToCSV(csvData, 'ip-pools-config.csv');
    toast.success(`Exported ${pools.length} IP pools to CSV`);
  };

  const handleImport = () => {
    createFileInput('.json', (file) => {
      importFromJSON<IPPool>(
        file,
        (data) => {
          const newPools = data.map(p => ({
            ...p,
            id: `pool-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            usedIPs: 0,
          }));
          setPools(prev => [...prev, ...newPools]);
          toast.success(`Imported ${newPools.length} IP pools`);
        },
        (error) => toast.error(error)
      );
    });
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
                <button 
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                  onClick={() => openCreateModal('overload')}
                >
                  <Database className="w-3 h-3" />
                  Overload
                </button>
                <button 
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                  onClick={() => openCreateModal('one-to-one')}
                >
                  <Layers className="w-3 h-3" />
                  One-to-One
                </button>
                <button 
                  className="w-full px-3 py-2 text-left text-[11px] hover:bg-[#f0f0f0] flex items-center gap-2"
                  onClick={() => openCreateModal('fixed-port-range')}
                >
                  <Database className="w-3 h-3" />
                  Fixed Port Range
                </button>
              </div>
            )}
          </div>
          <button 
            className="forti-toolbar-btn" 
            disabled={selectedIds.length !== 1}
            onClick={openEditModal}
          >
            <Edit2 className="w-3 h-3" />
            Edit
          </button>
          <button 
            className="forti-toolbar-btn" 
            disabled={selectedIds.length === 0}
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="w-3 h-3" />
            Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={handleRefresh}>
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
          <div className="flex-1" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="forti-toolbar-btn">
                <Download className="w-3 h-3" />
                Export
                <ChevronDown className="w-3 h-3" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-white border shadow-lg z-50">
              <DropdownMenuItem onClick={handleExportJSON} className="cursor-pointer text-[11px]">
                Export as JSON
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCSV} className="cursor-pointer text-[11px]">
                Export as CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <button className="forti-toolbar-btn" onClick={handleImport}>
            <Upload className="w-3 h-3" />
            Import
          </button>
          <div className="forti-search">
            <Search className="w-3 h-3 text-[#999]" />
            <input 
              type="text" 
              placeholder="Search..." 
              className="w-40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-[#999] hover:text-[#666]">
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="p-4">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-8">
                  <input 
                    type="checkbox" 
                    className="forti-checkbox"
                    checked={selectedIds.length === filteredPools.length && filteredPools.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="w-16">Status</th>
                <th>Name</th>
                <th>Type</th>
                <th>Start IP</th>
                <th>End IP</th>
                <th>Interface</th>
                <th>ARP Reply</th>
                <th>Usage</th>
              </tr>
            </thead>
            <tbody>
              {filteredPools.map((pool) => (
                <tr 
                  key={pool.id} 
                  className={cn(!pool.enabled && "opacity-60", selectedIds.includes(pool.id) && "selected")}
                  onDoubleClick={() => {
                    setSelectedIds([pool.id]);
                    setTimeout(openEditModal, 0);
                  }}
                >
                  <td>
                    <input 
                      type="checkbox" 
                      className="forti-checkbox"
                      checked={selectedIds.includes(pool.id)}
                      onChange={() => handleSelect(pool.id)}
                    />
                  </td>
                  <td>
                    <FortiToggle 
                      enabled={pool.enabled} 
                      onToggle={() => togglePool(pool.id)}
                      size="sm"
                    />
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3 text-purple-600" />
                      <div>
                        <div className="text-[11px] font-medium">{pool.name}</div>
                        <div className="text-[10px] text-[#999]">{pool.comments}</div>
                      </div>
                    </div>
                  </td>
                  <td>
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 border",
                      pool.type === 'overload' && "bg-blue-100 text-blue-700 border-blue-200",
                      pool.type === 'one-to-one' && "bg-green-100 text-green-700 border-green-200",
                      pool.type === 'fixed-port-range' && "bg-purple-100 text-purple-700 border-purple-200",
                      pool.type === 'port-block-allocation' && "bg-orange-100 text-orange-700 border-orange-200"
                    )}>
                      {getTypeLabel(pool.type)}
                    </span>
                  </td>
                  <td className="mono text-[11px]">{pool.startIP}</td>
                  <td className="mono text-[11px]">{pool.endIP}</td>
                  <td>
                    <span className="text-[10px] px-1.5 py-0.5 bg-blue-100 text-blue-700 border border-blue-200">
                      {pool.associatedInterface}
                    </span>
                  </td>
                  <td>
                    {pool.arpReply ? (
                      <span className="text-[10px] text-green-600">Enable</span>
                    ) : (
                      <span className="text-[10px] text-[#999]">Disable</span>
                    )}
                  </td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1.5 bg-[#e0e0e0] rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${(pool.usedIPs / pool.totalIPs) * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-[#666]">{pool.usedIPs}/{pool.totalIPs}</span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredPools.length === 0 && (
                <tr>
                  <td colSpan={9} className="text-center text-[11px] text-[#999] py-8">
                    {searchQuery ? 'No matching IP pools found' : 'No IP pools configured'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          <div className="text-[11px] text-[#666] mt-2 px-1">
            {filteredPools.length} IP pools
            {selectedIds.length > 0 && ` (${selectedIds.length} selected)`}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="text-sm font-semibold">
              {editingItem ? 'Edit IP Pool' : 'New IP Pool'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-xs text-right text-muted-foreground">Name</label>
              <input
                type="text"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="col-span-3 text-xs border border-border rounded px-2 py-1.5 bg-background"
                placeholder="e.g., My-IP-Pool"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-xs text-right text-muted-foreground">Type</label>
              <select
                value={formType}
                onChange={(e) => setFormType(e.target.value as IPPool['type'])}
                className="col-span-3 text-xs border border-border rounded px-2 py-1.5 bg-background"
              >
                <option value="overload">Overload</option>
                <option value="one-to-one">One-to-One</option>
                <option value="fixed-port-range">Fixed Port Range</option>
                <option value="port-block-allocation">Port Block Allocation</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-xs text-right text-muted-foreground">Start IP</label>
              <input
                type="text"
                value={formStartIP}
                onChange={(e) => setFormStartIP(e.target.value)}
                className="col-span-3 text-xs border border-border rounded px-2 py-1.5 bg-background font-mono"
                placeholder="e.g., 203.0.113.100"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-xs text-right text-muted-foreground">End IP</label>
              <input
                type="text"
                value={formEndIP}
                onChange={(e) => setFormEndIP(e.target.value)}
                className="col-span-3 text-xs border border-border rounded px-2 py-1.5 bg-background font-mono"
                placeholder="e.g., 203.0.113.110"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-xs text-right text-muted-foreground">Interface</label>
              <select
                value={formInterface}
                onChange={(e) => setFormInterface(e.target.value)}
                className="col-span-3 text-xs border border-border rounded px-2 py-1.5 bg-background"
              >
                <option value="wan1">wan1</option>
                <option value="wan2">wan2</option>
                <option value="internal">internal</option>
                <option value="dmz">dmz</option>
              </select>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-xs text-right text-muted-foreground">ARP Reply</label>
              <div className="col-span-3">
                <FortiToggle enabled={formArpReply} onToggle={() => setFormArpReply(!formArpReply)} />
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-3">
              <label className="text-xs text-right text-muted-foreground">Comments</label>
              <input
                type="text"
                value={formComments}
                onChange={(e) => setFormComments(e.target.value)}
                className="col-span-3 text-xs border border-border rounded px-2 py-1.5 bg-background"
                placeholder="Optional description"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2 border-t">
            <button
              onClick={() => setModalOpen(false)}
              className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
            >
              {editingItem ? 'Save' : 'Create'}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete IP Pool(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedIds.length} IP pool(s)? This action cannot be undone.
              Pools with IPs in use cannot be deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default IPPools;
