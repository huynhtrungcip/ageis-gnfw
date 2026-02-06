import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // ── 1. System Metrics ──────────────────────────
    // In self-hosted mode the agent pushes real data via POST.
    // This GET path generates simulated metrics for the cloud/demo environment.

    let metricsPayload: Record<string, unknown>;

    if (req.method === "POST") {
      // Agent pushes real metrics
      const body = await req.json();
      metricsPayload = body.metrics ?? {};
    } else {
      // Simulate metrics for demo / cloud
      const baseMetrics = {
        hostname: "AEGIS-PRIMARY",
        uptime: Math.floor(Date.now() / 1000) - 1700000000,
        cpu_usage: Math.floor(Math.random() * 40 + 10),
        cpu_cores: 8,
        cpu_temperature: Math.floor(Math.random() * 20 + 35),
        memory_total: 32768,
        memory_used: Math.floor(Math.random() * 8000 + 8000),
        memory_free: 0,
        memory_cached: Math.floor(Math.random() * 2000 + 3000),
        disk_total: 512000,
        disk_used: Math.floor(Math.random() * 5000 + 125000),
        disk_free: 0,
        load_1m: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
        load_5m: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
        load_15m: parseFloat((Math.random() * 1.5 + 0.5).toFixed(2)),
      };
      baseMetrics.memory_free = baseMetrics.memory_total - baseMetrics.memory_used - baseMetrics.memory_cached;
      baseMetrics.disk_free = baseMetrics.disk_total - baseMetrics.disk_used;
      metricsPayload = baseMetrics;
    }

    const { error: metricsError } = await supabase.from("system_metrics").insert(metricsPayload);
    if (metricsError) console.error("Metrics insert error:", metricsError);

    // ── 2. Traffic Stats ───────────────────────────
    const trafficStats = {
      interface: "WAN",
      inbound: Math.floor(Math.random() * 500 + 200),
      outbound: Math.floor(Math.random() * 300 + 100),
      blocked: Math.floor(Math.random() * 50 + 10),
    };
    const { error: trafficError } = await supabase.from("traffic_stats").insert(trafficStats);
    if (trafficError) console.error("Traffic insert error:", trafficError);

    // ── 3. Update interface rx/tx bytes (simulate bandwidth) ─
    const { data: ifaces } = await supabase.from("network_interfaces").select("id, rx_bytes, tx_bytes, status");
    if (ifaces) {
      for (const iface of ifaces) {
        if (iface.status === 'up') {
          await supabase.from("network_interfaces").update({
            rx_bytes: (iface.rx_bytes ?? 0) + Math.floor(Math.random() * 50000000 + 10000000),
            tx_bytes: (iface.tx_bytes ?? 0) + Math.floor(Math.random() * 30000000 + 5000000),
          }).eq("id", iface.id);
        }
      }
    }

    // ── 4. Update VPN bytes (simulate traffic for connected tunnels) ─
    const { data: vpns } = await supabase.from("vpn_tunnels").select("id, bytes_in, bytes_out, status, uptime");
    if (vpns) {
      for (const vpn of vpns) {
        if (vpn.status === 'connected') {
          await supabase.from("vpn_tunnels").update({
            bytes_in: (vpn.bytes_in ?? 0) + Math.floor(Math.random() * 10000000 + 1000000),
            bytes_out: (vpn.bytes_out ?? 0) + Math.floor(Math.random() * 5000000 + 500000),
            uptime: (vpn.uptime ?? 0) + 30,
          }).eq("id", vpn.id);
        }
      }
    }

    // ── 5. Occasionally generate threat events (10% chance) ─
    if (Math.random() < 0.1) {
      const severities = ['critical', 'high', 'medium', 'low'];
      const categories = ['Intrusion Attempt', 'Malware', 'Port Scan', 'SQL Injection', 'Policy Violation', 'DDoS'];
      const actions = ['blocked', 'alerted'];
      const threat = {
        severity: severities[Math.floor(Math.random() * severities.length)],
        category: categories[Math.floor(Math.random() * categories.length)],
        source_ip: `${Math.floor(Math.random() * 200 + 1)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`,
        destination_ip: `192.168.1.${Math.floor(Math.random() * 254 + 1)}`,
        source_port: Math.floor(Math.random() * 60000 + 1024),
        destination_port: [22, 80, 443, 3306, 8080, 25][Math.floor(Math.random() * 6)],
        protocol: ['TCP', 'UDP'][Math.floor(Math.random() * 2)],
        action: actions[Math.floor(Math.random() * actions.length)],
        ai_confidence: parseFloat((Math.random() * 20 + 80).toFixed(1)),
        description: 'Auto-detected by AEGIS monitoring system',
        signature: `ET-${Math.floor(Math.random() * 99999)}`,
      };
      await supabase.from("threat_events").insert(threat);
    }

    // ── 6. Cleanup old data (keep last 7 days) ─────
    const cutoff = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    await supabase.from("system_metrics").delete().lt("recorded_at", cutoff);
    await supabase.from("traffic_stats").delete().lt("recorded_at", cutoff);

    return new Response(
      JSON.stringify({ success: true, timestamp: new Date().toISOString() }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
