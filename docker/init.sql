-- ============================================
-- Aegis NGFW - Database Initialization
-- For self-hosted PostgreSQL deployment
-- ============================================

-- Create roles
CREATE ROLE anon NOLOGIN;
CREATE ROLE authenticated NOLOGIN;
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Role enum
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin', 'operator', 'auditor');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ── Users table (replaces auth.users for self-host) ──
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── User Roles ──
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- ── Firewall Rules ──
CREATE TABLE IF NOT EXISTS public.firewall_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_order INT NOT NULL DEFAULT 0,
  enabled BOOLEAN NOT NULL DEFAULT true,
  action TEXT NOT NULL DEFAULT 'block' CHECK (action IN ('pass', 'block', 'reject')),
  interface TEXT NOT NULL DEFAULT 'WAN',
  direction TEXT NOT NULL DEFAULT 'in' CHECK (direction IN ('in', 'out')),
  protocol TEXT NOT NULL DEFAULT 'any',
  source_type TEXT NOT NULL DEFAULT 'any',
  source_value TEXT NOT NULL DEFAULT '*',
  source_port TEXT,
  destination_type TEXT NOT NULL DEFAULT 'any',
  destination_value TEXT NOT NULL DEFAULT '*',
  destination_port TEXT,
  description TEXT NOT NULL DEFAULT '',
  logging BOOLEAN NOT NULL DEFAULT false,
  hits BIGINT NOT NULL DEFAULT 0,
  last_hit TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- ── NAT Rules ──
CREATE TABLE IF NOT EXISTS public.nat_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL DEFAULT 'port-forward' CHECK (type IN ('port-forward', 'outbound', '1-to-1')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  interface TEXT NOT NULL DEFAULT 'WAN',
  protocol TEXT NOT NULL DEFAULT 'tcp',
  external_address TEXT,
  external_port TEXT NOT NULL DEFAULT '',
  internal_address TEXT NOT NULL DEFAULT '',
  internal_port TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id)
);

-- ── Network Interfaces ──
CREATE TABLE IF NOT EXISTS public.network_interfaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'LAN' CHECK (type IN ('WAN', 'LAN', 'DMZ', 'OPT')),
  status TEXT NOT NULL DEFAULT 'up' CHECK (status IN ('up', 'down', 'disabled')),
  ip_address TEXT,
  subnet TEXT,
  gateway TEXT,
  mac TEXT,
  speed TEXT,
  duplex TEXT DEFAULT 'full',
  mtu INT DEFAULT 1500,
  vlan INT,
  rx_bytes BIGINT DEFAULT 0,
  tx_bytes BIGINT DEFAULT 0,
  rx_packets BIGINT DEFAULT 0,
  tx_packets BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── VPN Tunnels ──
CREATE TABLE IF NOT EXISTS public.vpn_tunnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'ipsec' CHECK (type IN ('ipsec', 'openvpn', 'wireguard', 'ssl')),
  status TEXT NOT NULL DEFAULT 'disconnected' CHECK (status IN ('connected', 'disconnected', 'connecting')),
  remote_gateway TEXT,
  local_network TEXT,
  remote_network TEXT,
  bytes_in BIGINT DEFAULT 0,
  bytes_out BIGINT DEFAULT 0,
  uptime BIGINT DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Threat Events ──
CREATE TABLE IF NOT EXISTS public.threat_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
  category TEXT NOT NULL DEFAULT '',
  source_ip TEXT,
  destination_ip TEXT,
  source_port INT,
  destination_port INT,
  protocol TEXT,
  signature TEXT,
  description TEXT,
  action TEXT NOT NULL DEFAULT 'blocked' CHECK (action IN ('blocked', 'allowed', 'monitored')),
  ai_confidence DECIMAL(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── System Settings ──
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL UNIQUE,
  value TEXT NOT NULL DEFAULT '',
  description TEXT,
  is_auditable BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Grant permissions ──
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated, anon;

-- ── Seed default admin user ──
-- Password: admin123 (bcrypt hash)
INSERT INTO public.users (id, email, password_hash, full_name) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@aegis.local', '$2a$10$PwGnMmH1aQBQwAJPqjrFe.xMSMPG/0QVUKxC6O5Jx6XwVy5KjWjW2', 'Super Admin')
ON CONFLICT (email) DO NOTHING;

INSERT INTO public.user_roles (user_id, role) VALUES
  ('00000000-0000-0000-0000-000000000001', 'super_admin')
ON CONFLICT (user_id, role) DO NOTHING;

-- ── Seed mock data ──
INSERT INTO public.network_interfaces (name, type, status, ip_address, subnet, gateway, mac, speed, mtu) VALUES
  ('WAN', 'WAN', 'up', '203.113.152.45', '255.255.255.0', '203.113.152.1', '00:1A:2B:3C:4D:5E', '1 Gbps', 1500),
  ('LAN', 'LAN', 'up', '192.168.1.1', '255.255.255.0', NULL, '00:1A:2B:3C:4D:5F', '1 Gbps', 1500),
  ('DMZ', 'DMZ', 'up', '10.0.0.1', '255.255.255.0', NULL, '00:1A:2B:3C:4D:60', '1 Gbps', 1500),
  ('GUEST', 'OPT', 'up', '172.16.0.1', '255.255.255.0', NULL, '00:1A:2B:3C:4D:61', '100 Mbps', 1500)
ON CONFLICT DO NOTHING;

INSERT INTO public.firewall_rules (rule_order, enabled, action, interface, direction, protocol, source_type, source_value, destination_type, destination_value, description, logging) VALUES
  (1, true, 'block', 'WAN', 'in', 'any', 'any', '*', 'any', '*', 'Block all inbound by default', true),
  (2, true, 'pass', 'WAN', 'in', 'tcp', 'any', '*', 'address', '203.113.152.45', 'Allow HTTPS to Web Server', true),
  (3, true, 'pass', 'LAN', 'out', 'any', 'network', '192.168.1.0/24', 'any', '*', 'Allow LAN to Internet', false),
  (4, true, 'block', 'LAN', 'out', 'tcp', 'network', '192.168.1.0/24', 'any', '*', 'Block SMTP from LAN', true),
  (5, true, 'pass', 'DMZ', 'in', 'tcp', 'network', '10.0.0.0/24', 'address', '192.168.1.10', 'Allow DMZ to DB Server', true)
ON CONFLICT DO NOTHING;

INSERT INTO public.vpn_tunnels (name, type, status, remote_gateway, local_network, remote_network) VALUES
  ('Branch Office HCM', 'ipsec', 'connected', '113.161.72.50', '192.168.1.0/24', '192.168.2.0/24'),
  ('Remote Workers', 'wireguard', 'connected', 'Multiple', '192.168.1.0/24', '10.10.0.0/24'),
  ('Cloud Datacenter', 'openvpn', 'disconnected', '35.198.123.45', '192.168.1.0/24', '172.31.0.0/16')
ON CONFLICT DO NOTHING;

INSERT INTO public.system_settings (key, value, description, is_auditable) VALUES
  ('hostname', 'AEGIS-PRIMARY', 'System hostname', true),
  ('timezone', 'Asia/Ho_Chi_Minh', 'System timezone', true),
  ('dns_primary', '8.8.8.8', 'Primary DNS server', false),
  ('dns_secondary', '8.8.4.4', 'Secondary DNS server', false)
ON CONFLICT (key) DO NOTHING;
