<p align="center">
  <img src="public/favicon.ico" alt="Aegis NGFW" width="64" />
</p>

<h1 align="center">Aegis NGFW</h1>

<p align="center">
  <strong>Next-Generation Firewall Management Platform</strong><br/>
  100% Self-Hosted · Zero Cloud Dependencies · Ubuntu 24.04 LTS
</p>

<p align="center">
  <a href="https://github.com/huynhtrungcip/ageis-gnfw"><img src="https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub Repo" /></a>
  <a href="#-quick-start"><img src="https://img.shields.io/badge/deploy-one--click-brightgreen?style=for-the-badge" alt="One-Click Deploy" /></a>
  <a href="https://github.com/huynhtrungcip/ageis-gnfw/stargazers"><img src="https://img.shields.io/github/stars/huynhtrungcip/ageis-gnfw?style=flat-square" alt="Stars" /></a>
  <a href="https://github.com/huynhtrungcip/ageis-gnfw/issues"><img src="https://img.shields.io/github/issues/huynhtrungcip/ageis-gnfw?style=flat-square" alt="Issues" /></a>
  <img src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" alt="License" />
  <img src="https://img.shields.io/badge/platform-Ubuntu%2024.04%20LTS-E95420?style=flat-square&logo=ubuntu&logoColor=white" alt="Ubuntu" />
  <img src="https://img.shields.io/badge/docker-compose-2496ED?style=flat-square&logo=docker&logoColor=white" alt="Docker" />
  <img src="https://img.shields.io/badge/react-18-61DAFB?style=flat-square&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/postgres-16-4169E1?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL" />
</p>

---

## 🚀 Quick Start

**One command to deploy everything** — Docker, database, API, frontend, agent, and automated tests:

```bash
git clone https://github.com/huynhtrungcip/ageis-gnfw.git && cd ageis-gnfw
sudo bash scripts/deploy-oneclick.sh --dev --auto
```

That's it. Open **http://localhost:8080** → Login with `admin@aegis.local` / `Admin123!`

> **Production with TLS?**
> ```bash
> sudo bash scripts/deploy-oneclick.sh --domain firewall.yourdomain.com
> ```

<details>
<summary><strong>What does the one-click script do?</strong></summary>

1. ✅ Installs Docker & prerequisites automatically
2. ✅ Generates secure random credentials (DB password, JWT secret, Agent key)
3. ✅ Builds and launches the full Docker stack
4. ✅ Waits for PostgreSQL, PostgREST API, and Nginx to be healthy
5. ✅ Installs the Aegis Agent on the host for real metrics & rule sync
6. ✅ Installs **all security services** automatically:
   - **ClamAV** — Antivirus engine + auto virus definition updates
   - **Squid + squidclamav** — HTTP proxy with AV scanning
   - **Suricata** — IDS/IPS intrusion detection
   - **StrongSwan + WireGuard** — VPN tunnels
   - **dnsmasq** — DHCP & DNS services
7. ✅ Runs 22+ automated tests to verify everything works
8. ✅ Prints access URLs and credentials

</details>

---

## ✨ Features

| Category | Features |
|----------|----------|
| 🛡️ **Firewall** | Rule management (iptables/nftables), NAT (SNAT/DNAT/Port Forward), Virtual IPs |
| 🌐 **Networking** | Interface management (WAN/LAN/DMZ), DHCP Server, DNS Server & Filter |
| 📡 **Routing** | Static Routes, Policy Routes, OSPF, BGP, RIP |
| 🔐 **VPN** | IPsec (strongSwan), WireGuard, tunnel monitoring |
| 🔍 **Security** | IDS/IPS (Suricata), SSL Inspection, Application Control, Web/DNS Filtering |
| 🦠 **Antivirus** | ClamAV integration, protocol-level scanning (HTTP/SMTP/FTP/IMAP/POP3) |
| 🌐 **Web Filter** | Squid proxy, squidclamav HTTP scanning, URL filtering |
| 🤖 **AI Security** | Threat scoring, anomaly detection, predictive analysis |
| 📊 **Monitoring** | Real-time CPU/RAM/Disk/Traffic, Network Topology, Packet Capture |
| 🔑 **Auth & RBAC** | Role-based access: Super Admin, Admin, Operator, Auditor |
| 💾 **Backup** | Automated daily DB backup (30-day retention), config export/import (JSON) |
| 📋 **Audit** | Complete audit trail for all configuration changes |
| 📈 **Reporting** | Traffic analysis, log reports, threat summaries |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Ubuntu 24.04 LTS                  │
│                                                     │
│  ┌───────────┐  ┌───────────┐  ┌────────────────┐  │
│  │   Nginx   │──│ PostgREST │──│ PostgreSQL 16  │  │
│  │ (TLS/RL)  │  │  (API)    │  │ (Hardened)     │  │
│  │ :443/:80  │  │  :3000    │  │  :5432         │  │
│  └───────────┘  └───────────┘  └────────────────┘  │
│       │                              │              │
│  ┌───────────┐               ┌──────────────┐      │
│  │ Frontend  │               │ Aegis Agent  │      │
│  │ (React)   │               │ (host daemon)│      │
│  └───────────┘               └──────┬───────┘      │
│                                     │               │
│                      ┌──────────────┴────────┐      │
│                      │ iptables · nftables   │      │
│                      │ Suricata · strongSwan │      │
│                      │ WireGuard · ClamAV    │      │
│                      │ Squid · dnsmasq       │      │
│                      └───────────────────────┘      │
└─────────────────────────────────────────────────────┘
```

---

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts |
| **API** | PostgREST v12 — auto-generated REST API from PostgreSQL |
| **Database** | PostgreSQL 16 — hardened configuration |
| **Web Server** | Nginx 1.27 — reverse proxy, TLS 1.3, HSTS, CSP, rate limiting |
| **Agent** | Bash daemon — metrics collection, rule sync, threat monitoring |
| **Security** | ClamAV (antivirus), Squid (web filter), Suricata (IDS/IPS) |
| **Container** | Docker & Docker Compose |

---

## 📋 System Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| **OS** | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| **CPU** | 2 cores | 4+ cores |
| **RAM** | 2 GB | 4+ GB |
| **Disk** | 20 GB | 50+ GB SSD |
| **Network** | 1 NIC | 2+ NICs (WAN + LAN) |

> Docker & Docker Compose are installed automatically by the deploy script.

---

## 📦 Installation

### Option 1: One-Click Deploy (Recommended)

```bash
# Development mode (port 8080, no TLS)
sudo bash scripts/deploy-oneclick.sh --dev --auto

# Production mode (TLS via Let's Encrypt)
sudo bash scripts/deploy-oneclick.sh --domain firewall.yourdomain.com

# See all options
bash scripts/deploy-oneclick.sh --help
```

### Option 2: Manual Docker Compose

```bash
# Development
cp docker/.env.example .env
docker compose up -d

# Production
cp docker/.env.production.example .env.production
# Edit .env.production with your domain and credentials
docker compose -f docker-compose.production.yml --env-file .env.production up -d
```

### Option 3: Frontend Only (Mock Data)

```bash
npm install
npm run dev
# → http://localhost:8080
```

---

## 🔒 Security

### Production Hardening

| Feature | Details |
|---------|---------|
| **TLS** | Let's Encrypt auto-provisioned, TLS 1.2/1.3, auto-renewal every 12h |
| **HSTS** | 2 years, includeSubDomains, preload |
| **CSP** | Strict Content-Security-Policy headers |
| **Rate Limiting** | API: 30 req/s, Login: 5 req/min |
| **Security Headers** | X-Frame-Options, X-Content-Type-Options, Permissions-Policy |
| **Database** | scram-sha-256, statement timeout (60s), idle timeout (300s), WAL compression |
| **Containers** | `no-new-privileges`, resource limits, internal network |
| **Backup** | Automated daily, 30-day retention |

### Reporting Vulnerabilities

See [SECURITY.md](SECURITY.md) for our security policy and how to report vulnerabilities.

---

## 🕵️ Aegis Agent

The agent runs on the host Ubuntu system to collect real metrics and enforce firewall rules.

```bash
# Install agent (done automatically by one-click deploy)
sudo bash scripts/install-agent.sh

# Configure
sudo nano /opt/aegis/.env

# Manage
sudo systemctl status aegis-agent
sudo journalctl -u aegis-agent -f
```

**Collects:** CPU, RAM, Disk, Load, Network bandwidth, Suricata alerts, VPN status, ClamAV scan results

**Enforces:** Firewall rules → iptables/nftables, NAT rules, Static routes, AV profiles → ClamAV, Web filter → Squid

### Selective Installation

The `--full` flag installs everything, but you can pick individual modules:

```bash
sudo bash scripts/install-agent.sh --with-dhcp --with-dns    # DHCP + DNS only
sudo bash scripts/install-agent.sh --with-ids                 # Suricata IDS only
sudo bash scripts/install-agent.sh --with-av                  # ClamAV antivirus only
sudo bash scripts/install-agent.sh --with-webfilter           # Squid web filter only
sudo bash scripts/install-agent.sh --with-vpn                 # StrongSwan + WireGuard
sudo bash scripts/install-agent.sh --full                     # Everything (recommended)
```

---

## 🗂️ Project Structure

```
aegis-ngfw/
├── src/                            # React frontend
│   ├── components/                 # UI components
│   ├── pages/                      # Page views
│   ├── hooks/                      # Data fetching hooks
│   ├── lib/                        # Utilities & API client
│   └── contexts/                   # Auth & state contexts
├── docker/                         # Docker configurations
│   ├── init.sql                    # Database schema & seed data
│   ├── nginx.conf                  # Nginx dev config
│   ├── nginx-production.conf       # Nginx production (TLS, rate limit)
│   └── postgresql-hardened.conf    # PostgreSQL hardened config
├── scripts/                        # Automation scripts
│   ├── deploy-oneclick.sh          # One-click deploy (main)
│   ├── deploy-production.sh        # Production deploy
│   ├── install-agent.sh            # Agent installer
│   ├── backup.sh                   # Database backup
│   └── aegis-agent.sh              # Agent daemon
├── docker-compose.yml              # Dev stack
├── docker-compose.production.yml   # Production stack (hardened)
├── Dockerfile                      # Dev build
└── Dockerfile.production           # Production build
```

---

## 🔄 Backup & Restore

### Automated (Production)

Runs daily at **02:00 UTC**, retains **30 days**.

```bash
# List backups
docker exec aegis-backup ls -lh /backups/

# Manual backup
docker exec aegis-db pg_dump -U aegis aegis_ngfw | gzip > backup.sql.gz

# Restore
gunzip -c backup.sql.gz | docker exec -i aegis-db psql -U aegis aegis_ngfw
```

### Config Backup via UI

Navigate to **System > Config Backup** to export/import all configuration as JSON.

---

## 🐛 Troubleshooting

<details>
<summary><strong>Containers won't start</strong></summary>

```bash
docker compose logs db api frontend
sudo ss -tlnp | grep -E '80|443|5432|3000'
```
</details>

<details>
<summary><strong>TLS certificate issues</strong></summary>

```bash
docker exec aegis-certbot certbot certificates
docker exec aegis-certbot certbot renew --force-renewal
docker exec aegis-frontend nginx -s reload
```
</details>

<details>
<summary><strong>Agent not connecting</strong></summary>

```bash
sudo journalctl -u aegis-agent --since "10 minutes ago"
curl -sf http://localhost:8080/api/system_metrics
```
</details>

<details>
<summary><strong>Reset everything</strong></summary>

```bash
docker compose down -v
docker compose up -d
```
</details>

---

## 🔄 Update & Upgrade

Khi có phiên bản mới, bạn **không cần xóa và cài lại** toàn bộ hệ thống. Chỉ cần chạy lệnh update:

```bash
# Cập nhật từ GitHub và rebuild (giữ nguyên dữ liệu, cấu hình, credentials)
cd /path/to/ageis-gnfw
sudo bash scripts/deploy-oneclick.sh --update
```

Lệnh `--update` sẽ tự động:
- ✅ Pull code mới nhất từ GitHub
- ✅ Rebuild frontend container (áp dụng bug fix & tính năng mới)
- ✅ Chạy database migration nếu có thay đổi schema
- ✅ Cập nhật agent trên host
- ✅ **Giữ nguyên** dữ liệu PostgreSQL, file `.env`, credentials
- ✅ Chạy lại test suite để đảm bảo hệ thống hoạt động

> **⚠️ Lưu ý:** Lệnh update **không** reset mật khẩu, không xóa database, không thay đổi cấu hình `.env`.

---

## 📋 Changelog / Release Notes

### v2.2.0 — 2025-02-15
**🐛 Bug Fixes**
- Fix lỗi "JWT secret not configured" khi đăng nhập trên self-hosted deployment
- Truyền `app.jwt_secret` vào PostgreSQL qua docker-compose command args
- Fix bcrypt hash mặc định không khớp — dùng `crypt()` runtime thay vì hardcode hash
- Fix cả dev và production Docker Compose

**🔧 Improvements**
- Password admin được tạo động bằng `crypt()` + `gen_salt('bf')` trong init.sql
- `ON CONFLICT DO UPDATE` để tự reset password khi re-init database

### v2.1.0 — 2025-02-15
**🐛 Bug Fixes**
- Fix màn hình trắng khi deploy self-hosted (PostgREST URL construction)
- Loại bỏ dependency Supabase client khỏi app code — dùng PostgREST client thuần

**🔧 Improvements**
- Thêm lệnh `--update` cho deploy script (cập nhật không cần cài lại)
- Hỗ trợ relative URL (`/api`) cho `VITE_API_URL` trong Docker

### v2.0.0 — 2025-02-01
**🚀 Major Release**
- Kiến trúc self-hosted hoàn toàn (100% no cloud)
- Docker Compose stack: PostgreSQL + PostgREST + Nginx
- One-click deploy script cho Ubuntu 24.04 LTS
- Aegis Agent v3.0: tích hợp nftables, Suricata, ClamAV, Squid, WireGuard
- Hệ thống xác thực JWT qua PostgREST RPC
- Dashboard giám sát realtime: CPU, RAM, Disk, Traffic
- Quản lý Firewall Rules, NAT, VPN, DHCP, DNS
- AI Security Analysis & Threat Detection
- Demo mode với mock data

### v1.0.0 — 2025-01-01
**🎉 Initial Release**
- Giao diện quản trị NGFW kiểu FortiGate
- Quản lý firewall rules, interfaces, routing
- Monitoring & logging cơ bản

---

## 🤝 Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for development setup and contribution guidelines.

---

## 👨‍💻 Authors & Credits

<table>
  <tr>
    <td align="center">
      <a href="https://github.com/huynhtrungcip">
        <img src="https://github.com/huynhtrungcip.png" width="100px;" alt="Huỳnh Chí Trung" /><br />
        <sub><b>Huỳnh Chí Trung</b></sub>
      </a><br />
      <sub>💻 Creator & Lead Developer</sub><br />
      <a href="https://github.com/huynhtrungcip">GitHub</a> · <a href="mailto:huynhtrungcip@gmail.com">Email</a>
    </td>
  </tr>
</table>

> **Aegis NGFW** được phát triển và duy trì bởi [Huỳnh Chí Trung](https://github.com/huynhtrungcip).  
> Mọi đóng góp đều được chào đón — xem [CONTRIBUTING.md](CONTRIBUTING.md) để bắt đầu.

---

## 📄 License

Copyright © 2025 **Huỳnh Chí Trung** (huynhtrungcip)

This project is licensed under the **MIT License** — see [LICENSE](LICENSE) for details.

---

<p align="center">
  <strong>Aegis NGFW</strong> — Enterprise-grade firewall management, fully self-hosted.<br/>
  No cloud. No subscriptions. Your network, your rules.<br/><br/>
  Made with ❤️ by <a href="https://github.com/huynhtrungcip">Huỳnh Chí Trung</a>
</p>
