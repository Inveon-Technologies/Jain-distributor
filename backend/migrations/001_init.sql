-- Jain Distributor – Sales Field Management System
-- Initial schema (PRD INV-JDS-PRD-01 §6 "Core Data Schema").
-- Master records (users, villages, shops) are soft-deleted so order history stays intact.

CREATE TABLE users (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name           TEXT        NOT NULL,              -- Marathi / display name
  name_en        TEXT,
  email          TEXT        NOT NULL,
  password_hash  TEXT        NOT NULL,
  mobile         TEXT,
  role           TEXT        NOT NULL CHECK (role IN ('ADMIN', 'SALESPERSON')),
  status         TEXT        NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  last_login_at  TIMESTAMPTZ,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at     TIMESTAMPTZ
);
CREATE UNIQUE INDEX users_email_unique ON users (lower(email)) WHERE deleted_at IS NULL;
CREATE INDEX users_role_status_idx ON users (role, status) WHERE deleted_at IS NULL;

CREATE TABLE villages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  marathi_name  TEXT        NOT NULL,
  english_name  TEXT        NOT NULL,
  taluka        TEXT,
  district      TEXT,
  status        TEXT        NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);
CREATE UNIQUE INDEX villages_english_name_unique ON villages (lower(english_name)) WHERE deleted_at IS NULL;

-- Villages assigned to a salesperson.
CREATE TABLE salesperson_villages (
  salesperson_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  village_id     UUID NOT NULL REFERENCES villages (id) ON DELETE CASCADE,
  PRIMARY KEY (salesperson_id, village_id)
);

CREATE TABLE shops (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                TEXT          NOT NULL,
  name_en             TEXT,
  owner_name          TEXT,
  owner_name_en       TEXT,
  mobile              TEXT,
  address             TEXT,
  address_en          TEXT,
  village_id          UUID          NOT NULL REFERENCES villages (id),
  outstanding_balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  created_by          UUID          REFERENCES users (id),
  created_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at          TIMESTAMPTZ
);
CREATE INDEX shops_village_idx ON shops (village_id) WHERE deleted_at IS NULL;

CREATE SEQUENCE order_number_seq START WITH 1001;

CREATE TABLE orders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     BIGINT      NOT NULL UNIQUE DEFAULT nextval('order_number_seq'),
  salesperson_id   UUID        NOT NULL REFERENCES users (id),
  village_id       UUID        NOT NULL REFERENCES villages (id),
  shop_id          UUID        NOT NULL REFERENCES shops (id),
  transcribed_text TEXT        NOT NULL,
  items            JSONB       NOT NULL DEFAULT '[]'::jsonb,
  status           TEXT        NOT NULL DEFAULT 'CONFIRMED'
                     CHECK (status IN ('CONFIRMED', 'DELIVERED', 'CANCELLED')),
  notes            TEXT,
  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER SEQUENCE order_number_seq OWNED BY orders.order_number;
CREATE INDEX orders_created_at_idx ON orders (created_at DESC);
CREATE INDEX orders_salesperson_idx ON orders (salesperson_id, created_at DESC);
CREATE INDEX orders_village_idx ON orders (village_id, created_at DESC);
CREATE INDEX orders_shop_idx ON orders (shop_id, created_at DESC);

-- A salesperson checking in at a village and/or a shop. Orders also create a shop visit.
CREATE TABLE visits (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  salesperson_id UUID        NOT NULL REFERENCES users (id),
  village_id     UUID        NOT NULL REFERENCES villages (id),
  shop_id        UUID        REFERENCES shops (id),
  order_id       UUID        REFERENCES orders (id) ON DELETE SET NULL,
  notes          TEXT,
  visited_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX visits_visited_at_idx ON visits (visited_at DESC);
CREATE INDEX visits_salesperson_idx ON visits (salesperson_id, visited_at DESC);
CREATE INDEX visits_village_idx ON visits (village_id, visited_at DESC);
