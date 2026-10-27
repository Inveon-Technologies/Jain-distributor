# Changelog

All notable changes to the Jain Distributor – Sales Field Management System are documented here.
The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project uses
[Semantic Versioning](https://semver.org/). Each `## [x.y.z]` section becomes the GitHub Release
notes when the matching `vx.y.z` tag is pushed.

## [Unreleased]

### Added

- VPS deployment kit in `deploy/`: Caddy reverse proxy with automatic HTTPS, production `.env`
  template, one-time server setup script, nightly database backups and a step-by-step guide.

### Changed

- Repository renamed from `Jain-distributor-web` to `Jain-distributor`. Published images are now
  `ghcr.io/inveon-technologies/jain-distributor-api` and `…/jain-distributor-web`.

## [1.0.0] - 2026-10-26

First MVP release (PRD INV-JDS-PRD-01, Phase 1 scope): backend API, containers and CI/CD.

### Added

- **Backend API** (`backend/`): Node.js 22, Express 5, TypeScript and PostgreSQL 16, versioned under `/api/v1`.
  - Email/password login for admins and salespersons with JWT bearer tokens, `GET /auth/me` and
    change password. Deactivating a salesperson blocks their existing tokens immediately.
  - Salesperson self sign-up that stays inactive until an admin activates it.
  - Admin management of salespersons (create, edit, assign villages, activate/deactivate, reset
    password, delete) with each person's visits and orders for the day.
  - Village and shop CRUD. Salespersons can add a new shop from the field ("नवीन दुकान जोडा");
    only admins can edit or delete shops or set credit balances.
  - Voice orders: `POST /voice/transcribe` accepts the browser recording, runs Marathi (`mr-IN`)
    speech-to-text and returns the transcript plus items it read from it ("रवा – 10 किलो | …").
    `POST /voice/parse` re-reads the text after the salesperson edits it.
  - Marathi order parser: reads number words (दहा, वीस, पन्नास, पाचशे, दोन हजार), fractions
    (दीड, अडीच, साडे, सव्वा, पावणे, पाव), Devanagari and ASCII digits, common units
    (किलो, ग्रॅम, लिटर, पॅकेट, बॉक्स, नग, डझन, पोते, बाटली, …) and English labels for common
    kirana items.
  - Orders (`ORD-1001`, `ORD-1002`, …) with the original transcript, reviewed items and the
    CONFIRMED → DELIVERED / CANCELLED lifecycle. Admins can search and filter by date, salesperson,
    village, shop and status, and can correct items. Salespersons only see their own orders.
  - Visit tracking: village and shop check-ins, plus one automatic shop visit for every saved order.
  - Admin dashboard: active salespersons out of total, village visits, shops visited and orders for
    the day (IST), with per-village and per-salesperson tables and recent voice orders.
  - Speech-to-text providers: `google` (Google Cloud Speech-to-Text, Marathi) and `mock` for
    development and demos.
  - SQL migrations that run automatically on start, a bootstrap admin from environment variables
    and an optional demo seed matching the frontend's mock data.
  - Health endpoints `/health` (liveness) and `/health/ready` (database check).
  - Security: helmet headers, CORS allow-list, bcrypt password hashes, rate-limited login and
    sign-up, input validation on every endpoint, and log redaction of credentials.
  - 49 automated tests: unit tests for the Marathi parser and speech provider, and API tests
    against a real PostgreSQL.
- **Docker**: multi-stage images for the API and the Next.js web app (standalone output), both
  running as a non-root user with health checks, and `docker-compose.yml` that runs
  PostgreSQL, the API and the web app together.
- **Production compose** (`deploy/docker-compose.prod.yml`) that runs the published images on a
  single server.
- **CI** (`.github/workflows/ci.yml`): web lint, typecheck and build; API lint, typecheck, tests on
  PostgreSQL and build; Docker image builds on every PR, pushed to GHCR from `main`.
- **Release pipeline** (`.github/workflows/release.yml`): on a `v*.*.*` tag it publishes versioned
  images to GHCR, creates the GitHub Release from this changelog and can deploy over SSH.

### Changed

- Next.js upgraded from 14.2.15 to 14.2.35, which includes the December 2025 security fixes.
- Next.js builds with `output: "standalone"` for the container image.

### Fixed

- Unused imports in eleven frontend pages that made `npm run lint` fail.
