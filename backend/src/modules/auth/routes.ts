import { Router } from "express";
import rateLimit from "express-rate-limit";
import { z } from "zod";
import { config } from "../../config.js";
import { pool } from "../../db/pool.js";
import { badRequest, conflict, unauthorized } from "../../lib/errors.js";
import { mobile, password } from "../../lib/schemas.js";
import { parse } from "../../lib/validate.js";
import { authenticate, currentUser, signToken, type Role } from "../../middleware/auth.js";
import { assertMobileFree, looksLikeMobile, usersWithMobile } from "./mobile.js";
import { hashPassword, verifyPassword } from "./passwords.js";

export const authRouter = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: config.NODE_ENV === "test" ? 1000 : 20,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: { error: { code: "TOO_MANY_REQUESTS", message: "Too many attempts, please try again later" } },
});

/** `login` is an email or a mobile number; `email` and `mobile` are accepted for older clients. */
const loginBody = z
  .object({
    login: z.string().trim().min(1).max(200).optional(),
    email: z.string().trim().min(1).max(200).optional(),
    mobile: z.string().trim().min(1).max(30).optional(),
    password: z.string().min(1),
  })
  .refine((b) => b.login || b.email || b.mobile, { message: "Enter your email or mobile number", path: ["login"] });

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

/** POST /auth/login – email or mobile number + password, for both admins and salespersons. */
authRouter.post("/login", loginLimiter, async (req, res) => {
  const body = parse(loginBody, req.body);
  const id = (body.login ?? body.email ?? body.mobile)!.trim();
  const byMobile = looksLikeMobile(id);
  if (!byMobile && !z.string().email().safeParse(id).success) {
    throw badRequest("Enter a valid email or mobile number");
  }

  const ids = byMobile ? await usersWithMobile(id) : [];
  const { rows } = await pool.query<
    UserRow & {
      passwordHash: string;
      failedLoginAttempts: number;
      lockedUntil: string | null;
    }
  >(
    `SELECT ${USER_COLUMNS}, password_hash AS "passwordHash",
            failed_login_attempts AS "failedLoginAttempts",
            locked_until AS "lockedUntil"
       FROM users
      WHERE deleted_at IS NULL AND (${byMobile ? "id = ANY($1::uuid[])" : "lower(email) = lower($1)"})`,
    [byMobile ? ids : id],
  );

  if (rows.length === 0) {
    throw unauthorized("Invalid email/mobile number or password", "INVALID_CREDENTIALS");
  }

  // Check if account is currently locked out
  for (const candidate of rows) {
    if (candidate.lockedUntil && new Date(candidate.lockedUntil) > new Date()) {
      const remainingMinutes = Math.max(1, Math.ceil((new Date(candidate.lockedUntil).getTime() - Date.now()) / 60000));
      throw unauthorized(
        `Account is locked due to 5 consecutive failed login attempts. Try again in ${remainingMinutes} minute(s) or contact administrator.`,
        "ACCOUNT_LOCKED",
      );
    }
  }

  // Older data may have two accounts on one number; the password decides which one it is.
  let user: (typeof rows)[number] | undefined;
  for (const row of rows) {
    if (await verifyPassword(body.password, row.passwordHash)) {
      user = row;
      break;
    }
  }
  if (!user) {
    const candidate = rows[0];
    const newAttempts = (candidate.failedLoginAttempts || 0) + 1;
    if (newAttempts >= 5) {
      const lockUntil = new Date(Date.now() + 20 * 60 * 1000);
      await pool.query(
        "UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3",
        [newAttempts, lockUntil, candidate.id],
      );
      throw unauthorized(
        "Account has been locked for 20 minutes due to 5 consecutive failed login attempts. Please contact administrator.",
        "ACCOUNT_LOCKED",
      );
    } else {
      await pool.query(
        "UPDATE users SET failed_login_attempts = $1 WHERE id = $2",
        [newAttempts, candidate.id],
      );
      const remaining = 5 - newAttempts;
      throw unauthorized(
        `Invalid password. ${remaining} attempt(s) remaining before 20-minute account lockout.`,
        "INVALID_CREDENTIALS",
      );
    }
  }
  if (user.status !== "ACTIVE") {
    throw unauthorized("Account is inactive or pending admin approval", "ACCOUNT_INACTIVE");
  }

  // Reset failed attempts & clear lockout upon successful login
  await pool.query(
    "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login_at = now() WHERE id = $1",
    [user.id],
  );
  res.json({ token: signToken(user), user: await loadProfile(user.id) });
});

/** POST /auth/register – field salesperson self sign-up; starts INACTIVE until an admin activates it. */
authRouter.post("/register", loginLimiter, async (req, res) => {
  const body = parse(registerBody, req.body);
  const existing = await pool.query("SELECT 1 FROM users WHERE lower(email) = $1 AND deleted_at IS NULL", [body.email]);
  if (existing.rowCount) throw conflict("An account with this email already exists");
  await assertMobileFree(body.mobile);

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
