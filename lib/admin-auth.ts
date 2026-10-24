import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "bel_achat_admin";
const SESSION_SECONDS = 7 * 24 * 60 * 60;

function sessionSecret() {
  return process.env.BEL_ACHAT_SESSION_SECRET || "";
}

function passwordMatches(input: string, expected: string) {
  const inputHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();
  return timingSafeEqual(inputHash, expectedHash);
}

export function hasAdminConfiguration() {
  const password = process.env.BEL_ACHAT_ADMIN_PASSWORD || "";
  return password.length >= 20 && sessionSecret().length >= 32;
}

export function checkAdminPassword(input: unknown) {
  const expected = process.env.BEL_ACHAT_ADMIN_PASSWORD || "";
  return Boolean(typeof input === "string" && expected && sessionSecret() && passwordMatches(input, expected));
}

function sign(payload: string) {
  return createHmac("sha256", sessionSecret()).update(payload).digest("base64url");
}

export function createAdminSession() {
  const payload = String(Math.floor(Date.now() / 1000) + SESSION_SECONDS);
  return `${payload}.${sign(payload)}`;
}

function validSession(value: string | undefined) {
  if (!value || !sessionSecret()) return false;
  const [payload, signature, extra] = value.split(".");
  if (!payload || !signature || extra) return false;
  const expiresAt = Number(payload);
  if (!Number.isSafeInteger(expiresAt) || expiresAt <= Math.floor(Date.now() / 1000)) return false;
  const expected = Buffer.from(sign(payload));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export async function isAdminSessionValid() {
  const store = await cookies();
  return validSession(store.get(COOKIE_NAME)?.value);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}

export async function requireAdminApi(request?: Request): Promise<Response | null> {
  if (request && ["POST", "PUT", "PATCH", "DELETE"].includes(request.method)) {
    const origin = request.headers.get("origin");
    if (!origin || origin !== new URL(request.url).origin) {
      return Response.json({ error: "Origine de la demande refusée." }, { status: 403 });
    }
  }
  if (!hasAdminConfiguration()) {
    return Response.json({ error: "L’accès administrateur n’est pas encore configuré dans Vercel." }, { status: 503 });
  }
  if (!(await isAdminSessionValid())) {
    return Response.json({ error: "Connecte-toi avec le mot de passe administrateur." }, { status: 401 });
  }
  return null;
}
