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

// ── Firewall Rules ──────────────────────────────
export const firewallRulesApi = {
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
    const { error } = await supabase
      .from('firewall_rules')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async deleteMany(ids: string[]) {
    const { error } = await supabase
      .from('firewall_rules')
      .delete()
      .in('id', ids);
    if (error) throw error;
  },
};

// ── NAT Rules ──────────────────────────────────
export const natRulesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('nat_rules')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(rule: TablesInsert<'nat_rules'>) {
    const { data, error } = await supabase
      .from('nat_rules')
      .insert(rule)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: TablesUpdate<'nat_rules'>) {
    const { data, error } = await supabase
      .from('nat_rules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('nat_rules')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ── Network Interfaces ─────────────────────────
export const networkInterfacesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('network_interfaces')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(iface: TablesInsert<'network_interfaces'>) {
    const { data, error } = await supabase
      .from('network_interfaces')
      .insert(iface)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: TablesUpdate<'network_interfaces'>) {
    const { data, error } = await supabase
      .from('network_interfaces')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('network_interfaces')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ── VPN Tunnels ────────────────────────────────
export const vpnTunnelsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('vpn_tunnels')
      .select('*')
      .order('name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async create(tunnel: TablesInsert<'vpn_tunnels'>) {
    const { data, error } = await supabase
      .from('vpn_tunnels')
      .insert(tunnel)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async update(id: string, updates: TablesUpdate<'vpn_tunnels'>) {
    const { data, error } = await supabase
      .from('vpn_tunnels')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from('vpn_tunnels')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },
};

// ── Threat Events ──────────────────────────────
export const threatEventsApi = {
  async getAll(limit = 100) {
    const { data, error } = await supabase
      .from('threat_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return data;
  },

  async getById(id: string) {
    const { data, error } = await supabase
      .from('threat_events')
      .select('*')
      .eq('id', id)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
};

// ── System Settings ────────────────────────────
export const systemSettingsApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .order('key', { ascending: true });
    if (error) throw error;
    return data;
  },

  async get(key: string) {
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async upsert(key: string, value: string, description?: string) {
    const { data, error } = await supabase
      .from('system_settings')
      .upsert({ key, value, description }, { onConflict: 'key' })
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};

// ── Profiles ───────────────────────────────────
export const profilesApi = {
  async getAll() {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('full_name', { ascending: true });
    if (error) throw error;
    return data;
  },

  async getCurrent(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  async update(userId: string, updates: TablesUpdate<'profiles'>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  },
};
