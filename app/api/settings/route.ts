import { readCatalog } from "../../../lib/catalog-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const { catalog } = await readCatalog();
    return Response.json(catalog.settings, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ shopName: "Bel Achat", whatsappNumber: "" }, { headers: { "Cache-Control": "no-store" } });
  }
}
