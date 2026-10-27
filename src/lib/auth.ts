import "server-only";
import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "./db";
import { SESSION_COOKIE, SESSION_MAX_AGE, signSession, verifySession } from "./session";

const WINDOW_MS = 15 * 60 * 1000;
const PER_KEY_LIMIT = 5;
// Client IPs come from headers a client can forge, so a global cap also bounds total guessing.
const GLOBAL_LIMIT = 50;

const attempts = new Map<string, { count: number; until: number }>();

function safeEqual(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

function blocked(key: string, limit: number, now: number) {
  const rec = attempts.get(key);
  return !!rec && rec.until > now && rec.count >= limit;
}

function fail(key: string, now: number) {
  const rec = attempts.get(key);
  attempts.set(key, { count: rec && rec.until > now ? rec.count + 1 : 1, until: now + WINDOW_MS });
}

function prune(now: number) {
  if (attempts.size < 1000) return;
  for (const [k, v] of attempts) if (v.until <= now) attempts.delete(k);
}

/** Rejects missing or placeholder credentials so a production deploy can't run with them. */
function weakCredentials(user: string, pass: string) {
  return !user || pass.length < 12 || /change|password|admin|secret|use-a-long/i.test(pass);
}

/** Returns an error message, or null on success (session cookie set). */
export async function login(username: string, password: string, ip: string, userAgent = "") {
  const now = Date.now();
  prune(now);
  const keys = [`ip:${ip}`, `user:${username.toLowerCase().slice(0, 100)}`];
  if (keys.some((k) => blocked(k, PER_KEY_LIMIT, now)) || blocked("global", GLOBAL_LIMIT, now)) {
    return "Too many attempts. Try again in 15 minutes.";
  }

  const expectedUser = process.env.ADMIN_USERNAME ?? "";
  const expectedPass = process.env.ADMIN_PASSWORD ?? "";
  if (process.env.NODE_ENV === "production" && weakCredentials(expectedUser, expectedPass)) {
    console.error("Admin login disabled: set a strong ADMIN_PASSWORD (12+ chars, not a placeholder).");
    return "Admin login is disabled until a strong ADMIN_PASSWORD is configured.";
  }
  const ok = !!expectedPass && safeEqual(username, expectedUser) && safeEqual(password, expectedPass);
  if (!ok) {
    [...keys, "global"].forEach((k) => fail(k, now));
    return "Invalid username or password";
  }

  keys.forEach((k) => attempts.delete(k));
  const sid = randomUUID();
  await prisma.adminSession.create({
    data: {
      id: sid,
      username,
      expiresAt: new Date(now + SESSION_MAX_AGE * 1000),
      ip: ip.slice(0, 64),
      userAgent: userAgent.slice(0, 300) || null,
    },
  });
  // Old rows only matter for the sessions list; drop ones that expired a week ago.
  await prisma.adminSession.deleteMany({ where: { expiresAt: { lt: new Date(now - 7 * 24 * 3600 * 1000) } } });
  (await cookies()).set(SESSION_COOKIE, await signSession(username, sid), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
  return null;
}

/** Revokes this browser's session on the server, so a copied cookie stops working too. */
export async function logout() {
  const jar = await cookies();
  const token = await verifySession(jar.get(SESSION_COOKIE)?.value);
  if (token) await prisma.adminSession.updateMany({ where: { id: token.sid, revokedAt: null }, data: { revokedAt: new Date() } });
  jar.delete(SESSION_COOKIE);
}

/** A valid signature is not enough: the session row must exist, be unexpired and not revoked. */
export async function getSession() {
  const token = await verifySession((await cookies()).get(SESSION_COOKIE)?.value);
  if (!token) return null;
  const row = await prisma.adminSession.findUnique({ where: { id: token.sid } });
  const now = new Date();
  if (!row || row.revokedAt || row.expiresAt <= now) return null;
  if (now.getTime() - row.lastSeenAt.getTime() > 5 * 60 * 1000) {
    await prisma.adminSession.update({ where: { id: row.id }, data: { lastSeenAt: now } });
  }
  return { username: token.username, sid: token.sid };
}

export function listActiveSessions() {
  return prisma.adminSession.findMany({
    where: { revokedAt: null, expiresAt: { gt: new Date() } },
    orderBy: { lastSeenAt: "desc" },
  });
}

/** Revokes one session, or every session except `keep` when id is omitted. */
export async function revokeSessions({ id, keep }: { id?: string; keep?: string }) {
  await prisma.adminSession.updateMany({
    where: { revokedAt: null, ...(id ? { id } : {}), ...(keep ? { NOT: { id: keep } } : {}) },
    data: { revokedAt: new Date() },
  });
}

/** Call at the top of every admin server action and admin data loader. */
export async function requireAdmin() {
  const session = await getSession();
  if (!session) redirect("/admin/login");
  return session;
}
