import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time check of the "Authorization: Bearer <CRON_SECRET>" header. */
export function isCronAuthorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || secret.length < 16) return false;
  const given = request.headers.get("authorization") ?? "";
  const a = createHash("sha256").update(given).digest();
  const b = createHash("sha256").update(`Bearer ${secret}`).digest();
  return timingSafeEqual(a, b);
}
