-- Item Master: every product the distributor sells, as named in the billing software (English),
-- with optional Marathi name and spoken aliases so Marathi voice orders can be matched to it.

CREATE TABLE items (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT          NOT NULL,              -- "PARLE G RS 10" (billing name, English)
  marathi_name  TEXT,                                -- "पार्ले जी १० रुपये" (shown to salespersons)
  -- Other ways salespersons say it ("पारले ग्लुकोज"). Admins add them; orders confirmed on the
  -- review screen add the spoken name automatically (see orders POST).
  aliases       TEXT[]        NOT NULL DEFAULT '{}',
  unit          TEXT          NOT NULL DEFAULT 'PCS', -- packing as billed: "PCS", "PKT 30", "JAR 150"
  pack_type     TEXT          NOT NULL DEFAULT 'PCS', -- PCS, PKT, JAR, BOX, DOZ, PATTI, GATTU, KG, ...
  pack_qty      INT,                                 -- pieces per pack (30 in "PKT 30")
  free_qty      INT,                                 -- free pieces (2 in "JAR 58+2")
  price         NUMERIC(10,2),                       -- MRP printed in the name ("RS 10")
  status        TEXT          NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE')),
  created_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ   NOT NULL DEFAULT now(),
  deleted_at    TIMESTAMPTZ
);
CREATE UNIQUE INDEX items_name_unit_unique ON items (lower(name), lower(unit)) WHERE deleted_at IS NULL;
CREATE INDEX items_status_idx ON items (status) WHERE deleted_at IS NULL;
