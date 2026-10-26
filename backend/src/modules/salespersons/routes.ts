import { Router } from "express";
import type { PoolClient } from "pg";
import { z } from "zod";
import { pool, withTransaction } from "../../db/pool.js";
import { conflict, notFound } from "../../lib/errors.js";
import { idParams, isoDate, mobile, password, status, uuid } from "../../lib/schemas.js";
import { businessDayRange } from "../../lib/time.js";
import { parse } from "../../lib/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { hashPassword } from "../auth/passwords.js";

export const salespersonsRouter = Router();
salespersonsRouter.use(authenticate, requireAdmin);

const listQuery = z.object({
  status: status.optional(),
  q: z.string().trim().max(100).optional(),
  date: isoDate.optional(),
});

const createBody = z.object({
  name: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().max(100).optional().nullable(),
  email: z.string().trim().toLowerCase().email(),
  mobile,
  password,
  status: status.default("ACTIVE"),
  assignedVillageIds: z.array(uuid).max(200).default([]),
});

const updateBody = createBody
  .omit({ password: true })
  .partial()
  .refine((b) => Object.keys(b).length > 0, "Provide at least one field to update");

/**
 * Salesperson rows with activity for the given business day:
 *  - todayVisits: distinct shops visited, todayVillageVisits: distinct villages visited, todayOrders: orders taken.
 */
async function listSalespersons(filters: { id?: string; status?: string; q?: string; date?: string }) {
  const { start, end } = businessDayRange(filters.date);
  const { rows } = await pool.query(
    `SELECT u.id, u.name, u.name_en AS "nameEn", u.email, u.mobile, u.status,
            u.last_login_at AS "lastLoginAt", u.created_at AS "createdAt",
            COALESCE(v.shops, 0)::int    AS "todayVisits",
            COALESCE(v.villages, 0)::int AS "todayVillageVisits",
            COALESCE(o.orders, 0)::int   AS "todayOrders",
            COALESCE((SELECT json_agg(json_build_object('id', vl.id, 'marathiName', vl.marathi_name,
                                                        'englishName', vl.english_name) ORDER BY vl.english_name)
                        FROM salesperson_villages sv JOIN villages vl ON vl.id = sv.village_id
                       WHERE sv.salesperson_id = u.id AND vl.deleted_at IS NULL), '[]') AS "assignedVillages"
       FROM users u
       LEFT JOIN (SELECT salesperson_id, count(DISTINCT shop_id) AS shops, count(DISTINCT village_id) AS villages
                    FROM visits WHERE visited_at >= $1 AND visited_at < $2 GROUP BY salesperson_id) v
              ON v.salesperson_id = u.id
       LEFT JOIN (SELECT salesperson_id, count(*) AS orders
                    FROM orders WHERE created_at >= $1 AND created_at < $2 AND status <> 'CANCELLED'
                   GROUP BY salesperson_id) o
              ON o.salesperson_id = u.id
      WHERE u.role = 'SALESPERSON' AND u.deleted_at IS NULL
        AND ($3::uuid IS NULL OR u.id = $3)
        AND ($4::text IS NULL OR u.status = $4)
        AND ($5::text IS NULL OR u.name ILIKE '%' || $5 || '%' OR u.name_en ILIKE '%' || $5 || '%'
             OR u.email ILIKE '%' || $5 || '%' OR u.mobile ILIKE '%' || $5 || '%')
      ORDER BY u.status, u.name_en NULLS LAST, u.name`,
    [start, end, filters.id ?? null, filters.status ?? null, filters.q ?? null],
  );
  return rows;
}

async function getSalesperson(id: string) {
  const [row] = await listSalespersons({ id });
  if (!row) throw notFound("Salesperson");
  return row;
}

async function setAssignedVillages(client: PoolClient, salespersonId: string, villageIds: string[]) {
  await client.query("DELETE FROM salesperson_villages WHERE salesperson_id = $1", [salespersonId]);
  if (villageIds.length) {
    await client.query(
      `INSERT INTO salesperson_villages (salesperson_id, village_id)
       SELECT $1, id FROM villages WHERE id = ANY($2::uuid[]) AND deleted_at IS NULL`,
      [salespersonId, villageIds],
    );
  }
}

async function assertEmailFree(email: string, exceptId?: string) {
  const { rowCount } = await pool.query(
    "SELECT 1 FROM users WHERE lower(email) = $1 AND deleted_at IS NULL AND ($2::uuid IS NULL OR id <> $2)",
    [email, exceptId ?? null],
  );
  if (rowCount) throw conflict("An account with this email already exists");
}

salespersonsRouter.get("/", async (req, res) => {
  res.json({ data: await listSalespersons(parse(listQuery, req.query)) });
});

salespersonsRouter.post("/", async (req, res) => {
  const body = parse(createBody, req.body);
  await assertEmailFree(body.email);
  const passwordHash = await hashPassword(body.password);
  const id = await withTransaction(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `INSERT INTO users (name, name_en, email, mobile, password_hash, role, status)
       VALUES ($1, $2, $3, $4, $5, 'SALESPERSON', $6) RETURNING id`,
      [body.name, body.nameEn ?? null, body.email, body.mobile, passwordHash, body.status],
    );
    await setAssignedVillages(client, rows[0].id, body.assignedVillageIds);
    return rows[0].id;
  });
  res.status(201).json({ data: await getSalesperson(id) });
});

salespersonsRouter.get("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  res.json({ data: await getSalesperson(id) });
});

salespersonsRouter.patch("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  const body = parse(updateBody, req.body);
  await getSalesperson(id);
  if (body.email) await assertEmailFree(body.email, id);

  await withTransaction(async (client) => {
    await client.query(
      `UPDATE users SET
         name    = COALESCE($2, name),
         name_en = CASE WHEN $3::boolean THEN $4 ELSE name_en END,
         email   = COALESCE($5, email),
         mobile  = COALESCE($6, mobile),
         status  = COALESCE($7, status),
         updated_at = now()
       WHERE id = $1`,
      [id, body.name ?? null, body.nameEn !== undefined, body.nameEn ?? null, body.email ?? null,
        body.mobile ?? null, body.status ?? null],
    );
    if (body.assignedVillageIds) await setAssignedVillages(client, id, body.assignedVillageIds);
  });
  res.json({ data: await getSalesperson(id) });
});

/** One-click activate / deactivate (also used to approve self-registered salespersons). */
salespersonsRouter.patch("/:id/status", async (req, res) => {
  const { id } = parse(idParams, req.params);
  const body = parse(z.object({ status }), req.body);
  await getSalesperson(id);
  await pool.query("UPDATE users SET status = $2, updated_at = now() WHERE id = $1", [id, body.status]);
  res.json({ data: await getSalesperson(id) });
});

salespersonsRouter.post("/:id/reset-password", async (req, res) => {
  const { id } = parse(idParams, req.params);
  const { newPassword } = parse(z.object({ newPassword: password }), req.body);
  await getSalesperson(id);
  await pool.query("UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1", [
    id,
    await hashPassword(newPassword),
  ]);
  res.status(204).end();
});

/** Soft delete: the salesperson can no longer log in, but their order history is preserved. */
salespersonsRouter.delete("/:id", async (req, res) => {
  const { id } = parse(idParams, req.params);
  await getSalesperson(id);
  await withTransaction(async (client) => {
    await client.query("UPDATE users SET deleted_at = now(), status = 'INACTIVE' WHERE id = $1", [id]);
    await client.query("DELETE FROM salesperson_villages WHERE salesperson_id = $1", [id]);
  });
  res.status(204).end();
});
