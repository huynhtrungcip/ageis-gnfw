import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoMode } from '@/contexts/DemoModeContext';

export interface AgentStatus {
  connected: boolean;
  lastSyncTime: string | null;
  lastMetricTime: string | null;
  appliedRules: number;
  activeInterfaces: number;
  vpnTunnels: number;
  threatEventsToday: number;
  hostname: string;
  agentVersion: string;
}

export function useAgentStatus() {
  const { user } = useAuth();
  const { demoMode } = useDemoMode();

  return useQuery<AgentStatus>({
    queryKey: ['agent-status', !!user, demoMode],
    queryFn: async () => {
      if (demoMode) {
        return {
          connected: true,
          lastSyncTime: new Date(Date.now() - 15000).toISOString(),
          lastMetricTime: new Date(Date.now() - 8000).toISOString(),
          appliedRules: 24,
          activeInterfaces: 4,
          vpnTunnels: 3,
          threatEventsToday: 47,
          hostname: 'aegis-fw-01',
          agentVersion: '1.0.0',
        };
      }

      // Real mode — gather from multiple Supabase tables
      const [metricsRes, rulesRes, ifacesRes, vpnRes, threatsRes] = await Promise.all([
        supabase.from('system_metrics').select('recorded_at,hostname').order('recorded_at', { ascending: false }).limit(1).maybeSingle(),
        supabase.from('firewall_rules').select('id').eq('enabled', true),
        supabase.from('network_interfaces').select('id').eq('status', 'up'),
        supabase.from('vpn_tunnels').select('id').eq('status', 'connected'),
        supabase.from('threat_events').select('id').gte('created_at', new Date(Date.now() - 86400000).toISOString()),
      ]);

      const lastMetric = metricsRes.data;
      const isConnected = lastMetric && (Date.now() - new Date(lastMetric.recorded_at).getTime()) < 120000;

      return {
        connected: !!isConnected,
        lastSyncTime: lastMetric?.recorded_at ?? null,
        lastMetricTime: lastMetric?.recorded_at ?? null,
        appliedRules: rulesRes.data?.length ?? 0,
        activeInterfaces: ifacesRes.data?.length ?? 0,
        vpnTunnels: vpnRes.data?.length ?? 0,
        threatEventsToday: threatsRes.data?.length ?? 0,
        hostname: lastMetric?.hostname ?? 'unknown',
        agentVersion: '1.0.0',
      };
    },
    enabled: !!user,
    refetchInterval: 10000,
  });
}
