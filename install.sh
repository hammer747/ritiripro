#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error(){ echo -e "${RED}[✗]${NC} $1"; exit 1; }

[ "$EUID" -ne 0 ] && error "Esegui come root: sudo bash install.sh"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

DB_NAME="ritiri_facili"
DB_USER="ritiri_user"
DB_PASSWORD="Jordan4663"

echo ""
echo "========================================"
echo "   RitiriPro — Installazione automatica"
echo "========================================"
echo ""

# ── Node.js ──────────────────────────────────
if ! command -v node &>/dev/null; then
  warn "Node.js non trovato — installazione..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &>/dev/null
  apt-get install -y nodejs &>/dev/null
  log "Node.js $(node -v) installato"
else
  log "Node.js $(node -v) già presente"
fi

# ── MariaDB ───────────────────────────────────
if ! command -v mariadb &>/dev/null; then
  warn "MariaDB non trovata — installazione..."
  apt-get update -qq && apt-get install -y mariadb-server &>/dev/null
  systemctl enable --now mariadb
  log "MariaDB installata e avviata"
else
  log "MariaDB già presente"
  systemctl start mariadb 2>/dev/null || true
fi

# ── Database e utente ─────────────────────────
mariadb -u root <<SQL
CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\`
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON \`${DB_NAME}\`.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
SQL
log "Database '${DB_NAME}' e utente '${DB_USER}' configurati"

# ── File .env ─────────────────────────────────
ENV_FILE="${SCRIPT_DIR}/server/.env"
if [ ! -f "$ENV_FILE" ]; then
  cat > "$ENV_FILE" <<EOF
PORT=4000
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
UPLOAD_DIR=uploads
EOF
  log "File server/.env creato"
else
  warn "File server/.env già esistente — non modificato"
fi

# ── Cartella uploads ──────────────────────────
mkdir -p "${SCRIPT_DIR}/server/uploads"
log "Cartella server/uploads pronta"

# ── Dipendenze frontend ───────────────────────
log "Installazione dipendenze frontend..."
cd "${SCRIPT_DIR}"
npm install --silent

# ── Build frontend ────────────────────────────
log "Build frontend..."
npm run build --silent

# ── Dipendenze + build backend ────────────────
log "Installazione dipendenze backend..."
cd "${SCRIPT_DIR}/server"
npm install --silent

log "Build backend..."
npm run build --silent

# ── PM2 ──────────────────────────────────────
if ! command -v pm2 &>/dev/null; then
  warn "PM2 non trovato — installazione..."
  npm install -g pm2 --silent
  log "PM2 installato"
fi

pm2 delete ritiripro-api 2>/dev/null || true
pm2 start "${SCRIPT_DIR}/server/dist/index.js" --name "ritiripro-api"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true
log "Server avviato con PM2 (ritiripro-api)"

# ── Nginx ─────────────────────────────────────
if ! command -v nginx &>/dev/null; then
  warn "Nginx non trovato — installazione..."
  apt-get install -y nginx &>/dev/null
  log "Nginx installato"
fi

NGINX_CONF="/etc/nginx/sites-available/ritiripro"
cat > "$NGINX_CONF" <<NGINX
server {
    listen 80;
    server_name _;

    root ${SCRIPT_DIR}/dist;
    index index.html;

    location / {
        try_files \$uri \$uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:4000;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /uploads/ {
        proxy_pass http://localhost:4000;
    }
}
NGINX

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/ritiripro
rm -f /etc/nginx/sites-enabled/default
nginx -t && systemctl enable --now nginx && systemctl reload nginx
log "Nginx configurato e riavviato"

# ── Fine ──────────────────────────────────────
IP=$(hostname -I | awk '{print $1}')
echo ""
echo "========================================"
echo -e "${GREEN}   Installazione completata!${NC}"
echo "========================================"
echo ""
echo "  App:        http://${IP}"
echo "  API:        http://${IP}:4000"
echo ""
echo "  Log server: pm2 logs ritiripro-api"
echo "  Riavvio:    pm2 restart ritiripro-api"
echo ""
