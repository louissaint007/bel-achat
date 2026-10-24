import { inArray } from "drizzle-orm";
import { getDb } from "../../../../db";
import { settings } from "../../../../db/schema";
import { requireAdminApi } from "../../../../lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const rows = await getDb().select().from(settings).where(inArray(settings.key, ["shopName", "whatsappNumber"]));
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return Response.json({ shopName: values.shopName || "Bel Achat", whatsappNumber: values.whatsappNumber || "" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Impossible de charger les paramètres." }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdminApi(request);
  if (denied) return denied;
  let payload: { shopName?: unknown; whatsappNumber?: unknown };
  try { payload = await request.json(); } catch { return Response.json({ error: "Données invalides." }, { status: 400 }); }
  const shopName = typeof payload.shopName === "string" ? payload.shopName.trim() : "";
  const whatsappNumber = typeof payload.whatsappNumber === "string" ? payload.whatsappNumber.replace(/\D/g, "") : "";
  if (!shopName || shopName.length > 80) {
    return Response.json({ error: "Saisis un nom de boutique de 1 à 80 caractères." }, { status: 400 });
  }
  if (whatsappNumber && !/^\d{8,15}$/.test(whatsappNumber)) {
    return Response.json({ error: "Saisis le numéro avec l’indicatif pays, sans + ni espaces." }, { status: 400 });
  }
  try {
    const db = getDb();
    await db.insert(settings).values({ key: "shopName", value: shopName }).onConflictDoUpdate({ target: settings.key, set: { value: shopName, updatedAt: new Date() } });
    await db.insert(settings).values({ key: "whatsappNumber", value: whatsappNumber }).onConflictDoUpdate({ target: settings.key, set: { value: whatsappNumber, updatedAt: new Date() } });
    return Response.json({ shopName, whatsappNumber });
  } catch {
    return Response.json({ error: "Impossible d’enregistrer le numéro WhatsApp." }, { status: 503 });
  }
}
