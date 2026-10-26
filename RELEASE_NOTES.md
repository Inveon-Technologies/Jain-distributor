# Release Notes – v1.0.0 (MVP)

**Product:** Jain Distributor – Sales Field Management System
**Client:** Jain Distributor, Pandharpur
**Prepared by:** Inveon Technologies
**Reference:** PRD INV-JDS-PRD-01 v1.0
**Release date:** 26 October 2026

---

## Highlights

This release adds the backend behind the existing salesperson and admin screens. Field orders,
villages, shops and salesperson activity are now stored in a PostgreSQL database instead of browser
memory. The whole system runs with one `docker compose up`, and every change is checked by
GitHub Actions before it can be released.

| Area | What you get |
| --- | --- |
| Login | Email and password for admins and salespersons. New salespersons can sign up and wait for admin approval. |
| Admin dashboard | Active salespersons, village visits, shops visited and orders for today, plus per-village and per-salesperson tables. |
| Masters | Create, edit and delete villages, shops and salespersons, and assign villages to salespersons. |
| Voice orders | Upload a Marathi recording and get back the transcript and the items read from it, ready for the review screen. |
| Orders | Saved with the original transcript and the reviewed items. Admins can search, filter, correct and mark them delivered or cancelled. |
| Operations | Docker images, a compose stack with the database, health checks, automatic migrations, CI, and a tagged release pipeline. |

## PRD coverage (Phase 1 / MVP)

| PRD requirement | Status | Where |
| --- | --- | --- |
| Admin login, dashboard, active status tracking | Done | `/auth`, `/dashboard`, `/salespersons/:id/status` |
| Village and shop CRUD | Done | `/villages`, `/shops` |
| Salesperson flow: login → village → shop / add shop → voice order → review → save | Backend done | `/villages`, `/shops`, `/voice/transcribe`, `/voice/parse`, `/orders` |
| Marathi speech-to-text | Done (Google Cloud `mr-IN`, plus mock provider) | `/voice/transcribe` |
| Core data schema (Salesperson, Village, Shop, Order) | Done, plus visits and village assignment | `backend/migrations/001_init.sql` |
| Phase 2 (product catalogue, GPS, order history reminders, WhatsApp/PDF) | Not in this release | – |

## Decisions taken where the PRD left a choice

- **Stack:** Node.js 22 + Express 5 + TypeScript, to match the existing TypeScript/Next.js
  frontend so one team can work on both. The database is PostgreSQL 16 with plain SQL migrations.
- **Speech-to-text:** Google Cloud Speech-to-Text with the Marathi (`mr-IN`) model, called over
  REST with an API key. It was chosen because it supports Marathi, and the frontend handoff notes
  already named it. Set `STT_PROVIDER=mock` to run without Google (demos, CI).
- **Order items** are stored as structured JSON next to the original transcript. The Phase 2
  product catalogue can replace the free-text item names later without a data migration of
  the transcripts.
- **Deletes are soft.** Deleting a salesperson, village or shop hides it but keeps past orders
  intact for reporting.
- **Today means India time.** Dashboard counts use the business day in IST (UTC+05:30); this can be
  changed with `BUSINESS_TZ_OFFSET_MINUTES`.
- **Dashboard definitions:** a *village visit* is one salesperson visiting one village on a day,
  *shops visited* counts distinct shops, and *orders* excludes cancelled orders.
- **Deploy target:** container images are published to GitHub Container Registry (GHCR). The
  default deployment is a single Linux server (VPS) running `deploy/docker-compose.prod.yml`
  behind an HTTPS reverse proxy. The SSH deploy step is off until it is configured (see below).

## Getting started

```bash
cp .env.example .env              # set JWT_SECRET, ADMIN_PASSWORD, POSTGRES_PASSWORD
docker compose up -d --build      # db + api (:4000) + web (:3000)
docker compose exec api node dist/db/seed.js   # optional demo data (salesperson password: sales123)
```

The API documentation is in [`backend/README.md`](backend/README.md).

## Deploying a release

1. Add a `## [x.y.z]` section to `CHANGELOG.md` and merge to `main`.
2. Tag and push: `git tag v1.0.0 && git push origin v1.0.0`.
3. The **Release** workflow publishes `ghcr.io/inveon-technologies/jain-distributor-api:<version>`
   and `…-web:<version>`, then creates the GitHub Release from the changelog section.
4. Optional automatic deploy: set the repository variable `DEPLOY_ENABLED=true`, the secrets
   `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_PATH` (and `DEPLOY_PORT` if not 22),
   and put a `.env` with the production values in `DEPLOY_PATH` on the server. Approvals can be
   added through the `production` environment protection rules.

Set the repository variable `NEXT_PUBLIC_API_URL` to the public API address
(e.g. `https://api.jaindistributor.in/api/v1`) so the web image is built against it.

## Known limitations

- **The web app still uses its built-in demo data.** This release delivers the API that the
  screens will call. Connecting each page in `context/AppContext.tsx` to the API is the next step.
- Google synchronous recognition accepts recordings up to about one minute, which covers a normal
  order. Safari records MP4/AAC, which Google's v1 API does not accept; the frontend should record
  WebM/Opus or WAV.
- The Marathi item reader understands common quantity words and units. Unusual phrasing comes
  back under `unparsed` so the salesperson can correct it on the review screen.
- Forgotten passwords are reset by an admin (`POST /salespersons/:id/reset-password`); there is
  no email-based reset yet.
- Login is rate limited per IP address, so many people behind one mobile carrier IP could share
  the limit (20 attempts per 15 minutes).

## Upgrade notes

This is the first release. There is nothing to migrate. Database migrations run automatically when
the API starts.
