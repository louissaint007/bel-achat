import { put } from "@vercel/blob";
import { requireAdminApi } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const accepted = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: Request) {
  const denied = await requireAdminApi(request);
  if (denied) return denied;
  let form: FormData;
  try { form = await request.formData(); } catch { return Response.json({ error: "Fichier image invalide." }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choisis une photo à envoyer." }, { status: 400 });
  if (!accepted.has(file.type)) return Response.json({ error: "Formats acceptés : JPG, PNG ou WebP." }, { status: 400 });
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) return Response.json({ error: "La photo doit peser 4 Mo maximum." }, { status: 400 });
  try {
    const blob = await put(`products/${file.name.replace(/[^a-zA-Z0-9._-]/g, "-")}`, file, { access: "public", addRandomSuffix: true, contentType: file.type });
    return Response.json({ image: blob.url }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Le stockage photo Vercel Blob doit être configuré." }, { status: 503 });
  }
}
