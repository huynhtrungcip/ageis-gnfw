import { useState, useEffect } from 'react';
import { Shell } from '@/components/layout/Shell';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { db, isApiConfigured } from '@/lib/postgrest';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  Network,
  Globe,
  Server,
  Shield,
  Users,
  RefreshCw,
  Save,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Wifi,
  ArrowRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DetectedNIC {
  name: string;
  mac: string;
  ip: string;
  state: string;
  speed: string;
  driver?: string;
}

interface ZoneAssignment {
  zone: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  nic: string;
  ip: string;
  subnet: string;
  gateway: string;
  mode: 'dhcp' | 'static';
  required: boolean;
  color: string;
}

const MOCK_NICS: DetectedNIC[] = [
  { name: 'ens18', mac: '00:50:56:A1:B2:C3', ip: '203.0.113.10', state: 'up', speed: '1 Gbps' },
  { name: 'ens19', mac: '00:50:56:A1:B2:C4', ip: '192.168.1.1', state: 'up', speed: '1 Gbps' },
  { name: 'ens20', mac: '00:50:56:A1:B2:C5', ip: '', state: 'down', speed: '1 Gbps' },
  { name: 'ens21', mac: '00:50:56:A1:B2:C6', ip: '', state: 'down', speed: '1 Gbps' },
];

const InterfaceAssignment = () => {
  const { demoMode } = useDemoMode();
  const [detectedNICs, setDetectedNICs] = useState<DetectedNIC[]>(demoMode ? MOCK_NICS : []);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const [zones, setZones] = useState<ZoneAssignment[]>([
    {
      zone: 'WAN', label: 'WAN (Internet)', icon: <Globe size={18} />,
      description: 'Connects to ISP/Internet. Usually gets IP via DHCP from your router or ISP.',
      nic: '', ip: '', subnet: '255.255.255.0', gateway: '', mode: 'dhcp', required: true,
      color: 'text-red-500',
    },
    {
      zone: 'LAN', label: 'LAN (Internal)', icon: <Server size={18} />,
      description: 'Your trusted internal network. Devices connect here for secure access.',
      nic: '', ip: '192.168.1.1', subnet: '255.255.255.0', gateway: '', mode: 'static', required: true,
      color: 'text-green-500',
    },
    {
      zone: 'DMZ', label: 'DMZ (Servers)', icon: <Shield size={18} />,
      description: 'Isolated zone for public-facing servers (web, email). Separated from LAN.',
      nic: '', ip: '10.0.0.1', subnet: '255.255.255.0', gateway: '', mode: 'static', required: false,
      color: 'text-orange-500',
    },
    {
      zone: 'GUEST', label: 'GUEST (Visitors)', icon: <Users size={18} />,
      description: 'Guest Wi-Fi or visitor network. No access to LAN resources.',
      nic: '', ip: '172.16.0.1', subnet: '255.255.255.0', gateway: '', mode: 'static', required: false,
      color: 'text-purple-500',
    },
  ]);

  // Load existing assignments from DB
  useEffect(() => {
    if (!demoMode) {
      loadFromDB();
    } else {
      // Auto-assign mock NICs
      setZones(prev => prev.map((z, i) => ({
        ...z,
        nic: MOCK_NICS[i]?.name || '',
        ip: MOCK_NICS[i]?.ip || z.ip,
      })));
    }
  }, [demoMode]);

  const loadFromDB = async () => {
    if (!isApiConfigured()) return;
    setIsLoading(true);
    try {
      const { data, error } = await (db.from('network_interfaces').select('*') as any);

      if (error) throw error;

      if (data && data.length > 0) {
        setZones(prev => prev.map(zone => {
          const dbIface = (data as any[]).find((d: any) => d.name === zone.zone || d.type === zone.zone);
          if (dbIface) {
            return {
              ...zone,
              nic: dbIface.mac || '',
              ip: dbIface.ip_address || zone.ip,
              subnet: dbIface.subnet || zone.subnet,
              gateway: dbIface.gateway || '',
            };
          }
          return zone;
        }));

        const nics: DetectedNIC[] = (data as any[]).map((d: any) => ({
          name: d.name,
          mac: d.mac || '',
          ip: d.ip_address || '',
          state: d.status || 'unknown',
          speed: d.speed || 'N/A',
        }));
        if (nics.length > 0) setDetectedNICs(nics);
      }
    } catch (err) {
      console.error('Failed to load interfaces:', err);
    }
    setIsLoading(false);
  };

  const updateZone = (index: number, field: string, value: string) => {
    setZones(prev => prev.map((z, i) => i === index ? { ...z, [field]: value } : z));
    setHasChanges(true);
  };

  const getUsedNICs = () => zones.map(z => z.nic).filter(Boolean);

  const handleSave = async () => {
    // Validate required zones
    for (const zone of zones) {
      if (zone.required && !zone.nic) {
        toast.error(`${zone.zone} interface is required!`);
        return;
      }
    }

    // Check for duplicate assignments
    const used = getUsedNICs();
    const duplicates = used.filter((v, i) => used.indexOf(v) !== i);
    if (duplicates.length > 0) {
      toast.error(`Duplicate NIC assignment: ${duplicates.join(', ')}`);
      return;
    }

    setIsSaving(true);
    try {
      for (const zone of zones) {
        if (!zone.nic) continue;

        const selectedNIC = detectedNICs.find(n => n.name === zone.nic);

        const payload = {
          name: zone.zone,
          type: zone.zone as "WAN" | "LAN" | "DMZ",
          status: 'up' as const,
          ip_address: zone.ip || null,
          subnet: zone.subnet || null,
          gateway: zone.gateway || null,
          mac: selectedNIC?.mac || null,
          speed: selectedNIC?.speed || null,
          mtu: 1500,
        };

        // Upsert: check if exists
        const { data: existing } = await (db.from('network_interfaces')
          .select('id')
          .eq('name', zone.zone)
          .maybeSingle() as any);

        if (existing) {
          await (db.from('network_interfaces')
            .update(payload)
            .eq('id', existing.id) as any);
        } else {
          await (db.from('network_interfaces')
            .insert(payload) as any);
        }
      }

      toast.success('Interface assignments saved! Agent will apply on next sync.');
      setHasChanges(false);
    } catch (err) {
      toast.error('Failed to save interface assignments');
      console.error(err);
    }
    setIsSaving(false);
  };

  const nicCount = detectedNICs.length;
  const assignedCount = zones.filter(z => z.nic).length;

  return (
    <Shell>
      <div className="space-y-0">
        {/* Header */}
        <div className="section-header-neutral">
          <div className="flex items-center gap-2">
            <Network size={14} />
            <span className="font-semibold">Interface Assignment</span>
            <span className="text-[10px] text-[#999] ml-2">pfSense-style zone mapping</span>
          </div>
        </div>

        {/* NIC Detection Summary */}
        <div className="bg-white border-x border-b border-[#ddd] p-4">
          <div className="flex items-center gap-6">
            {/* NIC Count */}
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-12 h-12 rounded-lg flex items-center justify-center text-white font-bold text-lg",
                nicCount >= 3 ? "bg-green-500" : nicCount >= 2 ? "bg-yellow-500" : "bg-red-500"
              )}>
                {nicCount}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#333]">NICs Detected</div>
                <div className="text-[11px] text-[#666]">
                  {nicCount === 0 && 'No interfaces found!'}
                  {nicCount === 1 && '⚠ Need at least 2 for WAN+LAN'}
                  {nicCount === 2 && 'WAN + LAN available'}
                  {nicCount === 3 && 'WAN + LAN + DMZ available'}
                  {nicCount >= 4 && 'Full multi-zone available'}
                </div>
              </div>
            </div>

            <ArrowRight size={16} className="text-[#ccc]" />

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-500 flex items-center justify-center text-white font-bold text-lg">
                {assignedCount}
              </div>
              <div>
                <div className="text-sm font-semibold text-[#333]">Zones Assigned</div>
                <div className="text-[11px] text-[#666]">of {zones.length} available zones</div>
              </div>
            </div>

            <div className="flex-1" />

            <button
              onClick={loadFromDB}
              disabled={isLoading}
              className="forti-toolbar-btn"
            >
              <RefreshCw size={12} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>

            <button
              onClick={handleSave}
              disabled={isSaving || !hasChanges}
              className={cn("forti-toolbar-btn", hasChanges && "primary")}
            >
              <Save size={12} />
              {isSaving ? 'Saving...' : 'Apply Assignment'}
            </button>
          </div>

          {/* Warning banner */}
          {nicCount < 2 && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded flex items-start gap-2">
              <AlertTriangle size={16} className="text-red-500 mt-0.5 shrink-0" />
              <div>
                <div className="text-sm font-medium text-red-800">Insufficient Network Interfaces</div>
                <div className="text-[11px] text-red-600 mt-1">
                  Aegis NGFW requires at least 2 NICs: one for WAN (Internet) and one for LAN (Internal).
                  Add another NIC to your server and refresh.
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Detected NICs Table */}
        <div className="bg-white border-x border-b border-[#ddd]">
          <div className="px-4 py-2 bg-[#f5f5f5] border-b border-[#ddd]">
            <span className="text-[11px] font-semibold text-[#555]">DETECTED PHYSICAL INTERFACES</span>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Interface</th>
                <th>MAC Address</th>
                <th>IP Address</th>
                <th>State</th>
                <th>Speed</th>
                <th>Assigned To</th>
              </tr>
            </thead>
            <tbody>
              {detectedNICs.map(nic => {
                const assignedZone = zones.find(z => z.nic === nic.name);
                return (
                  <tr key={nic.name}>
                    <td className="font-medium text-[#111]">
                      <div className="flex items-center gap-2">
                        <Wifi size={12} className="text-[#666]" />
                        {nic.name}
                      </div>
                    </td>
                    <td className="mono text-[11px] text-[#555]">{nic.mac || 'N/A'}</td>
                    <td className="mono text-[11px] text-[#333]">{nic.ip || '(no IP)'}</td>
                    <td>
                      <span className={cn(
                        "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded",
                        nic.state === 'up' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
                      )}>
                        <span className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          nic.state === 'up' ? 'bg-green-500' : 'bg-gray-400'
                        )} />
                        {nic.state.toUpperCase()}
                      </span>
                    </td>
                    <td className="text-[11px] text-[#555]">{nic.speed}</td>
                    <td>
                      {assignedZone ? (
                        <span className={cn(
                          "inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded",
                          "bg-blue-100 text-blue-700"
                        )}>
                          <CheckCircle2 size={10} />
                          {assignedZone.zone}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#999]">Unassigned</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {detectedNICs.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center text-[#999] py-8">
                    {demoMode ? 'No NICs in demo mode' : 'No interfaces detected. Run the agent installer on your Ubuntu host.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Zone Assignment Cards */}
        <div className="bg-white border-x border-b border-[#ddd] p-4">
          <div className="text-[11px] font-semibold text-[#555] mb-3 uppercase tracking-wider">
            Zone Assignment
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {zones.map((zone, idx) => (
              <div
                key={zone.zone}
                className={cn(
                  "border rounded-lg overflow-hidden",
                  zone.required ? "border-[#ccc]" : "border-dashed border-[#ddd]"
                )}
              >
                {/* Zone Header */}
                <div className={cn(
                  "px-4 py-2.5 flex items-center gap-3",
                  zone.nic ? "bg-[#f0f8f0]" : "bg-[#f9f9f9]"
                )}>
                  <span className={zone.color}>{zone.icon}</span>
                  <div className="flex-1">
                    <div className="text-[12px] font-bold text-[#333]">
                      {zone.label}
                      {zone.required && <span className="text-red-500 ml-1">*</span>}
                    </div>
                    <div className="text-[10px] text-[#888]">{zone.description}</div>
                  </div>
                  {zone.nic && <CheckCircle2 size={16} className="text-green-500" />}
                </div>

                {/* Zone Config */}
                <div className="p-4 space-y-3">
                  {/* NIC Selection */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-[11px] text-right text-[#666]">Interface</Label>
                    <div className="col-span-2">
                      <Select
                        value={zone.nic || '__none__'}
                        onValueChange={(v) => updateZone(idx, 'nic', v === '__none__' ? '' : v)}
                      >
                        <SelectTrigger className="h-8 text-[11px]">
                          <SelectValue placeholder="Select NIC..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__" className="text-[11px]">
                            — None —
                          </SelectItem>
                          {detectedNICs.map(nic => {
                            const usedBy = zones.find(z => z.nic === nic.name && z.zone !== zone.zone);
                            return (
                              <SelectItem
                                key={nic.name}
                                value={nic.name}
                                disabled={!!usedBy}
                                className="text-[11px]"
                              >
                                {nic.name} ({nic.mac}) {nic.state === 'up' ? '●' : '○'}
                                {usedBy ? ` [${usedBy.zone}]` : ''}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Address Mode */}
                  <div className="grid grid-cols-3 gap-2 items-center">
                    <Label className="text-[11px] text-right text-[#666]">Address</Label>
                    <div className="col-span-2">
                      <Select
                        value={zone.mode}
                        onValueChange={(v) => updateZone(idx, 'mode', v)}
                      >
                        <SelectTrigger className="h-8 text-[11px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="dhcp" className="text-[11px]">DHCP (Automatic)</SelectItem>
                          <SelectItem value="static" className="text-[11px]">Static IP</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Static IP Config */}
                  {zone.mode === 'static' && (
                    <>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <Label className="text-[11px] text-right text-[#666]">IP Address</Label>
                        <div className="col-span-2">
                          <Input
                            value={zone.ip}
                            onChange={(e) => updateZone(idx, 'ip', e.target.value)}
                            placeholder="192.168.1.1"
                            className="h-8 text-[11px] font-mono"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <Label className="text-[11px] text-right text-[#666]">Subnet</Label>
                        <div className="col-span-2">
                          <Select
                            value={zone.subnet}
                            onValueChange={(v) => updateZone(idx, 'subnet', v)}
                          >
                            <SelectTrigger className="h-8 text-[11px] font-mono">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="255.255.255.0" className="text-[11px]">255.255.255.0 (/24)</SelectItem>
                              <SelectItem value="255.255.0.0" className="text-[11px]">255.255.0.0 (/16)</SelectItem>
                              <SelectItem value="255.255.255.128" className="text-[11px]">255.255.255.128 (/25)</SelectItem>
                              <SelectItem value="255.255.255.192" className="text-[11px]">255.255.255.192 (/26)</SelectItem>
                              <SelectItem value="255.255.255.240" className="text-[11px]">255.255.255.240 (/28)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 items-center">
                        <Label className="text-[11px] text-right text-[#666]">Gateway</Label>
                        <div className="col-span-2">
                          <Input
                            value={zone.gateway}
                            onChange={(e) => updateZone(idx, 'gateway', e.target.value)}
                            placeholder={zone.zone === 'WAN' ? 'ISP gateway IP' : 'Optional'}
                            className="h-8 text-[11px] font-mono"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-[#f8f9fa] border-x border-b border-[#ddd] p-4">
          <div className="flex items-start gap-2">
            <HelpCircle size={14} className="text-blue-500 mt-0.5 shrink-0" />
            <div className="text-[11px] text-[#666] space-y-1">
              <div><strong>How it works:</strong> Assign physical NICs to network zones, just like pfSense/OPNsense.</div>
              <div>• <strong>WAN</strong>: Connects to Internet (required). Usually DHCP from ISP.</div>
              <div>• <strong>LAN</strong>: Internal trusted network (required). Set a static IP like 192.168.1.1/24.</div>
              <div>• <strong>DMZ</strong>: Public server zone (optional). Isolated from LAN for security.</div>
              <div>• <strong>GUEST</strong>: Visitor network (optional). No LAN access.</div>
              <div className="mt-2">After saving, the Aegis Agent on your Ubuntu host will apply the configuration automatically.</div>
            </div>
          </div>
        </div>
      </div>
    </Shell>
  );
};

export default InterfaceAssignment;
