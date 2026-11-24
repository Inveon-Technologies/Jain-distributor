#!/usr/bin/env bash
# Updates a server that builds its own images (API_IMAGE/WEB_IMAGE=...:local in /opt/jain-distributor/.env).
# Run as root:  sudo bash update-server.sh [git-ref]      (default: origin/main)
#
# What it does, in order, and stops on the first error:
#   1. dumps the database (a failed backup aborts the update)
#   2. fetches the repo and checks out the requested ref
#   3. installs this repo's docker-compose.prod.yml and Caddyfile into the deploy directory
#   4. rebuilds the api and web images, restarts the stack and waits for /health/ready
# Rolling back: re-run with the previous commit id (printed at the start); restore data from backups/ if needed.
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/jain-distributor}"
SRC_DIR="${SRC_DIR:-/home/ubuntu/app}"
REF="${1:-origin/main}"
COMPOSE=(docker compose -f docker-compose.prod.yml)

[ "$(id -u)" -eq 0 ] || { echo "Run as root (sudo)." >&2; exit 1; }
[ -f "$APP_DIR/.env" ] || { echo "$APP_DIR/.env is missing." >&2; exit 1; }
[ -d "$SRC_DIR/.git" ] || { echo "$SRC_DIR is not a git checkout." >&2; exit 1; }

# The same variable twice in .env is almost always a mistake (the last one silently wins).
dups=$(grep -E '^[A-Z_]+=' "$APP_DIR/.env" | cut -d= -f1 | sort | uniq -d || true)
if [ -n "$dups" ]; then
  echo "Duplicate keys in $APP_DIR/.env, remove the extra lines first:" >&2
  echo "$dups" >&2
  exit 1
fi

cd "$SRC_DIR"
echo "Currently deployed commit: $(git rev-parse --short HEAD)"

echo "==> Backing up the database"
( cd "$APP_DIR" && bash ./backup-db.sh )

echo "==> Fetching $REF"
git fetch --all --prune
git checkout --force --detach "$REF"
echo "Deploying commit: $(git rev-parse --short HEAD)"

echo "==> Installing compose file and Caddyfile"
install -m 644 deploy/docker-compose.prod.yml "$APP_DIR/docker-compose.prod.yml"
mkdir -p "$APP_DIR/caddy"
install -m 644 deploy/caddy/Caddyfile "$APP_DIR/caddy/Caddyfile"
install -m 750 deploy/backup-db.sh "$APP_DIR/backup-db.sh"

echo "==> Building images"
set -a; . "$APP_DIR/.env"; set +a
API_URL="${NEXT_PUBLIC_API_URL:-https://${DOMAIN}/api/v1}"
docker build -t "${API_IMAGE:-jain-distributor-api:local}" ./backend
docker build -t "${WEB_IMAGE:-jain-distributor-web:local}" --build-arg NEXT_PUBLIC_API_URL="$API_URL" .

echo "==> Restarting"
cd "$APP_DIR"
"${COMPOSE[@]}" config -q
"${COMPOSE[@]}" up -d --remove-orphans
"${COMPOSE[@]}" exec -T caddy caddy reload --config /etc/caddy/Caddyfile || true

for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:4000/health/ready >/dev/null; then
    echo "API healthy."; docker image prune -f >/dev/null; exit 0
  fi
  sleep 2
done
echo "API did not become healthy:" >&2
"${COMPOSE[@]}" logs --tail=100 api >&2
exit 1
