import { isAdminSessionValid } from "../../../lib/admin-auth";
import { readCatalog } from "../../../lib/catalog-store";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const [{ catalog }, admin] = await Promise.all([readCatalog(), isAdminSessionValid()]);
    const products = admin ? catalog.products : catalog.products.filter((product) => product.available);
    return Response.json({ products }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Le catalogue est momentanément indisponible." }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
