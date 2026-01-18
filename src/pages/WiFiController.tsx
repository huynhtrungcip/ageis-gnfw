import { useState } from 'react';
import { Shell } from '@/components/layout/Shell';
import { cn } from '@/lib/utils';
import { 
  Wifi,
  Plus,
  RefreshCw,
  Search,
  Edit,
  Trash2,
  Signal,
  Users,
  Radio,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FortiToggle } from '@/components/ui/forti-toggle';
import { toast } from 'sonner';

// Access Point Interface
interface AccessPoint {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  status: 'online' | 'offline' | 'upgrading';
  ipAddress: string;
  clients: number;
  channel24: number;
  channel5: number;
  txPower: number;
  uptime: string;
  firmware: string;
}

const mockAPs: AccessPoint[] = [
  { id: 'ap-1', name: 'AP-Floor1-Lobby', serialNumber: 'FP431F0000001', model: 'FAP-431F', status: 'online', ipAddress: '192.168.10.11', clients: 24, channel24: 6, channel5: 36, txPower: 100, uptime: '15d 4h 23m', firmware: '7.0.5' },
  { id: 'ap-2', name: 'AP-Floor1-Office', serialNumber: 'FP431F0000002', model: 'FAP-431F', status: 'online', ipAddress: '192.168.10.12', clients: 18, channel24: 11, channel5: 44, txPower: 100, uptime: '15d 4h 20m', firmware: '7.0.5' },
  { id: 'ap-3', name: 'AP-Floor2-Meeting', serialNumber: 'FP231F0000003', model: 'FAP-231F', status: 'online', ipAddress: '192.168.10.13', clients: 8, channel24: 1, channel5: 149, txPower: 80, uptime: '10d 2h 15m', firmware: '7.0.5' },
  { id: 'ap-4', name: 'AP-Floor2-Break', serialNumber: 'FP231F0000004', model: 'FAP-231F', status: 'offline', ipAddress: '192.168.10.14', clients: 0, channel24: 6, channel5: 157, txPower: 80, uptime: '-', firmware: '7.0.4' },
  { id: 'ap-5', name: 'AP-Floor3-Executive', serialNumber: 'FP433F0000005', model: 'FAP-433F', status: 'upgrading', ipAddress: '192.168.10.15', clients: 5, channel24: 11, channel5: 52, txPower: 100, uptime: '8d 12h 45m', firmware: '7.0.4' },
];

// SSID Interface
interface SSID {
  id: string;
  name: string;
  enabled: boolean;
  security: 'open' | 'wpa2-personal' | 'wpa2-enterprise' | 'wpa3';
  band: '2.4GHz' | '5GHz' | 'dual';
  vlanId: number;
  broadcast: boolean;
  clients: number;
  traffic: { rx: number; tx: number };
}

const mockSSIDs: SSID[] = [
  { id: 'ssid-1', name: 'Corporate-WiFi', enabled: true, security: 'wpa2-enterprise', band: 'dual', vlanId: 10, broadcast: true, clients: 45, traffic: { rx: 1250, tx: 890 } },
  { id: 'ssid-2', name: 'Guest-WiFi', enabled: true, security: 'wpa2-personal', band: 'dual', vlanId: 20, broadcast: true, clients: 12, traffic: { rx: 450, tx: 120 } },
  { id: 'ssid-3', name: 'IoT-Network', enabled: true, security: 'wpa2-personal', band: '2.4GHz', vlanId: 30, broadcast: false, clients: 8, traffic: { rx: 50, tx: 30 } },
  { id: 'ssid-4', name: 'Management', enabled: false, security: 'wpa3', band: '5GHz', vlanId: 99, broadcast: false, clients: 0, traffic: { rx: 0, tx: 0 } },
];

// Client Interface
interface WiFiClient {
  id: string;
  macAddress: string;
  ipAddress: string;
  hostname: string;
  ssid: string;
  ap: string;
  band: '2.4GHz' | '5GHz';
  signal: number;
  rxRate: number;
  txRate: number;
  connected: string;
}

const mockClients: WiFiClient[] = [
  { id: 'c-1', macAddress: 'AA:BB:CC:11:22:33', ipAddress: '192.168.10.101', hostname: 'laptop-john', ssid: 'Corporate-WiFi', ap: 'AP-Floor1-Lobby', band: '5GHz', signal: -45, rxRate: 866, txRate: 720, connected: '2h 15m' },
  { id: 'c-2', macAddress: 'AA:BB:CC:11:22:34', ipAddress: '192.168.10.102', hostname: 'iphone-jane', ssid: 'Corporate-WiFi', ap: 'AP-Floor1-Office', band: '5GHz', signal: -52, rxRate: 585, txRate: 520, connected: '45m' },
  { id: 'c-3', macAddress: 'AA:BB:CC:11:22:35', ipAddress: '192.168.20.50', hostname: 'guest-device', ssid: 'Guest-WiFi', ap: 'AP-Floor2-Meeting', band: '2.4GHz', signal: -68, rxRate: 72, txRate: 54, connected: '15m' },
  { id: 'c-4', macAddress: 'AA:BB:CC:11:22:36', ipAddress: '192.168.10.103', hostname: 'macbook-mike', ssid: 'Corporate-WiFi', ap: 'AP-Floor1-Lobby', band: '5GHz', signal: -48, rxRate: 780, txRate: 650, connected: '4h 30m' },
  { id: 'c-5', macAddress: 'AA:BB:CC:11:22:37', ipAddress: '192.168.30.10', hostname: 'iot-sensor-1', ssid: 'IoT-Network', ap: 'AP-Floor2-Meeting', band: '2.4GHz', signal: -72, rxRate: 54, txRate: 36, connected: '5d 12h' },
];

const WiFiController = () => {
  const [activeTab, setActiveTab] = useState('aps');
  const [aps] = useState<AccessPoint[]>(mockAPs);
  const [ssids, setSSIDs] = useState<SSID[]>(mockSSIDs);
  const [clients] = useState<WiFiClient[]>(mockClients);
  const [searchQuery, setSearchQuery] = useState('');

  const handleToggleSSID = (id: string) => {
    setSSIDs(prev => prev.map(s =>
      s.id === id ? { ...s, enabled: !s.enabled } : s
    ));
    toast.success('SSID status updated');
  };

  // Stats
  const stats = {
    totalAPs: aps.length,
    onlineAPs: aps.filter(ap => ap.status === 'online').length,
    totalClients: aps.reduce((a, ap) => a + ap.clients, 0),
    activeSSIDs: ssids.filter(s => s.enabled).length,
  };

  const getSignalIcon = (signal: number) => {
    if (signal >= -50) return <Signal size={12} className="text-green-600" />;
    if (signal >= -65) return <Signal size={12} className="text-yellow-600" />;
    return <Signal size={12} className="text-red-600" />;
  };

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <Wifi size={14} />
            <span className="font-semibold">WiFi Controller</span>
            <span className="text-[10px] text-[#888]">Managed FortiAP</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="forti-toolbar">
          <button className="forti-toolbar-btn primary">
            <Plus size={12} />
            <span>Create New</span>
          </button>
          <button className="forti-toolbar-btn">
            <Edit size={12} />
            <span>Edit</span>
          </button>
          <button className="forti-toolbar-btn">
            <Trash2 size={12} />
            <span>Delete</span>
          </button>
          <div className="forti-toolbar-separator" />
          <button className="forti-toolbar-btn">
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
          <div className="flex-1" />
          <div className="forti-search">
            <Search size={12} className="text-[#999]" />
            <input 
              type="text" 
              placeholder="Search..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-0 border-x border-[#ddd]">
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Wifi size={14} className="text-blue-600" />
            <span className="text-lg font-bold text-blue-600">{stats.totalAPs}</span>
            <span className="text-[11px] text-[#666]">Total APs</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <CheckCircle size={14} className="text-green-600" />
            <span className="text-lg font-bold text-green-600">{stats.onlineAPs}</span>
            <span className="text-[11px] text-[#666]">Online</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white border-r border-[#ddd]">
            <Users size={14} className="text-purple-600" />
            <span className="text-lg font-bold text-purple-600">{stats.totalClients}</span>
            <span className="text-[11px] text-[#666]">Connected Clients</span>
          </div>
          <div className="flex-1 flex items-center justify-center gap-2 py-2 bg-white">
            <Radio size={14} className="text-orange-600" />
            <span className="text-lg font-bold text-orange-600">{stats.activeSSIDs}</span>
            <span className="text-[11px] text-[#666]">Active SSIDs</span>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="bg-[#f0f0f0] border-x border-b border-[#ddd]">
            <TabsList className="bg-transparent h-auto p-0 rounded-none">
              <TabsTrigger 
                value="aps" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                Managed FortiAPs
              </TabsTrigger>
              <TabsTrigger 
                value="ssids" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                SSID Configuration
              </TabsTrigger>
              <TabsTrigger 
                value="clients" 
                className="data-[state=active]:bg-white data-[state=active]:border-b-2 data-[state=active]:border-b-[hsl(142,70%,35%)] rounded-none px-4 py-2 text-[11px]"
              >
                Client Monitor
              </TabsTrigger>
            </TabsList>
          </div>

          {/* APs Tab */}
          <TabsContent value="aps" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Status</th>
                  <th>Name</th>
                  <th>Serial Number</th>
                  <th>Model</th>
                  <th>IP Address</th>
                  <th className="w-16">Clients</th>
                  <th>Ch 2.4G</th>
                  <th>Ch 5G</th>
                  <th>Uptime</th>
                  <th>Firmware</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {aps.map((ap) => (
                  <tr key={ap.id}>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        ap.status === 'online' ? 'bg-green-100 text-green-700 border-green-200' :
                        ap.status === 'upgrading' ? 'bg-yellow-100 text-yellow-700 border-yellow-200' :
                        'bg-red-100 text-red-700 border-red-200'
                      )}>
                        {ap.status.toUpperCase()}
                      </span>
                    </td>
                    <td className="font-medium text-[#333]">{ap.name}</td>
                    <td className="mono text-[#666]">{ap.serialNumber}</td>
                    <td className="text-[#666]">{ap.model}</td>
                    <td className="mono text-[#666]">{ap.ipAddress}</td>
                    <td className="text-center">
                      <span className="inline-flex items-center gap-1">
                        <Users size={12} className="text-[#999]" />
                        {ap.clients}
                      </span>
                    </td>
                    <td className="text-[#666]">{ap.channel24}</td>
                    <td className="text-[#666]">{ap.channel5}</td>
                    <td className="text-[#666]">{ap.uptime}</td>
                    <td className="text-[#666]">{ap.firmware}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Edit size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Settings size={12} className="text-[#666]" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* SSIDs Tab */}
          <TabsContent value="ssids" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-16">Status</th>
                  <th>SSID Name</th>
                  <th>Security</th>
                  <th>Band</th>
                  <th>VLAN</th>
                  <th>Broadcast</th>
                  <th className="w-16">Clients</th>
                  <th>RX (Mbps)</th>
                  <th>TX (Mbps)</th>
                  <th className="w-20">Actions</th>
                </tr>
              </thead>
              <tbody>
                {ssids.map((ssid) => (
                  <tr key={ssid.id} className={cn(!ssid.enabled && "opacity-60")}>
                    <td>
                      <FortiToggle 
                        enabled={ssid.enabled}
                        onChange={() => handleToggleSSID(ssid.id)}
                        size="sm"
                      />
                    </td>
                    <td className="font-medium text-[#333]">{ssid.name}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        ssid.security === 'wpa3' ? 'bg-green-100 text-green-700 border-green-200' :
                        ssid.security === 'wpa2-enterprise' ? 'bg-blue-100 text-blue-700 border-blue-200' :
                        ssid.security === 'wpa2-personal' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                        'bg-gray-100 text-gray-500 border-gray-200'
                      )}>
                        {ssid.security.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-[#666]">{ssid.band}</td>
                    <td className="text-[#666]">{ssid.vlanId}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        ssid.broadcast ? 'bg-green-100 text-green-700 border-green-200' : 'bg-gray-100 text-gray-500 border-gray-200'
                      )}>
                        {ssid.broadcast ? 'YES' : 'HIDDEN'}
                      </span>
                    </td>
                    <td className="text-center text-[#666]">{ssid.clients}</td>
                    <td className="mono text-[#666]">{ssid.traffic.rx}</td>
                    <td className="mono text-[#666]">{ssid.traffic.tx}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Edit size={12} className="text-[#666]" />
                        </button>
                        <button className="p-1 hover:bg-[#f0f0f0]">
                          <Trash2 size={12} className="text-red-500" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>

          {/* Clients Tab */}
          <TabsContent value="clients" className="mt-0">
            <table className="data-table">
              <thead>
                <tr>
                  <th>MAC Address</th>
                  <th>IP Address</th>
                  <th>Hostname</th>
                  <th>SSID</th>
                  <th>Access Point</th>
                  <th>Band</th>
                  <th>Signal</th>
                  <th>RX Rate</th>
                  <th>TX Rate</th>
                  <th>Connected</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client) => (
                  <tr key={client.id}>
                    <td className="mono text-[#666]">{client.macAddress}</td>
                    <td className="mono text-[#666]">{client.ipAddress}</td>
                    <td className="font-medium text-[#333]">{client.hostname}</td>
                    <td className="text-[#666]">{client.ssid}</td>
                    <td className="text-[#666]">{client.ap}</td>
                    <td>
                      <span className={cn(
                        "forti-tag",
                        client.band === '5GHz' ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-orange-100 text-orange-700 border-orange-200'
                      )}>
                        {client.band}
                      </span>
                    </td>
                    <td>
                      <div className="flex items-center gap-1">
                        {getSignalIcon(client.signal)}
                        <span className="text-[#666]">{client.signal} dBm</span>
                      </div>
                    </td>
                    <td className="mono text-[#666]">{client.rxRate} Mbps</td>
                    <td className="mono text-[#666]">{client.txRate} Mbps</td>
                    <td className="text-[#666]">{client.connected}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TabsContent>
        </Tabs>
      </div>
    </Shell>
  );
};

export default WiFiController;
