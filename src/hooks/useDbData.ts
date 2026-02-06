import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import {
  firewallRulesApi,
  natRulesApi,
  networkInterfacesApi,
  vpnTunnelsApi,
  threatEventsApi,
  systemSettingsApi,
} from '@/lib/api';
import {
  mockFirewallRules,
  mockNATRules,
  mockInterfaces,
  mockVPNTunnels,
  mockThreats,
  mockSystemStatus,
} from '@/data/mockData';

/**
 * Hook to fetch data from database with fallback to mock data.
 * When user has no roles yet (new signup), mock data is shown.
 * When connected to real database (Lovable Cloud or self-host), real data is used.
 */
export function useFirewallRules() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;

  return useQuery({
    queryKey: ['firewall-rules', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return [];
      const data = await firewallRulesApi.getAll();
      return data;
    },
    enabled: !!user,
    placeholderData: mockFirewallRules.map(r => ({
      id: r.id,
      rule_order: r.order,
      enabled: r.enabled,
      action: r.action,
      interface: r.interface,
      direction: r.direction,
      protocol: r.protocol,
      source_type: r.source.type,
      source_value: r.source.value,
      source_port: r.source.port || null,
      destination_type: r.destination.type,
      destination_value: r.destination.value,
      destination_port: r.destination.port || null,
      description: r.description,
      logging: r.logging,
      hits: r.hits,
      last_hit: r.lastHit?.toISOString() || null,
      created_at: r.created.toISOString(),
      updated_at: new Date().toISOString(),
      created_by: null,
    })),
  });
}

export function useNATRules() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;

  return useQuery({
    queryKey: ['nat-rules', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return [];
      return natRulesApi.getAll();
    },
    enabled: !!user,
  });
}

export function useNetworkInterfaces() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;

  return useQuery({
    queryKey: ['network-interfaces', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return [];
      return networkInterfacesApi.getAll();
    },
    enabled: !!user,
  });
}

export function useVPNTunnels() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;

  return useQuery({
    queryKey: ['vpn-tunnels', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return [];
      return vpnTunnelsApi.getAll();
    },
    enabled: !!user,
  });
}

export function useThreatEvents(limit = 100) {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;

  return useQuery({
    queryKey: ['threat-events', hasAccess, limit],
    queryFn: async () => {
      if (!hasAccess) return [];
      return threatEventsApi.getAll(limit);
    },
    enabled: !!user,
  });
}

export function useSystemSettings() {
  const { user, roles } = useAuth();
  const hasAccess = roles.length > 0;

  return useQuery({
    queryKey: ['system-settings', hasAccess],
    queryFn: async () => {
      if (!hasAccess) return [];
      return systemSettingsApi.getAll();
    },
    enabled: !!user,
  });
}
