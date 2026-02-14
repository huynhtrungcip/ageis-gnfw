import { Shell } from '@/components/layout/Shell';
import { Settings, Radio, RefreshCw, Save, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { useDemoMode } from '@/contexts/DemoModeContext';

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
  const [interfaces] = useState<MulticastInterface[]>(demoMode ? [
    { name: 'internal', pimMode: 'sparse', igmpVersion: 2, enabled: true },
    { name: 'wan1', pimMode: 'sparse', igmpVersion: 2, enabled: false },
    { name: 'dmz', pimMode: 'dense', igmpVersion: 3, enabled: true },
  ] : []);
  const [groups] = useState<MulticastGroup[]>(demoMode ? [
    { id: '1', group: '239.1.1.1', source: '10.0.0.100', interface: 'internal', members: 15 },
    { id: '2', group: '239.1.1.2', source: '10.0.0.101', interface: 'internal', members: 8 },
    { id: '3', group: '224.0.0.5', source: '0.0.0.0', interface: 'dmz', members: 3 },
  ] : []);

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio size={18} className="text-primary" />
            <h1 className="text-base font-semibold text-foreground">Multicast Configuration</h1>
          </div>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90">
              <Save size={12} />
              Apply
            </button>
            <button className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary rounded">
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
            <div className="text-sm font-mono text-foreground">10.0.0.1</div>
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
                <FortiToggle enabled={true} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">RP Address</span>
                <input 
                  type="text" 
                  defaultValue="10.0.0.1"
                  className="w-28 text-xs border border-border rounded px-2 py-1 bg-background font-mono"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">IGMP Snooping</span>
                <FortiToggle enabled={true} />
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
                      <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                        intf.pimMode === 'sparse' ? 'bg-blue-100 text-blue-700' : 
                        intf.pimMode === 'dense' ? 'bg-orange-100 text-orange-700' : 
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {intf.pimMode.toUpperCase()}
                      </span>
                    </td>
                    <td className="px-3 py-2">v{intf.igmpVersion}</td>
                    <td className="px-3 py-2"><FortiToggle enabled={intf.enabled} /></td>
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
            <button className="flex items-center gap-1 px-2 py-1 text-xs text-primary hover:bg-primary/10 rounded">
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
              {groups.map((group) => (
                <tr key={group.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-mono">{group.group}</td>
                  <td className="px-3 py-2 font-mono text-muted-foreground">{group.source === '0.0.0.0' ? '*' : group.source}</td>
                  <td className="px-3 py-2">
                    <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 rounded text-[10px]">{group.interface}</span>
                  </td>
                  <td className="px-3 py-2">{group.members}</td>
                  <td className="px-3 py-2">
                    <button className="p-1 text-destructive hover:bg-destructive/10 rounded">
                      <Trash2 size={10} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Shell>
  );
};

export default MulticastConfig;
