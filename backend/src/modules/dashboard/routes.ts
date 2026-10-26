import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { isoDate } from "../../lib/schemas.js";
import { businessDayRange } from "../../lib/time.js";
import { parse } from "../../lib/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

export const dashboardRouter = Router();
dashboardRouter.use(authenticate, requireAdmin);

/**
 * GET /dashboard/summary?date=YYYY-MM-DD – the four KPI cards on the admin dashboard (PRD §4):
 * active salespersons / total, village visits, shops visited and orders for the business day.
 */
dashboardRouter.get("/summary", async (req, res) => {
  const { date: requested } = parse(z.object({ date: isoDate.optional() }), req.query);
  const { date, start, end } = businessDayRange(requested);
  const { rows } = await pool.query(
    `SELECT
       (SELECT count(*) FROM users WHERE role = 'SALESPERSON' AND deleted_at IS NULL AND status = 'ACTIVE')::int
         AS "activeSalespersons",
       (SELECT count(*) FROM users WHERE role = 'SALESPERSON' AND deleted_at IS NULL)::int AS "totalSalespersons",
       (SELECT count(DISTINCT salesperson_id) FROM visits WHERE visited_at >= $1 AND visited_at < $2)::int
         AS "salespersonsInFieldToday",
       (SELECT count(*) FROM (SELECT DISTINCT salesperson_id, village_id FROM visits
                               WHERE visited_at >= $1 AND visited_at < $2) t)::int AS "villageVisitsToday",
       (SELECT count(DISTINCT shop_id) FROM visits WHERE visited_at >= $1 AND visited_at < $2)::int
         AS "shopsVisitedToday",
       (SELECT count(*) FROM orders WHERE created_at >= $1 AND created_at < $2 AND status <> 'CANCELLED')::int
         AS "ordersToday",
       (SELECT count(*) FROM villages WHERE deleted_at IS NULL)::int AS "totalVillages",
       (SELECT count(*) FROM shops WHERE deleted_at IS NULL)::int AS "totalShops"`,
    [start, end],
  );
  res.json({ data: { date, ...rows[0] } });
});

/** GET /dashboard/recent-orders – latest voice orders for the "Recent Voice Orders" panel. */
dashboardRouter.get("/recent-orders", async (req, res) => {
  const { limit } = parse(z.object({ limit: z.coerce.number().int().min(1).max(50).default(10) }), req.query);
  const { rows } = await pool.query(
    `SELECT o.id, 'ORD-' || o.order_number AS "displayId", o.status, o.created_at AS "createdAt",
            o.transcribed_text AS "transcribedText", jsonb_array_length(o.items)::int AS "itemCount",
            json_build_object('id', u.id, 'name', u.name, 'nameEn', u.name_en) AS salesperson,
            json_build_object('id', v.id, 'marathiName', v.marathi_name, 'englishName', v.english_name) AS village,
            json_build_object('id', s.id, 'name', s.name, 'nameEn', s.name_en) AS shop
       FROM orders o
       JOIN users u ON u.id = o.salesperson_id
       JOIN villages v ON v.id = o.village_id
       JOIN shops s ON s.id = o.shop_id
      ORDER BY o.created_at DESC
      LIMIT $1`,
    [limit],
  );
  res.json({ data: rows });
});
