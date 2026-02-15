import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockFirewallRules } from '@/data/mockData';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { cn } from '@/lib/utils';
import { formatBytes } from '@/lib/formatters';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { 
  Plus, 
  Search,
  Shield,
  Check,
  X,
  Network,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  Copy,
  RefreshCw
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
  onToggle: (id: string) => void;
  isDraggingDisabled: boolean;
}

function SortableRow({ rule, index, isSelected, onSelect, onEdit, onToggle, isDraggingDisabled }: SortableRowProps) {
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
      className={cn(
        isDragging && "bg-yellow-50",
        isSelected && "selected"
      )}
    >
      <td className="w-8 text-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => onSelect(rule.id)}
          onClick={(e) => e.stopPropagation()}
          className="forti-checkbox"
        />
      </td>
      <td className="w-12 text-center">
        <FortiToggle
          enabled={rule.enabled}
          onToggle={() => onToggle(rule.id)}
          size="sm"
        />
      </td>
      <td className="w-10 text-center text-[11px] text-[#333]">{index + 1}</td>
      <td className="text-[11px] font-medium text-[#111]" onDoubleClick={() => onEdit(rule)}>
        {rule.description || `Rule-${index + 1}`}
      </td>
      <td className="text-[11px] text-[#333]">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-[#4caf50] rounded-sm" />
          {rule.source.value === '*' ? 'all' : rule.source.value}
        </span>
      </td>
      <td className="text-[11px] text-[#333]">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-[#2196f3] rounded-sm" />
          {rule.destination.value === '*' ? 'all' : rule.destination.value}
        </span>
      </td>
      <td className="text-[11px] text-[#333]">
        {rule.schedule || 'always'}
      </td>
      <td className="text-[11px] text-[#333]">
        <span className="inline-flex items-center gap-1">
          <span className="w-3 h-3 bg-purple-400 rounded-sm text-white text-[8px] flex items-center justify-center">⚡</span>
          {rule.destination.port || 'ALL'}
        </span>
      </td>
      <td className="text-[11px]">
        <span className={cn(
          "inline-flex items-center gap-1 px-1.5 py-0.5 border text-[10px]",
          rule.action === 'pass' 
            ? 'bg-green-100 text-green-700 border-green-200' 
            : 'bg-red-100 text-red-600 border-red-200'
        )}>
          {rule.action === 'pass' ? <Check size={10} /> : <X size={10} />}
          {rule.action === 'pass' ? 'ACCEPT' : 'DENY'}
        </span>
      </td>
      <td className="text-[11px]">
        <span className="inline-flex items-center gap-1 text-[#666]">
          <Shield size={10} />
          UTM
        </span>
      </td>
      <td className="text-[11px] text-right text-[#666]">{formatBytes(rule.hits * 1024)}</td>
    </tr>
  );
}

const FirewallRules = () => {
  const { demoMode } = useDemoMode();
  const [rules, setRules] = useState(demoMode ? mockFirewallRules : []);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);
  const [viewMode, setViewMode] = useState<'sequence' | 'interface'>('interface');
  const [expandedPairs, setExpandedPairs] = useState<string[]>([]);

  const getInterfacePairs = (): InterfacePair[] => {
    if (!demoMode || rules.length === 0) return [];

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

  

  const handleSelect = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleToggleRule = (id: string) => {
    setRules(prev => prev.map(r => 
      r.id === id ? { ...r, enabled: !r.enabled } : r
    ));
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
      <div className="space-y-0 animate-slide-in">
        {/* FortiGate Toolbar */}
        <div className="forti-toolbar">
          <button onClick={handleAddRule} className="forti-toolbar-btn primary">
            <Plus size={12} /> Create New
          </button>
          <button 
            onClick={() => selectedRule && handleEditRule(selectedRule)}
            className="forti-toolbar-btn"
            disabled={selectedIds.length !== 1}
          >
            <Edit2 size={12} /> Edit
          </button>
          <button 
            onClick={handleDeleteSelected}
            className="forti-toolbar-btn"
            disabled={selectedIds.length === 0}
          >
            <Trash2 size={12} /> Delete
          </button>
          <button 
            className="forti-toolbar-btn"
            disabled={selectedIds.length !== 1}
            onClick={() => {
              const rule = rules.find(r => r.id === selectedIds[0]);
              if (rule) {
                const clone = { ...rule, id: `rule-${Date.now()}`, description: `${rule.description} (copy)` };
                setRules(prev => [...prev, clone]);
                toast.success(`Cloned rule "${rule.description}"`);
              }
            }}
          >
            <Copy size={12} /> Clone
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn" onClick={() => toast.info('Policy Lookup: Enter source/destination to find matching policies')}>
            <Search size={12} /> Policy Lookup
          </button>
          <button className="forti-toolbar-btn" onClick={() => { setRules(demoMode ? mockFirewallRules : []); toast.success('Firewall rules refreshed'); }}>
            <RefreshCw size={12} /> Refresh
          </button>
          
          <div className="flex-1" />
          
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input 
              type="text" 
              placeholder="Search" 
              className="w-40"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="forti-toolbar-separator" />
          
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
          <div className="p-4">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-8"></th>
                  <th className="w-12">Status</th>
                  <th className="w-10">ID</th>
                  <th>Name</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Schedule</th>
                  <th>Service</th>
                  <th>Action</th>
                  <th>Security Profiles</th>
                  <th className="text-right">Bytes</th>
                </tr>
              </thead>
              <tbody>
                {viewMode === 'interface' ? (
                  interfacePairs.map((pair, pairIdx) => {
                    const pairKey = `${pair.from}-${pair.to}`;
                    const isExpanded = expandedPairs.includes(pairKey);
                    const ruleCount = pair.rules.length;
                    
                    return (
                      <>
                        <tr 
                          key={`pair-${pairIdx}`}
                          className="group-header cursor-pointer"
                          onClick={() => togglePair(pairKey)}
                        >
                          <td colSpan={11} className="py-1 px-2">
                            <div className="flex items-center gap-2">
                              <input type="checkbox" className="forti-checkbox border-white" onClick={e => e.stopPropagation()} />
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
                                onToggle={handleToggleRule}
                                isDraggingDisabled={isDraggingDisabled}
                              />
                            ))}
                          </SortableContext>
                        )}
                      </>
                    );
                  })
                ) : (
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
                          onToggle={handleToggleRule}
                          isDraggingDisabled={isDraggingDisabled}
                        />
                      ))}
                  </SortableContext>
                )}
                
                <tr className="group-header">
                  <td colSpan={11} className="py-1 px-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="forti-checkbox border-white" />
                      <ChevronRight size={12} />
                      <span>Implicit</span>
                      <span className="ml-2 px-1.5 py-0.5 bg-white/20 rounded text-[10px]">1</span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
            <div className="text-[11px] text-[#666] mt-2 px-1">
              {rules.length} policies
            </div>
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
