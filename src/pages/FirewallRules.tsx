import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { mockFirewallRules } from '@/data/mockData';
import { cn } from '@/lib/utils';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';
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

interface SortableRowProps {
  rule: FirewallRule;
  index: number;
  onEdit: (rule: FirewallRule) => void;
  onDelete: (id: string) => void;
  formatHits: (n: number) => string;
  isDraggingDisabled: boolean;
}

function SortableRow({ rule, index, onEdit, onDelete, formatHits, isDraggingDisabled }: SortableRowProps) {
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
        !rule.enabled && "opacity-50",
        isDragging && "bg-muted/50 shadow-lg"
      )}
    >
      <td className="text-muted-foreground font-mono">
        <div className="flex items-center gap-2">
          {!isDraggingDisabled && (
            <button
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing p-1 -ml-1 hover:bg-muted rounded transition-colors"
            >
              <GripVertical size={14} className="text-muted-foreground/50" />
            </button>
          )}
          {index + 1}
        </div>
      </td>
      <td>
        <span className={cn(
          "status-dot-lg",
          rule.enabled ? "status-healthy" : "status-inactive"
        )} />
      </td>
      <td>
        <span className={cn(
          "tag",
          rule.action === 'pass' ? "tag-healthy" : rule.action === 'block' ? "tag-critical" : "tag-medium"
        )}>
          {rule.action.toUpperCase()}
        </span>
      </td>
      <td className="font-medium">{rule.interface}</td>
      <td className="mono">{rule.protocol.toUpperCase()}</td>
      <td className="mono text-muted-foreground">
        {rule.source.value}{rule.source.port ? `:${rule.source.port}` : ''}
      </td>
      <td className="mono text-muted-foreground">
        {rule.destination.value}{rule.destination.port ? `:${rule.destination.port}` : ''}
      </td>
      <td className="max-w-[200px] truncate text-muted-foreground">{rule.description}</td>
      <td className="text-right mono text-muted-foreground">{formatHits(rule.hits)}</td>
      <td>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(rule)}
            className="p-1.5 rounded hover:bg-muted transition-colors"
            title="Edit rule"
          >
            <Pencil size={14} className="text-muted-foreground" />
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
            title="Delete rule"
          >
            <Trash2 size={14} className="text-destructive" />
          </button>
        </div>
      </td>
    </tr>
  );
}

const FirewallRules = () => {
  const [rules, setRules] = useState(mockFirewallRules);
  const [iface, setIface] = useState<string>('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | null>(null);

  const interfaces = ['all', 'WAN', 'LAN', 'DMZ'];
  const filtered = iface === 'all' ? rules : rules.filter(r => r.interface === iface);
  const isDraggingDisabled = iface !== 'all';

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
    toast.success('Rule deleted');
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setRules((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Update order numbers
        const updatedOrder = newOrder.map((rule, idx) => ({
          ...rule,
          order: idx + 1,
        }));
        
        toast.success(`Rule moved to position ${newIndex + 1}`);
        return updatedOrder;
      });
    }
  };

  return (
    <Shell>
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-base font-bold">Firewall Rules</h1>
            {!isDraggingDisabled && (
              <p className="text-[10px] text-muted-foreground mt-0.5">Drag rows to reorder rules</p>
            )}
          </div>
          <button onClick={handleAddRule} className="btn btn-primary flex items-center gap-1.5">
            <Plus size={14} />
            Add Rule
          </button>
        </div>

        {/* Filter Strip */}
        <div className="action-strip">
          <span className="text-xs text-muted-foreground">Filter by interface:</span>
          <div className="flex items-center gap-1">
            {interfaces.map((i) => (
              <button
                key={i}
                onClick={() => setIface(i)}
                className={cn(
                  "px-3 py-1.5 text-xs rounded-sm transition-all",
                  iface === i 
                    ? "bg-primary text-primary-foreground font-medium" 
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                {i === 'all' ? 'All Interfaces' : i}
              </button>
            ))}
          </div>
          <div className="flex-1" />
          {isDraggingDisabled && (
            <span className="text-[10px] text-amber-400 mr-2">Drag disabled when filtered</span>
          )}
          <span className="text-xs text-muted-foreground">{filtered.length} rules</span>
        </div>

        {/* Rules Table */}
        <div className="section">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">#</th>
                  <th className="w-14">Status</th>
                  <th className="w-24">Action</th>
                  <th>Interface</th>
                  <th>Protocol</th>
                  <th>Source</th>
                  <th>Destination</th>
                  <th>Description</th>
                  <th className="text-right">Hits</th>
                  <th className="w-20">Actions</th>
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
