import { requireAdminApi } from "../../../../lib/admin-auth";
import { readCatalog, writeCatalog } from "../../../../lib/catalog-store";
import { parseProductInput } from "../../../../lib/product-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const { catalog } = await readCatalog({ fresh: true });
    return Response.json({ products: catalog.products }, { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    const error = reason instanceof Error ? reason.message : "Impossible de charger les produits.";
    return Response.json({ error }, { status: 503 });
  }
}

export async function POST(request: Request) {
  const denied = await requireAdminApi(request);
  if (denied) return denied;
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Données invalides." }, { status: 400 }); }
  const input = parseProductInput(payload);
  if (!input) return Response.json({ error: "Vérifie le nom, la catégorie, le prix et l’image." }, { status: 400 });
  try {
    const { catalog, sha } = await readCatalog({ fresh: true });
    const now = new Date().toISOString();
    const product = { id: crypto.randomUUID(), ...input, createdAt: now, updatedAt: now };
    const updated = { ...catalog, products: [product, ...catalog.products] };
    await writeCatalog(updated, `Ajouter ${product.name} au catalogue Bel Achat`, sha);
    return Response.json({ product }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    const error = reason instanceof Error ? reason.message : "Impossible d’enregistrer ce produit.";
    return Response.json({ error }, { status: 503 });
  }
}
