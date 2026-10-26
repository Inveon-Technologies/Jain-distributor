import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../../config.js";
import { pool } from "../../db/pool.js";
import { badRequest, conflict, unauthorized } from "../../lib/errors.js";
import { mobile, password } from "../../lib/schemas.js";
import { parse } from "../../lib/validate.js";
import { authenticate, currentUser, signToken, type Role } from "../../middleware/auth.js";
import { hashPassword, verifyPassword } from "./passwords.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.NODE_ENV === "test" ? 1000 : 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts, please try again later" } },
});

const loginBody = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1),
});

const registerBody = z.object({
  name: z.string().trim().min(2).max(100),
  nameEn: z.string().trim().max(100).optional(),
  email: z.string().trim().toLowerCase().email(),
  mobile,
  password,
});

const changePasswordBody = z.object({
  currentPassword: z.string().min(1),
  newPassword: password,
});

interface UserRow {
  id: string;
  name: string;
  nameEn: string | null;
  email: string;
  mobile: string | null;
  role: Role;
  status: "ACTIVE" | "INACTIVE";
}

const USER_COLUMNS = `id, name, name_en AS "nameEn", email, mobile, role, status`;

async function loadProfile(userId: string) {
  const { rows } = await pool.query<UserRow>(`SELECT ${USER_COLUMNS} FROM users WHERE id = $1`, [userId]);
  const user = rows[0];
  const villages =
    user.role === "SALESPERSON"
      ? (
          await pool.query(
            `SELECT v.id, v.marathi_name AS "marathiName", v.english_name AS "englishName"
               FROM salesperson_villages sv JOIN villages v ON v.id = sv.village_id
              WHERE sv.salesperson_id = $1 AND v.deleted_at IS NULL
              ORDER BY v.english_name`,
            [userId],
          )
        ).rows
      : [];
  return { ...user, assignedVillages: villages };
}

/** POST /auth/login – email + password for both admins and salespersons. */
authRouter.post("/login", loginLimiter, async (req, res) => {
  const { email, password: plain } = parse(loginBody, req.body);
  const { rows } = await pool.query<UserRow & { passwordHash: string }>(
    `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash"
       FROM users WHERE lower(email) = $1 AND deleted_at IS NULL`,
    [email],
  );
  const user = rows[0];
  if (!user || !(await verifyPassword(plain, user.passwordHash))) {
    throw unauthorized("Invalid email or password", "INVALID_CREDENTIALS");
  }
  if (user.status !== "ACTIVE") {
    throw unauthorized("Account is inactive or pending admin approval", "ACCOUNT_INACTIVE");
  }
  await pool.query("UPDATE users SET last_login_at = now() WHERE id = $1", [user.id]);
  res.json({ token: signToken(user), user: await loadProfile(user.id) });
});

/** POST /auth/register – field salesperson self sign-up; starts INACTIVE until an admin activates it. */
authRouter.post("/register", loginLimiter, async (req, res) => {
  const body = parse(registerBody, req.body);
  const existing = await pool.query("SELECT 1 FROM users WHERE lower(email) = $1 AND deleted_at IS NULL", [body.email]);
  if (existing.rowCount) throw conflict("An account with this email already exists");

  const { rows } = await pool.query<UserRow>(
    `INSERT INTO users (name, name_en, email, mobile, password_hash, role, status)
     VALUES ($1, $2, $3, $4, $5, 'SALESPERSON', 'INACTIVE')
     RETURNING ${USER_COLUMNS}`,
    [body.name, body.nameEn ?? null, body.email, body.mobile, await hashPassword(body.password)],
  );
  res.status(201).json({ user: rows[0], pendingApproval: true });
});

authRouter.get("/me", authenticate, async (req, res) => {
  res.json({ user: await loadProfile(currentUser(req).id) });
});

authRouter.post("/change-password", authenticate, async (req, res) => {
  const { currentPassword, newPassword } = parse(changePasswordBody, req.body);
  const userId = currentUser(req).id;
  const { rows } = await pool.query<{ hash: string }>(`SELECT password_hash AS hash FROM users WHERE id = $1`, [userId]);
  if (!(await verifyPassword(currentPassword, rows[0].hash))) {
    throw badRequest("Current password is incorrect");
  }
  await pool.query("UPDATE users SET password_hash = $2, updated_at = now() WHERE id = $1", [
    userId,
    await hashPassword(newPassword),
  ]);
  res.status(204).end();
});
