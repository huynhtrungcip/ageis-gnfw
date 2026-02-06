#!/bin/bash
# ============================================================
# Aegis NGFW Agent - Ubuntu System Monitor & Firewall Sync
# ============================================================
# Runs on the Ubuntu host, collects real system metrics and
# pushes them to the PostgREST API. Also pulls firewall rules
# from the DB and applies them to the host.
#
# Usage:
#   ./aegis-agent.sh daemon       # Run as background service
#   ./aegis-agent.sh sync         # One-time rule sync
#   ./aegis-agent.sh metrics      # Collect & push metrics once
#   ./aegis-agent.sh status       # Show agent status
#   ./aegis-agent.sh fetch        # Fetch rules and display
#   ./aegis-agent.sh backup       # Backup current rules
#
# Required: curl jq bc
# Optional: suricata strongswan isc-dhcp-server bind9 nftables
# ============================================================

set -euo pipefail

# ── Configuration ────────────────────────────────────────────
AEGIS_DIR="${AEGIS_DIR:-/opt/aegis}"
ENV_FILE="${AEGIS_DIR}/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  source "$ENV_FILE"
  set +a
fi

# API_URL is the PostgREST endpoint (via nginx proxy or direct)
API_URL="${API_URL:?ERROR: API_URL not set (e.g. http://localhost:8080/api)}"
AGENT_SECRET_KEY="${AGENT_SECRET_KEY:-}"
SYNC_INTERVAL="${SYNC_INTERVAL:-30}"
METRICS_INTERVAL="${METRICS_INTERVAL:-30}"
FIREWALL_BACKEND="${FIREWALL_BACKEND:-nft}"
HOSTNAME_ID="${HOSTNAME_ID:-$(hostname)}"
LOG_FILE="${AEGIS_DIR}/agent.log"
RULES_DIR="${AEGIS_DIR}/rules"
PID_FILE="${AEGIS_DIR}/agent.pid"

# Interface mapping: DB name → Linux device
declare -A IFACE_MAP
IFACE_MAP[WAN]="${IFACE_WAN:-eth0}"
IFACE_MAP[LAN]="${IFACE_LAN:-eth1}"
IFACE_MAP[DMZ]="${IFACE_DMZ:-eth2}"
IFACE_MAP[GUEST]="${IFACE_GUEST:-eth3}"
IFACE_MAP[wan1]="${IFACE_WAN:-eth0}"
IFACE_MAP[wan2]="${IFACE_WAN2:-eth4}"
IFACE_MAP[internal]="${IFACE_LAN:-eth1}"
IFACE_MAP[dmz]="${IFACE_DMZ:-eth2}"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

# ── Logging ──────────────────────────────────────────────────
log() {
  local level="$1"; shift
  local ts=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${ts} [${level}] $*" | tee -a "$LOG_FILE" 2>/dev/null
}
log_info()  { log "INFO " "$*"; }
log_warn()  { log "WARN " "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }
log_ok()    { log " OK  " "${GREEN}$*${NC}"; }

# ── HTTP helpers ─────────────────────────────────────────────
api_get() {
  local path="$1"; shift
  curl -sf -H "Content-Type: application/json" \
    ${AGENT_SECRET_KEY:+-H "x-agent-key: $AGENT_SECRET_KEY"} \
    "$@" "${API_URL}${path}"
}

api_post() {
  local path="$1"; local data="$2"
  curl -sf -X POST \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    ${AGENT_SECRET_KEY:+-H "x-agent-key: $AGENT_SECRET_KEY"} \
    -d "$data" "${API_URL}${path}"
}

api_patch() {
  local path="$1"; local data="$2"; shift 2
  curl -sf -X PATCH \
    -H "Content-Type: application/json" \
    -H "Prefer: return=representation" \
    ${AGENT_SECRET_KEY:+-H "x-agent-key: $AGENT_SECRET_KEY"} \
    -d "$data" "$@" "${API_URL}${path}"
}

# ── Initialization ───────────────────────────────────────────
init() {
  mkdir -p "$RULES_DIR" "${AEGIS_DIR}/backups"

  log_info "════════════════════════════════════════════════"
  log_info "  Aegis NGFW Agent Starting"
  log_info "  Hostname:  $HOSTNAME_ID"
  log_info "  API URL:   $API_URL"
  log_info "  Backend:   $FIREWALL_BACKEND"
  log_info "  Sync:      ${SYNC_INTERVAL}s  Metrics: ${METRICS_INTERVAL}s"
  log_info "════════════════════════════════════════════════"

  for cmd in curl jq bc; do
    if ! command -v "$cmd" &>/dev/null; then
      log_error "Required: $cmd — install with: apt install -y $cmd"
      exit 1
    fi
  done
}

# ════════════════════════════════════════════════════════════
#  SYSTEM METRICS COLLECTION
# ════════════════════════════════════════════════════════════

collect_cpu() {
  # Read /proc/stat twice to calculate real CPU usage
  local cpu1=($(head -1 /proc/stat | awk '{print $2,$3,$4,$5,$6,$7,$8}'))
  sleep 1
  local cpu2=($(head -1 /proc/stat | awk '{print $2,$3,$4,$5,$6,$7,$8}'))

  local idle1=${cpu1[3]}
  local idle2=${cpu2[3]}
  local total1=0 total2=0

  for v in "${cpu1[@]}"; do total1=$((total1 + v)); done
  for v in "${cpu2[@]}"; do total2=$((total2 + v)); done

  local diff_idle=$((idle2 - idle1))
  local diff_total=$((total2 - total1))

  if [[ $diff_total -gt 0 ]]; then
    echo $(( (diff_total - diff_idle) * 100 / diff_total ))
  else
    echo 0
  fi
}

collect_cpu_temp() {
  # Try thermal zone, hwmon, or sensors
  if [[ -f /sys/class/thermal/thermal_zone0/temp ]]; then
    echo $(( $(cat /sys/class/thermal/thermal_zone0/temp) / 1000 ))
  elif command -v sensors &>/dev/null; then
    sensors 2>/dev/null | grep -oP '\+\K[0-9]+(?=\.[0-9]+°C)' | head -1 || echo 0
  else
    echo 0
  fi
}

collect_metrics() {
  log_info "Collecting system metrics..."

  local hostname_val=$(hostname)
  local uptime_secs=$(awk '{print int($1)}' /proc/uptime)
  local cpu_usage=$(collect_cpu)
  local cpu_cores=$(nproc)
  local cpu_temp=$(collect_cpu_temp)

  # Memory (in MB)
  local mem_info=$(free -m | awk '/^Mem:/{print $2,$3,$4,$6}')
  local mem_total=$(echo "$mem_info" | awk '{print $1}')
  local mem_used=$(echo "$mem_info" | awk '{print $2}')
  local mem_free=$(echo "$mem_info" | awk '{print $3}')
  local mem_cached=$(echo "$mem_info" | awk '{print $4}')

  # Disk (in MB)
  local disk_info=$(df -BM / | awk 'NR==2{gsub("M",""); print $2,$3,$4}')
  local disk_total=$(echo "$disk_info" | awk '{print $1}')
  local disk_used=$(echo "$disk_info" | awk '{print $2}')
  local disk_free=$(echo "$disk_info" | awk '{print $3}')

  # Load average
  local load_1m=$(awk '{print $1}' /proc/loadavg)
  local load_5m=$(awk '{print $2}' /proc/loadavg)
  local load_15m=$(awk '{print $3}' /proc/loadavg)

  local payload=$(jq -n \
    --arg hostname "$hostname_val" \
    --argjson uptime "$uptime_secs" \
    --argjson cpu_usage "$cpu_usage" \
    --argjson cpu_cores "$cpu_cores" \
    --argjson cpu_temp "$cpu_temp" \
    --argjson mem_total "$mem_total" \
    --argjson mem_used "$mem_used" \
    --argjson mem_free "$mem_free" \
    --argjson mem_cached "$mem_cached" \
    --argjson disk_total "$disk_total" \
    --argjson disk_used "$disk_used" \
    --argjson disk_free "$disk_free" \
    --arg load_1m "$load_1m" \
    --arg load_5m "$load_5m" \
    --arg load_15m "$load_15m" \
    '{
      hostname: $hostname,
      uptime: $uptime,
      cpu_usage: $cpu_usage,
      cpu_cores: $cpu_cores,
      cpu_temperature: $cpu_temp,
      memory_total: $mem_total,
      memory_used: $mem_used,
      memory_free: $mem_free,
      memory_cached: $mem_cached,
      disk_total: $disk_total,
      disk_used: $disk_used,
      disk_free: $disk_free,
      load_1m: ($load_1m | tonumber),
      load_5m: ($load_5m | tonumber),
      load_15m: ($load_15m | tonumber)
    }')

  if api_post "/system_metrics" "$payload" >/dev/null 2>&1; then
    log_ok "System metrics pushed (CPU: ${cpu_usage}%, Mem: ${mem_used}/${mem_total}MB)"
  else
    log_error "Failed to push system metrics"
  fi
}

# ── Network Interface Stats ──────────────────────────────────
collect_interface_stats() {
  log_info "Collecting interface stats..."

  # Get interfaces from DB
  local db_ifaces
  db_ifaces=$(api_get "/network_interfaces?select=id,name,status" 2>/dev/null) || {
    log_warn "Could not fetch interface list from DB"
    return 0
  }

  echo "$db_ifaces" | jq -c '.[]' 2>/dev/null | while read -r iface_json; do
    local db_name=$(echo "$iface_json" | jq -r '.name')
    local db_id=$(echo "$iface_json" | jq -r '.id')
    local linux_dev="${IFACE_MAP[$db_name]:-}"

    # Auto-detect if not mapped
    if [[ -z "$linux_dev" ]]; then
      linux_dev=$(ip -o link show | awk -F': ' '{print $2}' | grep -v lo | sed -n "${db_name//[^0-9]/}p" 2>/dev/null || echo "")
    fi

    if [[ -z "$linux_dev" ]] || [[ ! -d "/sys/class/net/$linux_dev" ]]; then
      continue
    fi

    local rx_bytes=$(cat "/sys/class/net/$linux_dev/statistics/rx_bytes" 2>/dev/null || echo 0)
    local tx_bytes=$(cat "/sys/class/net/$linux_dev/statistics/tx_bytes" 2>/dev/null || echo 0)
    local rx_packets=$(cat "/sys/class/net/$linux_dev/statistics/rx_packets" 2>/dev/null || echo 0)
    local tx_packets=$(cat "/sys/class/net/$linux_dev/statistics/tx_packets" 2>/dev/null || echo 0)

    # Get link status
    local operstate=$(cat "/sys/class/net/$linux_dev/operstate" 2>/dev/null || echo "unknown")
    local status="up"
    [[ "$operstate" != "up" ]] && status="down"

    # Get speed
    local speed_val=$(cat "/sys/class/net/$linux_dev/speed" 2>/dev/null || echo 0)
    local speed_str="${speed_val} Mbps"
    [[ "$speed_val" -ge 1000 ]] && speed_str="$(echo "scale=0; $speed_val/1000" | bc) Gbps"

    # Get MAC
    local mac=$(cat "/sys/class/net/$linux_dev/address" 2>/dev/null || echo "")

    # Get IP
    local ip_addr=$(ip -4 addr show "$linux_dev" 2>/dev/null | grep -oP 'inet \K[0-9.]+' | head -1 || echo "")

    # Get MTU
    local mtu=$(cat "/sys/class/net/$linux_dev/mtu" 2>/dev/null || echo 1500)

    local patch_data=$(jq -n \
      --arg status "$status" \
      --argjson rx_bytes "$rx_bytes" \
      --argjson tx_bytes "$tx_bytes" \
      --argjson rx_packets "$rx_packets" \
      --argjson tx_packets "$tx_packets" \
      --arg speed "$speed_str" \
      --arg mac "$mac" \
      --arg ip_address "$ip_addr" \
      --argjson mtu "$mtu" \
      '{
        status: $status,
        rx_bytes: $rx_bytes,
        tx_bytes: $tx_bytes,
        rx_packets: $rx_packets,
        tx_packets: $tx_packets,
        speed: $speed,
        mac: $mac,
        ip_address: $ip_address,
        mtu: $mtu
      }')

    if api_patch "/network_interfaces" "$patch_data" "?id=eq.${db_id}" >/dev/null 2>&1; then
      log_ok "Interface $db_name ($linux_dev): rx=${rx_bytes} tx=${tx_bytes} status=${status}"
    fi
  done
}

# ── Traffic Stats ────────────────────────────────────────────
collect_traffic_stats() {
  # Get WAN interface traffic counters
  local wan_dev="${IFACE_MAP[WAN]:-eth0}"

  if [[ ! -d "/sys/class/net/$wan_dev" ]]; then
    log_warn "WAN interface $wan_dev not found"
    return 0
  fi

  local rx_bytes=$(cat "/sys/class/net/$wan_dev/statistics/rx_bytes" 2>/dev/null || echo 0)
  local tx_bytes=$(cat "/sys/class/net/$wan_dev/statistics/tx_bytes" 2>/dev/null || echo 0)

  # Convert to Mbps (approximate, based on interval)
  local inbound=$(echo "scale=0; $rx_bytes / 1048576" | bc)
  local outbound=$(echo "scale=0; $tx_bytes / 1048576" | bc)

  # Count blocked packets from iptables/nftables
  local blocked=0
  if [[ "$FIREWALL_BACKEND" == "nft" ]]; then
    blocked=$(nft list chain inet aegis_filter input 2>/dev/null | grep -c "drop" || echo 0)
  else
    blocked=$(iptables -L -n -v 2>/dev/null | grep -c "DROP\|REJECT" || echo 0)
  fi

  local payload=$(jq -n \
    --arg iface "WAN" \
    --argjson inbound "$inbound" \
    --argjson outbound "$outbound" \
    --argjson blocked "$blocked" \
    '{interface: $iface, inbound: $inbound, outbound: $outbound, blocked: $blocked}')

  api_post "/traffic_stats" "$payload" >/dev/null 2>&1 && \
    log_ok "Traffic stats: in=${inbound}MB out=${outbound}MB blocked=${blocked}" || \
    log_warn "Failed to push traffic stats"
}

# ── VPN Status ───────────────────────────────────────────────
collect_vpn_status() {
  # Check IPsec (strongSwan)
  if command -v ipsec &>/dev/null; then
    log_info "Collecting IPsec VPN status..."
    local vpn_tunnels
    vpn_tunnels=$(api_get "/vpn_tunnels?select=id,name,type&type=eq.ipsec" 2>/dev/null) || return 0

    echo "$vpn_tunnels" | jq -c '.[]' 2>/dev/null | while read -r tunnel; do
      local tunnel_id=$(echo "$tunnel" | jq -r '.id')
      local tunnel_name=$(echo "$tunnel" | jq -r '.name')

      # Check if tunnel is established
      local ipsec_status="disconnected"
      local bytes_in=0 bytes_out=0 uptime_val=0

      if ipsec status "$tunnel_name" 2>/dev/null | grep -q "ESTABLISHED"; then
        ipsec_status="connected"
        bytes_in=$(ipsec status "$tunnel_name" 2>/dev/null | grep -oP '\d+ bytes_i' | grep -oP '\d+' || echo 0)
        bytes_out=$(ipsec status "$tunnel_name" 2>/dev/null | grep -oP '\d+ bytes_o' | grep -oP '\d+' || echo 0)
        uptime_val=$(ipsec status "$tunnel_name" 2>/dev/null | grep -oP '\d+s ago' | grep -oP '\d+' || echo 0)
      fi

      local patch=$(jq -n \
        --arg status "$ipsec_status" \
        --argjson bytes_in "$bytes_in" \
        --argjson bytes_out "$bytes_out" \
        --argjson uptime "$uptime_val" \
        '{status:$status, bytes_in:$bytes_in, bytes_out:$bytes_out, uptime:$uptime}')

      api_patch "/vpn_tunnels" "$patch" "?id=eq.${tunnel_id}" >/dev/null 2>&1
    done
  fi

  # Check WireGuard
  if command -v wg &>/dev/null; then
    log_info "Collecting WireGuard status..."
    local wg_tunnels
    wg_tunnels=$(api_get "/vpn_tunnels?select=id,name,type&type=eq.wireguard" 2>/dev/null) || return 0

    echo "$wg_tunnels" | jq -c '.[]' 2>/dev/null | while read -r tunnel; do
      local tunnel_id=$(echo "$tunnel" | jq -r '.id')
      local tunnel_name=$(echo "$tunnel" | jq -r '.name')

      local wg_iface=$(echo "$tunnel_name" | tr '[:upper:]' '[:lower:]' | tr ' ' '-' | cut -c1-15)

      if wg show "$wg_iface" 2>/dev/null | grep -q "peer"; then
        local rx=$(wg show "$wg_iface" transfer 2>/dev/null | awk '{sum+=$2} END{print int(sum)}' || echo 0)
        local tx=$(wg show "$wg_iface" transfer 2>/dev/null | awk '{sum+=$3} END{print int(sum)}' || echo 0)

        local patch=$(jq -n \
          --arg status "connected" \
          --argjson bytes_in "$rx" \
          --argjson bytes_out "$tx" \
          '{status:$status, bytes_in:$bytes_in, bytes_out:$bytes_out}')

        api_patch "/vpn_tunnels" "$patch" "?id=eq.${tunnel_id}" >/dev/null 2>&1
      fi
    done
  fi
}

# ── DHCP Lease Collection ────────────────────────────────────
collect_dhcp_leases() {
  local lease_file="/var/lib/dhcp/dhcpd.leases"
  [[ ! -f "$lease_file" ]] && return 0

  log_info "Collecting DHCP leases..."

  # Count active leases
  local active_count=$(grep -c "^lease " "$lease_file" 2>/dev/null || echo 0)

  # Update DHCP server active_leases count
  local dhcp_servers
  dhcp_servers=$(api_get "/dhcp_servers?select=id" 2>/dev/null) || return 0

  echo "$dhcp_servers" | jq -c '.[]' 2>/dev/null | while read -r server; do
    local server_id=$(echo "$server" | jq -r '.id')
    api_patch "/dhcp_servers" "{\"active_leases\":$active_count}" "?id=eq.${server_id}" >/dev/null 2>&1
  done
}

# ── Threat Detection (parse syslog/suricata) ─────────────────
collect_threats() {
  # Check Suricata eve.json
  local eve_log="/var/log/suricata/eve.json"
  [[ ! -f "$eve_log" ]] && return 0

  log_info "Collecting threat events from Suricata..."

  # Read last 100 alerts from eve.json
  local last_check_file="${AEGIS_DIR}/.last_threat_check"
  local last_check="1970-01-01T00:00:00"
  [[ -f "$last_check_file" ]] && last_check=$(cat "$last_check_file")

  tail -500 "$eve_log" | jq -c 'select(.event_type == "alert")' 2>/dev/null | while read -r alert; do
    local ts=$(echo "$alert" | jq -r '.timestamp // empty')
    [[ -z "$ts" ]] && continue
    [[ "$ts" < "$last_check" ]] && continue

    local severity_id=$(echo "$alert" | jq -r '.alert.severity // 3')
    local severity="low"
    case "$severity_id" in
      1) severity="critical" ;;
      2) severity="high" ;;
      3) severity="medium" ;;
      *) severity="low" ;;
    esac

    local payload=$(jq -n \
      --arg severity "$severity" \
      --arg category "$(echo "$alert" | jq -r '.alert.category // "Unknown"')" \
      --arg source_ip "$(echo "$alert" | jq -r '.src_ip // ""')" \
      --arg dest_ip "$(echo "$alert" | jq -r '.dest_ip // ""')" \
      --argjson src_port "$(echo "$alert" | jq -r '.src_port // 0')" \
      --argjson dst_port "$(echo "$alert" | jq -r '.dest_port // 0')" \
      --arg protocol "$(echo "$alert" | jq -r '.proto // ""')" \
      --arg signature "$(echo "$alert" | jq -r '.alert.signature // ""')" \
      --arg description "$(echo "$alert" | jq -r '.alert.signature // "Suricata alert"')" \
      --arg action "blocked" \
      '{
        severity:$severity, category:$category,
        source_ip:$source_ip, destination_ip:$dest_ip,
        source_port:$src_port, destination_port:$dst_port,
        protocol:$protocol, signature:$signature,
        description:$description, action:$action
      }')

    api_post "/threat_events" "$payload" >/dev/null 2>&1
  done

  date -u +%Y-%m-%dT%H:%M:%SZ > "$last_check_file"
}

# ════════════════════════════════════════════════════════════
#  FIREWALL RULE SYNC (Pull from DB → Apply to system)
# ════════════════════════════════════════════════════════════

fetch_firewall_rules() {
  api_get "/firewall_rules?select=*&enabled=eq.true&order=rule_order.asc" 2>/dev/null
}

map_iface() {
  local name="$1"
  echo "${IFACE_MAP[$name]:-$name}"
}

apply_firewall_rules() {
  log_info "Fetching firewall rules from DB..."
  local rules
  rules=$(fetch_firewall_rules) || { log_error "Failed to fetch rules"; return 1; }

  local count=$(echo "$rules" | jq length)
  log_info "Received $count firewall rules"

  # Backup
  backup_rules

  if [[ "$FIREWALL_BACKEND" == "nft" ]]; then
    apply_nft_rules "$rules"
  else
    apply_ipt_rules "$rules"
  fi
}

apply_ipt_rules() {
  local rules="$1"
  local script="${RULES_DIR}/firewall-apply.sh"

  cat > "$script" <<'HEADER'
#!/bin/bash
set -e
# Auto-generated by Aegis Agent — DO NOT EDIT
iptables -F
iptables -X
iptables -t nat -F
iptables -t nat -X
iptables -P INPUT DROP
iptables -P FORWARD DROP
iptables -P OUTPUT ACCEPT
iptables -A INPUT -i lo -j ACCEPT
iptables -A OUTPUT -o lo -j ACCEPT
iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
iptables -A FORWARD -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT
sysctl -w net.ipv4.ip_forward=1 >/dev/null
HEADER

  echo "$rules" | jq -c '.[]' | while read -r rule; do
    local action=$(echo "$rule" | jq -r '.action')
    local direction=$(echo "$rule" | jq -r '.direction')
    local interface=$(echo "$rule" | jq -r '.interface')
    local protocol=$(echo "$rule" | jq -r '.protocol')
    local src_val=$(echo "$rule" | jq -r '.source_value')
    local src_type=$(echo "$rule" | jq -r '.source_type')
    local dst_val=$(echo "$rule" | jq -r '.destination_value')
    local dst_type=$(echo "$rule" | jq -r '.destination_type')
    local src_port=$(echo "$rule" | jq -r '.source_port // empty')
    local dst_port=$(echo "$rule" | jq -r '.destination_port // empty')
    local logging=$(echo "$rule" | jq -r '.logging')
    local desc=$(echo "$rule" | jq -r '.description')
    local order=$(echo "$rule" | jq -r '.rule_order')

    local chain="INPUT"
    [[ "$direction" == "out" ]] && chain="OUTPUT"
    [[ "$direction" == "in" && "$interface" != "WAN" ]] && chain="FORWARD"

    local linux_iface=$(map_iface "$interface")
    local cmd="iptables -A $chain"

    if [[ "$direction" == "in" ]]; then
      cmd+=" -i $linux_iface"
    else
      cmd+=" -o $linux_iface"
    fi

    [[ "$protocol" != "any" ]] && cmd+=" -p $protocol"
    [[ "$src_type" != "any" && "$src_val" != "*" ]] && cmd+=" -s $src_val"
    [[ -n "$src_port" ]] && cmd+=" --sport $src_port"
    [[ "$dst_type" != "any" && "$dst_val" != "*" ]] && cmd+=" -d $dst_val"
    [[ -n "$dst_port" ]] && cmd+=" --dport $dst_port"

    echo "# Rule $order: $desc" >> "$script"

    if [[ "$logging" == "true" ]]; then
      echo "${cmd} -j LOG --log-prefix 'AEGIS_${order}: ' --log-level 4" >> "$script"
    fi

    local target="DROP"
    [[ "$action" == "pass" ]] && target="ACCEPT"
    [[ "$action" == "reject" ]] && target="REJECT"

    echo "${cmd} -j ${target}" >> "$script"
    echo "" >> "$script"
  done

  chmod +x "$script"
  if bash "$script" 2>&1 | tee -a "$LOG_FILE"; then
    log_ok "iptables rules applied ($count rules)"
  else
    log_error "Failed to apply iptables rules"
    return 1
  fi
}

apply_nft_rules() {
  local rules="$1"
  local nft_file="${RULES_DIR}/aegis.nft"

  cat > "$nft_file" <<HEADER
#!/usr/sbin/nft -f
# Auto-generated by Aegis Agent — DO NOT EDIT
flush ruleset

table inet aegis_filter {
  chain input {
    type filter hook input priority 0; policy drop;
    iif lo accept
    ct state established,related accept
HEADER

  echo "$rules" | jq -c '.[] | select(.direction == "in")' | while read -r rule; do
    local nft_rule=$(build_nft_rule "$rule")
    echo "    $nft_rule" >> "$nft_file"
  done

  cat >> "$nft_file" <<'MID'
  }

  chain forward {
    type filter hook forward priority 0; policy drop;
    ct state established,related accept
MID

  echo "$rules" | jq -c '.[] | select(.direction != "in" or .interface != "WAN")' | while read -r rule; do
    local nft_rule=$(build_nft_rule "$rule")
    echo "    $nft_rule" >> "$nft_file"
  done

  cat >> "$nft_file" <<'FOOTER'
  }

  chain output {
    type filter hook output priority 0; policy accept;
  }
}
FOOTER

  if nft -f "$nft_file" 2>&1 | tee -a "$LOG_FILE"; then
    log_ok "nftables rules applied"
  else
    log_error "Failed to apply nftables rules"
    return 1
  fi
}

build_nft_rule() {
  local rule_json="$1"
  local r=""

  local interface=$(echo "$rule_json" | jq -r '.interface')
  local direction=$(echo "$rule_json" | jq -r '.direction')
  local protocol=$(echo "$rule_json" | jq -r '.protocol')
  local src_val=$(echo "$rule_json" | jq -r '.source_value')
  local src_type=$(echo "$rule_json" | jq -r '.source_type')
  local dst_val=$(echo "$rule_json" | jq -r '.destination_value')
  local dst_type=$(echo "$rule_json" | jq -r '.destination_type')
  local src_port=$(echo "$rule_json" | jq -r '.source_port // empty')
  local dst_port=$(echo "$rule_json" | jq -r '.destination_port // empty')
  local action=$(echo "$rule_json" | jq -r '.action')
  local logging=$(echo "$rule_json" | jq -r '.logging')
  local desc=$(echo "$rule_json" | jq -r '.description')

  r+="# ${desc}  "

  local linux_iface=$(map_iface "$interface")
  [[ "$direction" == "in" ]] && r+="iifname \"$linux_iface\" " || r+="oifname \"$linux_iface\" "

  [[ "$protocol" != "any" ]] && r+="ip protocol $protocol "
  [[ "$src_type" != "any" && "$src_val" != "*" ]] && r+="ip saddr $src_val "
  [[ -n "$src_port" ]] && r+="$protocol sport $src_port "
  [[ "$dst_type" != "any" && "$dst_val" != "*" ]] && r+="ip daddr $dst_val "
  [[ -n "$dst_port" ]] && r+="$protocol dport $dst_port "
  [[ "$logging" == "true" ]] && r+="log prefix \"AEGIS: \" "

  local nft_action="drop"
  [[ "$action" == "pass" ]] && nft_action="accept"
  [[ "$action" == "reject" ]] && nft_action="reject"
  r+="$nft_action"

  echo "$r"
}

# ── NAT Rules ────────────────────────────────────────────────
apply_nat_rules() {
  log_info "Fetching NAT rules..."
  local rules
  rules=$(api_get "/nat_rules?select=*&enabled=eq.true" 2>/dev/null) || return 0

  local count=$(echo "$rules" | jq length)
  [[ "$count" -eq 0 ]] && { log_info "No NAT rules"; return 0; }

  local script="${RULES_DIR}/nat-apply.sh"
  echo "#!/bin/bash" > "$script"
  echo "# NAT rules — auto-generated" >> "$script"

  echo "$rules" | jq -c '.[]' | while read -r rule; do
    local type=$(echo "$rule" | jq -r '.type')
    local protocol=$(echo "$rule" | jq -r '.protocol' | tr '[:upper:]' '[:lower:]')
    local ext_port=$(echo "$rule" | jq -r '.external_port')
    local int_addr=$(echo "$rule" | jq -r '.internal_address')
    local int_port=$(echo "$rule" | jq -r '.internal_port')
    local interface=$(echo "$rule" | jq -r '.interface')
    local linux_iface=$(map_iface "$interface")

    if [[ "$type" == "port-forward" ]]; then
      [[ "$protocol" == "tcp/udp" ]] && protocol="tcp"
      echo "iptables -t nat -A PREROUTING -i $linux_iface -p $protocol --dport $ext_port -j DNAT --to-destination ${int_addr}:${int_port}" >> "$script"
      echo "iptables -A FORWARD -p $protocol -d $int_addr --dport $int_port -j ACCEPT" >> "$script"
    elif [[ "$type" == "outbound" ]]; then
      echo "iptables -t nat -A POSTROUTING -o $linux_iface -j MASQUERADE" >> "$script"
    fi
  done

  chmod +x "$script"
  bash "$script" 2>&1 | tee -a "$LOG_FILE" && log_ok "NAT rules applied ($count)" || log_error "NAT apply failed"
}

# ── Static Routes ────────────────────────────────────────────
apply_static_routes() {
  log_info "Fetching static routes..."
  local routes
  routes=$(api_get "/static_routes?select=*&status=eq.enabled" 2>/dev/null) || return 0

  echo "$routes" | jq -c '.[]' | while read -r route; do
    local dest=$(echo "$route" | jq -r '.destination')
    local gw=$(echo "$route" | jq -r '.gateway')
    local iface=$(echo "$route" | jq -r '.interface')
    local linux_iface=$(map_iface "$iface")
    local metric=$(echo "$route" | jq -r '.distance')

    # Skip default route (dangerous to override)
    [[ "$dest" == "0.0.0.0/0" ]] && continue

    ip route replace "$dest" via "$gw" dev "$linux_iface" metric "$metric" 2>/dev/null && \
      log_ok "Route: $dest via $gw dev $linux_iface" || \
      log_warn "Failed to add route: $dest"
  done
}

# ── Backup ───────────────────────────────────────────────────
backup_rules() {
  local ts=$(date +%Y%m%d_%H%M%S)
  local backup_dir="${AEGIS_DIR}/backups"

  if [[ "$FIREWALL_BACKEND" == "nft" ]]; then
    nft list ruleset > "${backup_dir}/nft_${ts}.conf" 2>/dev/null || true
  else
    iptables-save > "${backup_dir}/ipt_${ts}.v4" 2>/dev/null || true
  fi
  ip route show > "${backup_dir}/routes_${ts}.txt" 2>/dev/null || true

  # Keep only last 50 backups
  ls -t "${backup_dir}"/* 2>/dev/null | tail -n +51 | xargs rm -f 2>/dev/null || true

  log_info "Rules backed up (${ts})"
}

# ── Cleanup old metrics ──────────────────────────────────────
cleanup_old_data() {
  local cutoff=$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
                 date -u -v-7d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "")
  [[ -z "$cutoff" ]] && return 0

  curl -sf -X DELETE "${API_URL}/system_metrics?recorded_at=lt.${cutoff}" >/dev/null 2>&1 || true
  curl -sf -X DELETE "${API_URL}/traffic_stats?recorded_at=lt.${cutoff}" >/dev/null 2>&1 || true
  log_info "Cleaned up metrics older than 7 days"
}

# ── Report status to audit log ───────────────────────────────
report_status() {
  local status="$1"
  local details="$2"

  local payload=$(jq -n \
    --arg action "AGENT_SYNC" \
    --arg resource_type "system" \
    --arg resource_id "$HOSTNAME_ID" \
    --argjson details "$details" \
    '{action:$action, resource_type:$resource_type, resource_id:$resource_id, details:$details}')

  api_post "/audit_logs" "$payload" >/dev/null 2>&1 || true
}

# ════════════════════════════════════════════════════════════
#  MAIN LOOPS
# ════════════════════════════════════════════════════════════

# Full sync: pull rules from DB and apply to system
do_sync() {
  local errors=0 applied=0

  apply_firewall_rules && ((applied++)) || ((errors++))
  apply_nat_rules && ((applied++)) || ((errors++))
  apply_static_routes && ((applied++)) || ((errors++))

  local status="success"
  [[ $errors -gt 0 ]] && status="partial"

  report_status "$status" "$(jq -n --argjson applied "$applied" --argjson errors "$errors" \
    --arg hostname "$HOSTNAME_ID" --arg backend "$FIREWALL_BACKEND" \
    '{applied:$applied, errors:$errors, hostname:$hostname, backend:$backend}')"

  log_info "Sync complete: applied=$applied errors=$errors"
}

# Metrics push: collect and send system metrics
do_metrics() {
  collect_metrics
  collect_interface_stats
  collect_traffic_stats
  collect_vpn_status
  collect_dhcp_leases
  collect_threats
}

# Daemon: run both sync and metrics on their intervals
run_daemon() {
  init
  echo $$ > "$PID_FILE"
  trap 'log_info "Agent stopping (PID $$)"; rm -f "$PID_FILE"; exit 0' SIGTERM SIGINT

  local last_sync=0
  local last_metrics=0
  local last_cleanup=0
  local cleanup_interval=3600  # 1 hour

  # Initial run
  do_metrics || log_warn "Initial metrics collection failed"
  do_sync || log_warn "Initial sync failed"

  while true; do
    local now=$(date +%s)

    # Metrics collection
    if (( now - last_metrics >= METRICS_INTERVAL )); then
      do_metrics || log_warn "Metrics collection failed"
      last_metrics=$now
    fi

    # Rule sync (check for changes via hash)
    if (( now - last_sync >= SYNC_INTERVAL )); then
      local new_hash=$(fetch_firewall_rules 2>/dev/null | md5sum | cut -d' ' -f1)
      local old_hash=""
      [[ -f "${AEGIS_DIR}/.rules_hash" ]] && old_hash=$(cat "${AEGIS_DIR}/.rules_hash")

      if [[ "$new_hash" != "$old_hash" ]]; then
        log_info "Rule changes detected, syncing..."
        do_sync || log_warn "Sync failed"
        echo "$new_hash" > "${AEGIS_DIR}/.rules_hash"
      fi
      last_sync=$now
    fi

    # Periodic cleanup
    if (( now - last_cleanup >= cleanup_interval )); then
      cleanup_old_data
      last_cleanup=$now
    fi

    sleep 5
  done
}

# ── Status ───────────────────────────────────────────────────
show_status() {
  echo -e "${CYAN}═══ Aegis NGFW Agent Status ═══${NC}"

  if [[ -f "$PID_FILE" ]] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo -e "Service:  ${GREEN}Running${NC} (PID $(cat "$PID_FILE"))"
  else
    echo -e "Service:  ${RED}Stopped${NC}"
  fi

  echo "API URL:  $API_URL"
  echo "Backend:  $FIREWALL_BACKEND"
  echo "Hostname: $HOSTNAME_ID"

  # Test API connection
  if api_get "/" >/dev/null 2>&1; then
    echo -e "API:      ${GREEN}Connected${NC}"
  else
    echo -e "API:      ${RED}Unreachable${NC}"
  fi

  # Show system summary
  echo ""
  echo -e "${CYAN}── System ──${NC}"
  echo "CPU:      $(nproc) cores, $(collect_cpu)% usage"
  echo "Memory:   $(free -h | awk '/^Mem:/{print $3"/"$2}')"
  echo "Disk:     $(df -h / | awk 'NR==2{print $3"/"$2}')"
  echo "Uptime:   $(uptime -p)"

  # Show interface status
  echo ""
  echo -e "${CYAN}── Interfaces ──${NC}"
  for name in WAN LAN DMZ; do
    local dev="${IFACE_MAP[$name]:-}"
    if [[ -n "$dev" ]] && [[ -d "/sys/class/net/$dev" ]]; then
      local state=$(cat "/sys/class/net/$dev/operstate" 2>/dev/null || echo "?")
      local ip=$(ip -4 addr show "$dev" 2>/dev/null | grep -oP 'inet \K[0-9.]+' || echo "N/A")
      printf "  %-6s %-8s %-4s %s\n" "$name" "$dev" "$state" "$ip"
    fi
  done

  # Firewall rules count
  echo ""
  echo -e "${CYAN}── Firewall ──${NC}"
  if [[ "$FIREWALL_BACKEND" == "nft" ]]; then
    echo "Rules:    $(nft list ruleset 2>/dev/null | grep -c 'accept\|drop\|reject' || echo '?')"
  else
    echo "Rules:    $(iptables -L -n 2>/dev/null | grep -c 'ACCEPT\|DROP\|REJECT' || echo '?')"
  fi
}

# ════════════════════════════════════════════════════════════
#  CLI ENTRY POINT
# ════════════════════════════════════════════════════════════
case "${1:-daemon}" in
  daemon)
    run_daemon
    ;;
  sync)
    init
    do_sync
    ;;
  metrics)
    init
    do_metrics
    ;;
  status)
    show_status
    ;;
  fetch)
    init
    fetch_firewall_rules | jq .
    ;;
  backup)
    init
    backup_rules
    ;;
  *)
    echo "Usage: $0 {daemon|sync|metrics|status|fetch|backup}"
    echo ""
    echo "  daemon   Run as background service (default)"
    echo "  sync     Pull rules from DB and apply to system"
    echo "  metrics  Collect system metrics and push to DB"
    echo "  status   Show agent and system status"
    echo "  fetch    Fetch firewall rules and display JSON"
    echo "  backup   Backup current iptables/nftables rules"
    exit 1
    ;;
esac
