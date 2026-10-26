export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
  }
}

export const badRequest = (message: string, details?: unknown) =>
  new HttpError(400, "BAD_REQUEST", message, details);
export const unauthorized = (message = "Authentication required", code = "UNAUTHORIZED") =>
  new HttpError(401, code, message);
export const forbidden = (message = "You do not have access to this resource") =>
  new HttpError(403, "FORBIDDEN", message);
export const notFound = (entity: string) => new HttpError(404, "NOT_FOUND", `${entity} not found`);
export const conflict = (message: string) => new HttpError(409, "CONFLICT", message);
