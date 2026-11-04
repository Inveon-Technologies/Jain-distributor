import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { notFound } from "../../lib/errors.js";
import { idParams, pageMeta, pagination, status } from "../../lib/schemas.js";
import { parse } from "../../lib/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { isDevanagari } from "../voice/phonetic.js";
import { invalidateItemCatalog, itemMatcher } from "./catalog.js";
import { cleanItemName, normalizeUnit, parseItemList, priceOf, toItemCsv } from "./importer.js";

/** Item Master: the products salespersons' spoken orders are matched to. */
export const itemsRouter = Router();
itemsRouter.use(authenticate);

const ITEM_SELECT = `
  SELECT id, name, marathi_name AS "marathiName", aliases, unit, pack_type AS "packType",
         pack_qty AS "packQty", free_qty AS "freeQty", price, status,
         created_at AS "createdAt", updated_at AS "updatedAt"
    FROM items`;

const aliasList = z
  .array(z.string().trim().min(1).max(100))
  .max(50)
  .transform((a) => [...new Set(a)]);

const createBody = z.object({
  name: z.string().trim().min(1).max(200),
  marathiName: z.string().trim().max(200).optional().nullable(),
  aliases: aliasList.optional(),
  unit: z.string().trim().max(50).optional(),
  /** Taken from "RS 20" in the name when left out. */
  price: z.number().nonnegative().max(1_000_000).optional().nullable(),
  status: status.default("ACTIVE"),
});

const updateBody = createBody
  .omit({ status: true })
  .extend({ status })
  .partial()
  .refine((b) => Object.keys(b).length > 0, "Provide at least one field to update");

const listQuery = pagination.extend({
  pageSize: z.coerce.number().int().min(1).max(200).default(50),
  q: z.string().trim().max(100).optional(),
  status: status.optional(),
});

const suggestQuery = z.object({
  q: z.string().trim().min(1).max(200),
  unitCode: z.string().trim().max(20).optional(),
  limit: z.coerce.number().int().min(1).max(20).default(8),
});

async function getItem(id: string) {
  const { rows } = await pool.query(`${ITEM_SELECT} WHERE id = $1 AND deleted_at IS NULL`, [id]);
  if (!rows[0]) throw notFound("Item");
  return rows[0];
}

/**
 * GET /items – the Item Master, A–Z. `q` in English filters by name; `q` in Marathi ("पार्ले") is
 * matched by sound, best match first, the same way spoken orders are.
 */
itemsRouter.get("/", async (req, res) => {
  const f = parse(listQuery, req.query);
  if (f.q && isDevanagari(f.q)) {
    const matcher = await itemMatcher();
    const ids = matcher
      .suggest(f.q, { limit: 200 })
      .filter((s) => s.score >= 0.5)
      .map((s) => s.id);
    const { rows } = await pool.query(
      `${ITEM_SELECT} WHERE id = ANY($1::uuid[]) AND deleted_at IS NULL AND ($2::text IS NULL OR status = $2)
        ORDER BY array_position($1::uuid[], id)`,
      [ids, f.status ?? null],
    );
    const page = rows.slice((f.page - 1) * f.pageSize, f.page * f.pageSize);
    res.json({ data: page, meta: pageMeta(f.page, f.pageSize, rows.length) });
    return;
  }
  const where = `WHERE deleted_at IS NULL AND ($1::text IS NULL OR status = $1)
    AND ($2::text IS NULL OR name ILIKE '%' || $2 || '%' OR marathi_name ILIKE '%' || $2 || '%'
         OR array_to_string(aliases, ' ') ILIKE '%' || $2 || '%' OR unit ILIKE $2)`;
  const params = [f.status ?? null, f.q ?? null];
  const [{ rows }, count] = await Promise.all([
    pool.query(`${ITEM_SELECT} ${where} ORDER BY name, unit LIMIT $3 OFFSET $4`, [
      ...params,
      f.pageSize,
      (f.page - 1) * f.pageSize,
    ]),
    pool.query<{ total: number }>(`SELECT count(*)::int AS total FROM items ${where}`, params),
  ]);
  res.json({ data: rows, meta: pageMeta(f.page, f.pageSize, count.rows[0].total) });
});

/** GET /items/suggest?q=पार्ले जी – best Item Master matches for a spoken or typed name. */
itemsRouter.get("/suggest", async (req, res) => {
  const f = parse(suggestQuery, req.query);
  const matcher = await itemMatcher();
  res.json({ data: matcher.suggest(f.q, { limit: f.limit, unitCode: f.unitCode }) });
});

/** GET /items/export – the whole Item Master as CSV (opens in Excel; re-importable). */
itemsRouter.get("/export", requireAdmin, async (_req, res) => {
  const { rows } = await pool.query(
    `SELECT name, unit, price, marathi_name AS "marathiName", aliases, status
       FROM items WHERE deleted_at IS NULL ORDER BY name, unit`,
  );
  const date = new Date().toISOString().slice(0, 10);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="item-master-${date}.csv"`);
  // The web app may run on another origin; let it read the file name.
  res.setHeader("Access-Control-Expose-Headers", "Content-Disposition");
  res.send(toItemCsv(rows));
});

itemsRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json({ data: await getItem(id) });
});

itemsRouter.post("/", requireAdmin, async (req, res) => {
  const b = parse(createBody, req.body);
  const name = cleanItemName(b.name);
  const unit = normalizeUnit(b.unit ?? "");
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO items (name, marathi_name, aliases, unit, pack_type, pack_qty, free_qty, price, status)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [name, b.marathiName || null, b.aliases ?? [], unit.unit, unit.packType, unit.packQty, unit.freeQty,
      b.price !== undefined ? b.price : priceOf(name), b.status],
  );
  invalidateItemCatalog();
  res.status(201).json({ data: await getItem(rows[0].id) });
});

itemsRouter.patch("/:id", requireAdmin, async (req, res) => {
  const { id } = parse(idParams, req.params);
  const b = parse(updateBody, req.body);
  await getItem(id);
  const name = b.name !== undefined ? cleanItemName(b.name) : null;
  const unit = b.unit !== undefined ? normalizeUnit(b.unit) : null;
  await pool.query(
    `UPDATE items SET
       name = COALESCE($2, name),
       marathi_name = CASE WHEN $3::boolean THEN $4 ELSE marathi_name END,
       aliases = COALESCE($5, aliases),
       unit = COALESCE($6, unit),
       pack_type = COALESCE($7, pack_type),
       pack_qty = CASE WHEN $6::text IS NULL THEN pack_qty ELSE $8 END,
       free_qty = CASE WHEN $6::text IS NULL THEN free_qty ELSE $9 END,
       price = CASE WHEN $10::boolean THEN $11 ELSE price END,
       status = COALESCE($12, status),
       updated_at = now()
     WHERE id = $1`,
    [id, name, b.marathiName !== undefined, b.marathiName || null, b.aliases ?? null, unit?.unit ?? null,
      unit?.packType ?? null, unit?.packQty ?? null, unit?.freeQty ?? null, b.price !== undefined, b.price ?? null,
      b.status ?? null],
  );
  invalidateItemCatalog();
  res.json({ data: await getItem(id) });
});

/** Soft delete: orders that used the item keep its name. */
itemsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = parse(idParams, req.params);
  await getItem(id);
  await pool.query("UPDATE items SET deleted_at = now() WHERE id = $1", [id]);
  invalidateItemCatalog();
  res.status(204).end();
});

/**
 * POST /items/import { text, update? } – adds items from a pasted or uploaded list: name <TAB>
 * packing per line, or columns under a header row (the CSV from GET /items/export). Items already
 * in the master (same name and packing) are left unchanged, or with `update: true` get the file's
 * MRP, Marathi name, spoken names and status (only the columns the file has).
 */
itemsRouter.post("/import", requireAdmin, async (req, res) => {
  const { text, update } = parse(
    z.object({ text: z.string().min(1).max(1_000_000), update: z.boolean().default(false) }),
    req.body,
  );
  const { items, skipped, columns } = parseItemList(text);
  const has = (c: string) => columns.includes(c);
  let added = 0;
  let updated = 0;
  const CHUNK = 1000;
  for (let i = 0; i < items.length; i += CHUNK) {
    const chunk = items.slice(i, i + CHUNK);
    const { rows } = await pool.query<{ inserted: boolean }>(
      `INSERT INTO items (name, unit, pack_type, pack_qty, free_qty, price, marathi_name, aliases, status)
       SELECT n, u, pt, pq, fq, pr, mn, CASE WHEN al IS NULL OR al = '' THEN '{}'::text[] ELSE string_to_array(al, '|') END,
              COALESCE(st, 'ACTIVE')
         FROM unnest($1::text[], $2::text[], $3::text[], $4::int[], $5::int[], $6::numeric[], $7::text[], $8::text[], $9::text[])
              AS t(n, u, pt, pq, fq, pr, mn, al, st)
       ON CONFLICT (lower(name), lower(unit)) WHERE deleted_at IS NULL DO UPDATE SET
         price        = CASE WHEN $11 THEN EXCLUDED.price ELSE items.price END,
         marathi_name = CASE WHEN $12 THEN EXCLUDED.marathi_name ELSE items.marathi_name END,
         aliases      = CASE WHEN $13 THEN EXCLUDED.aliases ELSE items.aliases END,
         status       = CASE WHEN $14 THEN EXCLUDED.status ELSE items.status END,
         updated_at   = now()
       WHERE $10::boolean
       RETURNING (xmax = 0) AS inserted`,
      [chunk.map((r) => r.name), chunk.map((r) => r.unit), chunk.map((r) => r.packType),
        chunk.map((r) => r.packQty), chunk.map((r) => r.freeQty), chunk.map((r) => r.price),
        chunk.map((r) => r.marathiName ?? null), chunk.map((r) => (r.aliases ?? []).join("|")),
        chunk.map((r) => r.status ?? null), update, has("price"), has("marathiName"), has("aliases"), has("status")],
    );
    for (const r of rows) {
      if (r.inserted) added++;
      else updated++;
    }
  }
  if (added || updated) invalidateItemCatalog();
  res.json({
    data: {
      read: items.length,
      added,
      updated,
      alreadyInMaster: items.length - added - updated,
      skippedCount: skipped.length,
      skipped: skipped.slice(0, 100),
    },
  });
});
