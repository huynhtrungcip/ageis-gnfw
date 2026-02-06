#!/bin/bash
# ============================================================
# Aegis NGFW Agent - Installer for Ubuntu 24.04 LTS
# ============================================================
# Usage:
#   sudo bash install-agent.sh
#   sudo bash install-agent.sh --api-url http://localhost:8080/api
# ============================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

AEGIS_DIR="/opt/aegis"
API_URL="${API_URL:-}"

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --api-url) API_URL="$2"; shift 2 ;;
    *) shift ;;
  esac
done

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     Aegis NGFW Agent Installer           ║"
echo "  ║     Ubuntu 24.04 LTS                     ║"
echo "  ╚══════════════════════════════════════════╝"
echo -e "${NC}"

# Check root
if [[ $EUID -ne 0 ]]; then
  echo -e "${RED}Error: Must run as root (sudo)${NC}"
  exit 1
fi

# Check Ubuntu
if ! grep -qi 'ubuntu' /etc/os-release 2>/dev/null; then
  echo -e "${YELLOW}Warning: Not Ubuntu. Proceed anyway? (y/N)${NC}"
  read -r confirm
  [[ "$confirm" != "y" ]] && exit 1
fi

echo -e "${GREEN}[1/6]${NC} Installing dependencies..."
apt-get update -qq
apt-get install -y -qq curl jq bc nftables iptables iproute2 >/dev/null

echo -e "${GREEN}[2/6]${NC} Creating directory structure..."
mkdir -p "$AEGIS_DIR"/{rules,backups}

echo -e "${GREEN}[3/6]${NC} Installing agent script..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/aegis-agent.sh" "$AEGIS_DIR/aegis-agent.sh"
chmod +x "$AEGIS_DIR/aegis-agent.sh"

echo -e "${GREEN}[4/6]${NC} Creating configuration..."
if [[ ! -f "$AEGIS_DIR/.env" ]]; then
  # Prompt for API URL if not provided
  if [[ -z "$API_URL" ]]; then
    echo -en "  Enter API URL [http://localhost:8080/api]: "
    read -r API_URL
    API_URL="${API_URL:-http://localhost:8080/api}"
  fi

  # Detect default interface
  local_iface=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'dev \K\S+' || echo "eth0")

  cat > "$AEGIS_DIR/.env" <<EOF
# Aegis NGFW Agent Configuration
API_URL=${API_URL}
AGENT_SECRET_KEY=
SYNC_INTERVAL=60
METRICS_INTERVAL=30
FIREWALL_BACKEND=nft
HOSTNAME_ID=$(hostname)
IFACE_WAN=${local_iface}
IFACE_LAN=eth1
IFACE_DMZ=eth2
AEGIS_DIR=/opt/aegis
EOF

  echo -e "  Config created at ${CYAN}$AEGIS_DIR/.env${NC}"
  echo -e "  ${YELLOW}→ Edit interface mapping to match your server${NC}"
else
  echo -e "  Config already exists, skipping"
fi

echo -e "${GREEN}[5/6]${NC} Installing systemd service..."
cp "$SCRIPT_DIR/aegis-agent.service" /etc/systemd/system/aegis-agent.service
systemctl daemon-reload

echo -e "${GREEN}[6/6]${NC} Setting up log rotation..."
cat > /etc/logrotate.d/aegis-agent <<'LOGROTATE'
/opt/aegis/agent.log {
    daily
    missingok
    rotate 14
    compress
    delaycompress
    notifempty
    create 0640 root root
    postrotate
        systemctl reload aegis-agent 2>/dev/null || true
    endscript
}
LOGROTATE

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Installation complete!${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo -e "  1. Edit config:     ${CYAN}nano $AEGIS_DIR/.env${NC}"
echo -e "  2. Set interfaces:  Map IFACE_WAN, IFACE_LAN to your devices"
echo -e "  3. Test connection: ${CYAN}$AEGIS_DIR/aegis-agent.sh status${NC}"
echo -e "  4. Test metrics:    ${CYAN}$AEGIS_DIR/aegis-agent.sh metrics${NC}"
echo -e "  5. Start service:   ${CYAN}systemctl enable --now aegis-agent${NC}"
echo -e "  6. View logs:       ${CYAN}tail -f $AEGIS_DIR/agent.log${NC}"
echo ""

# Optional: install additional packages
echo -e "${YELLOW}Optional packages for full feature support:${NC}"
echo "  apt install -y suricata           # IDS/IPS"
echo "  apt install -y strongswan         # IPsec VPN"
echo "  apt install -y wireguard-tools    # WireGuard VPN"
echo "  apt install -y isc-dhcp-server    # DHCP Server"
echo "  apt install -y bind9              # DNS Server"
echo ""
