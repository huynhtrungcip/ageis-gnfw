import { supabase } from '@/integrations/supabase/client';
import type { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Re-export types for convenience
export type FirewallRule = Tables<'firewall_rules'>;
export type NATRule = Tables<'nat_rules'>;
export type NetworkInterface = Tables<'network_interfaces'>;
export type VPNTunnel = Tables<'vpn_tunnels'>;
export type ThreatEvent = Tables<'threat_events'>;
export type SystemSetting = Tables<'system_settings'>;
export type Profile = Tables<'profiles'>;

// ── Generic CRUD helper ─────────────────────────
function createCrudApi<T extends string>(tableName: T, orderBy = 'created_at') {
  return {
    async getAll() {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .select('*')
        .order(orderBy, { ascending: true });
      if (error) throw error;
      return data;
    },
    async create(record: any) {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .insert(record)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async update(id: string, updates: any) {
      const { data, error } = await (supabase as any)
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    async delete(id: string) {
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    async deleteMany(ids: string[]) {
      const { error } = await (supabase as any)
        .from(tableName)
        .delete()
        .in('id', ids);
      if (error) throw error;
    },
  };
}

// ── Firewall Rules ──────────────────────────────
export const firewallRulesApi = {
  ...createCrudApi('firewall_rules', 'rule_order'),
  async getAll() {
    const { data, error } = await supabase
      .from('firewall_rules')
      .select('*')
      .order('rule_order', { ascending: true });
    if (error) throw error;
    return data;
  },
  async create(rule: TablesInsert<'firewall_rules'>) {
    const { data, error } = await supabase
      .from('firewall_rules')
      .insert(rule)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: TablesUpdate<'firewall_rules'>) {
    const { data, error } = await supabase
      .from('firewall_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
  async delete(id: string) {
    const { error } = await supabase.from('firewall_rules').delete().eq('id', id);
    if (error) throw error;
  },
  async deleteMany(ids: string[]) {
    const { error } = await supabase.from('firewall_rules').delete().in('id', ids);
    if (error) throw error;
  },
};

// ── NAT Rules ──────────────────────────────────
export const natRulesApi = {
  ...createCrudApi('nat_rules'),
  async getAll() {
    const { data, error } = await supabase.from('nat_rules').select('*').order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },
  async create(rule: TablesInsert<'nat_rules'>) {
    const { data, error } = await supabase.from('nat_rules').insert(rule).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: TablesUpdate<'nat_rules'>) {
    const { data, error } = await supabase.from('nat_rules').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string) {
    const { error } = await supabase.from('nat_rules').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── Network Interfaces ─────────────────────────
export const networkInterfacesApi = {
  ...createCrudApi('network_interfaces', 'name'),
  async getAll() {
    const { data, error } = await supabase.from('network_interfaces').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data;
  },
  async create(iface: TablesInsert<'network_interfaces'>) {
    const { data, error } = await supabase.from('network_interfaces').insert(iface).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: TablesUpdate<'network_interfaces'>) {
    const { data, error } = await supabase.from('network_interfaces').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string) {
    const { error } = await supabase.from('network_interfaces').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── VPN Tunnels ────────────────────────────────
export const vpnTunnelsApi = {
  ...createCrudApi('vpn_tunnels', 'name'),
  async getAll() {
    const { data, error } = await supabase.from('vpn_tunnels').select('*').order('name', { ascending: true });
    if (error) throw error;
    return data;
  },
  async create(tunnel: TablesInsert<'vpn_tunnels'>) {
    const { data, error } = await supabase.from('vpn_tunnels').insert(tunnel).select().single();
    if (error) throw error;
    return data;
  },
  async update(id: string, updates: TablesUpdate<'vpn_tunnels'>) {
    const { data, error } = await supabase.from('vpn_tunnels').update(updates).eq('id', id).select().single();
    if (error) throw error;
    return data;
  },
  async delete(id: string) {
    const { error } = await supabase.from('vpn_tunnels').delete().eq('id', id);
    if (error) throw error;
  },
};

// ── Threat Events ──────────────────────────────
export const threatEventsApi = {
  async getAll(limit = 100) {
    const { data, error } = await supabase.from('threat_events').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data;
  },
  async getById(id: string) {
    const { data, error } = await supabase.from('threat_events').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    return data;
  },
};

// ── System Settings ────────────────────────────
export const systemSettingsApi = {
  async getAll() {
    const { data, error } = await supabase.from('system_settings').select('*').order('key', { ascending: true });
    if (error) throw error;
    return data;
  },
  async get(key: string) {
    const { data, error } = await supabase.from('system_settings').select('*').eq('key', key).maybeSingle();
    if (error) throw error;
    return data;
  },
  async upsert(key: string, value: string, description?: string) {
    const { data, error } = await supabase.from('system_settings').upsert({ key, value, description }, { onConflict: 'key' }).select().single();
    if (error) throw error;
    return data;
  },
};

// ── Profiles ───────────────────────────────────
export const profilesApi = {
  async getAll() {
    const { data, error } = await supabase.from('profiles').select('*').order('full_name', { ascending: true });
    if (error) throw error;
    return data;
  },
  async getCurrent(userId: string) {
    const { data, error } = await supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle();
    if (error) throw error;
    return data;
  },
  async update(userId: string, updates: TablesUpdate<'profiles'>) {
    const { data, error } = await supabase.from('profiles').update(updates).eq('user_id', userId).select().single();
    if (error) throw error;
    return data;
  },
};

// ── New tables (using generic CRUD) ────────────
export const staticRoutesApi = createCrudApi('static_routes', 'created_at');
export const policyRoutesApi = createCrudApi('policy_routes', 'seq');
export const aliasesApi = createCrudApi('aliases', 'name');
export const servicesApi = createCrudApi('services', 'name');
export const schedulesApi = createCrudApi('schedules', 'name');
export const certificatesApi = createCrudApi('certificates', 'name');
export const idsSignaturesApi = createCrudApi('ids_signatures', 'sid');
export const dhcpServersApi = createCrudApi('dhcp_servers', 'interface');
export const dhcpStaticMappingsApi = createCrudApi('dhcp_static_mappings', 'name');
export const dhcpLeasesApi = createCrudApi('dhcp_leases', 'ip');
export const dnsFilterProfilesApi = createCrudApi('dns_filter_profiles', 'name');
export const dnsForwardZonesApi = createCrudApi('dns_forward_zones', 'name');
export const dnsLocalRecordsApi = createCrudApi('dns_local_records', 'hostname');
export const ipPoolsApi = createCrudApi('ip_pools', 'name');
export const virtualIpsApi = createCrudApi('virtual_ips', 'name');
export const wildcardFqdnsApi = createCrudApi('wildcard_fqdns', 'name');
export const trafficShapersApi = createCrudApi('traffic_shapers', 'name');
export const trafficShapingPoliciesApi = createCrudApi('traffic_shaping_policies', 'name');
export const sslInspectionProfilesApi = createCrudApi('ssl_inspection_profiles', 'name');
export const avProfilesApi = createCrudApi('av_profiles', 'name');
export const webFilterProfilesApi = createCrudApi('web_filter_profiles', 'name');
export const auditLogsApi = {
  async getAll(limit = 200) {
    const { data, error } = await (supabase as any).from('audit_logs').select('*').order('created_at', { ascending: false }).limit(limit);
    if (error) throw error;
    return data;
  },
  async create(log: any) {
    const { data, error } = await (supabase as any).from('audit_logs').insert(log).select().single();
    if (error) throw error;
    return data;
  },
};

// ── Traffic Stats (time-series) ────────────────
export const trafficStatsApi = {
  async getRecent(hours = 24) {
    const since = new Date(Date.now() - hours * 3600000).toISOString();
    const { data, error } = await (supabase as any)
      .from('traffic_stats')
      .select('*')
      .gte('recorded_at', since)
      .order('recorded_at', { ascending: true });
    if (error) throw error;
    return data;
  },
};

// ── System Metrics ─────────────────────────────
export const systemMetricsApi = {
  async getLatest() {
    const { data, error } = await (supabase as any)
      .from('system_metrics')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async getRecent(count = 60) {
    const { data, error } = await (supabase as any)
      .from('system_metrics')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(count);
    if (error) throw error;
    return data;
  },
};

// ── AI Analysis ────────────────────────────────
export const aiAnalysisApi = {
  async getLatest() {
    const { data, error } = await (supabase as any)
      .from('ai_analysis')
      .select('*')
      .order('recorded_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};
