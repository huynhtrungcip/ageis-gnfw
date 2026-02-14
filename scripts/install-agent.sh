#!/bin/bash
# ============================================================
# Aegis NGFW Agent - Installer for Ubuntu 24.04 LTS
# Version: 2.0 — Full Self-Hosted
# ============================================================
# Usage:
#   sudo bash install-agent.sh
#   sudo bash install-agent.sh --api-url http://localhost:8080/api
#   sudo bash install-agent.sh --with-dhcp --with-ids
# ============================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'

AEGIS_DIR="/opt/aegis"
API_URL="${API_URL:-}"
INSTALL_DHCP=false
INSTALL_DNS=false
INSTALL_IDS=false
INSTALL_VPN=false

# Parse args
while [[ $# -gt 0 ]]; do
  case $1 in
    --api-url) API_URL="$2"; shift 2 ;;
    --with-dhcp) INSTALL_DHCP=true; shift ;;
    --with-dns) INSTALL_DNS=true; shift ;;
    --with-ids) INSTALL_IDS=true; shift ;;
    --with-vpn) INSTALL_VPN=true; shift ;;
    --full) INSTALL_DHCP=true; INSTALL_DNS=true; INSTALL_IDS=true; INSTALL_VPN=true; shift ;;
    *) shift ;;
  esac
done

echo -e "${CYAN}"
echo "  ╔══════════════════════════════════════════╗"
echo "  ║     Aegis NGFW Agent Installer v2.0      ║"
echo "  ║     Ubuntu 24.04 LTS — Self-Hosted       ║"
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

echo -e "${GREEN}[1/7]${NC} Installing core dependencies..."
apt-get update -qq
apt-get install -y -qq curl jq bc nftables iptables iproute2 >/dev/null

echo -e "${GREEN}[2/7]${NC} Installing optional services..."
if [[ "$INSTALL_DHCP" == "true" || "$INSTALL_DNS" == "true" ]]; then
  echo "  → Installing dnsmasq..."
  apt-get install -y -qq dnsmasq >/dev/null
  # Disable default dnsmasq to let agent manage config
  systemctl stop dnsmasq 2>/dev/null || true
  systemctl disable dnsmasq 2>/dev/null || true
fi

if [[ "$INSTALL_IDS" == "true" ]]; then
  echo "  → Installing Suricata..."
  apt-get install -y -qq suricata >/dev/null
fi

if [[ "$INSTALL_VPN" == "true" ]]; then
  echo "  → Installing StrongSwan & WireGuard..."
  apt-get install -y -qq strongswan wireguard-tools >/dev/null
fi

echo -e "${GREEN}[3/7]${NC} Creating directory structure..."
mkdir -p "$AEGIS_DIR"/{rules,backups}

echo -e "${GREEN}[4/7]${NC} Installing agent script..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/aegis-agent.sh" "$AEGIS_DIR/aegis-agent.sh"
chmod +x "$AEGIS_DIR/aegis-agent.sh"

echo -e "${GREEN}[5/7]${NC} Creating configuration..."
if [[ ! -f "$AEGIS_DIR/.env" ]]; then
  # Prompt for API URL if not provided
  if [[ -z "$API_URL" ]]; then
    echo -en "  Enter API URL [http://localhost:8080/api]: "
    read -r API_URL
    API_URL="${API_URL:-http://localhost:8080/api}"
  fi

  # Detect default interface
  local_iface=$(ip route get 8.8.8.8 2>/dev/null | grep -oP 'dev \K\S+' || echo "eth0")

  # Detect all interfaces
  all_ifaces=$(ip -o link show | awk -F': ' '{print $2}' | grep -v lo | head -5)
  iface_wan="$local_iface"
  iface_lan=$(echo "$all_ifaces" | grep -v "$local_iface" | head -1 || echo "eth1")
  iface_dmz=$(echo "$all_ifaces" | grep -v "$local_iface" | sed -n '2p' || echo "eth2")

  cat > "$AEGIS_DIR/.env" <<EOF
# Aegis NGFW Agent Configuration v2.0
API_URL=${API_URL}
AGENT_SECRET_KEY=
SYNC_INTERVAL=60
METRICS_INTERVAL=30
FIREWALL_BACKEND=nft
HOSTNAME_ID=$(hostname)
IFACE_WAN=${iface_wan}
IFACE_LAN=${iface_lan}
IFACE_DMZ=${iface_dmz}
IFACE_GUEST=eth3
IFACE_WAN2=eth4
DHCP_BACKEND=dnsmasq
DNS_BACKEND=dnsmasq
DNSMASQ_CONF_DIR=/etc/dnsmasq.d
AEGIS_DIR=/opt/aegis
DRY_RUN=false
EOF

  echo -e "  Config created at ${CYAN}$AEGIS_DIR/.env${NC}"
  echo -e "  ${YELLOW}→ Detected WAN: $iface_wan, LAN: $iface_lan${NC}"
  echo -e "  ${YELLOW}→ Edit interface mapping if needed: nano $AEGIS_DIR/.env${NC}"
else
  echo -e "  Config already exists, skipping"
fi

echo -e "${GREEN}[6/7]${NC} Installing systemd service..."
cp "$SCRIPT_DIR/aegis-agent.service" /etc/systemd/system/aegis-agent.service
systemctl daemon-reload

echo -e "${GREEN}[7/7]${NC} Setting up log rotation..."
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

# Enable IP forwarding permanently
echo "net.ipv4.ip_forward = 1" > /etc/sysctl.d/90-aegis.conf
sysctl -p /etc/sysctl.d/90-aegis.conf 2>/dev/null || true

echo ""
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo -e "${GREEN}  Aegis NGFW Agent v2.0 — Installation OK  ${NC}"
echo -e "${GREEN}════════════════════════════════════════════${NC}"
echo ""
echo "Next steps:"
echo -e "  1. Edit config:      ${CYAN}nano $AEGIS_DIR/.env${NC}"
echo -e "  2. Verify interfaces: ${CYAN}ip link show${NC}"
echo -e "  3. Test connection:  ${CYAN}$AEGIS_DIR/aegis-agent.sh status${NC}"
echo -e "  4. Dry-run test:     ${CYAN}$AEGIS_DIR/aegis-agent.sh test${NC}"
echo -e "  5. Start service:    ${CYAN}systemctl enable --now aegis-agent${NC}"
echo -e "  6. View logs:        ${CYAN}tail -f $AEGIS_DIR/agent.log${NC}"
echo ""

# Services status
echo -e "${CYAN}Installed services:${NC}"
for svc in nftables dnsmasq suricata strongswan; do
  if dpkg -l "$svc" &>/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $svc"
  else
    echo -e "  ${YELLOW}○${NC} $svc (not installed)"
  fi
done
echo ""
echo -e "${YELLOW}Note: The agent reads ALL config from the local PostgREST API.${NC}"
echo -e "${YELLOW}No cloud services required. 100% self-hosted.${NC}"
echo ""
