#!/bin/bash
set -e

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
error(){ echo -e "${RED}[✗]${NC} $1"; exit 1; }

[ "$EUID" -ne 0 ] && error "Esegui come root: sudo bash install.sh [porta]"

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_PORT="${1:-8080}"

DB_NAME="ritiri_facili"
DB_USER="ritiri_user"
DB_PASSWORD="Jordan4663"

echo ""
echo "========================================"
echo "   RitiriPro — Installazione automatica"
echo "   Porta: ${APP_PORT}"
echo "========================================"
echo ""

# ── Node.js ───────────────────────────────────
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
PORT=${APP_PORT}
DB_HOST=localhost
DB_PORT=3306
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_NAME=${DB_NAME}
UPLOAD_DIR=uploads
EOF
  log "File server/.env creato (porta ${APP_PORT})"
else
  warn "File server/.env già esistente — aggiorno solo la porta..."
  sed -i "s/^PORT=.*/PORT=${APP_PORT}/" "$ENV_FILE"
  log "Porta aggiornata a ${APP_PORT} in server/.env"
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

pm2 delete ritiripro 2>/dev/null || true
pm2 start "${SCRIPT_DIR}/server/dist/index.js" --name "ritiripro"
pm2 save
pm2 startup systemd -u root --hp /root 2>/dev/null | tail -1 | bash 2>/dev/null || true
log "App avviata con PM2 sulla porta ${APP_PORT}"

# ── Fine ──────────────────────────────────────
IP=$(hostname -I | awk '{print $1}')
echo ""
echo "========================================"
echo -e "${GREEN}   Installazione completata!${NC}"
echo "========================================"
echo ""
echo "  App:      http://${IP}:${APP_PORT}"
echo ""
echo "  Nel tuo nginx punta a:"
echo "  proxy_pass http://127.0.0.1:${APP_PORT};"
echo ""
echo "  Log:      pm2 logs ritiripro"
echo "  Riavvio:  pm2 restart ritiripro"
echo ""
