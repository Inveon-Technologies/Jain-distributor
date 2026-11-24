import { config } from "../config.js";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Returns the [start, end) UTC instants of a business day (IST by default).
 * `date` is YYYY-MM-DD in business time; omitted means "today".
 */
export function businessDayRange(date?: string, now: Date = new Date()): { date: string; start: Date; end: Date } {
  const offsetMs = config.BUSINESS_TZ_OFFSET_MINUTES * 60 * 1000;
  const day = date ?? new Date(now.getTime() + offsetMs).toISOString().slice(0, 10);
  const [y, m, d] = day.split("-").map(Number);
  const start = new Date(Date.UTC(y, m - 1, d) - offsetMs);
  return { date: day, start, end: new Date(start.getTime() + DAY_MS) };
}
