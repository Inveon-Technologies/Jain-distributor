#!/usr/bin/env bash
# Dumps the production database to $APP_DIR/backups and keeps the last $KEEP_DAYS days.
# Installed as a nightly cron job by setup-server.sh. Restore with:
#   gunzip -c backups/<file>.sql.gz | docker compose -f docker-compose.prod.yml exec -T db \
#     psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
set -euo pipefail

APP_DIR="${APP_DIR:-$(cd "$(dirname "$0")" && pwd)}"
KEEP_DAYS="${KEEP_DAYS:-14}"
cd "$APP_DIR"

set -a
# shellcheck disable=SC1091
. ./.env
set +a

mkdir -p backups
file="backups/${POSTGRES_DB:-jain_distributor}-$(date +%Y%m%d-%H%M%S).sql.gz"
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U "${POSTGRES_USER:-jain}" -d "${POSTGRES_DB:-jain_distributor}" --no-owner --clean --if-exists \
  | gzip >"$file"
chmod 600 "$file"
find backups -name '*.sql.gz' -mtime +"$KEEP_DAYS" -delete
echo "$(date -Is) backup written to $file"
