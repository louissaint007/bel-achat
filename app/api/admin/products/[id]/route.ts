import { requireAdminApi } from "../../../../../lib/admin-auth";
import { readCatalog, writeCatalog } from "../../../../../lib/catalog-store";
import { parseProductInput } from "../../../../../lib/product-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
type RouteContext = { params: Promise<{ id: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const denied = await requireAdminApi(request);
  if (denied) return denied;
  let payload: unknown;
  try { payload = await request.json(); } catch { return Response.json({ error: "Données invalides." }, { status: 400 }); }
  const input = parseProductInput(payload);
  if (!input) return Response.json({ error: "Vérifie le nom, la catégorie, le prix et l’image." }, { status: 400 });
  const { id } = await context.params;
  try {
    const { catalog, sha } = await readCatalog({ fresh: true });
    const index = catalog.products.findIndex((product) => product.id === id);
    if (index < 0) return Response.json({ error: "Produit introuvable." }, { status: 404 });
    const product = { id, ...input, createdAt: catalog.products[index].createdAt, updatedAt: new Date().toISOString() };
    const products = [...catalog.products];
    products[index] = product;
    await writeCatalog({ ...catalog, products }, `Modifier ${product.name} dans le catalogue Bel Achat`, sha);
    return Response.json({ product }, { headers: { "Cache-Control": "no-store" } });
  } catch (reason) {
    const error = reason instanceof Error ? reason.message : "Impossible de modifier ce produit.";
    return Response.json({ error }, { status: 503 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await requireAdminApi(request);
  if (denied) return denied;
  const { id } = await context.params;
  try {
    const { catalog, sha } = await readCatalog({ fresh: true });
    const product = catalog.products.find((item) => item.id === id);
    if (!product) return Response.json({ error: "Produit introuvable." }, { status: 404 });
    const products = catalog.products.filter((item) => item.id !== id);
    await writeCatalog({ ...catalog, products }, `Supprimer ${product.name} du catalogue Bel Achat`, sha);
    return Response.json({ deleted: true });
  } catch (reason) {
    const error = reason instanceof Error ? reason.message : "Impossible de supprimer ce produit.";
    return Response.json({ error }, { status: 503 });
  }
}
