import { Router } from "express";
import { z } from "zod";
import { pool, withTransaction } from "../../db/pool.js";
import { badRequest, forbidden, notFound } from "../../lib/errors.js";
import { idParams, isoDate, pageMeta, pagination, uuid } from "../../lib/schemas.js";
import { businessDayRange } from "../../lib/time.js";
import { parse } from "../../lib/validate.js";
import { authenticate, currentUser, requireAdmin, requireRole, type AuthUser } from "../../middleware/auth.js";
import { parseOrderText } from "../voice/parser.js";

export const ordersRouter = Router();
ordersRouter.use(authenticate);

const orderStatus = z.enum(["CONFIRMED", "DELIVERED", "CANCELLED"]);

const item = z.object({
  name: z.string().trim().min(1).max(200),
  nameEn: z.string().trim().max(200).optional(),
  quantity: z.number().positive().max(1_000_000),
  unit: z.string().trim().min(1).max(50),
  unitCode: z.string().trim().max(20).optional(),
});

const createBody = z.object({
  shopId: uuid,
  transcribedText: z.string().trim().min(1).max(5000),
  /** Reviewed items from the client; parsed from the transcript when omitted. */
  items: z.array(item).max(200).optional(),
  notes: z.string().trim().max(1000).optional(),
});

const updateBody = z
  .object({
    transcribedText: z.string().trim().min(1).max(5000),
    items: z.array(item).max(200),
    notes: z.string().trim().max(1000).nullable(),
    status: orderStatus,
  })
  .partial()
  .refine((b) => Object.keys(b).length > 0, "Provide at least one field to update");

const listQuery = pagination.extend({
  date: isoDate.optional(),
  from: isoDate.optional(),
  to: isoDate.optional(),
  salespersonId: uuid.optional(),
  villageId: uuid.optional(),
  shopId: uuid.optional(),
  status: orderStatus.optional(),
  q: z.string().trim().max(100).optional(),
});

const ORDER_SELECT = `
  SELECT o.id, o.order_number AS "orderNumber", 'ORD-' || o.order_number AS "displayId",
         o.transcribed_text AS "transcribedText", o.items, o.status, o.notes,
         o.created_at AS "createdAt", o.updated_at AS "updatedAt",
         o.salesperson_id AS "salespersonId", o.village_id AS "villageId", o.shop_id AS "shopId",
         json_build_object('id', u.id, 'name', u.name, 'nameEn', u.name_en, 'mobile', u.mobile) AS salesperson,
         json_build_object('id', v.id, 'marathiName', v.marathi_name, 'englishName', v.english_name) AS village,
         json_build_object('id', s.id, 'name', s.name, 'nameEn', s.name_en, 'ownerName', s.owner_name,
                           'ownerNameEn', s.owner_name_en, 'mobile', s.mobile, 'address', s.address) AS shop
    FROM orders o
    JOIN users u    ON u.id = o.salesperson_id
    JOIN villages v ON v.id = o.village_id
    JOIN shops s    ON s.id = o.shop_id`;

async function getOrder(id: string, user: AuthUser) {
  const { rows } = await pool.query(`${ORDER_SELECT} WHERE o.id = $1`, [id]);
  const order = rows[0];
  if (!order) throw notFound("Order");
  if (user.role === "SALESPERSON" && order.salespersonId !== user.id) throw forbidden();
  return order;
}

/** POST /orders – salesperson saves a reviewed voice order ("ऑर्डर सेव्ह करा"). Also logs a shop visit. */
ordersRouter.post("/", requireRole("SALESPERSON"), async (req, res) => {
  const user = currentUser(req);
  const body = parse(createBody, req.body);
  const shop = await pool.query<{ villageId: string }>(
    `SELECT s.village_id AS "villageId" FROM shops s JOIN villages v ON v.id = s.village_id
      WHERE s.id = $1 AND s.deleted_at IS NULL AND v.deleted_at IS NULL`,
    [body.shopId],
  );
  if (!shop.rows[0]) throw badRequest("Shop does not exist");
  const villageId = shop.rows[0].villageId;

  const items = body.items ?? parseOrderText(body.transcribedText).items;
  if (!items.length) {
    throw badRequest("No items could be read from the order. Please edit the text or re-record.");
  }

  const orderId = await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO orders (salesperson_id, village_id, shop_id, transcribed_text, items, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [user.id, villageId, body.shopId, body.transcribedText, JSON.stringify(items), body.notes ?? null],
    );
    await client.query(
      `INSERT INTO visits (salesperson_id, village_id, shop_id, order_id) VALUES ($1, $2, $3, $4)`,
      [user.id, villageId, body.shopId, rows[0].id],
    );
    return rows[0].id;
  });

  res.status(201).json({ data: await getOrder(orderId, user) });
});

/** GET /orders – admins see everything; salespersons only their own orders. */
ordersRouter.get("/", async (req, res) => {
  const user = currentUser(req);
  const f = parse(listQuery, req.query);
  if (f.from && f.to && f.from > f.to) throw badRequest("'from' must be on or before 'to'");

  const conditions: string[] = [];
  const params: unknown[] = [];
  const add = (sql: string, value: unknown) => {
    params.push(value);
    conditions.push(sql.replace("?", `$${params.length}`));
  };

  if (user.role === "SALESPERSON") add("o.salesperson_id = ?", user.id);
  else if (f.salespersonId) add("o.salesperson_id = ?", f.salespersonId);
  if (f.date) {
    const { start, end } = businessDayRange(f.date);
    add("o.created_at >= ?", start);
    add("o.created_at < ?", end);
  }
  if (f.from) add("o.created_at >= ?", businessDayRange(f.from).start);
  if (f.to) add("o.created_at < ?", businessDayRange(f.to).end);
  if (f.villageId) add("o.village_id = ?", f.villageId);
  if (f.shopId) add("o.shop_id = ?", f.shopId);
  if (f.status) add("o.status = ?", f.status);
  if (f.q) {
    params.push(f.q);
    const p = `$${params.length}`;
    conditions.push(`(o.transcribed_text ILIKE '%' || ${p} || '%' OR s.name ILIKE '%' || ${p} || '%'
      OR s.name_en ILIKE '%' || ${p} || '%' OR u.name ILIKE '%' || ${p} || '%' OR u.name_en ILIKE '%' || ${p} || '%'
      OR ('ORD-' || o.order_number) ILIKE '%' || ${p} || '%')`);
  }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";

  const [{ rows }, count] = await Promise.all([
    pool.query(`${ORDER_SELECT} ${where} ORDER BY o.created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [
      ...params,
      f.pageSize,
      (f.page - 1) * f.pageSize,
    ]),
    pool.query<{ total: number }>(
      `SELECT count(*)::int AS total FROM orders o JOIN users u ON u.id = o.salesperson_id
         JOIN shops s ON s.id = o.shop_id ${where}`,
      params,
    ),
  ]);
  res.json({ data: rows, meta: pageMeta(f.page, f.pageSize, count.rows[0].total) });
});

ordersRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json({ data: await getOrder(id, currentUser(req)) });
});

/** PATCH /orders/:id – admin corrects a transcription / items or moves the order through its lifecycle. */
ordersRouter.patch("/:id", requireAdmin, async (req, res) => {
  const user = currentUser(req);
  const { id } = parse(idParams, req.params);
  const b = parse(updateBody, req.body);
  await getOrder(id, user);
  await pool.query(
    `UPDATE orders SET
       transcribed_text = COALESCE($2, transcribed_text),
       items  = COALESCE($3::jsonb, items),
       notes  = CASE WHEN $4::boolean THEN $5 ELSE notes END,
       status = COALESCE($6, status),
       updated_at = now()
     WHERE id = $1`,
    [id, b.transcribedText ?? null, b.items ? JSON.stringify(b.items) : null, b.notes !== undefined,
      b.notes ?? null, b.status ?? null],
  );
  res.json({ data: await getOrder(id, user) });
});
