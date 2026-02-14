import { Shell } from '@/components/layout/Shell';
import { Settings, Network, RefreshCw, Save, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { useDemoMode } from '@/contexts/DemoModeContext';

interface RIPNetwork {
  id: string;
  network: string;
}

interface RIPInterface {
  name: string;
  passive: boolean;
  splitHorizon: boolean;
  authentication: 'none' | 'text' | 'md5';
}

const RIPConfig = () => {
  const { demoMode } = useDemoMode();
  const [enabled, setEnabled] = useState(demoMode);
  const [version, setVersion] = useState<'1' | '2'>('2');
  const [networks, setNetworks] = useState<RIPNetwork[]>(demoMode ? [
    { id: '1', network: '10.0.0.0/8' },
    { id: '2', network: '192.168.1.0/24' },
  ] : []);
  const [interfaces, setInterfaces] = useState<RIPInterface[]>(demoMode ? [
    { name: 'internal', passive: false, splitHorizon: true, authentication: 'none' },
    { name: 'wan1', passive: true, splitHorizon: true, authentication: 'md5' },
  ] : []);

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network size={18} className="text-primary" />
            <h1 className="text-base font-semibold text-foreground">RIP Configuration</h1>
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

        <div className="grid grid-cols-2 gap-4">
          {/* Basic Settings */}
          <div className="border border-border rounded">
            <div className="bg-muted/50 px-3 py-2 border-b border-border">
              <h2 className="text-xs font-semibold text-foreground flex items-center gap-2">
                <Settings size={12} />
                Basic Settings
              </h2>
            </div>
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Enable RIP</span>
                <FortiToggle enabled={enabled} onToggle={() => setEnabled(!enabled)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Version</span>
                <select 
                  value={version} 
                  onChange={(e) => setVersion(e.target.value as '1' | '2')}
                  className="text-xs border border-border rounded px-2 py-1 bg-background"
                >
                  <option value="1">RIP v1</option>
                  <option value="2">RIP v2</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Default Metric</span>
                <input type="number" defaultValue={1} className="w-20 text-xs border border-border rounded px-2 py-1 bg-background" />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Update Timer (s)</span>
                <input type="number" defaultValue={30} className="w-20 text-xs border border-border rounded px-2 py-1 bg-background" />
              </div>
            </div>
          </div>

          {/* Networks */}
          <div className="border border-border rounded">
            <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-semibold text-foreground">Networks</h2>
              <button className="p-1 text-primary hover:bg-primary/10 rounded">
                <Plus size={12} />
              </button>
            </div>
            <div className="p-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Network</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {networks.map((net) => (
                    <tr key={net.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                      <td className="px-2 py-1.5 font-mono">{net.network}</td>
                      <td className="px-2 py-1.5">
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
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Passive</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Split Horizon</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Authentication</th>
              </tr>
            </thead>
            <tbody>
              {interfaces.map((intf) => (
                <tr key={intf.name} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{intf.name}</td>
                  <td className="px-3 py-2"><FortiToggle enabled={intf.passive} /></td>
                  <td className="px-3 py-2"><FortiToggle enabled={intf.splitHorizon} /></td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      intf.authentication === 'md5' ? 'bg-green-100 text-green-700' : 
                      intf.authentication === 'text' ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {intf.authentication.toUpperCase()}
                    </span>
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

export default RIPConfig;
