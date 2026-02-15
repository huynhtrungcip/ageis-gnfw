import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { db, isApiConfigured } from '@/lib/postgrest';
import { mockInterfaces, mockFirewallRules, mockNATRules, mockVPNTunnels, mockThreats, mockSystemStatus, mockTrafficStats, mockAIAnalysis } from '@/data/mockData';

/**
 * Returns true when mock data should be used — ONLY when demoMode is ON.
 */
function useShouldMock(): boolean {
  const { demoMode } = useDemoMode();
  return demoMode;
}

/**
 * Generic hook for fetching from PostgREST or falling back to mock data.
 */
function useDbQuery<T = any>(
  key: string,
  tableName: string,
  orderBy = 'created_at',
  options?: { ascending?: boolean; limit?: number },
  mockFallback?: T[]
) {
  const { user } = useAuth();
  const shouldMock = useShouldMock();

  return useQuery<T[]>({
    queryKey: [key, !!user, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return mockFallback ?? [];
      }
      const { data, error } = await db
        .from(tableName)
        .select('*')
        .order(orderBy, { ascending: options?.ascending ?? true })
        .limit(options?.limit ?? 1000);
      if (error) throw error;
      return (data as T[]) ?? [];
    },
    enabled: !!user,
  });
}

// ── Core tables ─────────────────────────────────
export function useFirewallRules() {
  return useDbQuery('firewall-rules', 'firewall_rules', 'rule_order', undefined,
    mockFirewallRules.map(r => ({
      id: r.id, rule_order: r.order, enabled: r.enabled, action: r.action,
      interface: r.interface, direction: r.direction, protocol: r.protocol,
      source_type: r.source.type, source_value: r.source.value,
      source_port: null, destination_type: r.destination.type,
      destination_value: r.destination.value, destination_port: r.destination.port ?? null,
      description: r.description, logging: r.logging, hits: r.hits ?? 0,
      last_hit: r.lastHit?.toISOString() ?? null, created_at: r.created.toISOString(),
      updated_at: r.created.toISOString(), created_by: null,
    })) as any[]
  );
}

export function useNATRules() {
  return useDbQuery('nat-rules', 'nat_rules', 'created_at', undefined,
    mockNATRules.map(r => ({
      id: r.id, type: r.type, enabled: r.enabled, interface: r.interface,
      protocol: r.protocol, external_address: r.externalAddress ?? null,
      external_port: r.externalPort, internal_address: r.internalAddress,
      internal_port: r.internalPort, description: r.description,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
      created_by: null,
    })) as any[]
  );
}

export function useNetworkInterfaces() {
  return useDbQuery('network-interfaces', 'network_interfaces', 'name', undefined,
    mockInterfaces.map(i => ({
      id: i.id, name: i.name, type: i.type, status: i.status,
      ip_address: i.ipAddress, subnet: i.subnet ?? null, gateway: i.gateway ?? null,
      mac: i.mac, speed: i.speed, duplex: i.duplex, mtu: i.mtu,
      vlan: i.vlan ?? null, rx_bytes: i.rxBytes, tx_bytes: i.txBytes,
      rx_packets: i.rxPackets, tx_packets: i.txPackets,
      created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })) as any[]
  );
}

export function useVPNTunnels() {
  return useDbQuery('vpn-tunnels', 'vpn_tunnels', 'name', undefined,
    mockVPNTunnels.map(v => ({
      id: v.id, name: v.name, type: v.type, status: v.status,
      remote_gateway: v.remoteGateway, local_network: v.localNetwork,
      remote_network: v.remoteNetwork, bytes_in: v.bytesIn, bytes_out: v.bytesOut,
      uptime: v.uptime, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    })) as any[]
  );
}

export function useThreatEvents(limit = 100) {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery({
    queryKey: ['threat-events', !!user, limit, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return mockThreats.map(t => ({
          id: t.id, severity: t.severity, category: t.category,
          source_ip: t.sourceIp, destination_ip: t.destinationIp,
          source_port: t.sourcePort, destination_port: t.destinationPort,
          protocol: t.protocol, signature: t.signature, description: t.description,
          action: t.action, ai_confidence: t.aiConfidence,
          created_at: t.timestamp.toISOString(),
        }));
      }
      const { data, error } = await db
        .from('threat_events')
        .select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useSystemSettings() {
  return useDbQuery('system-settings', 'system_settings', 'key');
}

export function useStaticRoutes() {
  return useDbQuery('static-routes', 'static_routes');
}
export function usePolicyRoutes() {
  return useDbQuery('policy-routes', 'policy_routes', 'seq', undefined, mockPolicyRoutes);
}

const mockPolicyRoutes = [
  { id: 'pr-1', seq: 1, incoming: 'internal', source: '10.0.1.0/24', destination: '0.0.0.0/0', protocol: 'any', gateway: '203.0.113.1', out_interface: 'wan1', status: 'enabled', comment: 'Sales VLAN via WAN1', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pr-2', seq: 2, incoming: 'internal', source: '10.0.2.0/24', destination: '0.0.0.0/0', protocol: 'any', gateway: '203.0.114.1', out_interface: 'wan2', status: 'enabled', comment: 'Engineering VLAN via WAN2', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pr-3', seq: 3, incoming: 'dmz', source: '172.16.0.0/24', destination: '10.0.0.0/8', protocol: 'TCP', gateway: '192.168.1.1', out_interface: 'internal', status: 'enabled', comment: 'DMZ to internal access', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'pr-4', seq: 4, incoming: 'internal', source: '10.0.3.0/24', destination: '0.0.0.0/0', protocol: 'any', gateway: '203.0.113.1', out_interface: 'wan1', status: 'disabled', comment: 'Guest VLAN (disabled)', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
export function useAliases() {
  return useDbQuery('aliases', 'aliases', 'name', undefined, mockAliases);
}

const mockAliases = [
  { id: 'a-1', name: 'INTERNAL_SERVERS', type: 'host', values: ['10.0.1.10', '10.0.1.11', '10.0.1.12'], description: 'Internal server farm', usage_count: 5, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a-2', name: 'TRUSTED_NETWORKS', type: 'network', values: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'], description: 'RFC1918 private ranges', usage_count: 12, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a-3', name: 'WEB_PORTS', type: 'port', values: ['80', '443', '8080', '8443'], description: 'Common web service ports', usage_count: 8, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a-4', name: 'DNS_SERVERS', type: 'host', values: ['8.8.8.8', '8.8.4.4', '1.1.1.1'], description: 'Public DNS resolvers', usage_count: 3, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a-5', name: 'MANAGEMENT_NET', type: 'network', values: ['10.0.99.0/24'], description: 'Management VLAN', usage_count: 2, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'a-6', name: 'MAIL_PORTS', type: 'port', values: ['25', '587', '993', '995'], description: 'Email service ports', usage_count: 1, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
export function useServices() {
  return useDbQuery('services', 'services', 'name');
}
export function useSchedules() {
  return useDbQuery('schedules', 'schedules', 'name');
}
export function useIPPools() {
  return useDbQuery('ip-pools', 'ip_pools', 'name');
}
export function useVirtualIPs() {
  return useDbQuery('virtual-ips', 'virtual_ips', 'name');
}
export function useWildcardFQDNs() {
  return useDbQuery('wildcard-fqdns', 'wildcard_fqdns', 'name', undefined, mockWildcardFQDNs);
}

const mockWildcardFQDNs = [
  { id: 'wf-1', name: 'Microsoft-365', fqdn: '*.microsoft.com', interface: 'wan1', comment: 'Microsoft cloud services', references_count: 3, visibility: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'wf-2', name: 'Google-Services', fqdn: '*.google.com', interface: 'wan1', comment: 'Google cloud and apps', references_count: 5, visibility: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'wf-3', name: 'AWS-Cloud', fqdn: '*.amazonaws.com', interface: 'wan1', comment: 'Amazon Web Services', references_count: 2, visibility: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'wf-4', name: 'Zoom-Meetings', fqdn: '*.zoom.us', interface: 'wan1', comment: 'Zoom video conferencing', references_count: 1, visibility: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'wf-5', name: 'Slack-Comms', fqdn: '*.slack.com', interface: 'wan1', comment: 'Slack messaging platform', references_count: 1, visibility: false, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
  { id: 'wf-6', name: 'GitHub-Dev', fqdn: '*.github.com', interface: 'wan1', comment: 'GitHub development platform', references_count: 2, visibility: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
];
export function useCertificates() {
  return useDbQuery('certificates', 'certificates', 'name');
}
export function useIDSSignatures() {
  return useDbQuery('ids-signatures', 'ids_signatures', 'sid');
}
export function useSSLInspectionProfiles() {
  return useDbQuery('ssl-inspection', 'ssl_inspection_profiles', 'name');
}
export function useAVProfiles() {
  return useDbQuery('av-profiles', 'av_profiles', 'name');
}
export function useWebFilterProfiles() {
  return useDbQuery('web-filter-profiles', 'web_filter_profiles', 'name');
}
export function useDNSFilterProfiles() {
  return useDbQuery('dns-filter-profiles', 'dns_filter_profiles', 'name');
}
export function useDHCPServers() {
  return useDbQuery('dhcp-servers', 'dhcp_servers', 'interface');
}
export function useDHCPLeases() {
  return useDbQuery('dhcp-leases', 'dhcp_leases', 'ip');
}
export function useDHCPStaticMappings() {
  return useDbQuery('dhcp-static-mappings', 'dhcp_static_mappings', 'name');
}
export function useDNSForwardZones() {
  return useDbQuery('dns-forward-zones', 'dns_forward_zones', 'name');
}
export function useDNSLocalRecords() {
  return useDbQuery('dns-local-records', 'dns_local_records', 'hostname');
}
export function useTrafficShapers() {
  return useDbQuery('traffic-shapers', 'traffic_shapers', 'name');
}
export function useTrafficShapingPolicies() {
  return useDbQuery('traffic-shaping-policies', 'traffic_shaping_policies', 'name', undefined, mockTrafficShapingPolicies);
}

const mockTrafficShapingPolicies = [
  { id: 'tsp-1', name: 'Limit-YouTube', src_interface: 'LAN (port1)', dst_interface: 'WAN1 (wan1)', source: 'all', destination: 'all', service: 'ALL', application: 'YouTube', traffic_shaper: 'high-priority', reverse_shaper: '', per_ip_shaper: 'per-ip-1mbps', enabled: true, matches: 245890, bytes: 52428800000 },
  { id: 'tsp-2', name: 'VoIP-Priority', src_interface: 'LAN (port1)', dst_interface: 'WAN1 (wan1)', source: '10.0.1.0/24', destination: 'all', service: 'SIP', application: 'VoIP', traffic_shaper: 'voip-shaper', reverse_shaper: 'voip-shaper', per_ip_shaper: '', enabled: true, matches: 89234, bytes: 1073741824 },
  { id: 'tsp-3', name: 'Guest-Throttle', src_interface: 'Guest (port3)', dst_interface: 'WAN1 (wan1)', source: '10.0.3.0/24', destination: 'all', service: 'ALL', application: 'ALL', traffic_shaper: 'guest-limit', reverse_shaper: 'guest-limit', per_ip_shaper: 'per-ip-512kbps', enabled: true, matches: 567123, bytes: 10737418240 },
  { id: 'tsp-4', name: 'Block-Torrents', src_interface: 'LAN (port1)', dst_interface: 'WAN1 (wan1)', source: 'all', destination: 'all', service: 'ALL', application: 'BitTorrent', traffic_shaper: 'block-shaper', reverse_shaper: '', per_ip_shaper: '', enabled: true, matches: 12045, bytes: 536870912 },
  { id: 'tsp-5', name: 'Office365-QoS', src_interface: 'LAN (port1)', dst_interface: 'WAN1 (wan1)', source: 'all', destination: 'all', service: 'HTTPS', application: 'Office365', traffic_shaper: 'high-priority', reverse_shaper: 'high-priority', per_ip_shaper: '', enabled: true, matches: 432100, bytes: 21474836480 },
  { id: 'tsp-6', name: 'Social-Media-Limit', src_interface: 'LAN (port1)', dst_interface: 'WAN1 (wan1)', source: 'all', destination: 'all', service: 'HTTPS', application: 'Facebook', traffic_shaper: 'low-priority', reverse_shaper: '', per_ip_shaper: 'per-ip-256kbps', enabled: false, matches: 78900, bytes: 3221225472 },
];

// ── Metrics ─────────────────────────────────────
export function useSystemMetrics(count = 1) {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery({
    queryKey: ['system-metrics', !!user, count, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return [{
          id: 'mock', hostname: mockSystemStatus.hostname, uptime: mockSystemStatus.uptime,
          cpu_usage: mockSystemStatus.cpu.usage, cpu_cores: mockSystemStatus.cpu.cores,
          cpu_temperature: mockSystemStatus.cpu.temperature,
          memory_total: mockSystemStatus.memory.total, memory_used: mockSystemStatus.memory.used,
          memory_free: mockSystemStatus.memory.free, memory_cached: mockSystemStatus.memory.cached,
          disk_total: mockSystemStatus.disk.total, disk_used: mockSystemStatus.disk.used,
          disk_free: mockSystemStatus.disk.free,
          load_1m: mockSystemStatus.load[0], load_5m: mockSystemStatus.load[1],
          load_15m: mockSystemStatus.load[2], recorded_at: new Date().toISOString(),
        }];
      }
      const { data, error } = await db
        .from('system_metrics')
        .select('*').order('recorded_at', { ascending: false }).limit(count);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

export function useTrafficStats(hours = 24) {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery({
    queryKey: ['traffic-stats', !!user, hours, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return mockTrafficStats.map(t => ({
          id: 'mock-' + t.timestamp.getTime(),
          interface: t.interface,
          inbound: t.inbound, outbound: t.outbound, blocked: t.blocked,
          recorded_at: t.timestamp.toISOString(),
        }));
      }
      const since = new Date(Date.now() - hours * 3600000).toISOString();
      const { data, error } = await db
        .from('traffic_stats')
        .select('*').gte('recorded_at', since).order('recorded_at');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}

export function useAIAnalysis() {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery({
    queryKey: ['ai-analysis', !!user, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return {
          id: 'mock', risk_score: mockAIAnalysis.riskScore,
          anomalies_detected: mockAIAnalysis.anomaliesDetected,
          threats_blocked: mockAIAnalysis.threatsBlocked,
          predictions: mockAIAnalysis.predictions,
          recommendations: mockAIAnalysis.recommendations,
          recorded_at: new Date().toISOString(),
        };
      }
      const { data, error } = await db
        .from('ai_analysis')
        .select('*').order('recorded_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useAuditLogs(limit = 200) {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery({
    queryKey: ['audit-logs', !!user, limit, shouldMock],
    queryFn: async () => {
      if (shouldMock) return [];
      const { data, error } = await db
        .from('audit_logs')
        .select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
