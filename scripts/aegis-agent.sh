#!/bin/bash
# ============================================================
# Aegis NGFW Agent - Ubuntu Firewall Sync Daemon
# ============================================================
# This script runs on the Ubuntu server and syncs firewall
# rules from the Aegis cloud database to local iptables/nftables.
#
# Installation:
#   1. Copy this script to /opt/aegis/aegis-agent.sh
#   2. chmod +x /opt/aegis/aegis-agent.sh
#   3. Copy aegis-agent.service to /etc/systemd/system/
#   4. Set environment variables in /opt/aegis/.env
#   5. systemctl enable --now aegis-agent
#
# Required packages:
#   apt install -y iptables nftables iproute2 curl jq
#
# Optional packages (for full feature support):
#   apt install -y suricata isc-dhcp-server bind9 strongswan
#   apt install -y tc squid clamav keepalived
# ============================================================

set -euo pipefail

# Load configuration
AEGIS_DIR="${AEGIS_DIR:-/opt/aegis}"
ENV_FILE="${AEGIS_DIR}/.env"

if [[ -f "$ENV_FILE" ]]; then
  source "$ENV_FILE"
fi

# Required environment variables
SUPABASE_URL="${SUPABASE_URL:?ERROR: SUPABASE_URL not set}"
AGENT_SECRET_KEY="${AGENT_SECRET_KEY:?ERROR: AGENT_SECRET_KEY not set}"
SYNC_INTERVAL="${SYNC_INTERVAL:-30}"  # seconds between syncs
FIREWALL_BACKEND="${FIREWALL_BACKEND:-ipt}"  # ipt or nft
HOSTNAME_ID="${HOSTNAME_ID:-$(hostname)}"
LOG_FILE="${AEGIS_DIR}/agent.log"
RULES_DIR="${AEGIS_DIR}/rules"

# Edge function URL
SYNC_URL="${SUPABASE_URL}/functions/v1/firewall-sync"

# Colors for terminal output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# ============================================================
# Logging
# ============================================================
log() {
  local level="$1"
  shift
  local msg="$*"
  local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
  echo -e "${timestamp} [${level}] ${msg}" | tee -a "$LOG_FILE"
}

log_info()  { log "INFO " "$*"; }
log_warn()  { log "WARN " "${YELLOW}$*${NC}"; }
log_error() { log "ERROR" "${RED}$*${NC}"; }
log_ok()    { log "OK   " "${GREEN}$*${NC}"; }

# ============================================================
# Initialization
# ============================================================
init() {
  mkdir -p "$RULES_DIR"
  mkdir -p "${AEGIS_DIR}/backups"
  
  log_info "=== Aegis NGFW Agent Starting ==="
  log_info "Hostname: $HOSTNAME_ID"
  log_info "Backend: $FIREWALL_BACKEND"
  log_info "Sync interval: ${SYNC_INTERVAL}s"
  log_info "Sync URL: $SYNC_URL"

  # Check required tools
  for cmd in curl jq; do
    if ! command -v "$cmd" &>/dev/null; then
      log_error "Required command not found: $cmd"
      exit 1
    fi
  done

  # Check firewall backend
  if [[ "$FIREWALL_BACKEND" == "nft" ]]; then
    if ! command -v nft &>/dev/null; then
      log_error "nftables not installed. Install: apt install nftables"
      exit 1
    fi
  else
    if ! command -v iptables &>/dev/null; then
      log_error "iptables not installed. Install: apt install iptables"
      exit 1
    fi
  fi
}

# ============================================================
# Fetch rules from cloud
# ============================================================
fetch_rules() {
  local format="$FIREWALL_BACKEND"
  local response
  local http_code

  response=$(curl -s -w "\n%{http_code}" \
    -H "x-agent-key: $AGENT_SECRET_KEY" \
    -H "Content-Type: application/json" \
    "${SYNC_URL}?format=${format}&section=all" \
    2>&1)

  http_code=$(echo "$response" | tail -1)
  local body=$(echo "$response" | sed '$d')

  if [[ "$http_code" != "200" ]]; then
    log_error "Failed to fetch rules. HTTP $http_code"
    log_error "Response: $body"
    return 1
  fi

  echo "$body"
}

# ============================================================
# Backup current rules
# ============================================================
backup_rules() {
  local backup_file="${AEGIS_DIR}/backups/rules_$(date +%Y%m%d_%H%M%S)"

  if [[ "$FIREWALL_BACKEND" == "nft" ]]; then
    nft list ruleset > "${backup_file}.nft" 2>/dev/null || true
  else
    iptables-save > "${backup_file}.v4" 2>/dev/null || true
  fi

  ip route show > "${backup_file}.routes" 2>/dev/null || true
  log_info "Rules backed up to ${backup_file}"
}

# ============================================================
# Apply firewall rules
# ============================================================
apply_firewall() {
  local rules_json="$1"
  local commands_file="${RULES_DIR}/firewall.sh"

  # Extract commands from JSON
  echo "$rules_json" | jq -r '.firewall.commands[]' > "$commands_file" 2>/dev/null

  if [[ ! -s "$commands_file" ]]; then
    log_warn "No firewall commands to apply"
    return 0
  fi

  log_info "Applying firewall rules..."
  
  # Make executable and run
  chmod +x "$commands_file"
  if bash "$commands_file" 2>&1 | tee -a "$LOG_FILE"; then
    log_ok "Firewall rules applied successfully"
    return 0
  else
    log_error "Error applying firewall rules"
    return 1
  fi
}

# ============================================================
# Apply NAT rules
# ============================================================
apply_nat() {
  local rules_json="$1"
  local commands_file="${RULES_DIR}/nat.sh"

  echo "$rules_json" | jq -r '.nat.commands[]' > "$commands_file" 2>/dev/null

  if [[ ! -s "$commands_file" ]]; then
    log_warn "No NAT commands to apply"
    return 0
  fi

  log_info "Applying NAT rules..."
  if bash "$commands_file" 2>&1 | tee -a "$LOG_FILE"; then
    log_ok "NAT rules applied successfully"
    return 0
  else
    log_error "Error applying NAT rules"
    return 1
  fi
}

# ============================================================
# Apply routes
# ============================================================
apply_routes() {
  local rules_json="$1"
  local commands_file="${RULES_DIR}/routes.sh"

  echo "$rules_json" | jq -r '.routes.commands[]' > "$commands_file" 2>/dev/null

  if [[ ! -s "$commands_file" ]]; then
    log_warn "No route commands to apply"
    return 0
  fi

  log_info "Applying routing configuration..."
  if bash "$commands_file" 2>&1 | tee -a "$LOG_FILE"; then
    log_ok "Routes applied successfully"
    return 0
  else
    log_error "Error applying routes"
    return 1
  fi
}

# ============================================================
# Apply traffic shaping
# ============================================================
apply_shaping() {
  local rules_json="$1"
  local commands_file="${RULES_DIR}/shaping.sh"

  echo "$rules_json" | jq -r '.shaping.commands[]' > "$commands_file" 2>/dev/null

  if [[ ! -s "$commands_file" ]]; then
    log_warn "No shaping commands to apply"
    return 0
  fi

  log_info "Applying traffic shaping..."
  if bash "$commands_file" 2>&1 | tee -a "$LOG_FILE"; then
    log_ok "Traffic shaping applied successfully"
    return 0
  else
    log_error "Error applying traffic shaping"
    return 1
  fi
}

# ============================================================
# Apply interface configuration
# ============================================================
apply_interfaces() {
  local rules_json="$1"
  local commands_file="${RULES_DIR}/interfaces.sh"

  echo "$rules_json" | jq -r '.interfaces.commands[]' > "$commands_file" 2>/dev/null

  if [[ ! -s "$commands_file" ]]; then
    log_warn "No interface commands to apply"
    return 0
  fi

  log_info "Applying interface configuration..."
  if bash "$commands_file" 2>&1 | tee -a "$LOG_FILE"; then
    log_ok "Interface configuration applied successfully"
    return 0
  else
    log_error "Error applying interfaces"
    return 1
  fi
}

# ============================================================
# Apply Suricata IDS rules
# ============================================================
apply_ids() {
  local rules_json="$1"

  if ! command -v suricata &>/dev/null; then
    log_warn "Suricata not installed, skipping IDS configuration"
    return 0
  fi

  local rules_file="/etc/suricata/rules/aegis-custom.rules"
  
  echo "$rules_json" | jq -r '.ids.config.local_rules[]' > "$rules_file" 2>/dev/null

  if [[ -s "$rules_file" ]]; then
    log_info "Updating Suricata rules..."
    suricata-update 2>/dev/null || true
    systemctl reload suricata 2>/dev/null || true
    log_ok "Suricata rules updated"
  fi
}

# ============================================================
# Report status back to cloud
# ============================================================
report_status() {
  local status="$1"
  local applied_rules="$2"
  local errors="$3"
  local sections="$4"

  curl -s -X POST \
    -H "x-agent-key: $AGENT_SECRET_KEY" \
    -H "Content-Type: application/json" \
    -d "{
      \"hostname\": \"$HOSTNAME_ID\",
      \"status\": \"$status\",
      \"applied_rules\": $applied_rules,
      \"errors\": $errors,
      \"sections\": $sections,
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"backend\": \"$FIREWALL_BACKEND\"
    }" \
    "$SYNC_URL" >/dev/null 2>&1 || log_warn "Failed to report status"
}

# ============================================================
# Main sync loop
# ============================================================
sync_once() {
  local rules_json
  local applied=0
  local errors=0
  local sections="[]"

  rules_json=$(fetch_rules) || return 1

  # Validate JSON
  if ! echo "$rules_json" | jq . >/dev/null 2>&1; then
    log_error "Invalid JSON response"
    return 1
  fi

  # Check if rules have changed (compare hash)
  local new_hash=$(echo "$rules_json" | md5sum | cut -d' ' -f1)
  local hash_file="${AEGIS_DIR}/.last_hash"
  local old_hash=""

  if [[ -f "$hash_file" ]]; then
    old_hash=$(cat "$hash_file")
  fi

  if [[ "$new_hash" == "$old_hash" ]]; then
    log_info "No changes detected, skipping apply"
    return 0
  fi

  log_info "Changes detected, applying new configuration..."

  # Backup current state
  backup_rules

  # Apply each section
  local applied_sections=()

  if echo "$rules_json" | jq -e '.interfaces' >/dev/null 2>&1; then
    if apply_interfaces "$rules_json"; then
      ((applied++))
      applied_sections+=("interfaces")
    else
      ((errors++))
    fi
  fi

  if echo "$rules_json" | jq -e '.firewall' >/dev/null 2>&1; then
    if apply_firewall "$rules_json"; then
      ((applied++))
      applied_sections+=("firewall")
    else
      ((errors++))
    fi
  fi

  if echo "$rules_json" | jq -e '.nat' >/dev/null 2>&1; then
    if apply_nat "$rules_json"; then
      ((applied++))
      applied_sections+=("nat")
    else
      ((errors++))
    fi
  fi

  if echo "$rules_json" | jq -e '.routes' >/dev/null 2>&1; then
    if apply_routes "$rules_json"; then
      ((applied++))
      applied_sections+=("routes")
    else
      ((errors++))
    fi
  fi

  if echo "$rules_json" | jq -e '.shaping' >/dev/null 2>&1; then
    if apply_shaping "$rules_json"; then
      ((applied++))
      applied_sections+=("shaping")
    else
      ((errors++))
    fi
  fi

  if echo "$rules_json" | jq -e '.ids' >/dev/null 2>&1; then
    apply_ids "$rules_json"
    ((applied++))
    applied_sections+=("ids")
  fi

  # Save hash if successful
  if [[ $errors -eq 0 ]]; then
    echo "$new_hash" > "$hash_file"
    log_ok "All sections applied successfully"
  else
    log_warn "Completed with $errors error(s)"
  fi

  # Build sections JSON array
  sections=$(printf '%s\n' "${applied_sections[@]}" | jq -R . | jq -s .)

  # Report back
  local status="success"
  [[ $errors -gt 0 ]] && status="partial"
  report_status "$status" "$applied" "$errors" "$sections"
}

# ============================================================
# Daemon mode
# ============================================================
run_daemon() {
  init

  trap 'log_info "Agent stopping..."; exit 0' SIGTERM SIGINT

  while true; do
    sync_once || log_warn "Sync cycle failed"
    sleep "$SYNC_INTERVAL"
  done
}

# ============================================================
# CLI
# ============================================================
case "${1:-daemon}" in
  daemon)
    run_daemon
    ;;
  sync)
    init
    sync_once
    ;;
  fetch)
    init
    fetch_rules | jq .
    ;;
  backup)
    init
    backup_rules
    ;;
  *)
    echo "Usage: $0 {daemon|sync|fetch|backup}"
    echo ""
    echo "  daemon  - Run as background service (default)"
    echo "  sync    - Run one sync cycle and exit"
    echo "  fetch   - Fetch rules from cloud and display"
    echo "  backup  - Backup current iptables/nftables rules"
    exit 1
    ;;
esac
