import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { config } from "../config.js";
import { pool } from "../db/pool.js";
import { forbidden, unauthorized } from "../lib/errors.js";

export type Role = "ADMIN" | "SALESPERSON";

export interface AuthUser {
  id: string;
  role: Role;
  name: string;
  email: string;
}

declare module "express-serve-static-core" {
  interface Request {
    user?: AuthUser;
  }
}

export function signToken(user: { id: string; role: Role }): string {
  return jwt.sign({ role: user.role }, config.JWT_SECRET, {
    subject: user.id,
    expiresIn: config.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  });
}

/**
 * Verifies the bearer token and re-loads the user so that deactivating or deleting
 * a salesperson takes effect immediately, not when their token expires.
 */
export async function authenticate(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) throw unauthorized();

  let payload: jwt.JwtPayload;
  try {
    payload = jwt.verify(header.slice(7), config.JWT_SECRET) as jwt.JwtPayload;
  } catch {
    throw unauthorized("Invalid or expired token", "INVALID_TOKEN");
  }

  const { rows } = await pool.query<AuthUser & { status: string }>(
    `SELECT id, role, name, email, status FROM users WHERE id = $1 AND deleted_at IS NULL`,
    [payload.sub],
  );
  const user = rows[0];
  if (!user) throw unauthorized("Account no longer exists", "INVALID_TOKEN");
  if (user.status !== "ACTIVE") throw unauthorized("Account is inactive", "ACCOUNT_INACTIVE");

  req.user = { id: user.id, role: user.role, name: user.name, email: user.email };
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) throw unauthorized();
    if (!roles.includes(req.user.role)) throw forbidden();
    next();
  };
}

export const requireAdmin = requireRole("ADMIN");

/** Narrows `req.user` for handlers mounted behind `authenticate`. */
export function currentUser(req: Request): AuthUser {
  if (!req.user) throw unauthorized();
  return req.user;
}
