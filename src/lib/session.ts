import { jwtVerify, SignJWT } from "jose";

export const SESSION_COOKIE = "admin_session";
export const SESSION_MAX_AGE = 60 * 60 * 12;

function key() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("SESSION_SECRET must be set (32+ chars)");
  return new TextEncoder().encode(secret);
}

/** `sid` is the AdminSession row id, so the server can revoke this token before it expires. */
export async function signSession(username: string, sid: string) {
  return new SignJWT({ sub: username, role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(sid)
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(key());
}

/**
 * Checks the signature and expiry only. Revocation needs the database, which lives in
 * getSession() (lib/auth), so the proxy stays a cheap first gate.
 */
export async function verifySession(token: string | undefined) {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, key(), { algorithms: ["HS256"] });
    if (payload.role !== "admin" || !payload.jti) return null;
    return { username: String(payload.sub), sid: payload.jti };
  } catch {
    return null;
  }
}
