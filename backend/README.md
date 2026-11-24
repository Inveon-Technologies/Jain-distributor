# Jain Distributor API (`backend/`)

REST API for the Jain Distributor – Sales Field Management System (PRD INV-JDS-PRD-01).
Node.js 22, Express 5, TypeScript, PostgreSQL 16.

## Run locally

```bash
cd backend
cp .env.example .env            # point DATABASE_URL at a PostgreSQL database
npm install
npm run migrate                 # apply SQL migrations
npm run dev                     # http://localhost:4000
```

Or run the whole stack from the repository root with `docker compose up -d --build`.

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start with reload (tsx) |
| `npm run build` / `npm start` | Compile to `dist/` and run |
| `npm run migrate` | Apply pending SQL migrations (also runs on every start) |
| `npm run lint` / `npm run typecheck` | ESLint / TypeScript |
| `npm test` | Unit and API tests. Needs PostgreSQL: set `TEST_DATABASE_URL` (default `postgres://jain:jain@localhost:5432/jain_test`). **The test database is wiped.** |

There is no demo data. On first start the API creates the admin account from `ADMIN_EMAIL` /
`ADMIN_PASSWORD`; the admin then adds villages, shops and salespersons from the web app.

## Configuration

All settings come from environment variables and are validated on start (see `.env.example`).

| Variable | Default | Notes |
| --- | --- | --- |
| `DATABASE_URL` | – | Required. `DATABASE_SSL=true` for managed databases. |
| `JWT_SECRET` | – | Required; at least 32 characters in production. |
| `JWT_EXPIRES_IN` | `7d` | Field staff stay signed in for a week. |
| `CORS_ORIGINS` | `http://localhost:3000` | Comma separated; `*` allows any origin. |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | – | First admin, created only when no admin exists. |
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

### Order text parsing

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/items/parse` | any | `{ text }` → `{ items, unparsed, formattedText, summary }`. Used by the review screen when it is reloaded and has to rebuild the lines from the saved text. `formattedText` is one item per line with digit quantities ("रवा 1 किलो"). |

Items look like `{ "name": "रवा", "nameEn": "Rava", "quantity": 10, "unit": "किलो (kg)", "unitCode": "KG" }`.
Parsed lines keep only lines that match an Item Master item (others are listed in `notInMaster` and `ignored`) and carry Item Master matches for each line: `suggestions` (best first, with a
0–1 `score`) and, when the best one is a confident match, `itemId`, `itemName` and `itemUnit`
(`nameEn` is then the Item Master name). A spoken price is kept apart from the quantity
("पार्ले जी दहा रुपये वीस पॅकेट" → `पार्ले जी ₹10`, 20 packets), and so is a pack size
("शाम्पू शंभर मिली दोन नग" → `शाम्पू 100मिली`, 2 pieces).

### Item Master

The distributor's products as billed ("PARLE G RS 10", packing "PKT 30"), seeded from the shop's
item list by `migrations/003_item_master_seed.sql`. Spoken Marathi names are matched to them by
sound ("कोलगेट" ≈ COLGATE), Marathi meanings ("साबण" = SOAP), prices and pack sizes
(`src/modules/items/matcher.ts`), plus the Marathi name and aliases set per item.

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| GET | `/items?q=&status=&page=&pageSize=` | any | A–Z. English `q` filters by name, Marathi name or alias; Devanagari `q` is matched by sound, best first. |
| GET | `/items/suggest?q=&unitCode=&limit=` | any | Best Item Master matches for a spoken or typed name (`[{ id, name, marathiName, unit, price, score }]`). |
| GET | `/items/:id` | any | |
| POST | `/items` | admin | `{ name, marathiName?, aliases?, unit?, price?, status? }`. Name and packing are cleaned (`PACKET` → `PKT`); price defaults to "RS N" in the name. 409 when name + packing exists. |
| PATCH / DELETE | `/items/:id` | admin | Delete is soft; past orders keep the item name. |
| GET | `/items/export` | admin | The whole Item Master as CSV (`name,packing,mrp,marathi_name,spoken_names,status`), re-importable. |
| POST | `/items/import` | admin | `{ text, update? }`: one item per line, `name<TAB>packing` (or `name,packing`), or columns under a header row (the export CSV). Adds new items; with `update: true` existing items get the file's MRP, Marathi name, spoken names and status. Returns `{ read, added, updated, alreadyInMaster, skippedCount, skipped }`. |

When a salesperson picks an item by hand on the review screen (`itemPicked: true` on the order
line), `POST /orders` saves the spoken name as an alias of that item, so it is suggested first
next time. Generic words alone ("साबण") are not learned. Admins can remove aliases on the Item
Master page.

### Orders

| Method | Path | Role | Description |
| --- | --- | --- | --- |
| POST | `/orders` | salesperson | `{ shopId, transcribedText, items?, notes? }`. Items are read from the text (and matched to the Item Master) when omitted; lines may carry `itemId`, `itemName`, `itemUnit`, `itemPicked`. Also records a shop visit. |
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
    db/                Pool, migration runner, bootstrap admin
    middleware/        Auth (JWT + role checks), error handling
    modules/           auth, salespersons, villages, shops, orders, visits, dashboard, items (the parser lives in `voice/`)
  scripts/             item-master-sql.ts: item list → seed migration
  tests/               Vitest unit and API tests
```

Add a schema change by creating the next numbered file in `migrations/` (e.g. `004_products.sql`).
