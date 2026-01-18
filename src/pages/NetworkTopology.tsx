import { Shell } from "@/components/layout/Shell";
import { 
  Network, 
  Router, 
  Server, 
  Monitor, 
  Wifi, 
  Globe, 
  Shield,
  ArrowRight,
  ArrowDown,
  RefreshCw,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";

interface NetworkNode {
  id: string;
  name: string;
  type: 'firewall' | 'switch' | 'router' | 'server' | 'client' | 'ap' | 'internet' | 'vlan';
  ip?: string;
  status: 'online' | 'offline' | 'warning';
  x: number;
  y: number;
  connections: string[];
  vlan?: string;
  interface?: string;
}

const networkNodes: NetworkNode[] = [
  // Internet Cloud
  { id: 'internet', name: 'Internet', type: 'internet', status: 'online', x: 400, y: 30, connections: ['firewall'] },
  
  // Core Firewall
  { id: 'firewall', name: 'Aegis NGFW-500', type: 'firewall', ip: '10.0.0.1', status: 'online', x: 400, y: 130, connections: ['core-switch', 'dmz-switch'] },
  
  // Core Switch
  { id: 'core-switch', name: 'Core Switch', type: 'switch', ip: '10.0.0.2', status: 'online', x: 300, y: 250, connections: ['server1', 'server2', 'dist-switch1', 'dist-switch2'], interface: 'port1' },
  
  // DMZ Switch
  { id: 'dmz-switch', name: 'DMZ Switch', type: 'switch', ip: '172.16.0.2', status: 'online', x: 550, y: 250, connections: ['web-server', 'mail-server'], vlan: 'VLAN 100', interface: 'port2' },
  
  // Servers in Core
  { id: 'server1', name: 'DB Server', type: 'server', ip: '10.0.1.10', status: 'online', x: 150, y: 370, connections: [], vlan: 'VLAN 10' },
  { id: 'server2', name: 'App Server', type: 'server', ip: '10.0.1.11', status: 'online', x: 280, y: 370, connections: [], vlan: 'VLAN 10' },
  
  // DMZ Servers
  { id: 'web-server', name: 'Web Server', type: 'server', ip: '172.16.0.10', status: 'online', x: 500, y: 370, connections: [], vlan: 'VLAN 100' },
  { id: 'mail-server', name: 'Mail Server', type: 'server', ip: '172.16.0.11', status: 'warning', x: 630, y: 370, connections: [], vlan: 'VLAN 100' },
  
  // Distribution Switches
  { id: 'dist-switch1', name: 'Floor 1 Switch', type: 'switch', ip: '10.0.2.1', status: 'online', x: 150, y: 490, connections: ['ap1', 'client1', 'client2'], interface: 'port3' },
  { id: 'dist-switch2', name: 'Floor 2 Switch', type: 'switch', ip: '10.0.3.1', status: 'online', x: 350, y: 490, connections: ['ap2', 'client3', 'client4'], interface: 'port4' },
  
  // Access Points
  { id: 'ap1', name: 'AP-Floor1', type: 'ap', ip: '10.0.2.10', status: 'online', x: 80, y: 610, connections: [], vlan: 'VLAN 20' },
  { id: 'ap2', name: 'AP-Floor2', type: 'ap', ip: '10.0.3.10', status: 'online', x: 280, y: 610, connections: [], vlan: 'VLAN 30' },
  
  // Clients
  { id: 'client1', name: 'Workstation 1', type: 'client', ip: '10.0.2.100', status: 'online', x: 150, y: 610, connections: [], vlan: 'VLAN 20' },
  { id: 'client2', name: 'Workstation 2', type: 'client', ip: '10.0.2.101', status: 'offline', x: 220, y: 610, connections: [], vlan: 'VLAN 20' },
  { id: 'client3', name: 'Workstation 3', type: 'client', ip: '10.0.3.100', status: 'online', x: 350, y: 610, connections: [], vlan: 'VLAN 30' },
  { id: 'client4', name: 'Workstation 4', type: 'client', ip: '10.0.3.101', status: 'online', x: 420, y: 610, connections: [], vlan: 'VLAN 30' },
];

const vlans = [
  { id: 'VLAN 10', name: 'Servers', color: 'bg-blue-500/20 border-blue-500', count: 2 },
  { id: 'VLAN 20', name: 'Floor 1', color: 'bg-green-500/20 border-green-500', count: 3 },
  { id: 'VLAN 30', name: 'Floor 2', color: 'bg-purple-500/20 border-purple-500', count: 3 },
  { id: 'VLAN 100', name: 'DMZ', color: 'bg-orange-500/20 border-orange-500', count: 2 },
];

const NetworkTopology = () => {
  const [selectedNode, setSelectedNode] = useState<NetworkNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setLastUpdate(new Date());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  const getNodeIcon = (type: NetworkNode['type']) => {
    switch (type) {
      case 'firewall': return Shield;
      case 'switch': return Network;
      case 'router': return Router;
      case 'server': return Server;
      case 'client': return Monitor;
      case 'ap': return Wifi;
      case 'internet': return Globe;
      default: return Network;
    }
  };

  const getStatusColor = (status: NetworkNode['status']) => {
    switch (status) {
      case 'online': return 'text-green-500';
      case 'offline': return 'text-muted-foreground';
      case 'warning': return 'text-yellow-500';
    }
  };

  const getStatusBg = (status: NetworkNode['status']) => {
    switch (status) {
      case 'online': return 'bg-green-500/10 border-green-500/30';
      case 'offline': return 'bg-muted/50 border-muted-foreground/30';
      case 'warning': return 'bg-yellow-500/10 border-yellow-500/30';
    }
  };

  const renderConnections = () => {
    const lines: JSX.Element[] = [];
    networkNodes.forEach(node => {
      node.connections.forEach(targetId => {
        const target = networkNodes.find(n => n.id === targetId);
        if (target) {
          const isSelected = selectedNode?.id === node.id || selectedNode?.id === targetId;
          lines.push(
            <line
              key={`${node.id}-${targetId}`}
              x1={node.x + 40}
              y1={node.y + 30}
              x2={target.x + 40}
              y2={target.y + 30}
              stroke={isSelected ? 'hsl(var(--primary))' : 'hsl(var(--border))'}
              strokeWidth={isSelected ? 2 : 1}
              strokeDasharray={node.type === 'internet' ? '5,5' : 'none'}
              className="transition-all duration-300"
            />
          );
        }
      });
    });
    return lines;
  };

  const onlineNodes = networkNodes.filter(n => n.status === 'online').length;
  const offlineNodes = networkNodes.filter(n => n.status === 'offline').length;
  const warningNodes = networkNodes.filter(n => n.status === 'warning').length;

  return (
    <Shell>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Network Topology</h1>
            <p className="text-sm text-muted-foreground">Visual network diagram • Last updated: {lastUpdate.toLocaleTimeString()}</p>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex items-center justify-between bg-muted/30 border border-border rounded-lg p-2">
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="h-8 gap-2" onClick={() => setLastUpdate(new Date())}>
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(z => Math.min(z + 0.1, 1.5))}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(z => Math.max(z - 0.1, 0.5))}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="h-8" onClick={() => setZoom(1)}>
              <Maximize2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-6 bg-border mx-1" />
            <Button variant="ghost" size="sm" className="h-8 gap-2">
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <span>Online ({onlineNodes})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-yellow-500" />
              <span>Warning ({warningNodes})</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-muted-foreground" />
              <span>Offline ({offlineNodes})</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Topology Diagram */}
          <div className="col-span-9 bg-card border border-border rounded-lg p-4 overflow-hidden">
            <div 
              className="relative"
              style={{ 
                transform: `scale(${zoom})`, 
                transformOrigin: 'top left',
                transition: 'transform 0.3s ease'
              }}
            >
              <svg 
                width="800" 
                height="680" 
                className="absolute top-0 left-0 pointer-events-none"
              >
                {renderConnections()}
              </svg>
              
              {networkNodes.map(node => {
                const Icon = getNodeIcon(node.type);
                const isSelected = selectedNode?.id === node.id;
                
                return (
                  <div
                    key={node.id}
                    className={`absolute cursor-pointer transition-all duration-200 ${
                      isSelected ? 'z-10' : 'z-0'
                    }`}
                    style={{ left: node.x, top: node.y }}
                    onClick={() => setSelectedNode(isSelected ? null : node)}
                  >
                    <div className={`
                      flex flex-col items-center p-2 rounded-lg border-2 min-w-[80px]
                      ${getStatusBg(node.status)}
                      ${isSelected ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}
                      hover:scale-105 transition-transform
                    `}>
                      <Icon className={`h-6 w-6 ${getStatusColor(node.status)}`} />
                      <span className="text-xs font-medium mt-1 text-center whitespace-nowrap">
                        {node.name}
                      </span>
                      {node.ip && (
                        <span className="text-[10px] text-muted-foreground">
                          {node.ip}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Side Panel */}
          <div className="col-span-3 space-y-4">
            {/* VLANs */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="h-4 w-4 text-primary" />
                <span className="font-medium text-sm">VLANs</span>
              </div>
              <div className="space-y-2">
                {vlans.map(vlan => (
                  <div 
                    key={vlan.id} 
                    className={`p-2 rounded border ${vlan.color} text-xs`}
                  >
                    <div className="font-medium">{vlan.id}</div>
                    <div className="text-muted-foreground flex justify-between">
                      <span>{vlan.name}</span>
                      <span>{vlan.count} devices</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Selected Node Details */}
            {selectedNode && (
              <div className="bg-card border border-border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  {(() => {
                    const Icon = getNodeIcon(selectedNode.type);
                    return <Icon className={`h-4 w-4 ${getStatusColor(selectedNode.status)}`} />;
                  })()}
                  <span className="font-medium text-sm">{selectedNode.name}</span>
                </div>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="capitalize">{selectedNode.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status</span>
                    <span className={`capitalize ${getStatusColor(selectedNode.status)}`}>
                      {selectedNode.status}
                    </span>
                  </div>
                  {selectedNode.ip && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">IP Address</span>
                      <span>{selectedNode.ip}</span>
                    </div>
                  )}
                  {selectedNode.vlan && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">VLAN</span>
                      <span>{selectedNode.vlan}</span>
                    </div>
                  )}
                  {selectedNode.interface && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Interface</span>
                      <span>{selectedNode.interface}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Connections</span>
                    <span>{selectedNode.connections.length}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Statistics */}
            <div className="bg-card border border-border rounded-lg p-4">
              <div className="font-medium text-sm mb-3">Network Statistics</div>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Devices</span>
                  <span>{networkNodes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Switches</span>
                  <span>{networkNodes.filter(n => n.type === 'switch').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Servers</span>
                  <span>{networkNodes.filter(n => n.type === 'server').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Access Points</span>
                  <span>{networkNodes.filter(n => n.type === 'ap').length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Clients</span>
                  <span>{networkNodes.filter(n => n.type === 'client').length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default NetworkTopology;
