# Jain Distributor API (`backend/`)

REST API for the Jain Distributor – Sales Field Management System (PRD INV-JDS-PRD-01).
Node.js 22, Express 5, TypeScript, PostgreSQL 16.

## Run locally

```bash
cd backend
cp .env.example .env            # point DATABASE_URL at a PostgreSQL database
npm install
npm run seed                    # migrations + bootstrap admin + demo data (optional)
npm run dev                     # http://localhost:4000
```

Or run the whole stack from the repository root with `docker compose up -d --build`.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start with reload (tsx) |
| `npm run build` / `npm start` | Compile to `dist/` and run |
| `npm run migrate` | Apply pending SQL migrations (also runs on every start) |
| `npm run seed` | Demo villages, shops, salespersons and orders (skipped if villages exist) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit and API tests. Needs PostgreSQL: set `TEST_DATABASE_URL` (default `postgres://jain:jain@localhost:5432/jain_test`). **The test database is wiped.** |

Demo accounts after seeding: `admin@jain.com` / value of `ADMIN_PASSWORD`, and
`amol@jain.com`, `santosh@jain.com` / `sales123` (`rahul@jain.com` is inactive).

## Configuration

All settings come from environment variables and are validated on start (see `.env.example`).

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | – | Required. `DATABASE_SSL=true` for managed databases. |
| `JWT_SECRET` | – | Required; at least 32 characters in production. |
| `JWT_EXPIRES_IN` | `7d` | Field staff stay signed in for a week. |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma separated; `*` allows any origin. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | – | First admin, created only when no admin exists. |
| `STT_PROVIDER` | `mock` | `google` or `mock`. |
| `GOOGLE_SPEECH_API_KEY` | – | Required for `google`. Restrict the key to the Speech-to-Text API. |
| `STT_LANGUAGE` | `mr-IN` | Recognition language. |
| `STT_MODEL` | `latest_long` | Google model. Falls back to the default model automatically if Google rejects it. |
| `STT_PHRASE_BOOST` | `12` | Boost (0–20) for the built-in kirana vocabulary: products, brands, units and Marathi number words. `0` turns hints off. |
| `STT_EXTRA_PHRASES` | – | Comma separated extra words to boost, e.g. local brands: `गणेश चहा,श्री मसाले`. |
| `STT_ALTERNATIVE_LANGUAGES` | – | Optional extra languages to auto-detect, e.g. `hi-IN`. Off by default because it pulls Marathi words into Hindi spellings. |
| `STT_MIN_CONFIDENCE` | `0.7` | Below this, the transcript is flagged `needsReview` and unsure words are returned in `lowConfidenceWords`. |
| `MOCK_TRANSCRIPT` | PRD example sentence | What the mock provider returns. |
| `MAX_AUDIO_MB` | `10` | Upload limit for recordings. |
| `BUSINESS_TZ_OFFSET_MINUTES` | `330` | Defines "today" for dashboards (IST). |

## API reference

Base path `/api/v1`. Send `Authorization: Bearer <token>` on everything except login and register.
Errors look like `{ "error": { "code": "NOT_FOUND", "message": "...", "details": [...] } }`.
Lists return `{ data: [...] }`; paginated lists add `meta: { page, pageSize, total, totalPages }`.
Dates in query strings are `YYYY-MM-DD` in business time (IST).

### Health

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Liveness |
| GET | `/health/ready` | Database connectivity (503 when down) |

### Auth

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/auth/login` | public | `{ email, password }` → `{ token, user }`. Codes: `INVALID_CREDENTIALS`, `ACCOUNT_INACTIVE`. |
| POST | `/auth/register` | public | Salesperson sign-up `{ name, nameEn?, email, mobile, password }`; created inactive. |
| GET | `/auth/me` | any | Profile including `assignedVillages`. |
| POST | `/auth/change-password` | any | `{ currentPassword, newPassword }`. |

### Salespersons (admin)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/salespersons?status=&q=&date=` | With `todayVisits` (shops), `todayVillageVisits`, `todayOrders`, `assignedVillages`, `lastLoginAt`. |
| POST | `/salespersons` | `{ name, nameEn?, email, mobile, password, status?, assignedVillageIds? }` |
| GET / PATCH / DELETE | `/salespersons/:id` | Delete is soft and blocks login. |
| PATCH | `/salespersons/:id/status` | `{ status: "ACTIVE" | "INACTIVE" }`; also approves sign-ups. |
| POST | `/salespersons/:id/reset-password` | `{ newPassword }` |

### Villages

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/villages?status=&q=&date=&assigned=` | any | With `shopsCount`, `visitsToday`, `shopsVisitedToday`, `ordersToday`. Salespersons only get active villages; `assigned=true` limits to their assigned ones (falls back to all if none). |
| GET | `/villages/:id` | any | |
| POST | `/villages` | admin | `{ marathiName, englishName, taluka?, district?, status? }` |
| PATCH / DELETE | `/villages/:id` | admin | Delete also hides the village's shops. |

### Shops

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/shops?villageId=&q=&page=&pageSize=` | any | Includes village names and `lastOrderAt`. |
| GET | `/shops/:id` | any | |
| POST | `/shops` | any | `{ name, nameEn?, ownerName?, ownerNameEn?, mobile?, address?, addressEn?, villageId, outstandingBalance? }`. Balance is admin-only. |
| PATCH / DELETE | `/shops/:id` | admin | |

### Voice

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/voice/transcribe` | any | `multipart/form-data` with `audio` (webm/opus, ogg, wav, flac, mp3) and optional `sampleRate`. Returns `{ text, confidence, needsReview, lowConfidenceWords, provider, language, items, unparsed, summary }`. `needsReview` is true when confidence is under `STT_MIN_CONFIDENCE`, a word was unsure or a part of the order could not be read. 422 `NO_SPEECH` when nothing was recognised. |
| POST | `/voice/parse` | any | `{ text }` → `{ items, unparsed, summary }` after the transcript is edited. |

Items look like `{ "name": "रवा", "nameEn": "Rava", "quantity": 10, "unit": "किलो (kg)", "unitCode": "KG" }`.

### Orders

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/orders` | salesperson | `{ shopId, transcribedText, items?, notes? }`. Items are read from the text when omitted. Also records a shop visit. |
| GET | `/orders?date=&from=&to=&salespersonId=&villageId=&shopId=&status=&q=&page=&pageSize=` | any | Salespersons only see their own. `q` searches transcript, shop, salesperson and `ORD-` number. |
| GET | `/orders/:id` | any | Includes salesperson, village and shop details. |
| PATCH | `/orders/:id` | admin | `{ transcribedText?, items?, notes?, status? }` (`CONFIRMED`, `DELIVERED`, `CANCELLED`). |

### Visits

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/visits` | salesperson | `{ villageId, shopId?, notes? }`. Call when a village or shop is selected. |
| GET | `/visits?date=&salespersonId=&villageId=` | any | Activity log; salespersons see their own. |

### Dashboard (admin)

| Method | Path | Description |
| --- | --- | --- |
| GET | `/dashboard/summary?date=` | `activeSalespersons`, `totalSalespersons`, `salespersonsInFieldToday`, `villageVisitsToday`, `shopsVisitedToday`, `ordersToday`, `totalVillages`, `totalShops`. |
| GET | `/dashboard/recent-orders?limit=` | Latest orders for the dashboard panel. |

The per-village and per-salesperson dashboard tables use `GET /villages` and `GET /salespersons`.

## Project layout

```
backend/
  migrations/          SQL migrations, applied in filename order
  src/
    app.ts             Express app (routes, middleware)
    index.ts           Server start: migrate → bootstrap admin → listen
    config.ts          Validated environment
    db/                Pool, migration runner, bootstrap admin, demo seed
    middleware/        Auth (JWT + role checks), error handling
    modules/           auth, salespersons, villages, shops, orders, visits, dashboard, voice
  tests/               Vitest unit and API tests
```

Add a schema change by creating the next numbered file in `migrations/` (e.g. `002_products.sql`).
