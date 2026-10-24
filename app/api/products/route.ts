import { desc, eq } from "drizzle-orm";
import { getDb } from "../../../db";
import { products } from "../../../db/schema";
import { isAdminSessionValid } from "../../../lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const admin = await isAdminSessionValid();
    const db = getDb();
    const rows = admin
      ? await db.select().from(products).orderBy(desc(products.createdAt))
      : await db.select().from(products).where(eq(products.available, true)).orderBy(desc(products.createdAt));
    return Response.json({ products: rows }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Le catalogue est momentanément indisponible." }, { status: 503 });
  }
}
