import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';
import { mockInterfaces, mockFirewallRules, mockNATRules, mockVPNTunnels, mockThreats, mockSystemStatus, mockTrafficStats, mockAIAnalysis } from '@/data/mockData';

type TableName = keyof Database['public']['Tables'];

/**
 * Returns true when mock data should be used — ONLY when demoMode is ON.
 */
function useShouldMock(): boolean {
  const { demoMode } = useDemoMode();
  return demoMode;
}

/**
 * Generic hook for fetching from Supabase or falling back to mock data.
 */
function useDbQuery<T = any>(
  key: string,
  tableName: TableName,
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
  return useDbQuery('policy-routes', 'policy_routes', 'seq');
}
export function useAliases() {
  return useDbQuery('aliases', 'aliases', 'name');
}
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
  return useDbQuery('wildcard-fqdns', 'wildcard_fqdns', 'name');
}
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
  return useDbQuery('traffic-shaping-policies', 'traffic_shaping_policies', 'name');
}

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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
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
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*').order('created_at', { ascending: false }).limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
