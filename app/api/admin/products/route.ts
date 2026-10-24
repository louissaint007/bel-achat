import { desc } from "drizzle-orm";
import { getDb } from "../../../../db";
import { products } from "../../../../db/schema";
import { requireAdminApi } from "../../../../lib/admin-auth";
import { parseProductInput } from "../../../../lib/product-validation";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const denied = await requireAdminApi();
  if (denied) return denied;
  try {
    const rows = await getDb().select().from(products).orderBy(desc(products.updatedAt));
    return Response.json({ products: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Impossible de charger les produits." }, { status: 503 });
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
    const id = crypto.randomUUID();
    const [product] = await getDb().insert(products).values({ id, ...input }).returning();
    return Response.json({ product }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Impossible d’enregistrer ce produit." }, { status: 503 });
  }
}
