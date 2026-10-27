import { requireAdminApi } from "../../../../lib/admin-auth";
import { readCatalog, writeCatalog } from "../../../../lib/catalog-store";
import { normalizeWhatsAppLink } from "../../../../lib/whatsapp";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const { catalog } = await readCatalog({ fresh: true });
    return Response.json(catalog.settings, { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    const error = reason instanceof Error ? reason.message : "Impossible de charger les paramètres.";
    return Response.json({ error }, { status: 503 });
  }
}

export async function PUT(request: Request) {
  const denied = await requireAdminApi(request);
  if (denied) return denied;
  let payload: { shopName?: unknown; whatsappNumber?: unknown; whatsappLink?: unknown };
  try { payload = await request.json(); } catch { return Response.json({ error: "Données invalides." }, { status: 400 }); }
  const shopName = typeof payload.shopName === "string" ? payload.shopName.trim() : "";
  const whatsappNumber = typeof payload.whatsappNumber === "string" ? payload.whatsappNumber.replace(/\D/g, "") : "";
  const whatsappLink = normalizeWhatsAppLink(payload.whatsappLink);
  if (!shopName || shopName.length > 80) return Response.json({ error: "Saisis un nom de boutique de 1 à 80 caractères." }, { status: 400 });
  if (whatsappNumber && !/^\d{8,15}$/.test(whatsappNumber)) return Response.json({ error: "Saisis le numéro avec l’indicatif pays, sans + ni espaces." }, { status: 400 });
  if (whatsappLink === null) return Response.json({ error: "Le lien doit être une adresse HTTPS WhatsApp valide (wa.me, groupe, chaîne ou whatsapp.com)." }, { status: 400 });
  try {
    const { catalog, sha } = await readCatalog({ fresh: true });
    const settings = { shopName, whatsappNumber, whatsappLink };
    await writeCatalog({ ...catalog, settings }, "Mettre à jour les paramètres de Bel Achat", sha);
    return Response.json(settings, { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    const error = reason instanceof Error ? reason.message : "Impossible d’enregistrer les paramètres.";
    return Response.json({ error }, { status: 503 });
  }
}
