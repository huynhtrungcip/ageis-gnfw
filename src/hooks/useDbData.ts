import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

/**
 * Generic hook factory for fetching data from any Supabase table.
 * Handles auth check and returns empty array when user has no access.
 */
function useDbQuery<T = any>(
  key: string,
  tableName: string,
  orderBy = 'created_at',
  options?: { ascending?: boolean; limit?: number }
) {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;

  return useQuery<T[]>({
    queryKey: [key, hasAccess],
    queryFn: async () => {
      if (!hasAccess) return [];
      let query = (supabase as any)
        .from(tableName)
        .select('*')
        .order(orderBy, { ascending: options?.ascending ?? true });
      if (options?.limit) query = query.limit(options.limit);
      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

// ── Core tables ─────────────────────────────────
export function useFirewallRules() {
  return useDbQuery<Tables<'firewall_rules'>>('firewall-rules', 'firewall_rules', 'rule_order');
}

export function useNATRules() {
  return useDbQuery<Tables<'nat_rules'>>('nat-rules', 'nat_rules');
}

export function useNetworkInterfaces() {
  return useDbQuery<Tables<'network_interfaces'>>('network-interfaces', 'network_interfaces', 'name');
}

export function useVPNTunnels() {
  return useDbQuery<Tables<'vpn_tunnels'>>('vpn-tunnels', 'vpn_tunnels', 'name');
}

export function useThreatEvents(limit = 100) {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'threat_events'>[]>({
    queryKey: ['threat-events', hasAccess, limit],
    queryFn: async () => {
      if (!hasAccess) return [];
      const { data, error } = await supabase
        .from('threat_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}

export function useSystemSettings() {
  return useDbQuery<Tables<'system_settings'>>('system-settings', 'system_settings', 'key');
}

// ── Routing ─────────────────────────────────────
export function useStaticRoutes() {
  return useDbQuery<Tables<'static_routes'>>('static-routes', 'static_routes');
}

export function usePolicyRoutes() {
  return useDbQuery<Tables<'policy_routes'>>('policy-routes', 'policy_routes', 'seq');
}

// ── Objects ─────────────────────────────────────
export function useAliases() {
  return useDbQuery<Tables<'aliases'>>('aliases', 'aliases', 'name');
}

export function useServices() {
  return useDbQuery<Tables<'services'>>('services', 'services', 'name');
}

export function useSchedules() {
  return useDbQuery<Tables<'schedules'>>('schedules', 'schedules', 'name');
}

export function useIPPools() {
  return useDbQuery<Tables<'ip_pools'>>('ip-pools', 'ip_pools', 'name');
}

export function useVirtualIPs() {
  return useDbQuery<Tables<'virtual_ips'>>('virtual-ips', 'virtual_ips', 'name');
}

export function useWildcardFQDNs() {
  return useDbQuery<Tables<'wildcard_fqdns'>>('wildcard-fqdns', 'wildcard_fqdns', 'name');
}

// ── Security Profiles ───────────────────────────
export function useCertificates() {
  return useDbQuery<Tables<'certificates'>>('certificates', 'certificates', 'name');
}

export function useIDSSignatures() {
  return useDbQuery<Tables<'ids_signatures'>>('ids-signatures', 'ids_signatures', 'sid');
}

export function useSSLInspectionProfiles() {
  return useDbQuery<Tables<'ssl_inspection_profiles'>>('ssl-inspection', 'ssl_inspection_profiles', 'name');
}

export function useAVProfiles() {
  return useDbQuery<Tables<'av_profiles'>>('av-profiles', 'av_profiles', 'name');
}

export function useWebFilterProfiles() {
  return useDbQuery<Tables<'web_filter_profiles'>>('web-filter-profiles', 'web_filter_profiles', 'name');
}

export function useDNSFilterProfiles() {
  return useDbQuery<Tables<'dns_filter_profiles'>>('dns-filter-profiles', 'dns_filter_profiles', 'name');
}

// ── DHCP ────────────────────────────────────────
export function useDHCPServers() {
  return useDbQuery<Tables<'dhcp_servers'>>('dhcp-servers', 'dhcp_servers', 'interface');
}

export function useDHCPLeases() {
  return useDbQuery<Tables<'dhcp_leases'>>('dhcp-leases', 'dhcp_leases', 'ip');
}

export function useDHCPStaticMappings() {
  return useDbQuery<Tables<'dhcp_static_mappings'>>('dhcp-static-mappings', 'dhcp_static_mappings', 'name');
}

// ── DNS ─────────────────────────────────────────
export function useDNSForwardZones() {
  return useDbQuery<Tables<'dns_forward_zones'>>('dns-forward-zones', 'dns_forward_zones', 'name');
}

export function useDNSLocalRecords() {
  return useDbQuery<Tables<'dns_local_records'>>('dns-local-records', 'dns_local_records', 'hostname');
}

// ── Traffic Shaping ─────────────────────────────
export function useTrafficShapers() {
  return useDbQuery<Tables<'traffic_shapers'>>('traffic-shapers', 'traffic_shapers', 'name');
}

export function useTrafficShapingPolicies() {
  return useDbQuery<Tables<'traffic_shaping_policies'>>('traffic-shaping-policies', 'traffic_shaping_policies', 'name');
}

// ── Metrics (time-series) ───────────────────────
export function useSystemMetrics(count = 1) {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'system_metrics'>[]>({
    queryKey: ['system-metrics', hasAccess, count],
    queryFn: async () => {
      if (!hasAccess) return [];
      const { data, error } = await (supabase as any)
        .from('system_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(count);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000, // refresh every 30s
  });
}

export function useTrafficStats(hours = 24) {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'traffic_stats'>[]>({
    queryKey: ['traffic-stats', hasAccess, hours],
    queryFn: async () => {
      if (!hasAccess) return [];
      const since = new Date(Date.now() - hours * 3600000).toISOString();
      const { data, error } = await (supabase as any)
        .from('traffic_stats')
        .select('*')
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}

export function useAIAnalysis() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'ai_analysis'> | null>({
    queryKey: ['ai-analysis', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return null;
      const { data, error } = await (supabase as any)
        .from('ai_analysis')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

// ── Audit Logs ──────────────────────────────────
export function useAuditLogs(limit = 200) {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'audit_logs'>[]>({
    queryKey: ['audit-logs', hasAccess, limit],
    queryFn: async () => {
      if (!hasAccess) return [];
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
  });
}
