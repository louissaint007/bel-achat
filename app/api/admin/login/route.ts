import { adminCookieOptions, checkAdminPassword, createAdminSession, hasAdminConfiguration } from "../../../../lib/admin-auth";
import { cookies } from "next/headers";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Origine de la demande refusée." }, { status: 403 });
  if (!hasAdminConfiguration()) return Response.json({ error: "L’accès administrateur n’est pas encore configuré." }, { status: 503 });
  let body: { password?: unknown };
  try { body = await request.json(); } catch { return Response.json({ error: "Données invalides." }, { status: 400 }); }
  if (!checkAdminPassword(body.password)) return Response.json({ error: "Mot de passe incorrect." }, { status: 401 });
  const store = await cookies();
  store.set("bel_achat_admin", createAdminSession(), adminCookieOptions());
  return Response.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
}
