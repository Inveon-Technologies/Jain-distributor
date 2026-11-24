import { pool } from "../../db/pool.js";
import { conflict } from "../../lib/errors.js";

/**
 * Indian mobile numbers are written many ways ("+91 98220 12345", "098220-12345", "9822012345").
 * The key is the last 10 digits, so all of those match the same account.
 */
export function mobileKey(value: string | null | undefined): string {
  const digits = (value ?? "").replace(/\D/g, "");
  return digits.length > 10 ? digits.slice(-10) : digits;
}

/** True when the login identifier looks like a phone number rather than an email. */
export function looksLikeMobile(value: string): boolean {
  return !value.includes("@") && /^[+0-9 ()-]{7,20}$/.test(value.trim());
}

/** Ids of live users whose mobile number has the same key. */
export async function usersWithMobile(value: string, exceptId?: string): Promise<string[]> {
  const key = mobileKey(value);
  if (key.length < 7) return [];
  const { rows } = await pool.query<{ id: string; mobile: string }>(
    `SELECT id, mobile FROM users
      WHERE deleted_at IS NULL AND mobile IS NOT NULL
        AND regexp_replace(mobile, '\\D', '', 'g') LIKE '%' || $1
        AND ($2::uuid IS NULL OR id <> $2)`,
    [key, exceptId ?? null],
  );
  return rows.filter((r) => mobileKey(r.mobile) === key).map((r) => r.id);
}

/** Mobile numbers are a login id, so two live accounts cannot share one. */
export async function assertMobileFree(value: string, exceptId?: string) {
  if ((await usersWithMobile(value, exceptId)).length) {
    throw conflict("An account with this mobile number already exists");
  }
}
