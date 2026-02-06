import { useQuery } from '@tanstack/react-query';
import { db, isApiConfigured } from '@/lib/postgrest';
import { useAuth } from '@/contexts/AuthContext';
import { useDemoMode } from '@/contexts/DemoModeContext';
import { mockSystemStatus, mockInterfaces, mockVPNTunnels, mockThreats, mockTrafficStats, mockAIAnalysis, mockFirewallRules } from '@/data/mockData';
import type { SystemMetric, TrafficStat, NetworkInterface, VPNTunnel, ThreatEvent, AIAnalysis } from '@/lib/api';

function useShouldMock(): boolean {
  const { demoMode } = useDemoMode();
  return demoMode || !isApiConfigured();
}

/** Latest system metrics (1 row) */
export function useLatestMetrics() {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery<SystemMetric | null>({
    queryKey: ['latest-metrics', !!user, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        const s = mockSystemStatus;
        return {
          id: 'mock', hostname: s.hostname, uptime: s.uptime,
          cpu_usage: s.cpu.usage, cpu_cores: s.cpu.cores, cpu_temperature: s.cpu.temperature,
          memory_total: s.memory.total, memory_used: s.memory.used,
          memory_free: s.memory.free, memory_cached: s.memory.cached,
          disk_total: s.disk.total, disk_used: s.disk.used, disk_free: s.disk.free,
          load_1m: s.load[0], load_5m: s.load[1], load_15m: s.load[2],
          recorded_at: new Date().toISOString(),
        };
      }
      const { data, error } = await (db.from<SystemMetric>('system_metrics')
        .select('*').order('recorded_at', { ascending: false }).limit(1).maybeSingle() as any);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** Traffic stats for the last N hours */
export function useTrafficHistory(hours = 24) {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery<TrafficStat[]>({
    queryKey: ['traffic-history', !!user, hours, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return mockTrafficStats.map(t => ({
          id: 'mock-' + t.timestamp.getTime(), interface: t.interface,
          inbound: t.inbound, outbound: t.outbound, blocked: t.blocked,
          recorded_at: t.timestamp.toISOString(),
        }));
      }
      const since = new Date(Date.now() - hours * 3600000).toISOString();
      const { data, error } = await (db.from<TrafficStat>('traffic_stats')
        .select('*').gte('recorded_at', since).order('recorded_at') as any);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** Network interfaces */
export function useInterfaces() {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery<NetworkInterface[]>({
    queryKey: ['dashboard-interfaces', !!user, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return mockInterfaces.map(i => ({
          id: i.id, name: i.name, type: i.type, status: i.status,
          ip_address: i.ipAddress, subnet: i.subnet ?? null, gateway: i.gateway ?? null,
          mac: i.mac, speed: i.speed, duplex: i.duplex, mtu: i.mtu,
          vlan: i.vlan ?? null, rx_bytes: i.rxBytes, tx_bytes: i.txBytes,
          rx_packets: i.rxPackets, tx_packets: i.txPackets,
          created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }));
      }
      const { data, error } = await (db.from<NetworkInterface>('network_interfaces')
        .select('*').order('name') as any);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** VPN tunnels */
export function useVPN() {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery<VPNTunnel[]>({
    queryKey: ['dashboard-vpn', !!user, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return mockVPNTunnels.map(v => ({
          id: v.id, name: v.name, type: v.type, status: v.status,
          remote_gateway: v.remoteGateway, local_network: v.localNetwork,
          remote_network: v.remoteNetwork, bytes_in: v.bytesIn, bytes_out: v.bytesOut,
          uptime: v.uptime, created_at: new Date().toISOString(), updated_at: new Date().toISOString(),
        }));
      }
      const { data, error } = await (db.from<VPNTunnel>('vpn_tunnels')
        .select('*').order('name') as any);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** Threat events from the last 24h */
export function useRecentThreats() {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery<ThreatEvent[]>({
    queryKey: ['dashboard-threats', !!user, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return mockThreats.map(t => ({
          id: t.id, severity: t.severity, category: t.category,
          source_ip: t.sourceIp, destination_ip: t.destinationIp,
          source_port: t.sourcePort, destination_port: t.destinationPort,
          protocol: t.protocol, signature: t.signature, description: t.description,
          action: t.action, ai_confidence: t.aiConfidence, created_at: t.timestamp.toISOString(),
        }));
      }
      const since = new Date(Date.now() - 24 * 3600000).toISOString();
      const { data, error } = await (db.from<ThreatEvent>('threat_events')
        .select('*').gte('created_at', since).order('created_at', { ascending: false }).limit(50) as any);
      if (error) throw error;
      return data ?? [];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });
}

/** AI analysis (latest) */
export function useLatestAIAnalysis() {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery<AIAnalysis | null>({
    queryKey: ['dashboard-ai', !!user, shouldMock],
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
      const { data, error } = await (db.from<AIAnalysis>('ai_analysis')
        .select('*').order('recorded_at', { ascending: false }).limit(1).maybeSingle() as any);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
    refetchInterval: 60000,
  });
}

/** Firewall rules count */
export function useFirewallStats() {
  const { user } = useAuth();
  const shouldMock = useShouldMock();
  return useQuery({
    queryKey: ['dashboard-fw-stats', !!user, shouldMock],
    queryFn: async () => {
      if (shouldMock) {
        return {
          total: mockFirewallRules.length,
          active: mockFirewallRules.filter(r => r.enabled).length,
        };
      }
      const { data, error } = await (db.from('firewall_rules').select('enabled') as any);
      if (error) throw error;
      const rules = (data as any[]) ?? [];
      return { total: rules.length, active: rules.filter(r => r.enabled).length };
    },
    enabled: !!user,
  });
}
