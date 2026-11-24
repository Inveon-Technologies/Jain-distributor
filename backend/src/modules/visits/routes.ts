import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { badRequest } from "../../lib/errors.js";
import { isoDate, uuid } from "../../lib/schemas.js";
import { businessDayRange } from "../../lib/time.js";
import { parse } from "../../lib/validate.js";
import { authenticate, currentUser, requireRole } from "../../middleware/auth.js";

export const visitsRouter = Router();
visitsRouter.use(authenticate);

const createBody = z.object({
  villageId: uuid,
  shopId: uuid.optional(),
  notes: z.string().trim().max(1000).optional(),
});

const listQuery = z.object({
  date: isoDate.optional(),
  salespersonId: uuid.optional(),
  villageId: uuid.optional(),
});

/**
 * POST /visits – the salesperson app records a check-in when a village is selected ("गाव निवडा")
 * and when a shop is opened, so visits without an order still show up on the admin dashboard.
 */
visitsRouter.post("/", requireRole("SALESPERSON"), async (req, res) => {
  const user = currentUser(req);
  const b = parse(createBody, req.body);
  const { rowCount } = await pool.query(
    `SELECT 1 FROM villages v WHERE v.id = $1 AND v.deleted_at IS NULL
        AND ($2::uuid IS NULL OR EXISTS (SELECT 1 FROM shops s WHERE s.id = $2 AND s.village_id = v.id
                                          AND s.deleted_at IS NULL))`,
    [b.villageId, b.shopId ?? null],
  );
  if (!rowCount) throw badRequest("Village or shop does not exist");

  const { rows } = await pool.query(
    `INSERT INTO visits (salesperson_id, village_id, shop_id, notes) VALUES ($1, $2, $3, $4)
     RETURNING id, salesperson_id AS "salespersonId", village_id AS "villageId", shop_id AS "shopId",
               notes, visited_at AS "visitedAt"`,
    [user.id, b.villageId, b.shopId ?? null, b.notes ?? null],
  );
  res.status(201).json({ data: rows[0] });
});

/** GET /visits – activity log for a business day (admins: everyone, salespersons: their own). */
visitsRouter.get("/", async (req, res) => {
  const user = currentUser(req);
  const f = parse(listQuery, req.query);
  const { start, end, date } = businessDayRange(f.date);
  const salespersonId = user.role === "SALESPERSON" ? user.id : (f.salespersonId ?? null);
  const { rows } = await pool.query(
    `SELECT vi.id, vi.visited_at AS "visitedAt", vi.notes, vi.order_id AS "orderId",
            json_build_object('id', u.id, 'name', u.name, 'nameEn', u.name_en) AS salesperson,
            json_build_object('id', v.id, 'marathiName', v.marathi_name, 'englishName', v.english_name) AS village,
            CASE WHEN s.id IS NULL THEN NULL
                 ELSE json_build_object('id', s.id, 'name', s.name, 'nameEn', s.name_en) END AS shop
       FROM visits vi
       JOIN users u ON u.id = vi.salesperson_id
       JOIN villages v ON v.id = vi.village_id
       LEFT JOIN shops s ON s.id = vi.shop_id
      WHERE vi.visited_at >= $1 AND vi.visited_at < $2
        AND ($3::uuid IS NULL OR vi.salesperson_id = $3)
        AND ($4::uuid IS NULL OR vi.village_id = $4)
      ORDER BY vi.visited_at DESC
      LIMIT 500`,
    [start, end, salespersonId, f.villageId ?? null],
  );
  res.json({ data: rows, meta: { date } });
});
