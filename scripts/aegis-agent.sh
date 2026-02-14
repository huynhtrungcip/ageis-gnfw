#!/bin/bash
# ============================================================
# Aegis NGFW Agent - Ubuntu System Monitor & Firewall Sync
# Version: 2.0.0 — Full Self-Hosted (No Cloud Dependencies)
# ============================================================
# Runs on the Ubuntu host, collects real system metrics and
# pushes them to the local PostgREST API. Also pulls firewall,
# NAT, routing, traffic shaping, interface, DHCP, and DNS
# configuration from the DB and applies them to the host.
#
# Usage:
#   ./aegis-agent.sh daemon       # Run as background service
#   ./aegis-agent.sh sync         # One-time full rule sync
#   ./aegis-agent.sh metrics      # Collect & push metrics once
#   ./aegis-agent.sh status       # Show agent status
#   ./aegis-agent.sh fetch        # Fetch rules and display
#   ./aegis-agent.sh backup       # Backup current rules
#   ./aegis-agent.sh apply-fw     # Apply firewall rules only
#   ./aegis-agent.sh apply-nat    # Apply NAT rules only
#   ./aegis-agent.sh apply-routes # Apply routes only
#   ./aegis-agent.sh apply-tc     # Apply traffic shaping only
#   ./aegis-agent.sh apply-iface  # Apply interface config only
#   ./aegis-agent.sh apply-dhcp   # Apply DHCP config only
#   ./aegis-agent.sh apply-dns    # Apply DNS config only
#   ./aegis-agent.sh test         # Dry-run (generate but don't apply)
#
# Required: curl jq bc iproute2 nftables|iptables
# Optional: suricata strongswan wireguard-tools dnsmasq bind9
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
DRY_RUN="${DRY_RUN:-false}"

# DHCP/DNS backends
DHCP_BACKEND="${DHCP_BACKEND:-dnsmasq}"   # dnsmasq or isc-dhcp
DNS_BACKEND="${DNS_BACKEND:-dnsmasq}"      # dnsmasq or bind9
DNSMASQ_CONF_DIR="${DNSMASQ_CONF_DIR:-/etc/dnsmasq.d}"
DNSMASQ_MAIN_CONF="${DNSMASQ_MAIN_CONF:-/etc/dnsmasq.conf}"

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

# ── HTTP helpers (PostgREST local API) ───────────────────────
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

# ── Execute or dry-run ───────────────────────────────────────
exec_cmd() {
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY-RUN] $*"
  else
    eval "$@"
  fi
}

exec_script() {
  local script_path="$1"
  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY-RUN] Would execute: $script_path"
    echo "--- Script content ---"
    cat "$script_path"
    echo "--- End ---"
  else
    bash "$script_path" 2>&1 | tee -a "$LOG_FILE"
  fi
}

# ── Initialization ───────────────────────────────────────────
init() {
  mkdir -p "$RULES_DIR" "${AEGIS_DIR}/backups"

  log_info "════════════════════════════════════════════════"
  log_info "  Aegis NGFW Agent v2.0 Starting"
  log_info "  Hostname:  $HOSTNAME_ID"
  log_info "  API URL:   $API_URL"
  log_info "  Backend:   $FIREWALL_BACKEND"
  log_info "  Sync:      ${SYNC_INTERVAL}s  Metrics: ${METRICS_INTERVAL}s"
  log_info "  Dry Run:   $DRY_RUN"
  log_info "════════════════════════════════════════════════"

  for cmd in curl jq bc; do
    if ! command -v "$cmd" &>/dev/null; then
      log_error "Required: $cmd — install with: apt install -y $cmd"
      exit 1
    fi
  done

  # Test API connectivity
  if api_get "/" >/dev/null 2>&1; then
    log_ok "API connection verified: $API_URL"
  else
    log_error "Cannot connect to API at $API_URL"
    log_error "Make sure PostgREST is running (docker compose up -d)"
    exit 1
  fi
}

# ════════════════════════════════════════════════════════════
#  SYSTEM METRICS COLLECTION
# ════════════════════════════════════════════════════════════

collect_cpu() {
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

  local mem_info=$(free -m | awk '/^Mem:/{print $2,$3,$4,$6}')
  local mem_total=$(echo "$mem_info" | awk '{print $1}')
  local mem_used=$(echo "$mem_info" | awk '{print $2}')
  local mem_free=$(echo "$mem_info" | awk '{print $3}')
  local mem_cached=$(echo "$mem_info" | awk '{print $4}')

  local disk_info=$(df -BM / | awk 'NR==2{gsub("M",""); print $2,$3,$4}')
  local disk_total=$(echo "$disk_info" | awk '{print $1}')
  local disk_used=$(echo "$disk_info" | awk '{print $2}')
  local disk_free=$(echo "$disk_info" | awk '{print $3}')

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

  local db_ifaces
  db_ifaces=$(api_get "/network_interfaces?select=id,name,status" 2>/dev/null) || {
    log_warn "Could not fetch interface list from DB"
    return 0
  }

  echo "$db_ifaces" | jq -c '.[]' 2>/dev/null | while read -r iface_json; do
    local db_name=$(echo "$iface_json" | jq -r '.name')
    local db_id=$(echo "$iface_json" | jq -r '.id')
    local linux_dev="${IFACE_MAP[$db_name]:-}"

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

    local operstate=$(cat "/sys/class/net/$linux_dev/operstate" 2>/dev/null || echo "unknown")
    local status="up"
    [[ "$operstate" != "up" ]] && status="down"

    local speed_val=$(cat "/sys/class/net/$linux_dev/speed" 2>/dev/null || echo 0)
    local speed_str="${speed_val} Mbps"
    [[ "$speed_val" -ge 1000 ]] && speed_str="$(echo "scale=0; $speed_val/1000" | bc) Gbps"

    local mac=$(cat "/sys/class/net/$linux_dev/address" 2>/dev/null || echo "")
    local ip_addr=$(ip -4 addr show "$linux_dev" 2>/dev/null | grep -oP 'inet \K[0-9.]+' | head -1 || echo "")
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
  local wan_dev="${IFACE_MAP[WAN]:-eth0}"

  if [[ ! -d "/sys/class/net/$wan_dev" ]]; then
    log_warn "WAN interface $wan_dev not found"
    return 0
  fi

  local rx_bytes=$(cat "/sys/class/net/$wan_dev/statistics/rx_bytes" 2>/dev/null || echo 0)
  local tx_bytes=$(cat "/sys/class/net/$wan_dev/statistics/tx_bytes" 2>/dev/null || echo 0)

  local inbound=$(echo "scale=0; $rx_bytes / 1048576" | bc)
  local outbound=$(echo "scale=0; $tx_bytes / 1048576" | bc)

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
  # Try dnsmasq lease file first, then isc-dhcp
  local lease_file="/var/lib/misc/dnsmasq.leases"
  [[ ! -f "$lease_file" ]] && lease_file="/var/lib/dhcp/dhcpd.leases"
  [[ ! -f "$lease_file" ]] && return 0

  log_info "Collecting DHCP leases..."

  local active_count=0
  if [[ "$lease_file" == *"dnsmasq"* ]]; then
    active_count=$(wc -l < "$lease_file" 2>/dev/null || echo 0)
  else
    active_count=$(grep -c "^lease " "$lease_file" 2>/dev/null || echo 0)
  fi

  local dhcp_servers
  dhcp_servers=$(api_get "/dhcp_servers?select=id" 2>/dev/null) || return 0

  echo "$dhcp_servers" | jq -c '.[]' 2>/dev/null | while read -r server; do
    local server_id=$(echo "$server" | jq -r '.id')
    api_patch "/dhcp_servers" "{\"active_leases\":$active_count}" "?id=eq.${server_id}" >/dev/null 2>&1
  done
}

# ── Threat Detection (parse syslog/suricata) ─────────────────
collect_threats() {
  local eve_log="/var/log/suricata/eve.json"
  [[ ! -f "$eve_log" ]] && return 0

  log_info "Collecting threat events from Suricata..."

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
iptables -t mangle -F
iptables -t mangle -X
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
  if exec_script "$script"; then
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
# Auto-generated by Aegis Agent v2.0 — DO NOT EDIT
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
flush ruleset

table inet aegis_filter {
  chain input {
    type filter hook input priority 0; policy drop;
    iif lo accept
    ct state established,related accept
    # Allow ICMP (ping)
    ip protocol icmp accept
    ip6 nexthdr icmpv6 accept
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

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY-RUN] nft -c -f $nft_file"
    nft -c -f "$nft_file" 2>&1 && log_ok "nftables syntax check passed" || log_error "nftables syntax error"
  else
    if nft -f "$nft_file" 2>&1 | tee -a "$LOG_FILE"; then
      log_ok "nftables rules applied"
    else
      log_error "Failed to apply nftables rules"
      return 1
    fi
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

# ════════════════════════════════════════════════════════════
#  NAT RULES
# ════════════════════════════════════════════════════════════

apply_nat_rules() {
  log_info "Fetching NAT rules..."
  local rules
  rules=$(api_get "/nat_rules?select=*&enabled=eq.true" 2>/dev/null) || return 0

  local count=$(echo "$rules" | jq length)
  [[ "$count" -eq 0 ]] && { log_info "No NAT rules"; return 0; }

  if [[ "$FIREWALL_BACKEND" == "nft" ]]; then
    apply_nft_nat "$rules" "$count"
  else
    apply_ipt_nat "$rules" "$count"
  fi
}

apply_ipt_nat() {
  local rules="$1"
  local count="$2"
  local script="${RULES_DIR}/nat-apply.sh"

  cat > "$script" <<'HEADER'
#!/bin/bash
set -e
# NAT rules — auto-generated by Aegis Agent
# Enable IP forwarding
sysctl -w net.ipv4.ip_forward=1 >/dev/null
HEADER

  echo "$rules" | jq -c '.[]' | while read -r rule; do
    local type=$(echo "$rule" | jq -r '.type')
    local protocol=$(echo "$rule" | jq -r '.protocol' | tr '[:upper:]' '[:lower:]')
    local ext_port=$(echo "$rule" | jq -r '.external_port')
    local int_addr=$(echo "$rule" | jq -r '.internal_address')
    local int_port=$(echo "$rule" | jq -r '.internal_port')
    local interface=$(echo "$rule" | jq -r '.interface')
    local desc=$(echo "$rule" | jq -r '.description')
    local linux_iface=$(map_iface "$interface")

    echo "# $desc" >> "$script"

    if [[ "$type" == "port-forward" ]]; then
      if [[ "$protocol" == "tcp/udp" ]]; then
        for p in tcp udp; do
          echo "iptables -t nat -A PREROUTING -i $linux_iface -p $p --dport $ext_port -j DNAT --to-destination ${int_addr}:${int_port}" >> "$script"
          echo "iptables -A FORWARD -i $linux_iface -p $p -d $int_addr --dport $int_port -j ACCEPT" >> "$script"
        done
      else
        echo "iptables -t nat -A PREROUTING -i $linux_iface -p $protocol --dport $ext_port -j DNAT --to-destination ${int_addr}:${int_port}" >> "$script"
        echo "iptables -A FORWARD -i $linux_iface -p $protocol -d $int_addr --dport $int_port -j ACCEPT" >> "$script"
      fi
    elif [[ "$type" == "outbound" ]]; then
      echo "iptables -t nat -A POSTROUTING -o $linux_iface -s $int_addr -j MASQUERADE" >> "$script"
    elif [[ "$type" == "1-to-1" ]]; then
      local ext_addr=$(echo "$rule" | jq -r '.external_address // empty')
      if [[ -n "$ext_addr" ]]; then
        echo "iptables -t nat -A PREROUTING -d $ext_addr -j DNAT --to-destination $int_addr" >> "$script"
        echo "iptables -t nat -A POSTROUTING -s $int_addr -j SNAT --to-source $ext_addr" >> "$script"
      fi
    fi
    echo "" >> "$script"
  done

  chmod +x "$script"
  exec_script "$script" && log_ok "NAT rules applied ($count)" || log_error "NAT apply failed"
}

apply_nft_nat() {
  local rules="$1"
  local count="$2"
  local nft_file="${RULES_DIR}/aegis-nat.nft"

  cat > "$nft_file" <<'HEADER'
#!/usr/sbin/nft -f
# NAT rules — auto-generated by Aegis Agent

table ip aegis_nat {
  chain prerouting {
    type nat hook prerouting priority -100; policy accept;
HEADER

  # Port forwards (DNAT)
  echo "$rules" | jq -c '.[] | select(.type == "port-forward")' | while read -r rule; do
    local protocol=$(echo "$rule" | jq -r '.protocol' | tr '[:upper:]' '[:lower:]')
    local ext_port=$(echo "$rule" | jq -r '.external_port')
    local int_addr=$(echo "$rule" | jq -r '.internal_address')
    local int_port=$(echo "$rule" | jq -r '.internal_port')
    local interface=$(echo "$rule" | jq -r '.interface')
    local desc=$(echo "$rule" | jq -r '.description')
    local linux_iface=$(map_iface "$interface")

    echo "    # $desc" >> "$nft_file"
    if [[ "$protocol" == "tcp/udp" ]]; then
      for p in tcp udp; do
        echo "    iifname \"$linux_iface\" $p dport $ext_port dnat to ${int_addr}:${int_port}" >> "$nft_file"
      done
    else
      echo "    iifname \"$linux_iface\" $protocol dport $ext_port dnat to ${int_addr}:${int_port}" >> "$nft_file"
    fi
  done

  # 1:1 NAT (DNAT)
  echo "$rules" | jq -c '.[] | select(.type == "1-to-1")' | while read -r rule; do
    local ext_addr=$(echo "$rule" | jq -r '.external_address // empty')
    local int_addr=$(echo "$rule" | jq -r '.internal_address')
    local desc=$(echo "$rule" | jq -r '.description')
    if [[ -n "$ext_addr" ]]; then
      echo "    # $desc (1:1 NAT)" >> "$nft_file"
      echo "    ip daddr $ext_addr dnat to $int_addr" >> "$nft_file"
    fi
  done

  cat >> "$nft_file" <<'MID'
  }

  chain postrouting {
    type nat hook postrouting priority 100; policy accept;
MID

  # Outbound MASQUERADE
  echo "$rules" | jq -c '.[] | select(.type == "outbound")' | while read -r rule; do
    local interface=$(echo "$rule" | jq -r '.interface')
    local int_addr=$(echo "$rule" | jq -r '.internal_address')
    local desc=$(echo "$rule" | jq -r '.description')
    local linux_iface=$(map_iface "$interface")

    echo "    # $desc" >> "$nft_file"
    echo "    oifname \"$linux_iface\" ip saddr $int_addr masquerade" >> "$nft_file"
  done

  # 1:1 NAT (SNAT)
  echo "$rules" | jq -c '.[] | select(.type == "1-to-1")' | while read -r rule; do
    local ext_addr=$(echo "$rule" | jq -r '.external_address // empty')
    local int_addr=$(echo "$rule" | jq -r '.internal_address')
    local desc=$(echo "$rule" | jq -r '.description')
    if [[ -n "$ext_addr" ]]; then
      echo "    # $desc (1:1 SNAT)" >> "$nft_file"
      echo "    ip saddr $int_addr snat to $ext_addr" >> "$nft_file"
    fi
  done

  cat >> "$nft_file" <<'FOOTER'
  }
}
FOOTER

  if [[ "$DRY_RUN" == "true" ]]; then
    echo "[DRY-RUN] nft -c -f $nft_file"
    nft -c -f "$nft_file" 2>&1 && log_ok "NAT nft syntax check passed" || log_error "NAT nft syntax error"
  else
    nft -f "$nft_file" 2>&1 | tee -a "$LOG_FILE" && log_ok "NAT nft rules applied ($count)" || log_error "NAT nft apply failed"
  fi
}

# ════════════════════════════════════════════════════════════
#  STATIC & POLICY ROUTES
# ════════════════════════════════════════════════════════════

apply_static_routes() {
  log_info "Fetching static routes..."
  local routes
  routes=$(api_get "/static_routes?select=*&status=eq.active" 2>/dev/null) || return 0

  local count=$(echo "$routes" | jq length)
  log_info "Received $count static routes"

  echo "$routes" | jq -c '.[]' | while read -r route; do
    local dest=$(echo "$route" | jq -r '.destination')
    local gw=$(echo "$route" | jq -r '.gateway')
    local iface=$(echo "$route" | jq -r '.interface')
    local linux_iface=$(map_iface "$iface")
    local metric=$(echo "$route" | jq -r '.distance')

    # Skip default route (dangerous to override without explicit intent)
    [[ "$dest" == "0.0.0.0/0" ]] && { log_warn "Skipping default route (safety)"; continue; }

    exec_cmd "ip route replace '$dest' via '$gw' dev '$linux_iface' metric '$metric'" 2>/dev/null && \
      log_ok "Route: $dest via $gw dev $linux_iface metric $metric" || \
      log_warn "Failed to add route: $dest"
  done
}

apply_policy_routes() {
  log_info "Fetching policy routes..."
  local routes
  routes=$(api_get "/policy_routes?select=*&status=eq.enabled&order=seq.asc" 2>/dev/null) || return 0

  local count=$(echo "$routes" | jq length)
  [[ "$count" -eq 0 ]] && { log_info "No policy routes"; return 0; }

  log_info "Applying $count policy routes..."

  # Clean up old Aegis policy route tables (100-199)
  for tbl in $(seq 100 199); do
    ip rule del table "$tbl" 2>/dev/null || true
    ip route flush table "$tbl" 2>/dev/null || true
  done

  echo "$routes" | jq -c '.[]' | while read -r route; do
    local seq_num=$(echo "$route" | jq -r '.seq')
    local source=$(echo "$route" | jq -r '.source')
    local destination=$(echo "$route" | jq -r '.destination')
    local gateway=$(echo "$route" | jq -r '.gateway')
    local incoming=$(echo "$route" | jq -r '.incoming')
    local out_iface=$(echo "$route" | jq -r '.out_interface')
    local protocol=$(echo "$route" | jq -r '.protocol')
    local comment=$(echo "$route" | jq -r '.comment')

    local linux_out=$(map_iface "$out_iface")
    local linux_in=$(map_iface "$incoming")
    local table_id=$((100 + seq_num))

    log_info "Policy Route seq=$seq_num: $comment"

    # Create routing table entry
    exec_cmd "ip route add default via '$gateway' dev '$linux_out' table '$table_id'" 2>/dev/null || true

    # Add ip rules based on source/destination
    if [[ "$source" != "0.0.0.0/0" && -n "$source" ]]; then
      exec_cmd "ip rule add from '$source' table '$table_id' priority '$seq_num'" 2>/dev/null && \
        log_ok "  Rule: from $source → table $table_id" || \
        log_warn "  Failed: from $source"
    fi

    if [[ "$destination" != "0.0.0.0/0" && -n "$destination" ]]; then
      exec_cmd "ip rule add to '$destination' table '$table_id' priority '$((seq_num + 1000))'" 2>/dev/null && \
        log_ok "  Rule: to $destination → table $table_id" || \
        log_warn "  Failed: to $destination"
    fi

    # Match by incoming interface
    if [[ -n "$linux_in" && "$incoming" != "any" ]]; then
      exec_cmd "ip rule add iif '$linux_in' table '$table_id' priority '$((seq_num + 2000))'" 2>/dev/null && \
        log_ok "  Rule: iif $linux_in → table $table_id" || \
        log_warn "  Failed: iif $linux_in"
    fi
  done

  log_ok "Policy routes applied ($count)"
}

# ════════════════════════════════════════════════════════════
#  TRAFFIC SHAPING (tc - Traffic Control)
# ════════════════════════════════════════════════════════════

apply_traffic_shaping() {
  log_info "Fetching traffic shapers..."
  local shapers
  shapers=$(api_get "/traffic_shapers?select=*&enabled=eq.true" 2>/dev/null) || return 0

  local count=$(echo "$shapers" | jq length)
  [[ "$count" -eq 0 ]] && { log_info "No traffic shapers"; return 0; }

  local wan_dev="${IFACE_MAP[WAN]:-eth0}"
  local lan_dev="${IFACE_MAP[LAN]:-eth1}"
  local script="${RULES_DIR}/tc-apply.sh"

  cat > "$script" <<HEADER
#!/bin/bash
set -e
# Traffic Shaping — auto-generated by Aegis Agent

# Clear existing qdiscs
tc qdisc del dev $wan_dev root 2>/dev/null || true
tc qdisc del dev $lan_dev root 2>/dev/null || true

# Root HTB qdisc on WAN
tc qdisc add dev $wan_dev root handle 1: htb default 99
tc class add dev $wan_dev parent 1: classid 1:1 htb rate 1000mbit ceil 1000mbit

HEADER

  local class_id=10
  echo "$shapers" | jq -c '.[]' | while read -r shaper; do
    local name=$(echo "$shaper" | jq -r '.name')
    local priority=$(echo "$shaper" | jq -r '.priority')
    local guaranteed=$(echo "$shaper" | jq -r '.guaranteed_bandwidth')
    local maximum=$(echo "$shaper" | jq -r '.maximum_bandwidth')
    local burst=$(echo "$shaper" | jq -r '.burst_bandwidth')

    echo "# Shaper: $name (priority: $priority)" >> "$script"
    echo "tc class add dev $wan_dev parent 1:1 classid 1:${class_id} htb rate ${guaranteed}kbit ceil ${maximum}kbit burst ${burst}k" >> "$script"
    echo "tc qdisc add dev $wan_dev parent 1:${class_id} handle ${class_id}: sfq perturb 10" >> "$script"
    echo "" >> "$script"

    class_id=$((class_id + 10))
  done

  # Default class for unmatched traffic
  cat >> "$script" <<FOOTER
# Default class (unmatched traffic)
tc class add dev $wan_dev parent 1:1 classid 1:99 htb rate 100kbit ceil 1000mbit
tc qdisc add dev $wan_dev parent 1:99 handle 99: sfq perturb 10
FOOTER

  chmod +x "$script"
  exec_script "$script" && log_ok "Traffic shaping applied ($count shapers)" || log_error "Traffic shaping failed"

  # Also apply shaping policies if any
  apply_shaping_policies "$wan_dev"
}

apply_shaping_policies() {
  local wan_dev="$1"
  local policies
  policies=$(api_get "/traffic_shaping_policies?select=*&enabled=eq.true" 2>/dev/null) || return 0

  local count=$(echo "$policies" | jq length)
  [[ "$count" -eq 0 ]] && return 0

  log_info "Applying $count traffic shaping policies..."

  # Use iptables MARK + tc filter to classify traffic
  echo "$policies" | jq -c '.[]' | while read -r policy; do
    local name=$(echo "$policy" | jq -r '.name')
    local src_iface=$(echo "$policy" | jq -r '.src_interface')
    local dst_iface=$(echo "$policy" | jq -r '.dst_interface')
    local source=$(echo "$policy" | jq -r '.source')
    local destination=$(echo "$policy" | jq -r '.destination')

    local linux_src=$(map_iface "$src_iface")
    local linux_dst=$(map_iface "$dst_iface")

    log_info "  Shaping policy: $name ($linux_src → $linux_dst)"
    # tc filter can be extended here based on shaper class mapping
  done
}

# ════════════════════════════════════════════════════════════
#  INTERFACE CONFIGURATION
# ════════════════════════════════════════════════════════════

apply_interface_config() {
  log_info "Fetching interface configuration..."
  local interfaces
  interfaces=$(api_get "/network_interfaces?select=*" 2>/dev/null) || return 0

  local count=$(echo "$interfaces" | jq length)
  log_info "Configuring $count interfaces..."

  echo "$interfaces" | jq -c '.[]' | while read -r iface; do
    local name=$(echo "$iface" | jq -r '.name')
    local ip_addr=$(echo "$iface" | jq -r '.ip_address // empty')
    local subnet=$(echo "$iface" | jq -r '.subnet // empty')
    local gateway=$(echo "$iface" | jq -r '.gateway // empty')
    local mtu=$(echo "$iface" | jq -r '.mtu // 1500')
    local status=$(echo "$iface" | jq -r '.status')
    local vlan=$(echo "$iface" | jq -r '.vlan // empty')

    local linux_dev=$(map_iface "$name")

    # Skip if device doesn't exist
    if [[ ! -d "/sys/class/net/$linux_dev" && -z "$vlan" ]]; then
      log_warn "Interface $name ($linux_dev) not found, skipping"
      continue
    fi

    log_info "Configuring $name → $linux_dev"

    # VLAN creation
    if [[ -n "$vlan" && "$vlan" != "null" ]]; then
      local parent_dev=$(echo "$linux_dev" | cut -d. -f1)
      local vlan_dev="${parent_dev}.${vlan}"
      if [[ ! -d "/sys/class/net/$vlan_dev" ]]; then
        exec_cmd "ip link add link $parent_dev name $vlan_dev type vlan id $vlan" && \
          log_ok "  VLAN $vlan_dev created" || log_warn "  Failed to create VLAN $vlan_dev"
      fi
      linux_dev="$vlan_dev"
    fi

    # IP address
    if [[ -n "$ip_addr" && "$ip_addr" != "null" && -n "$subnet" && "$subnet" != "null" ]]; then
      local cidr=$(subnet_to_cidr "$subnet")
      local current_ip=$(ip -4 addr show "$linux_dev" 2>/dev/null | grep -oP 'inet \K[0-9./]+' | head -1 || echo "")

      if [[ "$current_ip" != "${ip_addr}/${cidr}" ]]; then
        exec_cmd "ip addr flush dev '$linux_dev' 2>/dev/null || true"
        exec_cmd "ip addr add '${ip_addr}/${cidr}' dev '$linux_dev'" && \
          log_ok "  IP: ${ip_addr}/${cidr}" || log_warn "  Failed to set IP"
      fi
    fi

    # MTU
    if [[ -n "$mtu" && "$mtu" != "null" ]]; then
      exec_cmd "ip link set dev '$linux_dev' mtu '$mtu'" 2>/dev/null || true
    fi

    # Link state
    if [[ "$status" == "up" ]]; then
      exec_cmd "ip link set dev '$linux_dev' up" 2>/dev/null || true
    elif [[ "$status" == "down" ]]; then
      exec_cmd "ip link set dev '$linux_dev' down" 2>/dev/null || true
    fi

    # Default gateway
    if [[ -n "$gateway" && "$gateway" != "null" && "$name" == "WAN" ]]; then
      exec_cmd "ip route replace default via '$gateway' dev '$linux_dev'" 2>/dev/null && \
        log_ok "  Gateway: $gateway" || log_warn "  Failed to set gateway"
    fi
  done

  log_ok "Interface configuration applied"
}

subnet_to_cidr() {
  local subnet="$1"
  local cidr=0
  IFS='.' read -ra parts <<< "$subnet"
  for part in "${parts[@]}"; do
    local bits=$(echo "obase=2;$part" | bc | tr -cd '1' | wc -c)
    cidr=$((cidr + bits))
  done
  echo "$cidr"
}

# ════════════════════════════════════════════════════════════
#  DHCP SERVER CONFIGURATION (dnsmasq / isc-dhcp-server)
# ════════════════════════════════════════════════════════════

apply_dhcp_config() {
  log_info "Fetching DHCP configuration..."
  local servers
  servers=$(api_get "/dhcp_servers?select=*&enabled=eq.true" 2>/dev/null) || return 0

  local count=$(echo "$servers" | jq length)
  [[ "$count" -eq 0 ]] && { log_info "No DHCP servers enabled"; return 0; }

  local static_maps
  static_maps=$(api_get "/dhcp_static_mappings?select=*&enabled=eq.true" 2>/dev/null) || static_maps="[]"

  if [[ "$DHCP_BACKEND" == "dnsmasq" ]]; then
    apply_dhcp_dnsmasq "$servers" "$static_maps"
  else
    apply_dhcp_isc "$servers" "$static_maps"
  fi
}

apply_dhcp_dnsmasq() {
  local servers="$1"
  local static_maps="$2"
  local conf_file="${DNSMASQ_CONF_DIR}/aegis-dhcp.conf"

  mkdir -p "$DNSMASQ_CONF_DIR"

  cat > "$conf_file" <<'HEADER'
# Aegis NGFW DHCP Configuration — auto-generated
# DO NOT EDIT MANUALLY — managed by aegis-agent
HEADER

  echo "$servers" | jq -c '.[]' | while read -r server; do
    local iface=$(echo "$server" | jq -r '.interface')
    local range_start=$(echo "$server" | jq -r '.range_start')
    local range_end=$(echo "$server" | jq -r '.range_end')
    local netmask=$(echo "$server" | jq -r '.netmask')
    local gateway=$(echo "$server" | jq -r '.gateway')
    local dns1=$(echo "$server" | jq -r '.dns1')
    local dns2=$(echo "$server" | jq -r '.dns2')
    local domain=$(echo "$server" | jq -r '.domain')
    local lease_time=$(echo "$server" | jq -r '.lease_time')

    local linux_iface=$(map_iface "$iface")

    echo "" >> "$conf_file"
    echo "# DHCP for $iface ($linux_iface)" >> "$conf_file"
    echo "interface=$linux_iface" >> "$conf_file"
    echo "dhcp-range=$range_start,$range_end,$netmask,${lease_time}s" >> "$conf_file"
    echo "dhcp-option=option:router,$gateway" >> "$conf_file"
    echo "dhcp-option=option:dns-server,$dns1${dns2:+,$dns2}" >> "$conf_file"
    [[ -n "$domain" && "$domain" != "null" ]] && echo "dhcp-option=option:domain-name,$domain" >> "$conf_file"
  done

  # Static DHCP mappings
  echo "$static_maps" | jq -c '.[]' | while read -r mapping; do
    local mac=$(echo "$mapping" | jq -r '.mac')
    local ip=$(echo "$mapping" | jq -r '.ip')
    local hostname=$(echo "$mapping" | jq -r '.name')

    echo "dhcp-host=$mac,$ip,$hostname" >> "$conf_file"
  done

  log_ok "DHCP config written to $conf_file"

  # Reload dnsmasq
  if command -v dnsmasq &>/dev/null; then
    if [[ "$DRY_RUN" != "true" ]]; then
      # Test config first
      if dnsmasq --test --conf-file="$conf_file" 2>&1; then
        systemctl reload dnsmasq 2>/dev/null || systemctl restart dnsmasq 2>/dev/null || \
          killall -HUP dnsmasq 2>/dev/null || true
        log_ok "dnsmasq reloaded"
      else
        log_error "dnsmasq config test failed — not reloading"
      fi
    fi
  else
    log_warn "dnsmasq not installed — config written but not applied"
  fi
}

apply_dhcp_isc() {
  local servers="$1"
  local static_maps="$2"
  local conf_file="/etc/dhcp/dhcpd.conf.aegis"

  cat > "$conf_file" <<'HEADER'
# Aegis NGFW DHCP Configuration (ISC DHCP) — auto-generated
# DO NOT EDIT MANUALLY

authoritative;
log-facility local7;
HEADER

  echo "$servers" | jq -c '.[]' | while read -r server; do
    local range_start=$(echo "$server" | jq -r '.range_start')
    local range_end=$(echo "$server" | jq -r '.range_end')
    local netmask=$(echo "$server" | jq -r '.netmask')
    local gateway=$(echo "$server" | jq -r '.gateway')
    local dns1=$(echo "$server" | jq -r '.dns1')
    local dns2=$(echo "$server" | jq -r '.dns2')
    local domain=$(echo "$server" | jq -r '.domain')
    local lease_time=$(echo "$server" | jq -r '.lease_time')
    local iface=$(echo "$server" | jq -r '.interface')

    # Calculate network address from gateway and netmask
    echo "" >> "$conf_file"
    echo "# DHCP for $iface" >> "$conf_file"
    echo "subnet ${gateway%.*}.0 netmask $netmask {" >> "$conf_file"
    echo "  range $range_start $range_end;" >> "$conf_file"
    echo "  option routers $gateway;" >> "$conf_file"
    echo "  option domain-name-servers $dns1${dns2:+, $dns2};" >> "$conf_file"
    [[ -n "$domain" && "$domain" != "null" ]] && echo "  option domain-name \"$domain\";" >> "$conf_file"
    echo "  default-lease-time $lease_time;" >> "$conf_file"
    echo "  max-lease-time $((lease_time * 2));" >> "$conf_file"
    echo "}" >> "$conf_file"
  done

  # Static mappings
  echo "$static_maps" | jq -c '.[]' | while read -r mapping; do
    local mac=$(echo "$mapping" | jq -r '.mac')
    local ip=$(echo "$mapping" | jq -r '.ip')
    local hostname=$(echo "$mapping" | jq -r '.name')

    echo "" >> "$conf_file"
    echo "host $hostname {" >> "$conf_file"
    echo "  hardware ethernet $mac;" >> "$conf_file"
    echo "  fixed-address $ip;" >> "$conf_file"
    echo "}" >> "$conf_file"
  done

  log_ok "ISC DHCP config written to $conf_file"

  if command -v dhcpd &>/dev/null && [[ "$DRY_RUN" != "true" ]]; then
    if dhcpd -t -cf "$conf_file" 2>&1; then
      cp "$conf_file" /etc/dhcp/dhcpd.conf
      systemctl restart isc-dhcp-server 2>/dev/null || true
      log_ok "ISC DHCP server restarted"
    else
      log_error "ISC DHCP config test failed"
    fi
  fi
}

# ════════════════════════════════════════════════════════════
#  DNS SERVER CONFIGURATION
# ════════════════════════════════════════════════════════════

apply_dns_config() {
  log_info "Fetching DNS configuration..."

  local records
  records=$(api_get "/dns_local_records?select=*&enabled=eq.true" 2>/dev/null) || records="[]"

  local forward_zones
  forward_zones=$(api_get "/dns_forward_zones?select=*&enabled=eq.true" 2>/dev/null) || forward_zones="[]"

  local record_count=$(echo "$records" | jq length)
  local zone_count=$(echo "$forward_zones" | jq length)

  if [[ "$record_count" -eq 0 && "$zone_count" -eq 0 ]]; then
    log_info "No DNS config to apply"
    return 0
  fi

  if [[ "$DNS_BACKEND" == "dnsmasq" ]]; then
    apply_dns_dnsmasq "$records" "$forward_zones"
  else
    apply_dns_bind9 "$records" "$forward_zones"
  fi
}

apply_dns_dnsmasq() {
  local records="$1"
  local forward_zones="$2"
  local conf_file="${DNSMASQ_CONF_DIR}/aegis-dns.conf"

  mkdir -p "$DNSMASQ_CONF_DIR"

  cat > "$conf_file" <<'HEADER'
# Aegis NGFW DNS Configuration — auto-generated
# DO NOT EDIT MANUALLY
HEADER

  # Local DNS records
  echo "$records" | jq -c '.[]' | while read -r record; do
    local hostname=$(echo "$record" | jq -r '.hostname')
    local domain=$(echo "$record" | jq -r '.domain')
    local address=$(echo "$record" | jq -r '.address')
    local type=$(echo "$record" | jq -r '.type')

    local fqdn="${hostname}"
    [[ -n "$domain" && "$domain" != "null" ]] && fqdn="${hostname}.${domain}"

    if [[ "$type" == "A" || "$type" == "AAAA" ]]; then
      echo "address=/${fqdn}/${address}" >> "$conf_file"
    elif [[ "$type" == "CNAME" ]]; then
      echo "cname=${fqdn},${address}" >> "$conf_file"
    elif [[ "$type" == "MX" ]]; then
      echo "mx-host=${fqdn},${address}" >> "$conf_file"
    elif [[ "$type" == "TXT" ]]; then
      echo "txt-record=${fqdn},\"${address}\"" >> "$conf_file"
    fi
  done

  # Forward zones
  echo "$forward_zones" | jq -c '.[]' | while read -r zone; do
    local zone_name=$(echo "$zone" | jq -r '.name')
    local servers=$(echo "$zone" | jq -r '.servers[]')

    for server in $servers; do
      echo "server=/${zone_name}/${server}" >> "$conf_file"
    done
  done

  log_ok "DNS config written to $conf_file ($record_count records, $zone_count zones)"

  if command -v dnsmasq &>/dev/null && [[ "$DRY_RUN" != "true" ]]; then
    systemctl reload dnsmasq 2>/dev/null || systemctl restart dnsmasq 2>/dev/null || \
      killall -HUP dnsmasq 2>/dev/null || true
    log_ok "dnsmasq reloaded (DNS)"
  fi
}

apply_dns_bind9() {
  local records="$1"
  local forward_zones="$2"
  local conf_file="/etc/bind/named.conf.aegis"

  cat > "$conf_file" <<'HEADER'
// Aegis NGFW DNS Configuration (BIND9) — auto-generated
// DO NOT EDIT MANUALLY
HEADER

  # Forward zones
  echo "$forward_zones" | jq -c '.[]' | while read -r zone; do
    local zone_name=$(echo "$zone" | jq -r '.name')
    local zone_type=$(echo "$zone" | jq -r '.type')

    echo "" >> "$conf_file"
    echo "zone \"$zone_name\" {" >> "$conf_file"
    echo "    type forward;" >> "$conf_file"
    echo "    forward only;" >> "$conf_file"
    echo -n "    forwarders { " >> "$conf_file"

    echo "$zone" | jq -r '.servers[]' | while read -r server; do
      echo -n "$server; " >> "$conf_file"
    done

    echo "};" >> "$conf_file"
    echo "};" >> "$conf_file"
  done

  log_ok "BIND9 config written to $conf_file"

  # Create zone file for local records
  local record_count=$(echo "$records" | jq length)
  if [[ "$record_count" -gt 0 ]]; then
    local zone_file="/etc/bind/db.aegis.local"

    cat > "$zone_file" <<ZONEHEADER
; Aegis NGFW Local DNS Zone — auto-generated
\$TTL 300
@   IN  SOA ns1.aegis.local. admin.aegis.local. (
        $(date +%Y%m%d%H) ; serial
        3600       ; refresh
        600        ; retry
        86400      ; expire
        300 )      ; minimum
    IN  NS  ns1.aegis.local.
ZONEHEADER

    echo "$records" | jq -c '.[]' | while read -r record; do
      local hostname=$(echo "$record" | jq -r '.hostname')
      local address=$(echo "$record" | jq -r '.address')
      local type=$(echo "$record" | jq -r '.type')
      local ttl=$(echo "$record" | jq -r '.ttl')

      echo "${hostname}  ${ttl}  IN  ${type}  ${address}" >> "$zone_file"
    done

    log_ok "BIND9 zone file written ($record_count records)"
  fi

  if command -v named-checkconf &>/dev/null && [[ "$DRY_RUN" != "true" ]]; then
    if named-checkconf 2>&1; then
      systemctl reload bind9 2>/dev/null || systemctl reload named 2>/dev/null || true
      log_ok "BIND9 reloaded"
    else
      log_error "BIND9 config check failed"
    fi
  fi
}

# ════════════════════════════════════════════════════════════
#  IDS/IPS (Suricata) CONFIGURATION
# ════════════════════════════════════════════════════════════

apply_ids_config() {
  if ! command -v suricata &>/dev/null; then
    log_info "Suricata not installed, skipping IDS config"
    return 0
  fi

  log_info "Fetching IDS signatures..."
  local signatures
  signatures=$(api_get "/ids_signatures?select=*&enabled=eq.true" 2>/dev/null) || return 0

  local count=$(echo "$signatures" | jq length)
  [[ "$count" -eq 0 ]] && { log_info "No IDS signatures"; return 0; }

  local rules_file="/etc/suricata/rules/aegis-custom.rules"
  mkdir -p "/etc/suricata/rules"

  echo "# Aegis NGFW Custom IDS Rules — auto-generated" > "$rules_file"
  echo "# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)" >> "$rules_file"
  echo "" >> "$rules_file"

  echo "$signatures" | jq -c '.[]' | while read -r sig; do
    local action=$(echo "$sig" | jq -r '.action')
    local name=$(echo "$sig" | jq -r '.name')
    local sid=$(echo "$sig" | jq -r '.sid')
    local category=$(echo "$sig" | jq -r '.category')

    local proto="ip"
    [[ "$category" == "web-application" ]] && proto="http"

    echo "${action} ${proto} any any -> any any (msg:\"${name}\"; sid:${sid}; rev:1; classtype:${category};)" >> "$rules_file"
  done

  log_ok "Suricata rules written ($count signatures)"

  if [[ "$DRY_RUN" != "true" ]]; then
    suricata -T -c /etc/suricata/suricata.yaml 2>&1 && {
      systemctl reload suricata 2>/dev/null || systemctl restart suricata 2>/dev/null || true
      log_ok "Suricata reloaded"
    } || log_error "Suricata config test failed"
  fi
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
  ip rule show > "${backup_dir}/policy_routes_${ts}.txt" 2>/dev/null || true

  # Keep only last 50 backups
  ls -t "${backup_dir}"/* 2>/dev/null | tail -n +51 | xargs rm -f 2>/dev/null || true

  log_info "Rules backed up (${ts})"
}

# ── Cleanup old metrics ──────────────────────────────────────
cleanup_old_data() {
  local cutoff=$(date -u -d '7 days ago' +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || \
                 date -u -v-7d +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "")
  [[ -z "$cutoff" ]] && return 0

  curl -sf -X DELETE "${API_URL}/system_metrics?recorded_at=lt.${cutoff}" \
    ${AGENT_SECRET_KEY:+-H "x-agent-key: $AGENT_SECRET_KEY"} >/dev/null 2>&1 || true
  curl -sf -X DELETE "${API_URL}/traffic_stats?recorded_at=lt.${cutoff}" \
    ${AGENT_SECRET_KEY:+-H "x-agent-key: $AGENT_SECRET_KEY"} >/dev/null 2>&1 || true
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

# Full sync: pull ALL config from DB and apply to system
do_sync() {
  local errors=0 applied=0 sections=""

  log_info "═══ Starting full configuration sync ═══"

  # 1. Interface config first (networking base)
  apply_interface_config && { ((applied++)); sections+="interfaces,"; } || ((errors++))

  # 2. Firewall rules
  apply_firewall_rules && { ((applied++)); sections+="firewall,"; } || ((errors++))

  # 3. NAT rules
  apply_nat_rules && { ((applied++)); sections+="nat,"; } || ((errors++))

  # 4. Static routes
  apply_static_routes && { ((applied++)); sections+="routes,"; } || ((errors++))

  # 5. Policy routes
  apply_policy_routes && { ((applied++)); sections+="policy-routes,"; } || ((errors++))

  # 6. Traffic shaping
  apply_traffic_shaping && { ((applied++)); sections+="shaping,"; } || ((errors++))

  # 7. DHCP
  apply_dhcp_config && { ((applied++)); sections+="dhcp,"; } || ((errors++))

  # 8. DNS
  apply_dns_config && { ((applied++)); sections+="dns,"; } || ((errors++))

  # 9. IDS/IPS
  apply_ids_config && { ((applied++)); sections+="ids,"; } || ((errors++))

  local status="success"
  [[ $errors -gt 0 ]] && status="partial"
  [[ $applied -eq 0 ]] && status="failed"

  report_status "$status" "$(jq -n \
    --argjson applied "$applied" \
    --argjson errors "$errors" \
    --arg hostname "$HOSTNAME_ID" \
    --arg backend "$FIREWALL_BACKEND" \
    --arg sections "$sections" \
    --arg version "2.0.0" \
    '{applied:$applied, errors:$errors, hostname:$hostname, backend:$backend, sections:$sections, agent_version:$version}')"

  log_info "═══ Sync complete: applied=$applied errors=$errors ═══"
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
  echo -e "${CYAN}═══════════════════════════════════════${NC}"
  echo -e "${CYAN}   Aegis NGFW Agent v2.0 — Status     ${NC}"
  echo -e "${CYAN}═══════════════════════════════════════${NC}"

  if [[ -f "$PID_FILE" ]] && kill -0 $(cat "$PID_FILE") 2>/dev/null; then
    echo -e "Service:    ${GREEN}Running${NC} (PID $(cat "$PID_FILE"))"
  else
    echo -e "Service:    ${RED}Stopped${NC}"
  fi

  echo "API URL:    $API_URL"
  echo "Backend:    $FIREWALL_BACKEND"
  echo "Hostname:   $HOSTNAME_ID"
  echo "DHCP:       $DHCP_BACKEND"
  echo "DNS:        $DNS_BACKEND"

  # Test API connection
  if api_get "/" >/dev/null 2>&1; then
    echo -e "API:        ${GREEN}Connected${NC}"
  else
    echo -e "API:        ${RED}Unreachable${NC}"
  fi

  echo ""
  echo -e "${CYAN}── System ──${NC}"
  echo "CPU:        $(nproc) cores, $(collect_cpu)% usage"
  echo "Memory:     $(free -h | awk '/^Mem:/{print $3"/"$2}')"
  echo "Disk:       $(df -h / | awk 'NR==2{print $3"/"$2}')"
  echo "Uptime:     $(uptime -p)"

  echo ""
  echo -e "${CYAN}── Interfaces ──${NC}"
  for name in WAN LAN DMZ GUEST; do
    local dev="${IFACE_MAP[$name]:-}"
    if [[ -n "$dev" ]] && [[ -d "/sys/class/net/$dev" ]]; then
      local state=$(cat "/sys/class/net/$dev/operstate" 2>/dev/null || echo "?")
      local ip=$(ip -4 addr show "$dev" 2>/dev/null | grep -oP 'inet \K[0-9.]+' || echo "N/A")
      printf "  %-8s %-8s %-6s %s\n" "$name" "$dev" "$state" "$ip"
    else
      printf "  %-8s %-8s ${RED}%-6s${NC}\n" "$name" "${dev:-?}" "absent"
    fi
  done

  echo ""
  echo -e "${CYAN}── Firewall ──${NC}"
  if [[ "$FIREWALL_BACKEND" == "nft" ]]; then
    echo "Rules:      $(nft list ruleset 2>/dev/null | grep -c 'accept\|drop\|reject' || echo '?')"
    echo "NAT:        $(nft list table ip aegis_nat 2>/dev/null | grep -c 'dnat\|masquerade\|snat' || echo '0')"
  else
    echo "Rules:      $(iptables -L -n 2>/dev/null | grep -c 'ACCEPT\|DROP\|REJECT' || echo '?')"
    echo "NAT:        $(iptables -t nat -L -n 2>/dev/null | grep -c 'DNAT\|MASQ\|SNAT' || echo '0')"
  fi
  echo "Routes:     $(ip route show 2>/dev/null | wc -l || echo '?')"
  echo "Policy:     $(ip rule show 2>/dev/null | grep -c 'lookup [0-9]' || echo '0')"

  echo ""
  echo -e "${CYAN}── Services ──${NC}"
  for svc in dnsmasq isc-dhcp-server bind9 suricata strongswan; do
    if systemctl is-active "$svc" &>/dev/null; then
      echo -e "  $svc: ${GREEN}active${NC}"
    elif command -v "$svc" &>/dev/null || dpkg -l "$svc" &>/dev/null 2>&1; then
      echo -e "  $svc: ${YELLOW}installed (inactive)${NC}"
    fi
  done
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
  apply-fw)
    init
    apply_firewall_rules
    ;;
  apply-nat)
    init
    apply_nat_rules
    ;;
  apply-routes)
    init
    apply_static_routes
    apply_policy_routes
    ;;
  apply-tc)
    init
    apply_traffic_shaping
    ;;
  apply-iface)
    init
    apply_interface_config
    ;;
  apply-dhcp)
    init
    apply_dhcp_config
    ;;
  apply-dns)
    init
    apply_dns_config
    ;;
  apply-ids)
    init
    apply_ids_config
    ;;
  test)
    DRY_RUN=true
    init
    do_sync
    ;;
  *)
    echo "Aegis NGFW Agent v2.0 — Self-Hosted Firewall Management"
    echo ""
    echo "Usage: $0 {daemon|sync|metrics|status|fetch|backup|test|apply-*}"
    echo ""
    echo "  daemon        Run as background service (default)"
    echo "  sync          Pull ALL config from DB and apply"
    echo "  metrics       Collect system metrics and push to DB"
    echo "  status        Show agent and system status"
    echo "  fetch         Fetch firewall rules and display JSON"
    echo "  backup        Backup current iptables/nftables rules"
    echo "  test          Dry-run: generate config without applying"
    echo ""
    echo "  apply-fw      Apply firewall rules only"
    echo "  apply-nat     Apply NAT rules only"
    echo "  apply-routes  Apply static + policy routes"
    echo "  apply-tc      Apply traffic shaping only"
    echo "  apply-iface   Apply interface configuration"
    echo "  apply-dhcp    Apply DHCP server config"
    echo "  apply-dns     Apply DNS server config"
    echo "  apply-ids     Apply IDS/IPS (Suricata) rules"
    echo ""
    echo "All config is read from PostgREST local API."
    echo "No cloud dependencies required."
    exit 1
    ;;
esac
