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

    // Simulate system metrics (in self-hosted, this would read real hardware data)
    const baseMetrics = {
      hostname: "AEGIS-PRIMARY",
      uptime: Math.floor(Date.now() / 1000) - 1700000000, // simulated uptime
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

    // Insert system metrics
    const { error: metricsError } = await supabase.from("system_metrics").insert(baseMetrics);
    if (metricsError) console.error("Metrics insert error:", metricsError);

    // Insert traffic stats
    const trafficStats = {
      interface: "WAN",
      inbound: Math.floor(Math.random() * 500 + 200),
      outbound: Math.floor(Math.random() * 300 + 100),
      blocked: Math.floor(Math.random() * 50 + 10),
    };
    const { error: trafficError } = await supabase.from("traffic_stats").insert(trafficStats);
    if (trafficError) console.error("Traffic insert error:", trafficError);

    // Cleanup old data (keep last 7 days)
    const cutoff = new Date(Date.now() - 7 * 24 * 3600000).toISOString();
    await supabase.from("system_metrics").delete().lt("recorded_at", cutoff);
    await supabase.from("traffic_stats").delete().lt("recorded_at", cutoff);

    return new Response(
      JSON.stringify({ success: true, metrics: baseMetrics, traffic: trafficStats }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
