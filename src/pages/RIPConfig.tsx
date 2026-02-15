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
  const [defaultMetric, setDefaultMetric] = useState(1);
  const [updateTimer, setUpdateTimer] = useState(30);
  const [networks, setNetworks] = useState<RIPNetwork[]>(demoMode ? [
    { id: '1', network: '10.0.0.0/8' },
    { id: '2', network: '192.168.1.0/24' },
  ] : []);
  const [interfaces, setInterfaces] = useState<RIPInterface[]>(demoMode ? [
    { name: 'internal', passive: false, splitHorizon: true, authentication: 'none' },
    { name: 'wan1', passive: true, splitHorizon: true, authentication: 'md5' },
  ] : []);

  const [addNetworkOpen, setAddNetworkOpen] = useState(false);
  const [newNetwork, setNewNetwork] = useState('');
  const [deleteNetworkId, setDeleteNetworkId] = useState<string | null>(null);

  const handleAddNetwork = () => {
    if (!newNetwork.trim()) {
      toast.error('Network address is required');
      return;
    }
    if (!/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\/\d{1,2}$/.test(newNetwork.trim())) {
      toast.error('Invalid format. Use CIDR notation (e.g., 10.0.0.0/8)');
      return;
    }
    setNetworks(prev => [...prev, { id: Date.now().toString(), network: newNetwork.trim() }]);
    setNewNetwork('');
    setAddNetworkOpen(false);
    toast.success(`Network "${newNetwork.trim()}" added`);
  };

  const handleDeleteNetwork = () => {
    if (!deleteNetworkId) return;
    const net = networks.find(n => n.id === deleteNetworkId);
    setNetworks(prev => prev.filter(n => n.id !== deleteNetworkId));
    setDeleteNetworkId(null);
    toast.success(`Network "${net?.network}" removed`);
  };

  const handleTogglePassive = (name: string) => {
    setInterfaces(prev => prev.map(i => i.name === name ? { ...i, passive: !i.passive } : i));
  };

  const handleToggleSplitHorizon = (name: string) => {
    setInterfaces(prev => prev.map(i => i.name === name ? { ...i, splitHorizon: !i.splitHorizon } : i));
  };

  const handleAuthChange = (name: string, auth: RIPInterface['authentication']) => {
    setInterfaces(prev => prev.map(i => i.name === name ? { ...i, authentication: auth } : i));
  };

  const handleApply = () => {
    toast.success('RIP configuration applied successfully');
  };

  const handleRefresh = () => {
    if (demoMode) {
      setNetworks([
        { id: '1', network: '10.0.0.0/8' },
        { id: '2', network: '192.168.1.0/24' },
      ]);
      setInterfaces([
        { name: 'internal', passive: false, splitHorizon: true, authentication: 'none' },
        { name: 'wan1', passive: true, splitHorizon: true, authentication: 'md5' },
      ]);
    }
    toast.success('Configuration refreshed');
  };

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h1 className="text-base font-semibold text-foreground">RIP Configuration</h1>
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
                <input 
                  type="number" 
                  value={defaultMetric} 
                  onChange={(e) => setDefaultMetric(Number(e.target.value))}
                  className="w-20 text-xs border border-border rounded px-2 py-1 bg-background" 
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Update Timer (s)</span>
                <input 
                  type="number" 
                  value={updateTimer} 
                  onChange={(e) => setUpdateTimer(Number(e.target.value))}
                  className="w-20 text-xs border border-border rounded px-2 py-1 bg-background" 
                />
              </div>
            </div>
          </div>

          {/* Networks */}
          <div className="border border-border rounded">
            <div className="bg-muted/50 px-3 py-2 border-b border-border flex items-center justify-between">
              <h2 className="text-xs font-semibold text-foreground">Networks</h2>
              <button 
                className="p-1 text-primary hover:bg-primary/10 rounded"
                onClick={() => setAddNetworkOpen(true)}
              >
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
                  {networks.length === 0 ? (
                    <tr><td colSpan={2} className="px-2 py-4 text-center text-muted-foreground">No networks configured</td></tr>
                  ) : networks.map((net) => (
                    <tr key={net.id} className="border-b border-border last:border-b-0 hover:bg-muted/30">
                      <td className="px-2 py-1.5 font-mono">{net.network}</td>
                      <td className="px-2 py-1.5">
                        <button 
                          className="p-1 text-destructive hover:bg-destructive/10 rounded"
                          onClick={() => setDeleteNetworkId(net.id)}
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
                  <td className="px-3 py-2">
                    <FortiToggle enabled={intf.passive} onToggle={() => handleTogglePassive(intf.name)} />
                  </td>
                  <td className="px-3 py-2">
                    <FortiToggle enabled={intf.splitHorizon} onToggle={() => handleToggleSplitHorizon(intf.name)} />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={intf.authentication}
                      onChange={(e) => handleAuthChange(intf.name, e.target.value as RIPInterface['authentication'])}
                      className="text-[10px] border border-border rounded px-1.5 py-0.5 bg-background"
                    >
                      <option value="none">NONE</option>
                      <option value="text">TEXT</option>
                      <option value="md5">MD5</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Network Dialog */}
      <Dialog open={addNetworkOpen} onOpenChange={setAddNetworkOpen}>
        <DialogContent className="max-w-sm" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle className="text-sm">Add Network</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Network (CIDR)</label>
              <input
                type="text"
                value={newNetwork}
                onChange={(e) => setNewNetwork(e.target.value)}
                placeholder="e.g., 10.0.0.0/8"
                className="w-full text-xs border border-border rounded px-2 py-1.5 bg-background font-mono"
                onKeyDown={(e) => e.key === 'Enter' && handleAddNetwork()}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button className="px-3 py-1.5 text-xs border border-border rounded hover:bg-muted" onClick={() => setAddNetworkOpen(false)}>Cancel</button>
              <button className="px-3 py-1.5 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90" onClick={handleAddNetwork}>Add</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteNetworkId} onOpenChange={() => setDeleteNetworkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Network</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove this network from RIP configuration?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteNetwork}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Shell>
  );
};

export default RIPConfig;