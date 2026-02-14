import { useState, useEffect, useCallback } from 'react';
import { db, isApiConfigured } from '@/lib/postgrest';
import { useDemoMode } from '@/contexts/DemoModeContext';

export interface NetworkDevice {
  id: string;
  name: string;
  ip_address: string;
  mac_address: string;
  device_type: 'firewall' | 'switch' | 'router' | 'server' | 'client' | 'ap' | 'printer' | 'iot' | 'unknown';
  status: 'online' | 'offline' | 'warning';
  interface: string;
  vlan: string | null;
  vendor: string | null;
  hostname: string | null;
  os_hint: string | null;
  open_ports: number[];
  last_seen: string;
  first_seen: string;
}

const mockDevices: NetworkDevice[] = [
  { id: '1', name: 'Aegis NGFW-500', ip_address: '10.0.0.1', mac_address: '00:1A:2B:3C:4D:5E', device_type: 'firewall', status: 'online', interface: 'LAN', vlan: null, vendor: 'Aegis', hostname: 'aegis-fw-01', os_hint: 'Linux', open_ports: [22,443,8080], last_seen: new Date().toISOString(), first_seen: '2024-01-01' },
  { id: '2', name: 'Core Switch', ip_address: '10.0.0.2', mac_address: '00:1A:2B:3C:4D:5F', device_type: 'switch', status: 'online', interface: 'LAN', vlan: 'VLAN 1', vendor: 'Cisco', hostname: 'core-sw-01', os_hint: null, open_ports: [22], last_seen: new Date().toISOString(), first_seen: '2024-01-01' },
  { id: '3', name: 'DMZ Switch', ip_address: '172.16.0.2', mac_address: '00:1A:2B:3C:4D:60', device_type: 'switch', status: 'online', interface: 'DMZ', vlan: 'VLAN 100', vendor: 'Cisco', hostname: 'dmz-sw-01', os_hint: null, open_ports: [], last_seen: new Date().toISOString(), first_seen: '2024-01-01' },
  { id: '4', name: 'DB Server', ip_address: '10.0.1.10', mac_address: '00:1A:2B:3C:4D:61', device_type: 'server', status: 'online', interface: 'LAN', vlan: 'VLAN 10', vendor: 'Dell', hostname: 'db-srv-01', os_hint: 'Ubuntu 24.04', open_ports: [22,5432], last_seen: new Date().toISOString(), first_seen: '2024-01-01' },
  { id: '5', name: 'App Server', ip_address: '10.0.1.11', mac_address: '00:1A:2B:3C:4D:62', device_type: 'server', status: 'online', interface: 'LAN', vlan: 'VLAN 10', vendor: 'Dell', hostname: 'app-srv-01', os_hint: 'Ubuntu 24.04', open_ports: [22,80,443], last_seen: new Date().toISOString(), first_seen: '2024-01-01' },
  { id: '6', name: 'Web Server', ip_address: '172.16.0.10', mac_address: '00:1A:2B:3C:4D:63', device_type: 'server', status: 'online', interface: 'DMZ', vlan: 'VLAN 100', vendor: 'Dell', hostname: 'web-srv-01', os_hint: 'Ubuntu 22.04', open_ports: [80,443], last_seen: new Date().toISOString(), first_seen: '2024-01-01' },
  { id: '7', name: 'Mail Server', ip_address: '172.16.0.11', mac_address: '00:1A:2B:3C:4D:64', device_type: 'server', status: 'warning', interface: 'DMZ', vlan: 'VLAN 100', vendor: 'HP', hostname: 'mail-srv-01', os_hint: null, open_ports: [25,143,993], last_seen: new Date(Date.now() - 300000).toISOString(), first_seen: '2024-01-01' },
  { id: '8', name: 'AP-Floor1', ip_address: '10.0.2.10', mac_address: '00:1A:2B:3C:4D:65', device_type: 'ap', status: 'online', interface: 'LAN', vlan: 'VLAN 20', vendor: 'Ubiquiti', hostname: 'ap-floor1', os_hint: null, open_ports: [], last_seen: new Date().toISOString(), first_seen: '2024-01-01' },
  { id: '9', name: 'Workstation 1', ip_address: '10.0.2.100', mac_address: '00:1A:2B:3C:4D:66', device_type: 'client', status: 'online', interface: 'LAN', vlan: 'VLAN 20', vendor: 'Intel', hostname: 'ws-01', os_hint: 'Windows 11', open_ports: [], last_seen: new Date().toISOString(), first_seen: '2024-01-05' },
  { id: '10', name: 'Workstation 2', ip_address: '10.0.2.101', mac_address: '00:1A:2B:3C:4D:67', device_type: 'client', status: 'offline', interface: 'LAN', vlan: 'VLAN 20', vendor: 'Intel', hostname: 'ws-02', os_hint: 'Windows 10', open_ports: [], last_seen: new Date(Date.now() - 86400000).toISOString(), first_seen: '2024-01-05' },
  { id: '11', name: 'Main Printer', ip_address: '10.0.2.200', mac_address: '00:1A:2B:3C:4D:68', device_type: 'printer', status: 'online', interface: 'LAN', vlan: 'VLAN 20', vendor: 'HP', hostname: 'printer-main', os_hint: null, open_ports: [631,9100], last_seen: new Date().toISOString(), first_seen: '2024-01-01' },
];

export function useNetworkTopology() {
  const { demoMode } = useDemoMode();
  const shouldMock = demoMode || !isApiConfigured();
  const [devices, setDevices] = useState<NetworkDevice[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDevices = useCallback(async () => {
    if (shouldMock) {
      setDevices(mockDevices);
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await (db.from('network_devices').select('*').order('last_seen', { ascending: false }) as any);
      if (error) throw error;
      setDevices(data || []);
    } catch { setDevices(mockDevices); }
    setLoading(false);
  }, [shouldMock]);

  useEffect(() => { fetchDevices(); }, [fetchDevices]);

  return { devices, loading, fetchDevices };
}
