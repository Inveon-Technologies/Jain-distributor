import { Router } from "express";
import { z } from "zod";
import { pool } from "../../db/pool.js";
import { isoDate } from "../../lib/schemas.js";
import { businessDayRange } from "../../lib/time.js";
import { parse } from "../../lib/validate.js";
import { authenticate, requireAdmin } from "../../middleware/auth.js";

export const reportsRouter = Router();
reportsRouter.use(authenticate, requireAdmin);

const DAY_MS = 24 * 60 * 60 * 1000;

function computePeriodRange(period: "day" | "week" | "month" | "all", dateStr?: string) {
  const { date, start: dayStart, end: dayEnd } = businessDayRange(dateStr);
  if (period === "day") {
    return { date, start: dayStart, end: dayEnd, label: `Day: ${date}` };
  }
  if (period === "week") {
    const start = new Date(dayEnd.getTime() - 7 * DAY_MS);
    return { date, start, end: dayEnd, label: `Past 7 Days (up to ${date})` };
  }
  if (period === "month") {
    const start = new Date(dayEnd.getTime() - 30 * DAY_MS);
    return { date, start, end: dayEnd, label: `Past 30 Days (up to ${date})` };
  }
  return { date, start: new Date("2020-01-01T00:00:00Z"), end: dayEnd, label: `All Time (up to ${date})` };
}

const querySchema = z.object({
  period: z.enum(["day", "week", "month", "all"]).default("day"),
  date: isoDate.optional(),
});

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

/**
 * GET /dashboard/reports?period=day|week|month|all&date=YYYY-MM-DD
 * Returns comprehensive analytics:
 *  - summary
 *  - salesperson breakdown
 *  - item master breakdown
 *  - village / city ranking (highest orders)
 */
reportsRouter.get("/reports", async (req, res) => {
  const { period, date: requestedDate } = parse(querySchema, req.query);
  const { date, start, end, label } = computePeriodRange(period, requestedDate);

  // 1. Salesperson breakdown (includes active salespersons even if 0 orders)
  const salespersonsQuery = pool.query(`
    SELECT
      u.id AS "salespersonId",
      u.name,
      u.name_en AS "nameEn",
      u.mobile,
      COALESCE(stats.order_count, 0)::int AS "orderCount",
      COALESCE(stats.total_quantity, 0)::numeric AS "totalQuantity",
      COALESCE(stats.unique_shops, 0)::int AS "uniqueShops",
      COALESCE(stats.unique_villages, 0)::int AS "uniqueVillages"
    FROM users u
    LEFT JOIN (
      SELECT
        o.salesperson_id,
        count(o.id) AS order_count,
        count(DISTINCT o.shop_id) AS unique_shops,
        count(DISTINCT o.village_id) AS unique_villages,
        COALESCE(SUM((SELECT COALESCE(SUM((item->>'quantity')::numeric), 0) FROM jsonb_array_elements(o.items) item)), 0) AS total_quantity
      FROM orders o
      WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'CANCELLED'
      GROUP BY o.salesperson_id
    ) stats ON stats.salesperson_id = u.id
    WHERE u.role = 'SALESPERSON' AND u.deleted_at IS NULL
    ORDER BY "orderCount" DESC, "totalQuantity" DESC, u.name ASC
  `, [start, end]);

  // 2. Item breakdown
  const itemsQuery = pool.query(`
    SELECT
      COALESCE(elem->>'itemId', elem->>'name') AS "itemKey",
      COALESCE(elem->>'itemName', elem->>'name') AS "name",
      COALESCE(elem->>'itemUnit', elem->>'unit', '') AS "unit",
      elem->>'itemId' AS "itemId",
      SUM(COALESCE((elem->>'quantity')::numeric, 0))::numeric AS "totalQuantity",
      COUNT(DISTINCT o.id)::int AS "orderCount"
    FROM orders o,
         jsonb_array_elements(o.items) AS elem
    WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'CANCELLED'
    GROUP BY "itemKey", "name", "unit", elem->>'itemId'
    ORDER BY "totalQuantity" DESC, "orderCount" DESC
  `, [start, end]);

  // 3. Village / City breakdown (highest orders first)
  const villagesQuery = pool.query(`
    SELECT
      v.id AS "villageId",
      v.marathi_name AS "villageName",
      v.english_name AS "villageNameEn",
      COALESCE(v.taluka, '') AS "taluka",
      COALESCE(v.district, '') AS "district",
      COUNT(DISTINCT o.id)::int AS "orderCount",
      COUNT(DISTINCT o.shop_id)::int AS "uniqueShops",
      COALESCE(SUM((SELECT COALESCE(SUM((item->>'quantity')::numeric), 0) FROM jsonb_array_elements(o.items) item)), 0)::numeric AS "totalQuantity"
    FROM villages v
    JOIN orders o ON o.village_id = v.id
    WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'CANCELLED'
    GROUP BY v.id, v.marathi_name, v.english_name, v.taluka, v.district
    ORDER BY "orderCount" DESC, "totalQuantity" DESC
  `, [start, end]);

  // 4. Period summary
  const summaryQuery = pool.query(`
    SELECT
      COUNT(o.id)::int AS "totalOrders",
      COUNT(DISTINCT o.salesperson_id)::int AS "activeSalespersons",
      COUNT(DISTINCT o.village_id)::int AS "activeVillages",
      COUNT(DISTINCT o.shop_id)::int AS "activeShops",
      COALESCE(SUM((SELECT COALESCE(SUM((item->>'quantity')::numeric), 0) FROM jsonb_array_elements(o.items) item)), 0)::numeric AS "totalQuantity"
    FROM orders o
    WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'CANCELLED'
  `, [start, end]);

  const [salespersons, items, villages, summaryRes] = await Promise.all([
    salespersonsQuery,
    itemsQuery,
    villagesQuery,
    summaryQuery,
  ]);

  res.json({
    data: {
      period,
      date,
      label,
      range: { start: start.toISOString(), end: end.toISOString() },
      summary: summaryRes.rows[0] || {
        totalOrders: 0,
        activeSalespersons: 0,
        activeVillages: 0,
        activeShops: 0,
        totalQuantity: 0,
      },
      salespersons: salespersons.rows,
      items: items.rows,
      villages: villages.rows,
    },
  });
});

/**
 * GET /dashboard/reports/export?period=day|week|month|all&date=YYYY-MM-DD
 * Exports the full analytics report as CSV
 */
reportsRouter.get("/reports/export", async (req, res) => {
  const { period, date: requestedDate } = parse(querySchema, req.query);
  const { date, start, end, label } = computePeriodRange(period, requestedDate);

  const [salespersonsRes, itemsRes, villagesRes] = await Promise.all([
    pool.query(`
      SELECT
        u.name,
        u.name_en AS "nameEn",
        u.mobile,
        count(o.id)::int AS "orderCount",
        count(DISTINCT o.shop_id)::int AS "uniqueShops",
        count(DISTINCT o.village_id)::int AS "uniqueVillages",
        COALESCE(SUM((SELECT COALESCE(SUM((item->>'quantity')::numeric), 0) FROM jsonb_array_elements(o.items) item)), 0)::numeric AS "totalQuantity"
      FROM users u
      LEFT JOIN orders o ON o.salesperson_id = u.id AND o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'CANCELLED'
      WHERE u.role = 'SALESPERSON' AND u.deleted_at IS NULL
      GROUP BY u.id, u.name, u.name_en, u.mobile
      ORDER BY "orderCount" DESC, "totalQuantity" DESC
    `, [start, end]),
    pool.query(`
      SELECT
        COALESCE(elem->>'itemName', elem->>'name') AS "name",
        COALESCE(elem->>'itemUnit', elem->>'unit', '') AS "unit",
        SUM(COALESCE((elem->>'quantity')::numeric, 0))::numeric AS "totalQuantity",
        COUNT(DISTINCT o.id)::int AS "orderCount"
      FROM orders o,
           jsonb_array_elements(o.items) AS elem
      WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'CANCELLED'
      GROUP BY "name", "unit"
      ORDER BY "totalQuantity" DESC
    `, [start, end]),
    pool.query(`
      SELECT
        v.marathi_name AS "villageName",
        v.english_name AS "villageNameEn",
        COALESCE(v.taluka, '') AS "taluka",
        COUNT(DISTINCT o.id)::int AS "orderCount",
        COUNT(DISTINCT o.shop_id)::int AS "uniqueShops",
        COALESCE(SUM((SELECT COALESCE(SUM((item->>'quantity')::numeric), 0) FROM jsonb_array_elements(o.items) item)), 0)::numeric AS "totalQuantity"
      FROM villages v
      JOIN orders o ON o.village_id = v.id
      WHERE o.created_at >= $1 AND o.created_at < $2 AND o.status <> 'CANCELLED'
      GROUP BY v.id, v.marathi_name, v.english_name, v.taluka
      ORDER BY "orderCount" DESC, "totalQuantity" DESC
    `, [start, end]),
  ]);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="analytics-report-${period}-${date}.csv"`);

  let csv = "";
  // Header section
  csv += csvRow(["JAIN DISTRIBUTOR - ANALYTICS REPORT"]) + "\r\n";
  csv += csvRow(["Period:", label]) + "\r\n";
  csv += csvRow(["Generated At:", new Date().toLocaleString("en-IN", { timeZone: "Asia/Kolkata" })]) + "\r\n\r\n";

  // Section 1: Salespersons
  csv += csvRow(["=== 1. SALESPERSON PERFORMANCE ==="]) + "\r\n";
  csv += csvRow(["Rank", "Salesperson Name", "English Name", "Mobile", "Orders Taken", "Total Quantity", "Shops Served", "Villages Visited"]) + "\r\n";
  salespersonsRes.rows.forEach((sp, idx) => {
    csv += csvRow([idx + 1, sp.name, sp.nameEn || "", sp.mobile || "", sp.orderCount, sp.totalQuantity, sp.uniqueShops, sp.uniqueVillages]) + "\r\n";
  });
  csv += "\r\n";

  // Section 2: Items
  csv += csvRow(["=== 2. ITEM ORDERS ANALYSIS ==="]) + "\r\n";
  csv += csvRow(["Rank", "Item Name", "Unit", "Total Quantity Ordered", "Number of Orders"]) + "\r\n";
  itemsRes.rows.forEach((it, idx) => {
    csv += csvRow([idx + 1, it.name, it.unit, it.totalQuantity, it.orderCount]) + "\r\n";
  });
  csv += "\r\n";

  // Section 3: Villages / Cities
  csv += csvRow(["=== 3. CITY / VILLAGE PERFORMANCE (HIGHEST ORDERS) ==="]) + "\r\n";
  csv += csvRow(["Rank", "Village / City", "English Name", "Taluka", "Orders Placed", "Total Items Quantity", "Active Shops"]) + "\r\n";
  villagesRes.rows.forEach((vg, idx) => {
    csv += csvRow([idx + 1, vg.villageName, vg.villageNameEn, vg.taluka, vg.orderCount, vg.totalQuantity, vg.uniqueShops]) + "\r\n";
  });

  res.send(csv);
});
