import { eq, inArray } from "drizzle-orm";
import { getDb } from "../../../db";
import { settings } from "../../../db/schema";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  try {
    const rows = await getDb().select().from(settings).where(inArray(settings.key, ["shopName", "whatsappNumber"]));
    const values = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return Response.json({ shopName: values.shopName || "Bel Achat", whatsappNumber: values.whatsappNumber || "" }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ shopName: "Bel Achat", whatsappNumber: "" }, { headers: { "Cache-Control": "no-store" } });
  }
}
