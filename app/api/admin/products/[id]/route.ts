import { eq } from "drizzle-orm";
import { getDb } from "../../../../../db";
import { products } from "../../../../../db/schema";
import { requireAdminApi } from "../../../../../lib/admin-auth";
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
    const [product] = await getDb().update(products).set({ ...input, updatedAt: new Date() }).where(eq(products.id, id)).returning();
    if (!product) return Response.json({ error: "Produit introuvable." }, { status: 404 });
    return Response.json({ product }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Impossible de modifier ce produit." }, { status: 503 });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const denied = await requireAdminApi(request);
  if (denied) return denied;
  const { id } = await context.params;
  try {
    const [product] = await getDb().delete(products).where(eq(products.id, id)).returning({ id: products.id });
    if (!product) return Response.json({ error: "Produit introuvable." }, { status: 404 });
    return Response.json({ deleted: true });
  } catch {
    return Response.json({ error: "Impossible de supprimer ce produit." }, { status: 503 });
  }
}
