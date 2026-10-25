import { requireAdminApi } from "../../../../lib/admin-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const accepted = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2026-03-10",
  };
}

export async function POST(request: Request) {
  const denied = await requireAdminApi(request);
  if (denied) return denied;

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return Response.json({ error: "Fichier image invalide." }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) return Response.json({ error: "Choisis une photo à envoyer." }, { status: 400 });
  const extension = accepted.get(file.type);
  if (!extension) return Response.json({ error: "Formats acceptés : JPG, PNG ou WebP." }, { status: 400 });
  if (file.size < 1 || file.size > MAX_IMAGE_BYTES) {
    return Response.json({ error: "La photo doit peser 4 Mo maximum." }, { status: 400 });
  }

  const owner = process.env.GITHUB_OWNER?.trim() || "louissaint007";
  const repo = process.env.GITHUB_REPO?.trim() || "bel-achat";
  const branch = process.env.GITHUB_BRANCH?.trim() || "main";
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) return Response.json({ error: "Le jeton GitHub de la boutique n’est pas configuré." }, { status: 503 });

  const path = `public/products/${crypto.randomUUID()}.${extension}`;
  const contentsUrl = `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${path.split("/").map(encodeURIComponent).join("/")}`;

  try {
    const response = await fetch(contentsUrl, {
      method: "PUT",
      headers: { ...githubHeaders(token), "Content-Type": "application/json" },
      body: JSON.stringify({
        message: `Ajout photo produit ${path.split("/").at(-1)}`,
        content: Buffer.from(await file.arrayBuffer()).toString("base64"),
        branch,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      const reason = response.status === 401
        ? "GitHub refuse le jeton GITHUB_TOKEN. Vérifie qu’il est encore actif dans Vercel."
        : response.status === 403
          ? "GitHub refuse l’envoi de la photo. Vérifie que GITHUB_TOKEN autorise Contents: Read and write."
          : response.status === 404
            ? "GitHub ne trouve pas le dépôt ou la branche configurée. Vérifie GITHUB_OWNER, GITHUB_REPO et GITHUB_BRANCH dans Vercel."
            : `GitHub n’a pas enregistré la photo (HTTP ${response.status}).`;
      return Response.json({ error: reason }, { status: response.status === 401 || response.status === 403 || response.status === 404 ? response.status : 502 });
    }

    const image = `https://raw.githubusercontent.com/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${branch.split("/").map(encodeURIComponent).join("/")}/${path}`;
    return Response.json({ image }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "Impossible de joindre GitHub pour enregistrer la photo. Réessaie dans quelques instants." }, { status: 502 });
  }
}

