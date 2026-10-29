# Deploying Jain Distributor to a VPS

One Linux server runs the whole stack with Docker Compose:

```
Internet ──443/80──► Caddy (automatic HTTPS)
                       ├─ /api/*, /health* ─► api  (Express, port 4000)
                       └─ everything else  ─► web  (Next.js, port 3000)
                                               db   (PostgreSQL 16, internal only)
```

Only ports 22, 80 and 443 are open. The app, API and database are never exposed directly.

| File | Purpose |
| --- | --- |
| `docker-compose.prod.yml` | Production stack (db, api, web, caddy) using images from GHCR |
| `caddy/Caddyfile` | HTTPS + routing for `$DOMAIN`, `www.$DOMAIN` redirects to it |
| `.env.production.example` | Template for the server's `.env` (secrets, domain, images) |
| `setup-server.sh` | One-time server preparation (Docker, firewall, deploy user, swap, backups) |
| `backup-db.sh` | Nightly `pg_dump` to `backups/`, keeps 14 days |

## 1. Server requirements

* Ubuntu 22.04 / 24.04 or Debian 12, 64-bit.
* 2 vCPU / 2 GB RAM is enough to start (the setup script adds swap below 3 GB); 20 GB disk.
* Any provider works (Hostinger, DigitalOcean, Hetzner, AWS Lightsail, …).
* The domain: production runs on **`jaindistributor.in`** (`www.` redirects to it).

## 2. DNS

On AWS EC2, attach an **Elastic IP** first: the default public IP changes when the instance stops.

At the domain registrar, create two **A records** pointing at the server's public IPv4, and delete
any other `A`/`AAAA`/parking records for them (a stale `AAAA` record breaks the certificate):

| Name | Type | Value |
| --- | --- | --- |
| `@` | A | server IP |
| `www` | A | server IP |

Caddy requests the Let's Encrypt certificate on first start, so DNS must resolve before step 4
(check on the server with `getent hosts jaindistributor.in`). Also allow inbound 80 and 443 in
the cloud firewall (AWS: the instance's security group).

## 3. Prepare the server (once)

Generate an SSH key pair for GitHub Actions on your own computer:

```bash
ssh-keygen -t ed25519 -f jain-deploy -C "github-actions-deploy" -N ""
```

Copy `deploy/` to the server and run the setup script as root, passing the **public** key:

```bash
scp -r deploy root@SERVER_IP:/root/jain-deploy
ssh root@SERVER_IP
# paste the contents of jain-deploy.pub between the quotes
DEPLOY_PUBKEY="ssh-ed25519 AAAA... github-actions-deploy" bash /root/jain-deploy/setup-server.sh
```

The script installs Docker, creates the `deploy` user, enables the firewall and fail2ban, creates
`/opt/jain-distributor` with `docker-compose.prod.yml`, `caddy/Caddyfile`, `backup-db.sh` and a `.env`
that already has a random `POSTGRES_PASSWORD` and `JWT_SECRET`, and schedules the nightly backup.

Then edit `/opt/jain-distributor/.env` and fill in:

* `DOMAIN` (`jaindistributor.in`) and `ACME_EMAIL`
* `ADMIN_EMAIL` / `ADMIN_PASSWORD` (first admin login)
* Speech-to-text: `STT_PROVIDER=browser` works with no key (Chrome/Edge on the phone). For server-side recognition set `STT_PROVIDER=google` with `GOOGLE_SPEECH_API_KEY`, or `STT_PROVIDER=elevenlabs` with `ELEVENLABS_API_KEY`.

## 4. Configure GitHub (automatic deploys on release)

In **GitHub → Settings → Secrets and variables → Actions** of the repository:

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `DEPLOY_ENABLED` | `true` |
| Variable | `NEXT_PUBLIC_API_URL` | optional; defaults to `https://jaindistributor.in/api/v1` (baked into the web image) |
| Secret | `DEPLOY_HOST` | server IP or hostname |
| Secret | `DEPLOY_USER` | `deploy` |
| Secret | `DEPLOY_SSH_KEY` | contents of the **private** key `jain-deploy` |
| Secret | `DEPLOY_PORT` | only if SSH is not on 22 |
| Secret | `DEPLOY_PATH` | only if not `/opt/jain-distributor` |

The deploy job runs in the `production` environment, so you can add required reviewers under
**Settings → Environments → production** if every deploy should be approved.

Release (this builds images, publishes the GitHub Release and deploys):

```bash
# add a "## [1.0.1]" section to CHANGELOG.md first
git tag v1.0.1 && git push origin v1.0.1
```

To redeploy an existing version: **Actions → Release → Run workflow** with the tag.

The job copies the compose/Caddy/backup files, pulls `ghcr.io/inveon-technologies/jain-distributor-{api,web}:<version>`,
restarts the stack, reloads Caddy and waits for `/health/ready`.

## 5. Manual start (without GitHub Actions)

GHCR images of a private repository need a login with a GitHub personal access token that has `read:packages`:

```bash
sudo -iu deploy
cd /opt/jain-distributor
echo "<PAT>" | docker login ghcr.io -u <github-user> --password-stdin
docker compose -f docker-compose.prod.yml pull
docker compose -f docker-compose.prod.yml up -d
```

`API_IMAGE` / `WEB_IMAGE` in `.env` pick the version (`:latest`, `:1.0.0`, …).

### Building the images on the server instead

No registry login needed. `/opt/jain-distributor` belongs to the `deploy` user, so work as root (`sudo -i`):

```bash
git clone https://github.com/Inveon-Technologies/Jain-distributor.git /home/ubuntu/app
cd /home/ubuntu/app        # later: git pull
JWT_SECRET=x ADMIN_PASSWORD=x NEXT_PUBLIC_API_URL=https://jaindistributor.in/api/v1 docker compose build
```

(The `x` values only satisfy the build; real secrets live in `/opt/jain-distributor/.env`.)
Then set `API_IMAGE=jain-distributor-api:local` and `WEB_IMAGE=jain-distributor-web:local` in
`.env` and run `docker compose -f docker-compose.prod.yml up -d` from `/opt/jain-distributor`.

### Running on the bare IP before DNS is ready

Set `DOMAIN=:80` and `CORS_ORIGINS=http://<server-ip>` in `.env`, build the web image with
`NEXT_PUBLIC_API_URL=http://<server-ip>/api/v1`, and delete the `www.{$DOMAIN}` block at the end of
`caddy/Caddyfile`. The app is then served over plain HTTP on port 80. To switch to the domain, set
`DOMAIN=jaindistributor.in`, remove `CORS_ORIGINS` (or list both https origins), restore the Caddyfile
from the repo, rebuild the web image with the https API URL and run `up -d` again.

## 6. Check it works

```bash
curl -fsS https://jaindistributor.in/health/ready      # {"status":"ready","database":"up"}
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f --tail=100 api
```

The app starts empty apart from the admin account. To clear villages, shops, salespersons and
orders left over from the old demo seed (keeps admins; take a backup first, it is irreversible):

```bash
docker compose -f docker-compose.prod.yml exec -T db \
  sh -c 'psql -v ON_ERROR_STOP=1 -U "$POSTGRES_USER" -d "$POSTGRES_DB"' < clear-demo-data.sql
```

## Operations

**Backups** run nightly at 02:30 into `/opt/jain-distributor/backups` (log in `backups/backup.log`).
Run one now with `./backup-db.sh`. Copy them off the server regularly (e.g. `rsync`, or your
provider's snapshot feature). Restore:

```bash
gunzip -c backups/<file>.sql.gz | docker compose -f docker-compose.prod.yml exec -T db \
  psql -U jain -d jain_distributor
```

**Rollback:** run the Release workflow manually with the previous tag, or set `API_IMAGE`/`WEB_IMAGE`
in `.env` to the previous version and `docker compose -f docker-compose.prod.yml up -d`.
Database migrations only move forward, so restore a backup if a migration has to be undone.

**Updates to the OS** install automatically (unattended-upgrades). Reboot occasionally;
all containers restart on their own (`restart: always`).

**Certificates** renew automatically; they are stored in the `caddy_data` volume.
