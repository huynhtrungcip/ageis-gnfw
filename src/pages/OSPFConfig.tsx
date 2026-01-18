import { Shell } from '@/components/layout/Shell';
import { Settings, Network, RefreshCw, Save, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { FortiToggle } from '@/components/ui/forti-toggle';

interface OSPFArea {
  id: string;
  areaId: string;
  type: 'regular' | 'stub' | 'nssa';
  networks: string[];
}

interface OSPFInterface {
  name: string;
  area: string;
  cost: number;
  priority: number;
  helloInterval: number;
  deadInterval: number;
  authentication: 'none' | 'text' | 'md5';
}

const OSPFConfig = () => {
  const [enabled, setEnabled] = useState(true);
  const [routerId, setRouterId] = useState('10.0.0.1');
  const [areas] = useState<OSPFArea[]>([
    { id: '1', areaId: '0.0.0.0', type: 'regular', networks: ['10.0.0.0/8'] },
    { id: '2', areaId: '0.0.0.1', type: 'stub', networks: ['192.168.1.0/24'] },
  ]);
  const [interfaces] = useState<OSPFInterface[]>([
    { name: 'internal', area: '0.0.0.0', cost: 10, priority: 1, helloInterval: 10, deadInterval: 40, authentication: 'md5' },
    { name: 'wan1', area: '0.0.0.0', cost: 100, priority: 0, helloInterval: 10, deadInterval: 40, authentication: 'md5' },
  ]);

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network size={18} className="text-primary" />
            <h1 className="text-base font-semibold text-foreground">OSPF Configuration</h1>
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
                <span className="text-xs text-muted-foreground">Enable OSPF</span>
                <FortiToggle enabled={enabled} onToggle={() => setEnabled(!enabled)} />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Router ID</span>
                <input 
                  type="text" 
                  value={routerId}
                  onChange={(e) => setRouterId(e.target.value)}
                  className="w-32 text-xs border border-border rounded px-2 py-1 bg-background font-mono"
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">ABR Type</span>
                <select className="text-xs border border-border rounded px-2 py-1 bg-background">
                  <option>Cisco</option>
                  <option>IBM</option>
                  <option>Standard</option>
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Default Metric</span>
                <input type="number" defaultValue={10} className="w-20 text-xs border border-border rounded px-2 py-1 bg-background" />
              </div>
            </div>
          </div>

          {/* Areas */}
          <div className="border border-border rounded">
            <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-semibold text-foreground">Areas</h2>
              <button className="p-1 text-primary hover:bg-primary/10 rounded">
                <Plus size={12} />
              </button>
            </div>
            <div className="p-2">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Area ID</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Type</th>
                    <th className="px-2 py-1.5 text-left font-medium text-muted-foreground">Networks</th>
                    <th className="w-8"></th>
                  </tr>
                </thead>
                <tbody>
                  {areas.map((area) => (
                    <tr key={area.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                      <td className="px-2 py-1.5 font-mono">{area.areaId}</td>
                      <td className="px-2 py-1.5">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                          area.type === 'regular' ? 'bg-blue-100 text-blue-700' : 
                          area.type === 'stub' ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {area.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-2 py-1.5 text-muted-foreground">{area.networks.length}</td>
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
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Area</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Cost</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Priority</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Hello</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Dead</th>
                <th className="px-3 py-2 text-left font-medium text-muted-foreground">Auth</th>
              </tr>
            </thead>
            <tbody>
              {interfaces.map((intf) => (
                <tr key={intf.name} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                  <td className="px-3 py-2 font-medium">{intf.name}</td>
                  <td className="px-3 py-2 font-mono">{intf.area}</td>
                  <td className="px-3 py-2">{intf.cost}</td>
                  <td className="px-3 py-2">{intf.priority}</td>
                  <td className="px-3 py-2">{intf.helloInterval}s</td>
                  <td className="px-3 py-2">{intf.deadInterval}s</td>
                  <td className="px-3 py-2">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                      intf.authentication === 'md5' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
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

export default OSPFConfig;
