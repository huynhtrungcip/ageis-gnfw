import { useQuery } from '@tanstack/react-query';
import { db, isApiConfigured } from '@/lib/postgrest';
import { useAuth } from '@/contexts/AuthContext';

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

  return useQuery<AgentStatus>({
    queryKey: ['agent-status', !!user],
    queryFn: async () => {
      if (!isApiConfigured()) {
        // Mock mode — simulate a connected agent
        return {
          connected: true,
          lastSyncTime: new Date(Date.now() - 15000).toISOString(), // 15s ago
          lastMetricTime: new Date(Date.now() - 8000).toISOString(),
          appliedRules: 24,
          activeInterfaces: 4,
          vpnTunnels: 3,
          threatEventsToday: 47,
          hostname: 'aegis-fw-01',
          agentVersion: '1.0.0',
        };
      }

      // Real mode — gather from multiple tables
      const [metricsRes, rulesRes, ifacesRes, vpnRes, threatsRes] = await Promise.all([
        db.from('system_metrics').select('recorded_at,hostname').order('recorded_at', { ascending: false }).limit(1).maybeSingle() as any,
        db.from('firewall_rules').select('id').eq('enabled', true) as any,
        db.from('network_interfaces').select('id').eq('status', 'up') as any,
        db.from('vpn_tunnels').select('id').eq('status', 'connected') as any,
        db.from('threat_events').select('id').gte('created_at', new Date(Date.now() - 86400000).toISOString()) as any,
      ]);

      const lastMetric = metricsRes.data;
      const isConnected = lastMetric && (Date.now() - new Date(lastMetric.recorded_at).getTime()) < 120000; // 2 min threshold

      return {
        connected: !!isConnected,
        lastSyncTime: lastMetric?.recorded_at ?? null,
        lastMetricTime: lastMetric?.recorded_at ?? null,
        appliedRules: (rulesRes.data as any[])?.length ?? 0,
        activeInterfaces: (ifacesRes.data as any[])?.length ?? 0,
        vpnTunnels: (vpnRes.data as any[])?.length ?? 0,
        threatEventsToday: (threatsRes.data as any[])?.length ?? 0,
        hostname: lastMetric?.hostname ?? 'unknown',
        agentVersion: '1.0.0',
      };
    },
    enabled: !!user,
    refetchInterval: 10000, // Check every 10s
  });
}
