import pg from "pg";
import { config } from "../config.js";
import { logger } from "../lib/logger.js";

// Return NUMERIC as JS numbers (balances are small, 2-decimal values) and BIGINT counts as numbers.
pg.types.setTypeParser(pg.types.builtins.NUMERIC, (v) => parseFloat(v));
pg.types.setTypeParser(pg.types.builtins.INT8, (v) => parseInt(v, 10));

export const pool = new pg.Pool({
  connectionString: config.DATABASE_URL,
  ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
  max: 10,
});

pool.on("error", (err) => logger.error({ err }, "Unexpected PostgreSQL pool error"));

export type Queryable = Pick<pg.Pool, "query">;

export async function withTransaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}
