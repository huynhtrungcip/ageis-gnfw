import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-agent-key, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * firewall-sync Edge Function
 * 
 * GET  /firewall-sync              → Returns all rules as iptables/nftables commands
 * GET  /firewall-sync?format=nft   → Returns nftables format
 * GET  /firewall-sync?format=ipt   → Returns iptables format (default)
 * GET  /firewall-sync?section=all  → Returns all sections (firewall, nat, routes, dhcp, dns, shaping)
 * POST /firewall-sync              → Agent reports apply status
 * 
 * Auth: Agent uses x-agent-key header with a pre-shared secret
 */

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Agent authentication via pre-shared key
    const agentKey = req.headers.get("x-agent-key");
    const expectedKey = Deno.env.get("AGENT_SECRET_KEY");

    if (!expectedKey) {
      console.error("AGENT_SECRET_KEY not configured");
      return new Response(
        JSON.stringify({ error: "Server misconfiguration" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
      );
    }

    if (!agentKey || agentKey !== expectedKey) {
      console.warn("Unauthorized agent request");
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 401 }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const format = url.searchParams.get("format") || "ipt"; // ipt or nft
    const section = url.searchParams.get("section") || "all";

    if (req.method === "GET") {
      console.log(`Sync request: format=${format}, section=${section}`);
      
      const result: Record<string, unknown> = { 
        timestamp: new Date().toISOString(),
        format,
      };

      // ===== FIREWALL RULES =====
      if (section === "all" || section === "firewall") {
        const { data: rules, error } = await supabase
          .from("firewall_rules")
          .select("*")
          .order("rule_order", { ascending: true });

        if (error) {
          console.error("Error fetching firewall rules:", error);
          throw error;
        }

        result.firewall = {
          rules: rules || [],
          commands: format === "nft" 
            ? generateNftFirewall(rules || [])
            : generateIptFirewall(rules || []),
        };
      }

      // ===== NAT RULES =====
      if (section === "all" || section === "nat") {
        const { data: natRules, error } = await supabase
          .from("nat_rules")
          .select("*")
          .eq("enabled", true);

        if (error) {
          console.error("Error fetching NAT rules:", error);
          throw error;
        }

        result.nat = {
          rules: natRules || [],
          commands: format === "nft"
            ? generateNftNat(natRules || [])
            : generateIptNat(natRules || []),
        };
      }

      // ===== STATIC ROUTES =====
      if (section === "all" || section === "routes") {
        const { data: routes, error } = await supabase
          .from("static_routes")
          .select("*")
          .eq("status", "active");

        if (error) {
          console.error("Error fetching static routes:", error);
          throw error;
        }

        const { data: policyRoutes, error: prError } = await supabase
          .from("policy_routes")
          .select("*")
          .eq("status", "enabled");

        if (prError) {
          console.error("Error fetching policy routes:", prError);
          throw prError;
        }

        result.routes = {
          static_routes: routes || [],
          policy_routes: policyRoutes || [],
          commands: generateRouteCommands(routes || [], policyRoutes || []),
        };
      }

      // ===== TRAFFIC SHAPING =====
      if (section === "all" || section === "shaping") {
        const { data: shapers, error } = await supabase
          .from("traffic_shapers")
          .select("*")
          .eq("enabled", true);

        if (error) {
          console.error("Error fetching traffic shapers:", error);
          throw error;
        }

        result.shaping = {
          shapers: shapers || [],
          commands: generateTcCommands(shapers || []),
        };
      }

      // ===== INTERFACES =====
      if (section === "all" || section === "interfaces") {
        const { data: interfaces, error } = await supabase
          .from("network_interfaces")
          .select("*");

        if (error) {
          console.error("Error fetching interfaces:", error);
          throw error;
        }

        result.interfaces = {
          list: interfaces || [],
          commands: generateInterfaceCommands(interfaces || []),
        };
      }

      // ===== IDS/IPS (Suricata) =====
      if (section === "all" || section === "ids") {
        const { data: signatures, error } = await supabase
          .from("ids_signatures")
          .select("*")
          .eq("enabled", true);

        if (error) {
          console.error("Error fetching IDS signatures:", error);
          throw error;
        }

        result.ids = {
          signatures: signatures || [],
          config: generateSuricataConfig(signatures || []),
        };
      }

      console.log(`Sync response: ${Object.keys(result).length} sections`);
      return new Response(
        JSON.stringify(result),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    // POST - Agent reports status
    if (req.method === "POST") {
      const body = await req.json();
      console.log("Agent status report:", JSON.stringify(body));

      // Log the apply result as an audit event
      const { error } = await supabase.from("audit_logs").insert({
        action: "AGENT_SYNC",
        resource_type: "system",
        resource_id: body.hostname || "unknown",
        details: {
          status: body.status,
          applied_rules: body.applied_rules,
          errors: body.errors,
          timestamp: body.timestamp,
          hostname: body.hostname,
          sections: body.sections,
        },
      });

      if (error) {
        console.error("Error logging agent status:", error);
      }

      return new Response(
        JSON.stringify({ success: true, message: "Status received" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
      );
    }

    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 405 }
    );
  } catch (error) {
    console.error("Firewall sync error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});

// ==========================================
// iptables command generators
// ==========================================

interface FirewallRule {
  id: string;
  rule_order: number;
  enabled: boolean;
  action: string;
  interface: string;
  direction: string;
  protocol: string;
  source_type: string;
  source_value: string;
  source_port: string | null;
  destination_type: string;
  destination_value: string;
  destination_port: string | null;
  logging: boolean;
  description: string;
}

function mapInterface(iface: string): string {
  // Map logical interface names to Linux interface names
  const map: Record<string, string> = {
    "WAN": "eth0",
    "LAN": "eth1", 
    "DMZ": "eth2",
    "GUEST": "eth3",
    "wan1": "eth0",
    "wan2": "eth4",
    "internal": "eth1",
    "dmz": "eth2",
  };
  return map[iface] || iface;
}

function generateIptFirewall(rules: FirewallRule[]): string[] {
  const commands: string[] = [
    "# === Aegis NGFW - iptables Firewall Rules ===",
    "# Auto-generated - DO NOT EDIT MANUALLY",
    `# Generated at: ${new Date().toISOString()}`,
    "",
    "# Flush existing rules",
    "iptables -F",
    "iptables -X",
    "iptables -t nat -F",
    "iptables -t nat -X",
    "iptables -t mangle -F",
    "iptables -t mangle -X",
    "",
    "# Default policies",
    "iptables -P INPUT DROP",
    "iptables -P FORWARD DROP",
    "iptables -P OUTPUT ACCEPT",
    "",
    "# Allow loopback",
    "iptables -A INPUT -i lo -j ACCEPT",
    "iptables -A OUTPUT -o lo -j ACCEPT",
    "",
    "# Allow established/related connections",
    "iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT",
    "iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT",
    "",
    "# Enable IP forwarding",
    "sysctl -w net.ipv4.ip_forward=1",
    "",
  ];

  for (const rule of rules) {
    if (!rule.enabled) continue;

    const comment = `# Rule ${rule.rule_order}: ${rule.description}`;
    commands.push(comment);

    const chain = rule.direction === "in" ? "INPUT" : 
                  rule.direction === "out" ? "OUTPUT" : "FORWARD";
    
    // For forwarding rules between interfaces
    const isForward = rule.direction === "in" && rule.interface !== "WAN";
    const actualChain = isForward ? "FORWARD" : chain;

    let cmd = `iptables -A ${actualChain}`;

    // Interface
    const linuxIface = mapInterface(rule.interface);
    if (rule.direction === "in") {
      cmd += ` -i ${linuxIface}`;
    } else {
      cmd += ` -o ${linuxIface}`;
    }

    // Protocol
    if (rule.protocol !== "any") {
      cmd += ` -p ${rule.protocol}`;
    }

    // Source
    if (rule.source_type !== "any" && rule.source_value !== "*") {
      cmd += ` -s ${rule.source_value}`;
    }
    if (rule.source_port) {
      cmd += ` --sport ${rule.source_port}`;
    }

    // Destination
    if (rule.destination_type !== "any" && rule.destination_value !== "*") {
      cmd += ` -d ${rule.destination_value}`;
    }
    if (rule.destination_port) {
      cmd += ` --dport ${rule.destination_port}`;
    }

    // Logging
    if (rule.logging) {
      const logCmd = cmd + ` -j LOG --log-prefix "AEGIS_${rule.action.toUpperCase()}_${rule.rule_order}: " --log-level 4`;
      commands.push(logCmd);
    }

    // Action
    const action = rule.action === "pass" ? "ACCEPT" : 
                   rule.action === "reject" ? "REJECT" : "DROP";
    cmd += ` -j ${action}`;
    
    commands.push(cmd);
    commands.push("");
  }

  return commands;
}

function generateNftFirewall(rules: FirewallRule[]): string[] {
  const commands: string[] = [
    "#!/usr/sbin/nft -f",
    "# === Aegis NGFW - nftables Firewall Rules ===",
    "# Auto-generated - DO NOT EDIT MANUALLY",
    `# Generated at: ${new Date().toISOString()}`,
    "",
    "# Flush existing ruleset",
    "flush ruleset",
    "",
    "table inet aegis_filter {",
    "  chain input {",
    "    type filter hook input priority 0; policy drop;",
    "",
    "    # Allow loopback",
    "    iif lo accept",
    "",
    "    # Allow established/related",
    "    ct state established,related accept",
    "",
  ];

  // Input rules
  for (const rule of rules) {
    if (!rule.enabled || rule.direction !== "in") continue;
    commands.push(`    # Rule ${rule.rule_order}: ${rule.description}`);
    commands.push(`    ${buildNftRule(rule)}`);
    commands.push("");
  }

  commands.push("  }");
  commands.push("");
  commands.push("  chain forward {");
  commands.push("    type filter hook forward priority 0; policy drop;");
  commands.push("");
  commands.push("    # Allow established/related");
  commands.push("    ct state established,related accept");
  commands.push("");

  // Forward rules (LAN to WAN, etc.)
  for (const rule of rules) {
    if (!rule.enabled) continue;
    if (rule.interface === "WAN" && rule.direction === "in") continue; // already in input
    if (rule.direction === "out" && rule.interface === "WAN") continue; // output chain
    
    commands.push(`    # Rule ${rule.rule_order}: ${rule.description}`);
    commands.push(`    ${buildNftRule(rule)}`);
    commands.push("");
  }

  commands.push("  }");
  commands.push("");
  commands.push("  chain output {");
  commands.push("    type filter hook output priority 0; policy accept;");
  commands.push("  }");
  commands.push("}");

  return commands;
}

function buildNftRule(rule: FirewallRule): string {
  let r = "";
  
  const linuxIface = mapInterface(rule.interface);
  if (rule.direction === "in") {
    r += `iifname "${linuxIface}" `;
  } else {
    r += `oifname "${linuxIface}" `;
  }

  if (rule.protocol !== "any") {
    r += `ip protocol ${rule.protocol} `;
  }

  if (rule.source_type !== "any" && rule.source_value !== "*") {
    r += `ip saddr ${rule.source_value} `;
  }
  if (rule.source_port) {
    r += `${rule.protocol} sport ${rule.source_port} `;
  }

  if (rule.destination_type !== "any" && rule.destination_value !== "*") {
    r += `ip daddr ${rule.destination_value} `;
  }
  if (rule.destination_port) {
    r += `${rule.protocol} dport ${rule.destination_port} `;
  }

  if (rule.logging) {
    r += `log prefix "AEGIS_${rule.rule_order}: " `;
  }

  const action = rule.action === "pass" ? "accept" : 
                 rule.action === "reject" ? "reject" : "drop";
  r += action;

  return r;
}

// ==========================================
// NAT command generators
// ==========================================

interface NatRule {
  id: string;
  type: string;
  enabled: boolean;
  interface: string;
  protocol: string;
  external_address: string | null;
  external_port: string;
  internal_address: string;
  internal_port: string;
  description: string;
}

function generateIptNat(rules: NatRule[]): string[] {
  const commands: string[] = [
    "# === NAT Rules ===",
    "",
  ];

  for (const rule of rules) {
    if (!rule.enabled) continue;
    
    commands.push(`# ${rule.description}`);
    const linuxIface = mapInterface(rule.interface);

    if (rule.type === "port-forward") {
      // DNAT for port forwarding
      let proto = rule.protocol.toLowerCase();
      if (proto === "tcp/udp") {
        // Create rules for both TCP and UDP
        for (const p of ["tcp", "udp"]) {
          commands.push(
            `iptables -t nat -A PREROUTING -i ${linuxIface} -p ${p} --dport ${rule.external_port} -j DNAT --to-destination ${rule.internal_address}:${rule.internal_port}`
          );
          commands.push(
            `iptables -A FORWARD -i ${linuxIface} -p ${p} -d ${rule.internal_address} --dport ${rule.internal_port} -j ACCEPT`
          );
        }
      } else {
        commands.push(
          `iptables -t nat -A PREROUTING -i ${linuxIface} -p ${proto} --dport ${rule.external_port} -j DNAT --to-destination ${rule.internal_address}:${rule.internal_port}`
        );
        commands.push(
          `iptables -A FORWARD -i ${linuxIface} -p ${proto} -d ${rule.internal_address} --dport ${rule.internal_port} -j ACCEPT`
        );
      }
    } else if (rule.type === "outbound") {
      // MASQUERADE for outbound NAT
      commands.push(
        `iptables -t nat -A POSTROUTING -o ${linuxIface} -s ${rule.internal_address} -j MASQUERADE`
      );
    }
    commands.push("");
  }

  return commands;
}

function generateNftNat(rules: NatRule[]): string[] {
  const commands: string[] = [
    "# === NAT Rules (nftables) ===",
    "",
    "table ip aegis_nat {",
    "  chain prerouting {",
    "    type nat hook prerouting priority -100; policy accept;",
    "",
  ];

  for (const rule of rules) {
    if (!rule.enabled || rule.type !== "port-forward") continue;
    const linuxIface = mapInterface(rule.interface);
    const proto = rule.protocol.toLowerCase();
    
    commands.push(`    # ${rule.description}`);
    if (proto === "tcp/udp") {
      for (const p of ["tcp", "udp"]) {
        commands.push(`    iifname "${linuxIface}" ${p} dport ${rule.external_port} dnat to ${rule.internal_address}:${rule.internal_port}`);
      }
    } else {
      commands.push(`    iifname "${linuxIface}" ${proto} dport ${rule.external_port} dnat to ${rule.internal_address}:${rule.internal_port}`);
    }
  }

  commands.push("  }");
  commands.push("");
  commands.push("  chain postrouting {");
  commands.push("    type nat hook postrouting priority 100; policy accept;");
  commands.push("");

  for (const rule of rules) {
    if (!rule.enabled || rule.type !== "outbound") continue;
    const linuxIface = mapInterface(rule.interface);
    commands.push(`    # ${rule.description}`);
    commands.push(`    oifname "${linuxIface}" ip saddr ${rule.internal_address} masquerade`);
  }

  commands.push("  }");
  commands.push("}");

  return commands;
}

// ==========================================
// Route command generators
// ==========================================

function generateRouteCommands(staticRoutes: any[], policyRoutes: any[]): string[] {
  const commands: string[] = [
    "# === Routing Configuration ===",
    "",
    "# Static Routes",
  ];

  for (const route of staticRoutes) {
    const linuxIface = mapInterface(route.interface);
    commands.push(`# ${route.comment || route.destination}`);
    commands.push(
      `ip route add ${route.destination} via ${route.gateway} dev ${linuxIface} metric ${route.distance}`
    );
  }

  commands.push("");
  commands.push("# Policy Routes (ip rule)");

  for (const pr of policyRoutes) {
    const linuxIface = mapInterface(pr.incoming);
    commands.push(`# Seq ${pr.seq}: ${pr.comment || ''}`);
    
    // Create routing table for policy route
    const tableId = 100 + pr.seq;
    commands.push(`ip route add default via ${pr.gateway} dev ${mapInterface(pr.out_interface)} table ${tableId}`);
    
    if (pr.source !== "0.0.0.0/0") {
      commands.push(`ip rule add from ${pr.source} table ${tableId} priority ${pr.seq}`);
    }
    if (pr.destination !== "0.0.0.0/0") {
      commands.push(`ip rule add to ${pr.destination} table ${tableId} priority ${pr.seq}`);
    }
  }

  return commands;
}

// ==========================================
// Traffic Control (tc) command generators
// ==========================================

function generateTcCommands(shapers: any[]): string[] {
  const commands: string[] = [
    "# === Traffic Shaping (tc) ===",
    "",
    "# Clear existing qdiscs",
    "tc qdisc del dev eth0 root 2>/dev/null || true",
    "tc qdisc del dev eth1 root 2>/dev/null || true",
    "",
    "# Root HTB qdisc on WAN interface",
    "tc qdisc add dev eth0 root handle 1: htb default 99",
    `tc class add dev eth0 parent 1: classid 1:1 htb rate 1000mbit ceil 1000mbit`,
    "",
  ];

  let classId = 10;
  for (const shaper of shapers) {
    commands.push(`# Shaper: ${shaper.name} (${shaper.priority})`);
    
    const guaranteed = shaper.guaranteed_bandwidth;
    const maximum = shaper.maximum_bandwidth;
    const burst = shaper.burst_bandwidth;
    
    commands.push(
      `tc class add dev eth0 parent 1:1 classid 1:${classId} htb rate ${guaranteed}kbit ceil ${maximum}kbit burst ${burst}k`
    );
    
    // Priority mapping
    const prioMap: Record<string, number> = { "high": 1, "medium": 4, "low": 7 };
    const prio = prioMap[shaper.priority] || 4;
    commands.push(
      `tc qdisc add dev eth0 parent 1:${classId} handle ${classId}: sfq perturb 10`
    );
    commands.push("");
    
    classId += 10;
  }

  // Default class for unmatched traffic
  commands.push("# Default class");
  commands.push("tc class add dev eth0 parent 1:1 classid 1:99 htb rate 100kbit ceil 1000mbit");
  commands.push("tc qdisc add dev eth0 parent 1:99 handle 99: sfq perturb 10");

  return commands;
}

// ==========================================
// Interface configuration
// ==========================================

function generateInterfaceCommands(interfaces: any[]): string[] {
  const commands: string[] = [
    "# === Interface Configuration ===",
    "",
  ];

  for (const iface of interfaces) {
    const linuxName = mapInterface(iface.name);
    commands.push(`# ${iface.name} (${iface.type})`);
    
    if (iface.ip_address && iface.subnet) {
      // Convert subnet mask to CIDR
      const cidr = subnetToCidr(iface.subnet);
      commands.push(`ip addr flush dev ${linuxName}`);
      commands.push(`ip addr add ${iface.ip_address}/${cidr} dev ${linuxName}`);
    }
    
    if (iface.mtu) {
      commands.push(`ip link set dev ${linuxName} mtu ${iface.mtu}`);
    }
    
    commands.push(`ip link set dev ${linuxName} ${iface.status === 'up' ? 'up' : 'down'}`);
    
    if (iface.vlan) {
      commands.push(`ip link add link ${linuxName} name ${linuxName}.${iface.vlan} type vlan id ${iface.vlan}`);
      commands.push(`ip link set ${linuxName}.${iface.vlan} up`);
    }
    
    if (iface.gateway) {
      commands.push(`ip route add default via ${iface.gateway} dev ${linuxName}`);
    }
    
    commands.push("");
  }

  return commands;
}

function subnetToCidr(subnet: string): number {
  const parts = subnet.split(".").map(Number);
  let cidr = 0;
  for (const part of parts) {
    cidr += (part >>> 0).toString(2).split("").filter(b => b === "1").length;
  }
  return cidr;
}

// ==========================================
// Suricata IDS/IPS configuration
// ==========================================

function generateSuricataConfig(signatures: any[]): Record<string, unknown> {
  const enabledSids = signatures.map(s => s.sid);
  const alertSids = signatures.filter(s => s.action === "alert").map(s => s.sid);
  const dropSids = signatures.filter(s => s.action === "drop").map(s => s.sid);

  return {
    enabled_rules: enabledSids,
    alert_rules: alertSids,
    drop_rules: dropSids,
    suricata_yaml_snippet: {
      "default-rule-path": "/etc/suricata/rules",
      "rule-files": ["aegis-custom.rules"],
      "action-order": ["pass", "drop", "reject", "alert"],
    },
    local_rules: signatures.map(s => 
      `${s.action} ${s.category === 'web-application' ? 'http' : 'ip'} any any -> any any (msg:"${s.name}"; sid:${s.sid}; rev:1; classtype:${s.category};)`
    ),
  };
}
