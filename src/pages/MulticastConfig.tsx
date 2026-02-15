import { Shell } from '@/components/layout/Shell';
import { Settings, RefreshCw, Save, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { toast } from 'sonner';
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

interface MulticastInterface {
  name: string;
  pimMode: 'dense' | 'sparse' | 'sparse-dense';
  igmpVersion: 1 | 2 | 3;
  enabled: boolean;
}

interface MulticastGroup {
  id: string;
  group: string;
  source: string;
  interface: string;
  members: number;
}

const MulticastConfig = () => {
  const { demoMode } = useDemoMode();
  const [enabled, setEnabled] = useState(demoMode);
  const [multicastRouting, setMulticastRouting] = useState(true);
  const [igmpSnooping, setIgmpSnooping] = useState(true);
  const [rpAddress, setRpAddress] = useState('10.0.0.1');
  const [interfaces, setInterfaces] = useState<MulticastInterface[]>(demoMode ? [
    { name: 'internal', pimMode: 'sparse', igmpVersion: 2, enabled: true },
    { name: 'wan1', pimMode: 'sparse', igmpVersion: 2, enabled: false },
    { name: 'dmz', pimMode: 'dense', igmpVersion: 3, enabled: true },
  ] : []);
  const [groups, setGroups] = useState<MulticastGroup[]>(demoMode ? [
    { id: '1', group: '239.1.1.1', source: '10.0.0.100', interface: 'internal', members: 15 },
    { id: '2', group: '239.1.1.2', source: '10.0.0.101', interface: 'internal', members: 8 },
    { id: '3', group: '224.0.0.5', source: '0.0.0.0', interface: 'dmz', members: 3 },
  ] : []);

  const [addGroupOpen, setAddGroupOpen] = useState(false);
  const [newGroup, setNewGroup] = useState('');
  const [newSource, setNewSource] = useState('');
  const [newInterface, setNewInterface] = useState('internal');
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);

  const handleToggleInterface = (name: string) => {
    setInterfaces(prev => prev.map(i => i.name === name ? { ...i, enabled: !i.enabled } : i));
  };

  const handleAddGroup = () => {
    if (!newGroup.trim()) {
      toast.error('Group address is required');
      return;
    }
    setGroups(prev => [...prev, {
      id: Date.now().toString(),
      group: newGroup.trim(),
      source: newSource.trim() || '0.0.0.0',
      interface: newInterface,
      members: 0,
    }]);
    toast.success(`Static group "${newGroup.trim()}" added`);
    setNewGroup('');
    setNewSource('');
    setAddGroupOpen(false);
  };

  const handleDeleteGroup = () => {
    if (!deleteGroupId) return;
    const grp = groups.find(g => g.id === deleteGroupId);
    setGroups(prev => prev.filter(g => g.id !== deleteGroupId));
    setDeleteGroupId(null);
    toast.success(`Group "${grp?.group}" removed`);
  };

  const handleApply = () => {
    toast.success('Multicast configuration applied successfully');
  };

  const handleRefresh = () => {
    if (demoMode) {
      setInterfaces([
        { name: 'internal', pimMode: 'sparse', igmpVersion: 2, enabled: true },
        { name: 'wan1', pimMode: 'sparse', igmpVersion: 2, enabled: false },
        { name: 'dmz', pimMode: 'dense', igmpVersion: 3, enabled: true },
      ]);
      setGroups([
        { id: '1', group: '239.1.1.1', source: '10.0.0.100', interface: 'internal', members: 15 },
        { id: '2', group: '239.1.1.2', source: '10.0.0.101', interface: 'internal', members: 8 },
        { id: '3', group: '224.0.0.5', source: '0.0.0.0', interface: 'dmz', members: 3 },
      ]);
    }
    toast.success('Configuration refreshed');
  };

  const handlePimModeChange = (name: string, mode: MulticastInterface['pimMode']) => {
    setInterfaces(prev => prev.map(i => i.name === name ? { ...i, pimMode: mode } : i));
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground">Multicast Configuration</h1>
          </div>
          <div className="flex items-center gap-2">
            <button 
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
              onClick={handleApply}
            >
              <Save size={12} />
              Apply
            </button>
            <button 
              className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded"
              onClick={handleRefresh}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-3">
          <div className="bg-muted/30 border border-border rounded p-3">
            <div className="text-xs text-muted-foreground">PIM Enabled</div>
            <div className="text-lg font-bold text-foreground">{interfaces.filter(i => i.enabled).length}</div>
          </div>
          <div className="bg-muted/30 border border-border rounded p-3">
            <div className="text-xs text-muted-foreground">Active Groups</div>
            <div className="text-lg font-bold text-foreground">{groups.length}</div>
          </div>
          <div className="bg-muted/30 border border-border rounded p-3">
            <div className="text-xs text-muted-foreground">Total Members</div>
            <div className="text-lg font-bold text-foreground">{groups.reduce((acc, g) => acc + g.members, 0)}</div>
          </div>
          <div className="bg-muted/30 border border-border rounded p-3">
            <div className="text-xs text-muted-foreground">RP Address</div>
            <div className="text-sm font-mono text-foreground">{rpAddress}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {/* Basic Settings */}
          <div className="border border-border rounded">
            <div className="bg-muted/50 px-3 py-2 border-b border-border">
              <h2 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Settings size={12} />
                Global Settings
              </h2>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Enable Multicast</span>
                <FortiToggle enabled={enabled} onToggle={() => setEnabled(!enabled)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Multicast Routing</span>
                <FortiToggle enabled={multicastRouting} onToggle={() => setMulticastRouting(!multicastRouting)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">RP Address</span>
                <input 
                  type="text" 
                  value={rpAddress}
                  onChange={(e) => setRpAddress(e.target.value)}
                  className="w-28 text-xs border border-border rounded px-2 py-1 bg-background font-mono"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">IGMP Snooping</span>
                <FortiToggle enabled={igmpSnooping} onToggle={() => setIgmpSnooping(!igmpSnooping)} />
              </div>
            </div>
          </div>

          {/* Interface Settings */}
          <div className="border border-border rounded">
            <div className="bg-muted/50 px-3 py-2 border-b border-border">
              <h2 className="text-xs font-semibold text-foreground">Interface Settings</h2>
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Interface</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">PIM Mode</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">IGMP</th>
                  <th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {interfaces.map((intf) => (
                  <tr key={intf.name} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                    <td className="px-3 py-2 font-medium">{intf.name}</td>
                    <td className="px-3 py-2">
                      <select
                        value={intf.pimMode}
                        onChange={(e) => handlePimModeChange(intf.name, e.target.value as MulticastInterface['pimMode'])}
                        className="text-[10px] border border-border rounded px-1.5 py-0.5 bg-background"
                      >
                        <option value="sparse">SPARSE</option>
                        <option value="dense">DENSE</option>
                        <option value="sparse-dense">SPARSE-DENSE</option>
                      </select>
                    </td>
                    <td className="px-3 py-2">v{intf.igmpVersion}</td>
                    <td className="px-3 py-2">
                      <FortiToggle enabled={intf.enabled} onToggle={() => handleToggleInterface(intf.name)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Active Groups */}
        <div className="border border-border rounded">
          <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between">
            <h2 className="text-xs font-semibold text-foreground">Active Multicast Groups</h2>
            <button 
              className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded"
              onClick={() => setAddGroupOpen(true)}
            >
              <Plus size={12} />
              Add Static Group
            </button>
          </div>
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Group Address</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Source</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Interface</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Members</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr><td colSpan={5} className="px-3 py-4 text-center text-muted-foreground">No multicast groups</td></tr>
              ) : groups.map((group) => (
                <tr key={group.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono">{group.group}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{group.source === '0.0.0.0' ? '*' : group.source}</td>
                  <td className="px-3 py-2">
                    <span className="forti-tag bg-blue-100 text-blue-700 border-blue-200">{group.interface}</span>
                  </td>
                  <td className="px-3 py-2">{group.members}</td>
                  <td className="px-3 py-2">
                    <button 
                      className="p-1 text-destructive hover:bg-destructive/10 rounded"
                      onClick={() => setDeleteGroupId(group.id)}
                    >
                      <Trash2 size={10} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Group Dialog */}
      <Dialog open={addGroupOpen} onOpenChange={setAddGroupOpen}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-sm">Add Static Multicast Group</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Group Address</label>
              <input
                type="text"
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                placeholder="e.g., 239.1.1.1"
                className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Source (optional)</label>
              <input
                type="text"
                value={newSource}
                onChange={(e) => setNewSource(e.target.value)}
                placeholder="e.g., 10.0.0.100 (leave empty for any)"
                className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Interface</label>
              <select
                value={newInterface}
                onChange={(e) => setNewInterface(e.target.value)}
                className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background"
              >
                <option value="internal">internal</option>
                <option value="wan1">wan1</option>
                <option value="dmz">dmz</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted" onClick={() => setAddGroupOpen(false)}>Cancel</button>
              <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90" onClick={handleAddGroup}>Add</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Multicast Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this static multicast group?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteGroup}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default MulticastConfig;