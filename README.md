# Aegis NGFW

**Next-Generation Firewall Management Platform** — Giao diện quản trị tường lửa thế hệ mới, self-hosted, tối ưu cho Ubuntu 24.04 LTS.

![License](https://img.shields.io/badge/license-MIT-green)
![Platform](https://img.shields.io/badge/platform-Ubuntu%2024.04%20LTS-orange)
![Docker](https://img.shields.io/badge/docker-compose-blue)

---

## Tính năng

- 🛡️ **Firewall Rules** — Quản lý iptables/nftables qua giao diện web
- 🌐 **Network Interfaces** — Giám sát WAN/LAN/DMZ realtime
- 📊 **System Monitoring** — CPU, RAM, Disk, Load, Traffic bandwidth
- 🔐 **VPN Management** — IPsec (strongSwan) & WireGuard
- 🤖 **AI Security** — Phân tích mối đe dọa với AI scoring
- 🔍 **IDS/IPS** — Tích hợp Suricata threat detection
- 📡 **NAT & Routing** — Static routes, Policy routes, OSPF, BGP, RIP
- 🌍 **DNS & DHCP** — DNS Server, DNS Filter, DHCP Server
- 📋 **Audit Logs** — Ghi lại mọi thay đổi cấu hình
- 💾 **Backup/Restore** — Export/Import cấu hình JSON, lịch tự động
- 👥 **RBAC** — Phân quyền: Super Admin, Admin, Operator, Auditor

## Kiến trúc

```
┌─────────────────────────────────────────────────┐
│                  Ubuntu 24.04 LTS               │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │  Nginx   │──│ PostgREST│──│ PostgreSQL 16│  │
│  │ (TLS)    │  │  (API)   │  │ (Database)   │  │
│  │ :443/:80 │  │  :3000   │  │   :5432      │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
│       │                            │            │
│  ┌──────────┐              ┌──────────────┐     │
│  │ Frontend │              │ Aegis Agent  │     │
│  │ (React)  │              │ (bash daemon)│     │
│  └──────────┘              └──────────────┘     │
│                                    │            │
│                    ┌───────────────┴──────┐      │
│                    │ iptables / nftables  │      │
│                    │ Suricata / strongSwan│      │
│                    │ WireGuard            │      │
│                    └─────────────────────-┘      │
└─────────────────────────────────────────────────┘
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS, shadcn/ui, Recharts |
| API | PostgREST v12 (auto-generated REST from PostgreSQL) |
| Database | PostgreSQL 16 |
| Web Server | Nginx 1.27 (reverse proxy, TLS, rate limiting) |
| Agent | Bash daemon (metrics collection, rule sync) |
| Container | Docker & Docker Compose |

---

## Yêu cầu hệ thống

| Thành phần | Tối thiểu | Khuyến nghị |
|-----------|----------|-------------|
| OS | Ubuntu 24.04 LTS | Ubuntu 24.04 LTS |
| CPU | 2 cores | 4+ cores |
| RAM | 2 GB | 4+ GB |
| Disk | 20 GB | 50+ GB SSD |
| Docker | 24.0+ | Latest |
| Docker Compose | v2.20+ | Latest |

---

## Cài đặt nhanh

### 1. Cài Docker (nếu chưa có)

```bash
# Cập nhật hệ thống
sudo apt update && sudo apt upgrade -y

# Cài Docker
sudo apt install -y docker.io docker-compose-plugin

# Thêm user vào group docker
sudo usermod -aG docker $USER
newgrp docker

# Kiểm tra
docker --version
docker compose version
```

### 2. Clone repository

```bash
git clone https://github.com/your-org/aegis-ngfw.git
cd aegis-ngfw
```

---

## Development Mode

Chế độ phát triển sử dụng **mock data** — không cần Docker, không cần database.

### Chạy frontend (mock data)

```bash
# Cài dependencies
npm install

# Chạy dev server
npm run dev
```

Truy cập: `http://localhost:8080`

**Login mặc định:** `admin@aegis.local` / `Admin123!`

### Chạy full stack (Docker)

```bash
# Start tất cả services
docker compose up -d

# Xem logs
docker compose logs -f

# Rebuild sau khi sửa code
docker compose up -d --build
```

| Service | URL |
|---------|-----|
| Frontend | http://localhost:8080 |
| API (PostgREST) | http://localhost:3000 |
| Database | localhost:5432 |

### Dừng services

```bash
docker compose down          # Giữ data
docker compose down -v       # Xóa cả data (reset)
```

---

## Production Deployment

### 1. Chuẩn bị cấu hình

```bash
# Tạo file cấu hình từ template
cp docker/.env.production.example .env.production

# Sửa cấu hình
nano .env.production
```

**Bắt buộc thay đổi:**

```env
# Domain của bạn (đã trỏ DNS về server IP)
DOMAIN=firewall.yourdomain.com
CERTBOT_EMAIL=admin@yourdomain.com

# Database password (mạnh, >= 16 ký tự)
POSTGRES_PASSWORD=$(openssl rand -base64 24)

# JWT secret (>= 32 ký tự)
JWT_SECRET=$(openssl rand -base64 48)

# Agent secret key
AGENT_SECRET_KEY=$(openssl rand -hex 32)
```

### 2. Deploy tự động

```bash
# Cấp quyền chạy
chmod +x scripts/deploy-production.sh

# Deploy
sudo bash scripts/deploy-production.sh
```

Script sẽ tự động:
- ✅ Kiểm tra Docker, env vars
- ✅ Lấy TLS certificate từ Let's Encrypt
- ✅ Build và khởi chạy tất cả services
- ✅ Chạy health check

### 3. Kiểm tra sau deploy

```bash
# Status containers
docker compose -f docker-compose.production.yml ps

# Test HTTPS
curl -I https://firewall.yourdomain.com/health

# Xem logs
docker compose -f docker-compose.production.yml logs -f

# Kiểm tra backup
docker exec aegis-backup ls -la /backups/
```

### Production Services

| Service | Mô tả |
|---------|-------|
| `aegis-db` | PostgreSQL 16 — hardened config, statement timeout, slow query log |
| `aegis-api` | PostgREST — connection pool 20, rate limited |
| `aegis-frontend` | Nginx — TLS 1.2/1.3, HSTS, CSP, rate limit (API: 30r/s, Login: 5r/m) |
| `aegis-certbot` | Auto-renew TLS certificate mỗi 12h |
| `aegis-backup` | Auto backup database hàng ngày 02:00 UTC, giữ 30 ngày |
| `aegis-logrotate` | Xoay log Nginx, giữ 14 ngày |

### Hardened PostgreSQL

- `scram-sha-256` password encryption
- `max_connections = 100`
- `statement_timeout = 60s`
- `idle_in_transaction_session_timeout = 300s`
- Slow query logging (> 1s)
- Autovacuum tuned
- WAL compression enabled

### Security Headers (Nginx)

- `Strict-Transport-Security` (HSTS 2 năm, preload)
- `Content-Security-Policy` (restrict scripts, styles, connections)
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Permissions-Policy` (block camera, microphone, geolocation)
- Rate limit login endpoint: **5 requests/phút**

---

## Cài đặt Aegis Agent

Agent chạy trên host Ubuntu để thu thập metrics thật và đồng bộ firewall rules.

```bash
# Cài agent
chmod +x scripts/install-agent.sh
sudo bash scripts/install-agent.sh

# Cấu hình
sudo nano /opt/aegis/.env
```

Sửa file `/opt/aegis/.env`:

```env
API_URL=https://firewall.yourdomain.com/api
AGENT_KEY=your_agent_secret_key_here
INTERVAL=30

IFACE_WAN=eth0
IFACE_LAN=eth1
IFACE_DMZ=eth2
```

```bash
# Start agent
sudo systemctl enable aegis-agent
sudo systemctl start aegis-agent

# Xem logs
sudo journalctl -u aegis-agent -f
```

### Agent thu thập gì?

| Metric | Nguồn |
|--------|-------|
| CPU usage, cores, temperature | `/proc/stat`, `sensors` |
| Memory (total/used/free/cached) | `/proc/meminfo` |
| Disk usage | `df` |
| Load average | `/proc/loadavg` |
| Network bandwidth (per interface) | `/proc/net/dev` |
| Threat events | Suricata `eve.json` |
| VPN status | `ipsec status`, `wg show` |

### Agent đồng bộ gì?

| Action | Mô tả |
|--------|-------|
| Firewall rules → iptables | Tải rules từ API, apply bằng iptables/nftables |
| NAT rules → iptables | Port forward, SNAT, DNAT |
| Static routes → ip route | Thêm/xóa route theo cấu hình |

---

## Backup & Restore

### Tự động (Production)

Backup chạy tự động mỗi ngày lúc **02:00 UTC**, giữ **30 ngày**.

```bash
# Xem danh sách backup
docker exec aegis-backup ls -lh /backups/

# Restore từ backup
docker exec -i aegis-db pg_restore \
  -U aegis -d aegis_ngfw --clean --no-owner \
  < /path/to/backup/aegis_20250206_020000.sql.gz
```

### Thủ công

```bash
# Backup
docker exec aegis-db pg_dump -U aegis aegis_ngfw | gzip > backup_manual.sql.gz

# Restore
gunzip -c backup_manual.sql.gz | docker exec -i aegis-db psql -U aegis aegis_ngfw
```

### Backup cấu hình qua UI

Trang **System > Config Backup** cho phép export/import toàn bộ cấu hình (firewall rules, NAT, routes, VPN...) dưới dạng file JSON.

---

## Cấu trúc thư mục

```
aegis-ngfw/
├── docker/
│   ├── init.sql                    # Database schema + seed data
│   ├── nginx.conf                  # Nginx dev config
│   ├── nginx-production.conf       # Nginx production (TLS, rate limit)
│   ├── postgresql-hardened.conf    # PostgreSQL hardened config
│   ├── .env.example                # Dev env template
│   └── .env.production.example     # Production env template
├── scripts/
│   ├── aegis-agent.sh              # Host agent daemon
│   ├── aegis-agent.env.example     # Agent env template
│   ├── aegis-agent.service         # Systemd service file
│   ├── install-agent.sh            # Agent installer
│   ├── backup.sh                   # Database backup script
│   └── deploy-production.sh        # Production deploy script
├── src/
│   ├── components/                 # React components
│   ├── contexts/                   # Auth context
│   ├── data/                       # Mock data
│   ├── hooks/                      # Custom hooks
│   ├── lib/                        # API client, utilities
│   ├── pages/                      # Page components
│   └── types/                      # TypeScript types
├── docker-compose.yml              # Dev stack
├── docker-compose.production.yml   # Production stack
├── Dockerfile                      # Dev build
├── Dockerfile.production           # Production build
└── README.md
```

---

## Troubleshooting

### Container không start

```bash
# Xem chi tiết lỗi
docker compose -f docker-compose.production.yml logs db
docker compose -f docker-compose.production.yml logs api

# Kiểm tra port conflict
sudo ss -tlnp | grep -E '80|443|5432|3000'
```

### TLS certificate lỗi

```bash
# Xem certificate status
docker exec aegis-certbot certbot certificates

# Force renew
docker exec aegis-certbot certbot renew --force-renewal

# Reload nginx
docker exec aegis-frontend nginx -s reload
```

### Agent không kết nối

```bash
# Test kết nối API từ host
curl -H "Authorization: Bearer $(cat /opt/aegis/.env | grep AGENT_KEY | cut -d= -f2)" \
  https://firewall.yourdomain.com/api/system_metrics

# Kiểm tra agent log
sudo journalctl -u aegis-agent --since "10 minutes ago"
```

### Reset database

```bash
docker compose -f docker-compose.production.yml down -v
docker compose -f docker-compose.production.yml up -d
```

---

## License

MIT License — xem file [LICENSE](LICENSE) để biết chi tiết.
