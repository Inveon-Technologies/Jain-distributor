import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { badRequest, notFound } from "../../lib/errors.js";
import { idParams, mobile, optionalText, pageMeta, pagination, uuid } from "../../lib/schemas.js";
import { parse } from "../../lib/validate.js";
import { authenticate, currentUser, requireAdmin } from "../../middleware/auth.js";

export const shopsRouter = Router();
shopsRouter.use(authenticate);

const listQuery = pagination.extend({
  villageId: uuid.optional(),
  q: z.string().trim().max(100).optional(),
  pageSize: z.coerce.number().int().min(1).max(500).default(100),
});

const createBody = z.object({
  name: z.string().trim().min(1).max(150),
  nameEn: optionalText,
  ownerName: optionalText,
  ownerNameEn: optionalText,
  mobile: mobile.optional().nullable(),
  address: optionalText,
  addressEn: optionalText,
  villageId: uuid,
  outstandingBalance: z.number().min(0).max(1e9).optional(),
});

const updateBody = createBody.partial().refine((b) => Object.keys(b).length > 0, "Provide at least one field to update");

const SHOP_COLUMNS = `s.id, s.name, s.name_en AS "nameEn", s.owner_name AS "ownerName", s.owner_name_en AS "ownerNameEn",
  s.mobile, s.address, s.address_en AS "addressEn", s.village_id AS "villageId",
  v.marathi_name AS "villageMarathiName", v.english_name AS "villageEnglishName",
  s.outstanding_balance AS "outstandingBalance", s.created_at AS "createdAt",
  (SELECT max(o.created_at) FROM orders o WHERE o.shop_id = s.id) AS "lastOrderAt"`;

async function getShop(id: string) {
  const { rows } = await pool.query(
    `SELECT ${SHOP_COLUMNS} FROM shops s JOIN villages v ON v.id = s.village_id
      WHERE s.id = $1 AND s.deleted_at IS NULL`,
    [id],
  );
  if (!rows[0]) throw notFound("Shop");
  return rows[0];
}

async function assertVillageActive(villageId: string) {
  const { rowCount } = await pool.query("SELECT 1 FROM villages WHERE id = $1 AND deleted_at IS NULL", [villageId]);
  if (!rowCount) throw badRequest("Village does not exist");
}

shopsRouter.get("/", async (req, res) => {
  const { villageId, q, page, pageSize } = parse(listQuery, req.query);
  const where = `s.deleted_at IS NULL
    AND ($1::uuid IS NULL OR s.village_id = $1)
    AND ($2::text IS NULL OR s.name ILIKE '%' || $2 || '%' OR s.name_en ILIKE '%' || $2 || '%'
         OR s.owner_name ILIKE '%' || $2 || '%' OR s.owner_name_en ILIKE '%' || $2 || '%' OR s.mobile ILIKE '%' || $2 || '%')`;
  const params = [villageId ?? null, q ?? null];
  const [{ rows }, count] = await Promise.all([
    pool.query(
      `SELECT ${SHOP_COLUMNS} FROM shops s JOIN villages v ON v.id = s.village_id
        WHERE ${where} ORDER BY s.name LIMIT $3 OFFSET $4`,
      [...params, pageSize, (page - 1) * pageSize],
    ),
    pool.query<{ total: number }>(`SELECT count(*)::int AS total FROM shops s WHERE ${where}`, params),
  ]);
  res.json({ data: rows, meta: pageMeta(page, pageSize, count.rows[0].total) });
});

shopsRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json({ data: await getShop(id) });
});

/** Both roles: salespersons add new shops from the field ("नवीन दुकान जोडा"). */
shopsRouter.post("/", async (req, res) => {
  const b = parse(createBody, req.body);
  const user = currentUser(req);
  await assertVillageActive(b.villageId);
  // Only admins can set the credit balance.
  const balance = user.role === "ADMIN" ? (b.outstandingBalance ?? 0) : 0;
  const { rows } = await pool.query<{ id: string }>(
    `INSERT INTO shops (name, name_en, owner_name, owner_name_en, mobile, address, address_en, village_id,
                        outstanding_balance, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING id`,
    [b.name, b.nameEn ?? null, b.ownerName ?? null, b.ownerNameEn ?? null, b.mobile ?? null, b.address ?? null,
      b.addressEn ?? null, b.villageId, balance, user.id],
  );
  res.status(201).json({ data: await getShop(rows[0].id) });
});

shopsRouter.patch("/:id", requireAdmin, async (req, res) => {
  const { id } = parse(idParams, req.params);
  const b = parse(updateBody, req.body);
  await getShop(id);
  if (b.villageId) await assertVillageActive(b.villageId);

  const columns: Record<string, string> = {
    name: "name", nameEn: "name_en", ownerName: "owner_name", ownerNameEn: "owner_name_en", mobile: "mobile",
    address: "address", addressEn: "address_en", villageId: "village_id", outstandingBalance: "outstanding_balance",
  };
  const sets: string[] = [];
  const values: unknown[] = [id];
  for (const [key, column] of Object.entries(columns)) {
    const value = b[key as keyof typeof b];
    if (value === undefined) continue;
    values.push(value);
    sets.push(`${column} = $${values.length}`);
  }
  await pool.query(`UPDATE shops SET ${sets.join(", ")}, updated_at = now() WHERE id = $1`, values);
  res.json({ data: await getShop(id) });
});

shopsRouter.delete("/:id", requireAdmin, async (req, res) => {
  const { id } = parse(idParams, req.params);
  await getShop(id);
  await pool.query("UPDATE shops SET deleted_at = now() WHERE id = $1", [id]);
  res.status(204).end();
});
