import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import type { Tables } from '@/integrations/supabase/types';

/** Latest system metrics (1 row) */
export function useLatestMetrics() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'system_metrics'> | null>({
    queryKey: ['latest-metrics', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return null;
      const { data, error } = await supabase
        .from('system_metrics')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** Traffic stats for the last N hours */
export function useTrafficHistory(hours = 24) {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'traffic_stats'>[]>({
    queryKey: ['traffic-history', hasAccess, hours],
    queryFn: async () => {
      if (!hasAccess) return [];
      const since = new Date(Date.now() - hours * 3600000).toISOString();
      const { data, error } = await supabase
        .from('traffic_stats')
        .select('*')
        .gte('recorded_at', since)
        .order('recorded_at', { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** Network interfaces */
export function useInterfaces() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'network_interfaces'>[]>({
    queryKey: ['dashboard-interfaces', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return [];
      const { data, error } = await supabase
        .from('network_interfaces')
        .select('*')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** VPN tunnels */
export function useVPN() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'vpn_tunnels'>[]>({
    queryKey: ['dashboard-vpn', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return [];
      const { data, error } = await supabase
        .from('vpn_tunnels')
        .select('*')
        .order('name');
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** Threat events from the last 24h */
export function useRecentThreats() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'threat_events'>[]>({
    queryKey: ['dashboard-threats', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return [];
      const since = new Date(Date.now() - 24 * 3600000).toISOString();
      const { data, error } = await supabase
        .from('threat_events')
        .select('*')
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** AI analysis (latest) */
export function useLatestAIAnalysis() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery<Tables<'ai_analysis'> | null>({
    queryKey: ['dashboard-ai', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return null;
      const { data, error } = await supabase
        .from('ai_analysis')
        .select('*')
        .order('recorded_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}

/** Firewall rules count */
export function useFirewallStats() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;
  return useQuery({
    queryKey: ['dashboard-fw-stats', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return { total: 0, active: 0 };
      const { data, error } = await supabase
        .from('firewall_rules')
        .select('enabled');
      if (error) throw error;
      const rules = data ?? [];
      return {
        total: rules.length,
        active: rules.filter(r => r.enabled).length,
      };
    },
    enabled: !!user,
  });
}
