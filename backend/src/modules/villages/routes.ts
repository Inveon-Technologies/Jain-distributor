import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../../db/pool.js";
import { notFound } from "../../lib/errors.js";
import { idParams, isoDate, status } from "../../lib/schemas.js";
import { businessDayRange } from "../../lib/time.js";
import { parse } from "../../lib/validate.js";
import { authenticate, currentUser, requireAdmin } from "../../middleware/auth.js";

export const villagesRouter = Router();
villagesRouter.use(authenticate);

const listQuery = z.object({
  status: status.optional(),
  q: z.string().trim().max(100).optional(),
  date: isoDate.optional(),
  /** Salesperson only: restrict to villages assigned to the caller (falls back to all if none assigned). */
  assigned: z.enum(["true", "false"]).optional(),
});

const createBody = z.object({
  marathiName: z.string().trim().min(1).max(100),
  englishName: z.string().trim().min(1).max(100),
  taluka: z.string().trim().max(100).optional().nullable(),
  district: z.string().trim().max(100).optional().nullable(),
  status: status.default("ACTIVE"),
});

const updateBody = createBody.partial().refine((b) => Object.keys(b).length > 0, "Provide at least one field to update");

/**
 * Villages with activity for the business day:
 *  - visitsToday: distinct salespersons who visited the village, shopsVisitedToday: distinct shops visited,
 *  - ordersToday: non-cancelled orders, shopsCount: active shops in the village.
 */
async function listVillages(f: { id?: string; status?: string; q?: string; date?: string; onlyFor?: string }) {
  const { start, end } = businessDayRange(f.date);
  const { rows } = await pool.query(
    `SELECT v.id, v.marathi_name AS "marathiName", v.english_name AS "englishName", v.taluka, v.district,
            v.status, v.created_at AS "createdAt",
            (SELECT count(*) FROM shops s WHERE s.village_id = v.id AND s.deleted_at IS NULL)::int AS "shopsCount",
            COALESCE(vs.visits, 0)::int AS "visitsToday",
            COALESCE(vs.shops, 0)::int  AS "shopsVisitedToday",
            COALESCE(o.orders, 0)::int  AS "ordersToday"
       FROM villages v
       LEFT JOIN (SELECT village_id, count(DISTINCT salesperson_id) AS visits, count(DISTINCT shop_id) AS shops
                    FROM visits WHERE visited_at >= $1 AND visited_at < $2 GROUP BY village_id) vs
              ON vs.village_id = v.id
       LEFT JOIN (SELECT village_id, count(*) AS orders FROM orders
                   WHERE created_at >= $1 AND created_at < $2 AND status <> 'CANCELLED' GROUP BY village_id) o
              ON o.village_id = v.id
      WHERE v.deleted_at IS NULL
        AND ($3::uuid IS NULL OR v.id = $3)
        AND ($4::text IS NULL OR v.status = $4)
        AND ($5::text IS NULL OR v.marathi_name ILIKE '%' || $5 || '%' OR v.english_name ILIKE '%' || $5 || '%')
        AND ($6::uuid IS NULL OR v.id IN (SELECT village_id FROM salesperson_villages WHERE salesperson_id = $6))
      ORDER BY v.english_name`,
    [start, end, f.id ?? null, f.status ?? null, f.q ?? null, f.onlyFor ?? null],
  );
  return rows;
}

async function getVillage(id: string) {
  const [row] = await listVillages({ id });
  if (!row) throw notFound("Village");
  return row;
}

villagesRouter.get("/", async (req, res) => {
  const user = currentUser(req);
  const query = parse(listQuery, req.query);
  if (user.role === "ADMIN") {
    res.json({ data: await listVillages(query) });
    return;
  }
  // Salespersons only ever see active villages.
  const filters = { ...query, status: "ACTIVE" };
  if (query.assigned === "true") {
    const assigned = await listVillages({ ...filters, onlyFor: user.id });
    if (assigned.length) {
      res.json({ data: assigned });
      return;
    }
  }
  res.json({ data: await listVillages(filters) });
});

villagesRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json({ data: await getVillage(id) });
});

villagesRouter.post("/", requireAdmin, async (req, res) => {
  const b = parse(createBody, req.body);
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO villages (marathi_name, english_name, taluka, district, status)
     VALUES ($1, $2, $3, $4, $5) RETURNING id`,
    [b.marathiName, b.englishName, b.taluka ?? null, b.district ?? null, b.status],
  );
  res.status(201).json({ data: await getVillage(rows[0].id) });
});

villagesRouter.patch("/:id", requireAdmin, async (req, res) => {
  const { id } = parse(idParams, req.params);
  const b = parse(updateBody, req.body);
  await getVillage(id);
  await pool.query(
    `UPDATE villages SET
       marathi_name = COALESCE($2, marathi_name),
       english_name = COALESCE($3, english_name),
       taluka   = CASE WHEN $4::boolean THEN $5 ELSE taluka END,
       district = CASE WHEN $6::boolean THEN $7 ELSE district END,
       status   = COALESCE($8, status),
       updated_at = now()
     WHERE id = $1`,
    [id, b.marathiName ?? null, b.englishName ?? null, b.taluka !== undefined, b.taluka ?? null,
      b.district !== undefined, b.district ?? null, b.status ?? null],
  );
  res.json({ data: await getVillage(id) });
});

/** Soft-deletes the village and its shops; past orders keep pointing at them. */
villagesRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = parse(idParams, req.params);
  await getVillage(id);
  await withTransaction(async (client) => {
    await client.query("UPDATE villages SET deleted_at = now() WHERE id = $1", [id]);
    await client.query("UPDATE shops SET deleted_at = now() WHERE village_id = $1 AND deleted_at IS NULL", [id]);
    await client.query("DELETE FROM salesperson_villages WHERE village_id = $1", [id]);
  });
  res.status(204).end();
});
