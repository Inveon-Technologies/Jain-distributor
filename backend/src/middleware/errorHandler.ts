import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { HttpError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

const PG_UNIQUE_VIOLATION = "23505";
const PG_FOREIGN_KEY_VIOLATION = "23503";
const PG_INVALID_TEXT = "22P02";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({ error: { code: "NOT_FOUND", message: `Route ${req.method} ${req.path} not found` } });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof HttpError) {
    res.status(err.status).json({ error: { code: err.code, message: err.message, details: err.details } });
    return;
  }
  if (err instanceof multer.MulterError) {
    const status = err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    res.status(status).json({ error: { code: err.code, message: err.message } });
    return;
  }
  if (err instanceof SyntaxError && "body" in err) {
    res.status(400).json({ error: { code: "INVALID_JSON", message: "Request body is not valid JSON" } });
    return;
  }
  const pgCode = (err as { code?: string }).code;
  if (pgCode === PG_UNIQUE_VIOLATION) {
    res.status(409).json({ error: { code: "CONFLICT", message: "A record with these details already exists" } });
    return;
  }
  if (pgCode === PG_FOREIGN_KEY_VIOLATION) {
    res.status(400).json({ error: { code: "INVALID_REFERENCE", message: "A referenced record does not exist" } });
    return;
  }
  if (pgCode === PG_INVALID_TEXT) {
    res.status(400).json({ error: { code: "BAD_REQUEST", message: "Invalid identifier" } });
    return;
  }

  (req.log ?? logger).error({ err }, "Unhandled error");
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong" } });
}
