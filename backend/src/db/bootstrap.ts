import { config } from "../config.js";
import { logger } from "../lib/logger.js";
import { hashPassword } from "../modules/auth/passwords.js";
import { pool } from "./pool.js";

/** Creates the first admin from ADMIN_EMAIL / ADMIN_PASSWORD when the database has no admin yet. */
export async function ensureAdmin(): Promise<void> {
  if (!config.ADMIN_EMAIL || !config.ADMIN_PASSWORD) return;
  const { rowCount } = await pool.query("SELECT 1 FROM users WHERE role = 'ADMIN' AND deleted_at IS NULL LIMIT 1");
  if (rowCount) return;
  await pool.query(
    `INSERT INTO users (name, name_en, email, password_hash, role, status)
     VALUES ($1, 'Administrator', $2, $3, 'ADMIN', 'ACTIVE')`,
    [config.ADMIN_NAME, config.ADMIN_EMAIL.toLowerCase(), await hashPassword(config.ADMIN_PASSWORD)],
  );
  logger.info({ email: config.ADMIN_EMAIL }, "Created bootstrap admin account");
}
