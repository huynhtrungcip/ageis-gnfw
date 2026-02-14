import { Shell } from "@/components/layout/Shell";
import { 
  Network, Router, Server, Monitor, Wifi, Globe, Shield,
  RefreshCw, ZoomIn, ZoomOut, Maximize2, Download, Layers, Printer, Cpu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useMemo } from "react";
import { useNetworkTopology, NetworkDevice } from "@/hooks/useNetworkTopology";
import { toast } from "sonner";

interface LayoutNode extends NetworkDevice {
  x: number;
  y: number;
}

const NetworkTopology = () => {
  const { devices, loading, fetchDevices } = useNetworkTopology();
  const [selectedNode, setSelectedNode] = useState<LayoutNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      fetchDevices();
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchDevices]);

  const getNodeIcon = (type: NetworkDevice['device_type']) => {
    switch (type) {
      case 'firewall': return Shield;
      case 'switch': return Network;
      case 'router': return Router;
      case 'server': return Server;
      case 'client': return Monitor;
      case 'ap': return Wifi;
      case 'printer': return Printer;
      case 'iot': return Cpu;
      default: return Monitor;
    }
  };

  const getStatusColor = (status: NetworkDevice['status']) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-muted-foreground';
      case 'warning': return 'text-yellow-500';
    }
  };

  const getStatusBg = (status: NetworkDevice['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500/10 border-green-500/30';
      case 'offline': return 'bg-muted/50 border-muted-foreground/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
    }
  };

  // Auto-layout devices by type
  const layoutNodes: LayoutNode[] = useMemo(() => {
    const firewalls = devices.filter(d => d.device_type === 'firewall');
    const switches = devices.filter(d => d.device_type === 'switch' || d.device_type === 'router');
    const servers = devices.filter(d => d.device_type === 'server');
    const aps = devices.filter(d => d.device_type === 'ap');
    const clients = devices.filter(d => ['client', 'printer', 'iot', 'unknown'].includes(d.device_type));

    const nodes: LayoutNode[] = [];
    const centerX = 400;

    // Internet node (virtual)
    nodes.push({ id: 'internet-virtual', name: 'Internet', ip_address: '', mac_address: '', device_type: 'router' as any, status: 'online', interface: '', vlan: null, vendor: null, hostname: null, os_hint: null, open_ports: [], last_seen: '', first_seen: '', x: centerX, y: 30 } as LayoutNode);

    // Firewall tier (y=130)
    firewalls.forEach((d, i) => {
      nodes.push({ ...d, x: centerX - (firewalls.length - 1) * 60 + i * 120, y: 130 });
    });

    // Switch/Router tier (y=260)
    switches.forEach((d, i) => {
      const totalW = (switches.length - 1) * 140;
      nodes.push({ ...d, x: centerX - totalW / 2 + i * 140, y: 260 });
    });

    // Server tier (y=390)
    servers.forEach((d, i) => {
      const totalW = (servers.length - 1) * 130;
      nodes.push({ ...d, x: centerX - totalW / 2 + i * 130, y: 390 });
    });

    // AP tier (y=500)
    aps.forEach((d, i) => {
      const totalW = (aps.length - 1) * 120;
      nodes.push({ ...d, x: centerX - totalW / 2 + i * 120, y: 500 });
    });

    // Client tier (y=610)
    clients.forEach((d, i) => {
      const totalW = (clients.length - 1) * 100;
      nodes.push({ ...d, x: centerX - totalW / 2 + i * 100, y: 610 });
    });

    return nodes;
  }, [devices]);

  // Build connections between tiers
  const renderConnections = () => {
    const lines: JSX.Element[] = [];
    const tiers = [
      layoutNodes.filter(n => n.id === 'internet-virtual'),
      layoutNodes.filter(n => n.device_type === 'firewall'),
      layoutNodes.filter(n => n.device_type === 'switch' || n.device_type === 'router'),
      layoutNodes.filter(n => n.device_type === 'server'),
      layoutNodes.filter(n => n.device_type === 'ap'),
      layoutNodes.filter(n => ['client', 'printer', 'iot', 'unknown'].includes(n.device_type)),
    ].filter(t => t.length > 0);

    for (let t = 0; t < tiers.length - 1; t++) {
      const upper = tiers[t];
      const lower = tiers[t + 1];
      // Connect each upper to all lower (or best match by interface)
      upper.forEach(u => {
        lower.forEach(l => {
          const isSelected = selectedNode?.id === u.id || selectedNode?.id === l.id;
          lines.push(
            <line key={`${u.id}-${l.id}`} x1={u.x + 40} y1={u.y + 30} x2={l.x + 40} y2={l.y + 30}
              stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'} strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={u.id === 'internet-virtual' ? '5,5' : 'none'} className="transition-all duration-300" />
          );
        });
      });
    }
    return lines;
  };

  // Collect VLANs
  const vlans = useMemo(() => {
    const map = new Map<string, number>();
    devices.forEach(d => {
      if (d.vlan) {
        map.set(d.vlan, (map.get(d.vlan) || 0) + 1);
      }
    });
    const colors = ['bg-blue-500/20 border-blue-500', 'bg-green-500/20 border-green-500', 'bg-purple-500/20 border-purple-500', 'bg-orange-500/20 border-orange-500', 'bg-cyan-500/20 border-cyan-500'];
    return Array.from(map.entries()).map(([id, count], i) => ({ id, name: id, color: colors[i % colors.length], count }));
  }, [devices]);

  const onlineNodes = devices.filter(n => n.status === 'online').length;
  const offlineNodes = devices.filter(n => n.status === 'offline').length;
  const warningNodes = devices.filter(n => n.status === 'warning').length;

  return (
    <Shell>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Network Topology</h1>
            <p className="text-sm text-muted-foreground">
              {loading ? 'Loading...' : `${devices.length} devices discovered`} • Last updated: {lastUpdate.toLocaleTimeString()}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg p-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => { fetchDevices(); setLastUpdate(new Date()); toast.success('Topology refreshed'); }}>
              <RefreshCw className="h-4 w-4" /> Refresh
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))}><ZoomIn className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}><ZoomOut className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(1)}><Maximize2 className="h-4 w-4" /></Button>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-green-500" /><span>Online ({onlineNodes})</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-yellow-500" /><span>Warning ({warningNodes})</span></div>
            <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-muted-foreground" /><span>Offline ({offlineNodes})</span></div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-9 bg-card border border-border rounded-lg p-4 overflow-hidden">
            <div className="relative" style={{ transform: `scale(${zoom})`, transformOrigin: 'top left', transition: 'transform 0.3s ease' }}>
              <svg width="800" height="700" className="absolute top-0 left-0 pointer-events-none">{renderConnections()}</svg>
              {layoutNodes.map(node => {
                if (node.id === 'internet-virtual') {
                  return (
                    <div key={node.id} className="absolute" style={{ left: node.x, top: node.y }}>
                      <div className="flex flex-col items-center p-2 rounded-lg border-2 bg-blue-500/10 border-blue-500/30 min-w-[80px]">
                        <Globe className="h-6 w-6 text-blue-500" />
                        <span className="text-xs font-medium mt-1">Internet</span>
                      </div>
                    </div>
                  );
                }
                const Icon = getNodeIcon(node.device_type);
                const isSelected = selectedNode?.id === node.id;
                return (
                  <div key={node.id} className={`absolute cursor-pointer transition-all duration-200 ${isSelected ? 'z-10' : 'z-0'}`} style={{ left: node.x, top: node.y }} onClick={() => setSelectedNode(isSelected ? null : node)}>
                    <div className={`flex flex-col items-center p-2 rounded-lg border-2 min-w-[80px] ${getStatusBg(node.status)} ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''} hover:scale-105 transition-transform`}>
                      <Icon className={`h-6 w-6 ${getStatusColor(node.status)}`} />
                      <span className="text-xs font-medium mt-1 text-center whitespace-nowrap">{node.name}</span>
                      {node.ip_address && <span className="text-[10px] text-muted-foreground">{node.ip_address}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-span-3 space-y-4">
            {vlans.length > 0 && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3"><Layers className="h-4 w-4 text-primary" /><span className="font-medium text-sm">VLANs</span></div>
                <div className="space-y-2">
                  {vlans.map(vlan => (
                    <div key={vlan.id} className={`p-2 rounded border ${vlan.color} text-xs`}>
                      <div className="font-medium">{vlan.id}</div>
                      <div className="text-muted-foreground flex justify-between"><span>{vlan.name}</span><span>{vlan.count} devices</span></div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {selectedNode && selectedNode.id !== 'internet-virtual' && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {(() => { const Icon = getNodeIcon(selectedNode.device_type); return <Icon className={`h-4 w-4 ${getStatusColor(selectedNode.status)}`} />; })()}
                  <span className="font-medium text-sm">{selectedNode.name}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="capitalize">{selectedNode.device_type}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className={`capitalize ${getStatusColor(selectedNode.status)}`}>{selectedNode.status}</span></div>
                  {selectedNode.ip_address && <div className="flex justify-between"><span className="text-muted-foreground">IP Address</span><span>{selectedNode.ip_address}</span></div>}
                  {selectedNode.mac_address && <div className="flex justify-between"><span className="text-muted-foreground">MAC</span><span className="font-mono text-[10px]">{selectedNode.mac_address}</span></div>}
                  {selectedNode.vlan && <div className="flex justify-between"><span className="text-muted-foreground">VLAN</span><span>{selectedNode.vlan}</span></div>}
                  {selectedNode.vendor && <div className="flex justify-between"><span className="text-muted-foreground">Vendor</span><span>{selectedNode.vendor}</span></div>}
                  {selectedNode.os_hint && <div className="flex justify-between"><span className="text-muted-foreground">OS</span><span>{selectedNode.os_hint}</span></div>}
                  {selectedNode.hostname && <div className="flex justify-between"><span className="text-muted-foreground">Hostname</span><span>{selectedNode.hostname}</span></div>}
                  <div className="flex justify-between"><span className="text-muted-foreground">Last Seen</span><span className="text-[10px]">{new Date(selectedNode.last_seen).toLocaleString()}</span></div>
                </div>
              </div>
            )}

            <div className="bg-card border border-border rounded-lg p-4">
              <div className="font-medium text-sm mb-3">Network Statistics</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">Total Devices</span><span>{devices.length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Switches</span><span>{devices.filter(n => n.device_type === 'switch').length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Servers</span><span>{devices.filter(n => n.device_type === 'server').length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Access Points</span><span>{devices.filter(n => n.device_type === 'ap').length}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Clients</span><span>{devices.filter(n => n.device_type === 'client').length}</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default NetworkTopology;
