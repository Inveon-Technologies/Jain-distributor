import { Router } from "express";
import { pool } from "../../db/pool.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

export const notificationsRouter = Router();
notificationsRouter.use(authenticate, requireAdmin);

/** How far back the bell looks. Older activity is on the Orders and Salespersons pages. */
const WINDOW_DAYS = 3;
const LIMIT = 50;

/**
 * GET /notifications – what the admin bell shows, newest first:
 *  - NEW_ORDER: voice orders placed in the last few days (cancelled ones included, marked as such)
 *  - SIGNUP: salespersons who registered themselves and are waiting for approval
 * The app remembers which ones were already seen, so nothing is stored per admin here.
 */
notificationsRouter.get("/", async (_req, res) => {
  const { rows } = await pool.query(
    `(SELECT 'NEW_ORDER' AS type, o.id, o.created_at AS "createdAt",
             json_build_object(
               'orderNumber', o.order_number, 'status', o.status,
               'itemCount', jsonb_array_length(o.items),
               'shopName', s.name,
               'villageMr', v.marathi_name, 'villageEn', v.english_name,
               'salespersonName', u.name, 'salespersonNameEn', u.name_en) AS data
        FROM orders o
        JOIN shops s ON s.id = o.shop_id
        JOIN villages v ON v.id = o.village_id
        JOIN users u ON u.id = o.salesperson_id
       WHERE o.created_at >= now() - make_interval(days => $1)
       ORDER BY o.created_at DESC
       LIMIT $2)
     UNION ALL
     (SELECT 'SIGNUP' AS type, u.id, u.created_at AS "createdAt",
             json_build_object('name', u.name, 'nameEn', u.name_en, 'mobile', u.mobile) AS data
        FROM users u
       WHERE u.role = 'SALESPERSON' AND u.status = 'INACTIVE' AND u.deleted_at IS NULL
         AND u.last_login_at IS NULL
       ORDER BY u.created_at DESC
       LIMIT $2)
     ORDER BY "createdAt" DESC
     LIMIT $2`,
    [WINDOW_DAYS, LIMIT],
  );
  res.json({ data: rows, serverTime: new Date().toISOString() });
});
