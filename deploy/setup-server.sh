#!/usr/bin/env bash
# One-time preparation of a fresh Ubuntu 22.04 / 24.04 (or Debian 12) VPS for Jain Distributor.
# Run as root:  curl -fsSL <raw url of this file> | sudo bash
#          or:  sudo bash setup-server.sh
#
# What it does (safe to re-run):
#   - installs Docker Engine + Compose plugin, ufw, fail2ban, unattended-upgrades
#   - creates a "deploy" user (docker group) for GitHub Actions SSH deploys
#   - opens only SSH, HTTP and HTTPS in the firewall
#   - adds a 2 GB swap file on small servers
#   - creates /opt/jain-distributor and a nightly database backup cron job
#
# Optional environment variables:
#   DEPLOY_USER (default: deploy)   APP_DIR (default: /opt/jain-distributor)
#   SSH_PORT (default: 22)          DEPLOY_PUBKEY (public key allowed to log in as DEPLOY_USER)
set -euo pipefail

DEPLOY_USER="${DEPLOY_USER:-deploy}"
APP_DIR="${APP_DIR:-/opt/jain-distributor}"
SSH_PORT="${SSH_PORT:-22}"
DEPLOY_PUBKEY="${DEPLOY_PUBKEY:-}"
REPO_RAW="https://raw.githubusercontent.com/Inveon-Technologies/Jain-distributor/main/deploy"

if [ "$(id -u)" -ne 0 ]; then
  echo "Run as root (sudo bash $0)" >&2
  exit 1
fi

log() { printf '\n==> %s\n' "$*"; }

log "Installing base packages"
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl gnupg ufw fail2ban unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

if ! command -v docker >/dev/null 2>&1; then
  log "Installing Docker Engine"
  curl -fsSL https://get.docker.com | sh
fi
systemctl enable --now docker

log "Configuring Docker log rotation"
if [ ! -f /etc/docker/daemon.json ]; then
  cat >/etc/docker/daemon.json <<'JSON'
{
  "log-driver": "json-file",
  "log-opts": { "max-size": "10m", "max-file": "5" }
}
JSON
  systemctl restart docker
fi

log "Creating deploy user '$DEPLOY_USER'"
if ! id "$DEPLOY_USER" >/dev/null 2>&1; then
  useradd --create-home --shell /bin/bash "$DEPLOY_USER"
fi
usermod -aG docker "$DEPLOY_USER"
install -d -m 700 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh"
touch "/home/$DEPLOY_USER/.ssh/authorized_keys"
if [ -n "$DEPLOY_PUBKEY" ] && ! grep -qF "$DEPLOY_PUBKEY" "/home/$DEPLOY_USER/.ssh/authorized_keys"; then
  echo "$DEPLOY_PUBKEY" >>"/home/$DEPLOY_USER/.ssh/authorized_keys"
fi
chown "$DEPLOY_USER:$DEPLOY_USER" "/home/$DEPLOY_USER/.ssh/authorized_keys"
chmod 600 "/home/$DEPLOY_USER/.ssh/authorized_keys"

log "Configuring firewall (SSH $SSH_PORT, HTTP, HTTPS)"
ufw default deny incoming
ufw default allow outgoing
ufw allow "$SSH_PORT/tcp"
ufw allow 80/tcp
ufw allow 443/tcp
ufw allow 443/udp
ufw --force enable

systemctl enable --now fail2ban

mem_mb=$(awk '/MemTotal/ {print int($2/1024)}' /proc/meminfo)
if [ "$mem_mb" -lt 3000 ] && ! swapon --show | grep -q '/swapfile'; then
  log "Adding 2 GB swap (RAM is ${mem_mb} MB)"
  fallocate -l 2G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  grep -q '^/swapfile' /etc/fstab || echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

log "Preparing $APP_DIR"
install -d -m 750 -o "$DEPLOY_USER" -g "$DEPLOY_USER" "$APP_DIR" "$APP_DIR/backups" "$APP_DIR/caddy"
# Files next to this script are used when present (repo checkout / scp), otherwise fetched from GitHub.
# If the repository is private the fetch fails; the release workflow copies them on the first deploy.
SRC_DIR="$(cd "$(dirname "${BASH_SOURCE[0]:-$0}")" 2>/dev/null && pwd || echo /nonexistent)"
fetch() {
  if [ -f "$SRC_DIR/$1" ]; then cp "$SRC_DIR/$1" "$2"
  else curl -fsSL "$REPO_RAW/$1" -o "$2" || echo "  could not fetch $1 (copy it to $2 yourself)"; fi
}
[ -f "$APP_DIR/docker-compose.prod.yml" ] || fetch docker-compose.prod.yml "$APP_DIR/docker-compose.prod.yml"
[ -f "$APP_DIR/caddy/Caddyfile" ] || fetch caddy/Caddyfile "$APP_DIR/caddy/Caddyfile"
[ -f "$APP_DIR/backup-db.sh" ] || fetch backup-db.sh "$APP_DIR/backup-db.sh"
if [ ! -f "$APP_DIR/.env" ]; then
  fetch .env.production.example "$APP_DIR/.env"
  touch "$APP_DIR/.env"
  # Pre-fill the generated secrets so only domain, email, admin password and API key are left.
  sed -i \
    -e "s|^POSTGRES_PASSWORD=$|POSTGRES_PASSWORD=$(openssl rand -hex 24)|" \
    -e "s|^JWT_SECRET=$|JWT_SECRET=$(openssl rand -hex 32)|" \
    "$APP_DIR/.env"
fi
chmod 600 "$APP_DIR/.env"
[ -f "$APP_DIR/backup-db.sh" ] && chmod 750 "$APP_DIR/backup-db.sh"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$APP_DIR"

log "Scheduling nightly database backup (02:30 server time)"
cat >/etc/cron.d/jain-distributor-backup <<CRON
30 2 * * * $DEPLOY_USER $APP_DIR/backup-db.sh >>$APP_DIR/backups/backup.log 2>&1
CRON
chmod 644 /etc/cron.d/jain-distributor-backup

cat <<EOF

Server is ready. Next steps:
  1. Point the DNS A record for your domain at this server's public IP.
  2. Edit $APP_DIR/.env: DOMAIN, ACME_EMAIL, ADMIN_PASSWORD, GOOGLE_SPEECH_API_KEY.
  3. Either run a release from GitHub (see deploy/README.md), or start it by hand:
       sudo -iu $DEPLOY_USER
       cd $APP_DIR && docker compose -f docker-compose.prod.yml up -d
EOF
