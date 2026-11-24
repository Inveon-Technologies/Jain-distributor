import { z } from "zod";

export const uuid = z.string().uuid();
export const idParams = z.object({ id: uuid });
export const status = z.enum(["ACTIVE", "INACTIVE"]);
export const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
export const mobile = z
  .string()
  .trim()
  .regex(/^[+0-9 ()-]{7,20}$/, "Invalid mobile number");
export const optionalText = z.string().trim().max(500).optional().nullable();
export const password = z.string().min(6, "Password must be at least 6 characters").max(128);

export const pagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
});

export function pageMeta(page: number, pageSize: number, total: number) {
  return { page, pageSize, total, totalPages: Math.max(1, Math.ceil(total / pageSize)) };
}
