import { cookies } from "next/headers";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) return Response.json({ error: "Origine de la demande refusée." }, { status: 403 });
  const store = await cookies();
  store.set("bel_achat_admin", "", { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "strict", path: "/", maxAge: 0 });
  return Response.json({ ok: true });
}
