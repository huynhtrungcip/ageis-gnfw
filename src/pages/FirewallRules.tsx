import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockFirewallRules } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Pencil, 
  Trash2, 
  GripVertical, 
  RefreshCw, 
  Search,
  Copy,
  Shield,
  ArrowUp,
  ArrowDown,
  ToggleLeft,
  Filter
} from 'lucide-react';
import { FirewallRuleModal } from '@/components/firewall/FirewallRuleModal';
import type { FirewallRule } from '@/types/firewall';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface SortableRowProps {
  rule: FirewallRule;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (rule: FirewallRule) => void;
  onDelete: (id: string) => void;
  formatHits: (n: number) => string;
  isDraggingDisabled: boolean;
}

function SortableRow({ rule, index, isSelected, onSelect, onEdit, onDelete, formatHits, isDraggingDisabled }: SortableRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: rule.id, disabled: isDraggingDisabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      onClick={() => onSelect(rule.id)}
      className={cn(
        "cursor-pointer",
        !rule.enabled && "opacity-50",
        isDragging && "bg-muted/50 shadow-lg",
        isSelected && "selected"
      )}
    >
      <td>
        <div className="flex items-center gap-1">
          <input 
            type="checkbox" 
            checked={isSelected}
            onChange={() => onSelect(rule.id)}
            className="rounded"
          />
          {!isDraggingDisabled && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-0.5 hover:bg-muted rounded transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <GripVertical size={12} className="text-muted-foreground/50" />
            </button>
          )}
        </div>
      </td>
      <td className="text-muted-foreground font-mono text-xs">{index + 1}</td>
      <td className="font-medium text-xs">
        {rule.description || `Rule-${index + 1}`}
      </td>
      <td>
        <span className={cn(
          "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
          rule.interface === 'WAN' ? 'bg-blue-100 text-blue-700' :
          rule.interface === 'LAN' ? 'bg-green-100 text-green-700' :
          'bg-purple-100 text-purple-700'
        )}>
          {rule.interface}
        </span>
      </td>
      <td>
        <span className={cn(
          "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
          rule.interface === 'WAN' ? 'bg-blue-100 text-blue-700' :
          rule.interface === 'LAN' ? 'bg-green-100 text-green-700' :
          'bg-purple-100 text-purple-700'
        )}>
          {rule.interface === 'WAN' ? 'LAN' : 'WAN'}
        </span>
      </td>
      <td className="font-mono text-xs text-muted-foreground">
        {rule.source.value === '*' ? 'all' : rule.source.value}
      </td>
      <td className="font-mono text-xs text-muted-foreground">
        {rule.destination.value === '*' ? 'all' : rule.destination.value}
      </td>
      <td className="text-xs text-muted-foreground">
        {rule.schedule || 'always'}
      </td>
      <td className="text-xs text-muted-foreground">
        {rule.destination.port || 'ALL'}
      </td>
      <td>
        <span className={cn(
          "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-medium",
          rule.action === 'pass' ? 'bg-green-100 text-green-700' : 
          rule.action === 'block' ? 'bg-red-100 text-red-700' : 
          'bg-yellow-100 text-yellow-700'
        )}>
          {rule.action === 'pass' ? 'ACCEPT' : rule.action.toUpperCase()}
        </span>
      </td>
      <td>
        <span className={cn(
          "inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded",
          rule.enabled 
            ? 'bg-green-100 text-green-700' 
            : 'bg-gray-100 text-gray-500'
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            rule.enabled ? 'bg-green-500' : 'bg-gray-400'
          )} />
          {rule.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </td>
      <td className="text-right font-mono text-xs text-muted-foreground">{formatHits(rule.hits)}</td>
    </tr>
  );
}

const FirewallRules = () => {
  const [rules, setRules] = useState(mockFirewallRules);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [iface, setIface] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);

  const interfaces = ['all', 'WAN', 'LAN', 'DMZ'];
  const filtered = rules.filter(r => {
    const matchesIface = iface === 'all' || r.interface === iface;
    const matchesSearch = searchQuery === '' || 
      r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.source.value.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.destination.value.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesIface && matchesSearch;
  });
  const isDraggingDisabled = iface !== 'all' || searchQuery !== '';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const formatHits = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filtered.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filtered.map(r => r.id));
    }
  };

  const handleAddRule = () => {
    setEditingRule(null);
    setModalOpen(true);
  };

  const handleEditRule = (rule: FirewallRule) => {
    setEditingRule(rule);
    setModalOpen(true);
  };

  const handleSaveRule = (ruleData: Partial<FirewallRule>) => {
    if (editingRule) {
      setRules(prev => prev.map(r => 
        r.id === editingRule.id ? { ...r, ...ruleData } : r
      ));
      toast.success('Rule updated successfully');
    } else {
      const newRule: FirewallRule = {
        id: `rule-${Date.now()}`,
        order: rules.length + 1,
        hits: 0,
        created: new Date(),
        ...ruleData,
      } as FirewallRule;
      setRules(prev => [...prev, newRule]);
      toast.success('Rule created successfully');
    }
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(r => r.id !== ruleId));
    setSelectedIds(prev => prev.filter(id => id !== ruleId));
    toast.success('Rule deleted');
  };

  const handleDeleteSelected = () => {
    setRules(prev => prev.filter(r => !selectedIds.includes(r.id)));
    toast.success(`${selectedIds.length} rules deleted`);
    setSelectedIds([]);
  };

  const handleCloneSelected = () => {
    const cloned = selectedIds.map(id => {
      const rule = rules.find(r => r.id === id);
      if (rule) {
        return {
          ...rule,
          id: `rule-${Date.now()}-${Math.random()}`,
          description: `${rule.description} (copy)`,
          order: rules.length + 1,
        };
      }
      return null;
    }).filter(Boolean) as FirewallRule[];
    
    setRules(prev => [...prev, ...cloned]);
    toast.success(`${cloned.length} rules cloned`);
    setSelectedIds([]);
  };

  const handleMoveUp = () => {
    if (selectedIds.length !== 1) return;
    const idx = rules.findIndex(r => r.id === selectedIds[0]);
    if (idx > 0) {
      setRules(prev => arrayMove(prev, idx, idx - 1));
      toast.success('Rule moved up');
    }
  };

  const handleMoveDown = () => {
    if (selectedIds.length !== 1) return;
    const idx = rules.findIndex(r => r.id === selectedIds[0]);
    if (idx < rules.length - 1) {
      setRules(prev => arrayMove(prev, idx, idx + 1));
      toast.success('Rule moved down');
    }
  };

  const handleToggleSelected = () => {
    setRules(prev => prev.map(r => 
      selectedIds.includes(r.id) ? { ...r, enabled: !r.enabled } : r
    ));
    toast.success('Rules toggled');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        const updatedOrder = newOrder.map((rule, idx) => ({
          ...rule,
          order: idx + 1,
        }));
        
        toast.success(`Rule moved to position ${newIndex + 1}`);
        return updatedOrder;
      });
    }
  };

  const selectedRule = selectedIds.length === 1 ? rules.find(r => r.id === selectedIds[0]) : null;

  return (
    <Shell>
      <div className="space-y-3">
        {/* FortiGate-style Widget */}
        <div className="widget">
          <div className="widget-header">
            <div className="flex items-center gap-2">
              <Shield size={14} />
              <span>IPv4 Policy</span>
            </div>
          </div>
          
          {/* FortiGate Toolbar */}
          <div className="forti-toolbar">
            <button onClick={handleAddRule} className="forti-toolbar-btn primary">
              + Create New
            </button>
            <button 
              onClick={() => selectedRule && handleEditRule(selectedRule)}
              className="forti-toolbar-btn"
              disabled={selectedIds.length !== 1}
            >
              ✏️ Edit
            </button>
            <button 
              onClick={handleCloneSelected}
              className="forti-toolbar-btn"
              disabled={selectedIds.length === 0}
            >
              <Copy size={12} /> Clone
            </button>
            <button 
              onClick={handleDeleteSelected}
              className="forti-toolbar-btn"
              disabled={selectedIds.length === 0}
            >
              🗑️ Delete
            </button>
            <div className="h-4 w-px bg-border mx-1" />
            <button 
              onClick={handleMoveUp}
              className="forti-toolbar-btn"
              disabled={selectedIds.length !== 1}
            >
              <ArrowUp size={12} />
            </button>
            <button 
              onClick={handleMoveDown}
              className="forti-toolbar-btn"
              disabled={selectedIds.length !== 1}
            >
              <ArrowDown size={12} />
            </button>
            <button 
              onClick={handleToggleSelected}
              className="forti-toolbar-btn"
              disabled={selectedIds.length === 0}
            >
              <ToggleLeft size={12} /> Toggle
            </button>
            <div className="flex-1" />
            
            {/* Filter */}
            <div className="flex items-center gap-2">
              <Select value={iface} onValueChange={setIface}>
                <SelectTrigger className="h-7 w-28 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {interfaces.map((i) => (
                    <SelectItem key={i} value={i}>
                      {i === 'all' ? 'All' : i}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="forti-search">
                <Search size={12} className="text-muted-foreground" />
                <input 
                  type="text" 
                  placeholder="Search" 
                  className="w-32"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          {/* Policy Interface Selector Tabs */}
          <div className="flex items-center gap-0 bg-muted border-b border-border">
            <span className="px-3 py-1.5 text-xs text-muted-foreground">By Sequence</span>
            <button className="px-3 py-1.5 text-xs bg-white border-x border-border font-medium">
              By Sequence
            </button>
            <button className="px-3 py-1.5 text-xs text-muted-foreground hover:bg-white/50">
              Interface Pair View
            </button>
          </div>

          {/* Rules Table */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-14">
                    <input 
                      type="checkbox" 
                      checked={selectedIds.length === filtered.length && filtered.length > 0}
                      onChange={handleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="w-12">Seq.#</th>
                  <th>Name</th>
                  <th>From</th>
                  <th>To</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Schedule</th>
                  <th>Service</th>
                  <th>Action</th>
                  <th>Status</th>
                  <th className="text-right">Bytes</th>
                </tr>
              </thead>
              <tbody>
                <SortableContext
                  items={filtered.map(r => r.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {filtered.map((rule, idx) => (
                    <SortableRow
                      key={rule.id}
                      rule={rule}
                      index={idx}
                      isSelected={selectedIds.includes(rule.id)}
                      onSelect={handleSelect}
                      onEdit={handleEditRule}
                      onDelete={handleDeleteRule}
                      formatHits={formatHits}
                      isDraggingDisabled={isDraggingDisabled}
                    />
                  ))}
                </SortableContext>
              </tbody>
            </table>
          </DndContext>
          
          {/* Footer */}
          <div className="px-3 py-2 text-[11px] text-muted-foreground bg-muted border-t border-border flex items-center justify-between">
            <span>{filtered.length} policies</span>
            {isDraggingDisabled && searchQuery === '' && iface !== 'all' && (
              <span className="text-amber-600">Drag reorder disabled when filtered</span>
            )}
            {selectedIds.length > 0 && (
              <span>{selectedIds.length} selected</span>
            )}
          </div>
        </div>
      </div>

      <FirewallRuleModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        rule={editingRule}
        onSave={handleSaveRule}
      />
    </Shell>
  );
};

export default FirewallRules;
