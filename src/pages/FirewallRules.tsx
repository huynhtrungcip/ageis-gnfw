import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockFirewallRules } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { 
  Plus, 
  Search,
  Copy,
  Shield,
  ArrowUp,
  ArrowDown,
  GripVertical,
  Check,
  X,
  Network,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { FirewallRuleModal } from '@/components/firewall/FirewallRuleModal';
import type { FirewallRule } from '@/types/firewall';
import { toast } from 'sonner';
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
import { Checkbox } from '@/components/ui/checkbox';

// Group rules by interface pair
interface InterfacePair {
  from: string;
  to: string;
  rules: FirewallRule[];
  expanded: boolean;
}

interface SortableRowProps {
  rule: FirewallRule;
  index: number;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onEdit: (rule: FirewallRule) => void;
  formatBytes: (n: number) => string;
  isDraggingDisabled: boolean;
}

function SortableRow({ rule, index, isSelected, onSelect, onEdit, formatBytes, isDraggingDisabled }: SortableRowProps) {
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
        isDragging && "bg-yellow-50",
        isSelected && "bg-[#fff8e1]"
      )}
    >
      <td className="w-8 text-center">
        <Checkbox
          checked={isSelected}
          onCheckedChange={() => onSelect(rule.id)}
          onClick={(e) => e.stopPropagation()}
        />
      </td>
      <td className="w-10 text-center text-[11px] text-[#666]">{index + 1}</td>
      <td className="text-[11px] font-medium text-[#333]" onDoubleClick={() => onEdit(rule)}>
        {rule.description || `Rule-${index + 1}`}
      </td>
      <td className="text-[11px]">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-[#4caf50] rounded-sm" />
          {rule.source.value === '*' ? 'all' : rule.source.value}
        </span>
      </td>
      <td className="text-[11px]">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-[#2196f3] rounded-sm" />
          {rule.destination.value === '*' ? 'all' : rule.destination.value}
        </span>
      </td>
      <td className="text-[11px] text-[#666]">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-300 rounded-sm text-[8px] flex items-center justify-center">📅</span>
          {rule.schedule || 'always'}
        </span>
      </td>
      <td className="text-[11px]">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-purple-400 rounded-sm text-white text-[8px] flex items-center justify-center">⚡</span>
          {rule.destination.port || 'ALL'}
        </span>
      </td>
      <td className="text-[11px]">
        <span className={cn(
          "inline-flex items-center gap-1",
          rule.action === 'pass' ? 'text-[#4caf50]' : 'text-red-500'
        )}>
          {rule.action === 'pass' ? <Check size={12} /> : <X size={12} />}
          {rule.action === 'pass' ? 'ACCEPT' : 'DENY'}
        </span>
      </td>
      <td className="text-[11px]">
        <span className={cn(
          "inline-flex items-center gap-1",
          rule.enabled ? 'text-[#4caf50]' : 'text-[#999]'
        )}>
          <span className={cn(
            "w-2 h-2 rounded-full",
            rule.enabled ? 'bg-[#4caf50]' : 'bg-[#ccc]'
          )} />
          {rule.enabled ? 'Enabled' : 'Disabled'}
        </span>
      </td>
      <td className="text-[11px] text-[#666]">
        <span className="inline-flex items-center gap-1">
          <Shield size={10} />
          UTM
        </span>
      </td>
      <td className="text-[11px] text-right text-[#666]">{formatBytes(rule.hits * 1024)}</td>
    </tr>
  );
}

const FirewallRules = () => {
  const [rules, setRules] = useState(mockFirewallRules);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [viewMode, setViewMode] = useState<'sequence' | 'interface'>('interface');
  const [expandedPairs, setExpandedPairs] = useState<string[]>(['lan-wan1', 'vlan-kinhdoanh-vlan-kythuat']);

  // Group rules by interface pairs for Interface Pair View
  const getInterfacePairs = (): InterfacePair[] => {
    const pairMap = new Map<string, FirewallRule[]>();
    rules.forEach(rule => {
      const from = rule.interface;
      const to = rule.interface === 'WAN' ? 'LAN' : 'WAN';
      const key = `${from.toLowerCase()}-${to.toLowerCase()}`;
      if (!pairMap.has(key)) {
        pairMap.set(key, []);
      }
      pairMap.get(key)!.push(rule);
    });

    // Create demo interface pairs like FortiGate
    const demoPairs: InterfacePair[] = [
      { from: 'lan', to: 'wan1', rules: rules.filter(r => r.interface === 'LAN').slice(0, 2), expanded: true },
      { from: 'Vlan-Kinhdoanh', to: 'Vlan-Kythuat', rules: rules.filter(r => r.interface === 'LAN').slice(0, 1), expanded: true },
      { from: 'Vlan-Kinhdoanh', to: 'Vlan-Office', rules: rules.filter(r => r.interface === 'DMZ').slice(0, 1), expanded: true },
      { from: 'Vlan-Kinhdoanh', to: 'wan1', rules: [], expanded: false },
      { from: 'Vlan-Kythuat', to: 'Vlan-Kinhdoanh', rules: rules.filter(r => r.interface === 'WAN').slice(0, 1), expanded: true },
    ];

    return demoPairs;
  };

  const interfacePairs = getInterfacePairs();
  const isDraggingDisabled = searchQuery !== '';

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const formatBytes = (bytes: number) => {
    if (bytes >= 1073741824) return (bytes / 1073741824).toFixed(2) + ' GB';
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(2) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return bytes + ' B';
  };

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
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

  const handleDeleteSelected = () => {
    setRules(prev => prev.filter(r => !selectedIds.includes(r.id)));
    toast.success(`${selectedIds.length} rules deleted`);
    setSelectedIds([]);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      setRules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        toast.success(`Rule moved to position ${newIndex + 1}`);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const togglePair = (pairKey: string) => {
    setExpandedPairs(prev => 
      prev.includes(pairKey) 
        ? prev.filter(p => p !== pairKey)
        : [...prev, pairKey]
    );
  };

  const selectedRule = selectedIds.length === 1 ? rules.find(r => r.id === selectedIds[0]) : null;

  return (
    <Shell>
      <div className="space-y-0">
        {/* FortiGate Toolbar */}
        <div className="flex items-center gap-0.5 px-1 py-1 bg-[#f0f0f0] border border-[#ccc]">
          <button onClick={handleAddRule} className="forti-toolbar-btn primary">
            <Plus size={12} /> Create New
          </button>
          <button 
            onClick={() => selectedRule && handleEditRule(selectedRule)}
            className="forti-toolbar-btn"
            disabled={selectedIds.length !== 1}
          >
            ✏️ Edit
          </button>
          <button 
            onClick={handleDeleteSelected}
            className="forti-toolbar-btn"
            disabled={selectedIds.length === 0}
          >
            🗑️ Delete
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn">
            <Search size={12} /> Policy Lookup
          </button>
          
          <div className="flex-1" />
          
          {/* Search */}
          <div className="forti-search">
            <input 
              type="text" 
              placeholder="Search" 
              className="w-40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={12} className="text-[#999]" />
          </div>

          <div className="forti-toolbar-separator" />
          
          {/* View Toggle */}
          <div className="forti-view-toggle">
            <button 
              className={cn("forti-view-btn", viewMode === 'interface' && "active")}
              onClick={() => setViewMode('interface')}
            >
              Interface Pair View
            </button>
            <button 
              className={cn("forti-view-btn", viewMode === 'sequence' && "active")}
              onClick={() => setViewMode('sequence')}
            >
              By Sequence
            </button>
          </div>
        </div>

        {/* Policy Table */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <div className="border border-[#ccc] border-t-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th className="w-10">ID</th>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Schedule</th>
                  <th>Service</th>
                  <th>Action</th>
                  <th>NAT</th>
                  <th>Security Profiles</th>
                  <th>Log</th>
                  <th className="text-right">Bytes</th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'interface' ? (
                  // Interface Pair View
                  interfacePairs.map((pair, pairIdx) => {
                    const pairKey = `${pair.from}-${pair.to}`;
                    const isExpanded = expandedPairs.includes(pairKey);
                    const ruleCount = pair.rules.length;
                    
                    return (
                      <>
                        {/* Interface Pair Header */}
                        <tr 
                          key={`pair-${pairIdx}`}
                          className="group-header cursor-pointer"
                          onClick={() => togglePair(pairKey)}
                        >
                          <td colSpan={12} className="py-1 px-2">
                            <div className="flex items-center gap-2">
                              <Checkbox className="border-white" />
                              {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                              <span className="inline-flex items-center gap-1">
                                <span className="w-3 h-3 bg-green-400 rounded-sm" />
                                {pair.from}
                              </span>
                              <span>→</span>
                              <span className="inline-flex items-center gap-1">
                                <Network size={12} />
                                {pair.to}
                              </span>
                              <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">
                                {ruleCount}
                              </span>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Rules in this pair */}
                        {isExpanded && (
                          <SortableContext
                            items={pair.rules.map(r => r.id)}
                            strategy={verticalListSortingStrategy}
                          >
                            {pair.rules.map((rule, idx) => (
                              <SortableRow
                                key={rule.id}
                                rule={rule}
                                index={idx}
                                isSelected={selectedIds.includes(rule.id)}
                                onSelect={handleSelect}
                                onEdit={handleEditRule}
                                formatBytes={formatBytes}
                                isDraggingDisabled={isDraggingDisabled}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </>
                    );
                  })
                ) : (
                  // Sequence View
                  <SortableContext
                    items={rules.filter(r => 
                      searchQuery === '' || 
                      r.description.toLowerCase().includes(searchQuery.toLowerCase())
                    ).map(r => r.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {rules
                      .filter(r => searchQuery === '' || r.description.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((rule, idx) => (
                        <SortableRow
                          key={rule.id}
                          rule={rule}
                          index={idx}
                          isSelected={selectedIds.includes(rule.id)}
                          onSelect={handleSelect}
                          onEdit={handleEditRule}
                          formatBytes={formatBytes}
                          isDraggingDisabled={isDraggingDisabled}
                        />
                      ))}
                  </SortableContext>
                )}
                
                {/* Implicit Policy */}
                <tr className="group-header">
                  <td colSpan={12} className="py-1 px-2">
                    <div className="flex items-center gap-2">
                      <Checkbox className="border-white" />
                      <ChevronRight size={12} />
                      <span>Implicit</span>
                      <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">1</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </DndContext>
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
