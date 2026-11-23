import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { parse } from "../../lib/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";
import { badRequest } from "../../lib/errors.js";

export const exportRouter = Router();
exportRouter.use(authenticate, requireAdmin);

/** Formats a date as YYYY-MM-DD. */
function isoDate(d: Date = new Date()): string {
  return d.toISOString().slice(0, 10);
}

/** Escapes a CSV cell value (wraps in quotes if it contains comma, quote, or newline). */
function csvCell(val: unknown): string {
  const s = val == null ? "" : String(val);
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function csvRow(cells: unknown[]): string {
  return cells.map(csvCell).join(",");
}

/** GET /dashboard/export/orders – export all orders as CSV */
exportRouter.get("/export/orders", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT
      o.order_number,
      o.created_at,
      u.name           AS salesperson,
      u.name_en        AS salesperson_en,
      s.name           AS shop,
      v.marathi_name   AS village,
      v.english_name   AS village_en,
      jsonb_array_length(o.items) AS item_count,
      o.status,
      o.notes,
      o.items
    FROM orders o
    JOIN users    u ON u.id = o.salesperson_id
    JOIN shops    s ON s.id = o.shop_id
    JOIN villages v ON v.id = o.village_id
    ORDER BY o.created_at DESC
  `);

  const date = isoDate();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="orders-${date}.csv"`);

  // Header row
  const header = csvRow([
    "Order#",
    "Date",
    "Salesperson",
    "Salesperson (EN)",
    "Shop",
    "Village",
    "Village (EN)",
    "Items Count",
    "Status",
    "Notes",
    "Item Details",
  ]);
  res.write(header + "\r\n");

  for (const row of rows) {
    const items: Array<{ name?: string; nameEn?: string; quantity?: number; unit?: string }> =
      Array.isArray(row.items) ? row.items : [];
    const itemDetails = items
      .map((i) => `${i.name ?? ""} ${i.quantity ?? ""} ${i.unit ?? ""}`.trim())
      .join(" | ");

    res.write(
      csvRow([
        `ORD-${row.order_number}`,
        new Date(row.created_at).toLocaleString("en-IN", { timeZone: "Asia/Kolkata" }),
        row.salesperson,
        row.salesperson_en ?? "",
        row.shop,
        row.village,
        row.village_en ?? "",
        row.item_count,
        row.status,
        row.notes ?? "",
        itemDetails,
      ]) + "\r\n",
    );
  }

  res.end();
});

/** GET /dashboard/export/items – export all items as CSV */
exportRouter.get("/export/items", async (_req, res) => {
  const { rows } = await pool.query(`
    SELECT name, marathi_name, aliases, unit, price, status
      FROM items
     WHERE deleted_at IS NULL
     ORDER BY name ASC
  `);

  const date = isoDate();
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="items-${date}.csv"`);

  res.write(csvRow(["Item Name", "Marathi Name", "Unit", "Price", "Status", "Aliases"]) + "\r\n");
  for (const row of rows) {
    const aliases = Array.isArray(row.aliases) ? row.aliases.join("; ") : "";
    res.write(
      csvRow([row.name, row.marathi_name ?? "", row.unit, row.price ?? "", row.status, aliases]) + "\r\n",
    );
  }
  res.end();
});

/** GET /dashboard/export/full – full data backup as JSON */
exportRouter.get("/export/full", async (_req, res) => {
  const [users, villages, shops, items, orders] = await Promise.all([
    pool.query(
      `SELECT id, name, name_en, email, mobile, role, status, created_at
       FROM users WHERE deleted_at IS NULL`,
    ),
    pool.query(
      `SELECT id, marathi_name, english_name, taluka, district, status
       FROM villages WHERE deleted_at IS NULL`,
    ),
    pool.query(
      `SELECT id, name, name_en, owner_name, mobile, address, village_id, outstanding_balance
       FROM shops WHERE deleted_at IS NULL`,
    ),
    pool.query(
      `SELECT id, name, marathi_name, aliases, unit, price, status
       FROM items WHERE deleted_at IS NULL`,
    ),
    pool.query(
      `SELECT o.id, o.order_number, o.salesperson_id, o.village_id, o.shop_id,
              o.transcribed_text, o.items, o.status, o.notes, o.created_at
       FROM orders o
       WHERE o.created_at >= now() - interval '90 days'
       ORDER BY o.created_at DESC`,
    ),
  ]);

  const date = isoDate();
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Content-Disposition", `attachment; filename="jain-distributor-backup-${date}.json"`);

  res.json({
    exportedAt: new Date().toISOString(),
    version: "1.0",
    data: {
      users: users.rows,
      villages: villages.rows,
      shops: shops.rows,
      items: items.rows,
      orders: orders.rows,
    },
  });
});

/** POST /dashboard/import/restore – restore from a JSON backup */
exportRouter.post("/import/restore", async (req, res) => {
  const schema = z.object({
    data: z.object({
      villages: z
        .array(
          z.object({
            marathi_name: z.string(),
            english_name: z.string(),
            taluka: z.string().nullable().optional(),
            district: z.string().nullable().optional(),
            status: z.string().optional(),
          }),
        )
        .optional()
        .default([]),
      items: z
        .array(
          z.object({
            name: z.string(),
            marathi_name: z.string().nullable().optional(),
            aliases: z.array(z.string()).nullable().optional(),
            unit: z.string(),
            price: z.number().nullable().optional(),
            status: z.string().optional(),
          }),
        )
        .optional()
        .default([]),
      shops: z
        .array(
          z.object({
            name: z.string(),
            name_en: z.string().nullable().optional(),
            owner_name: z.string().nullable().optional(),
            mobile: z.string().nullable().optional(),
            address: z.string().nullable().optional(),
            village_id: z.string().optional(),
            outstanding_balance: z.number().nullable().optional(),
          }),
        )
        .optional()
        .default([]),
      users: z
        .array(
          z.object({
            name: z.string(),
            name_en: z.string().nullable().optional(),
            email: z.string().email(),
            mobile: z.string().nullable().optional(),
            role: z.string().optional(),
            status: z.string().optional(),
          }),
        )
        .optional()
        .default([]),
    }),
  });

  const { data } = parse(schema, req.body);

  if (!data.villages.length && !data.items.length && !data.users.length && !data.shops.length) {
    throw badRequest("Backup data appears empty. Nothing to restore.", "EMPTY_BACKUP");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let importedVillages = 0;
    for (const v of data.villages) {
      await client.query(
        `INSERT INTO villages (marathi_name, english_name, taluka, district, status)
         VALUES ($1, $2, $3, $4, COALESCE($5, 'ACTIVE'))
         ON CONFLICT (english_name) DO UPDATE
           SET marathi_name = EXCLUDED.marathi_name,
               taluka       = COALESCE(EXCLUDED.taluka, villages.taluka),
               district     = COALESCE(EXCLUDED.district, villages.district)`,
        [v.marathi_name, v.english_name, v.taluka ?? null, v.district ?? null, v.status ?? null],
      );
      importedVillages++;
    }

    let importedItems = 0;
    for (const i of data.items) {
      await client.query(
        `INSERT INTO items (name, marathi_name, aliases, unit, price, status)
         VALUES ($1, $2, $3, $4, $5, COALESCE($6, 'ACTIVE'))
         ON CONFLICT (name, unit) DO UPDATE
           SET marathi_name = COALESCE(EXCLUDED.marathi_name, items.marathi_name),
               aliases      = COALESCE(EXCLUDED.aliases, items.aliases),
               price        = COALESCE(EXCLUDED.price, items.price)`,
        [
          i.name,
          i.marathi_name ?? null,
          i.aliases ? JSON.stringify(i.aliases) : null,
          i.unit,
          i.price ?? null,
          i.status ?? null,
        ],
      );
      importedItems++;
    }

    let importedShops = 0;
    for (const s of data.shops) {
      if (!s.village_id) continue;
      await client.query(
        `INSERT INTO shops (name, name_en, owner_name, mobile, address, village_id, outstanding_balance)
         VALUES ($1, $2, $3, $4, $5, $6, COALESCE($7, 0))
         ON CONFLICT DO NOTHING`,
        [s.name, s.name_en ?? null, s.owner_name ?? null, s.mobile ?? null, s.address ?? null, s.village_id, s.outstanding_balance ?? 0],
      );
      importedShops++;
    }

    let importedUsers = 0;
    for (const u of data.users) {
      // Skip admin users to avoid overwriting admin credentials
      if (u.role === "ADMIN") continue;
      await client.query(
        `INSERT INTO users (name, name_en, email, mobile, role, status)
         VALUES ($1, $2, $3, $4, COALESCE($5, 'SALESPERSON'), COALESCE($6, 'INACTIVE'))
         ON CONFLICT (email) DO UPDATE
           SET name    = EXCLUDED.name,
               name_en = COALESCE(EXCLUDED.name_en, users.name_en),
               mobile  = COALESCE(EXCLUDED.mobile, users.mobile)
         WHERE users.role <> 'ADMIN'`,
        [u.name, u.name_en ?? null, u.email, u.mobile ?? null, u.role ?? null, u.status ?? null],
      );
      importedUsers++;
    }

    await client.query("COMMIT");

    res.json({
      imported: {
        villages: importedVillages,
        items: importedItems,
        shops: importedShops,
        users: importedUsers,
      },
    });
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
});
