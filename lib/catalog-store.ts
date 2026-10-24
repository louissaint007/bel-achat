import { parseProductInput, type ProductInput } from "./product-validation";

export type CatalogProduct = ProductInput & {
  id: string;
  createdAt: string;
  updatedAt: string;
};

export type CatalogData = {
  products: CatalogProduct[];
  settings: { shopName: string; whatsappNumber: string };
};

type CatalogFile = { content: string; sha: string };

const CONTENTS_PATH = "data/catalog.json";
const MAX_CATALOG_BYTES = 900_000;

function repositoryConfig() {
  const owner = process.env.GITHUB_OWNER?.trim() || "louissaint007";
  const repo = process.env.GITHUB_REPO?.trim() || "bel-achat";
  const branch = process.env.GITHUB_BRANCH?.trim() || "main";
  const token = process.env.GITHUB_TOKEN?.trim();
  if (!token) throw new Error("Le jeton GitHub de la boutique n’est pas configuré.");
  return { owner, repo, branch, token };
}

function contentsUrl(owner: string, repo: string, branch: string) {
  const encodedPath = CONTENTS_PATH.split("/").map(encodeURIComponent).join("/");
  return `https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}?ref=${encodeURIComponent(branch)}`;
}

function githubHeaders(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2026-03-10",
  };
}

function parseCatalog(value: unknown): CatalogData {
  const root = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const sourceSettings = root.settings && typeof root.settings === "object" ? root.settings as Record<string, unknown> : {};
  const rawProducts = Array.isArray(root.products) ? root.products : [];
  const products: CatalogProduct[] = [];
  for (const value of rawProducts) {
    if (!value || typeof value !== "object") continue;
    const row = value as Record<string, unknown>;
    const parsed = parseProductInput(row);
    if (!parsed || typeof row.id !== "string" || !row.id) continue;
    const createdAt = typeof row.createdAt === "string" ? row.createdAt : new Date(0).toISOString();
    const updatedAt = typeof row.updatedAt === "string" ? row.updatedAt : createdAt;
    products.push({ id: row.id, ...parsed, createdAt, updatedAt });
  }
  const shopName = typeof sourceSettings.shopName === "string" && sourceSettings.shopName.trim()
    ? sourceSettings.shopName.trim().slice(0, 80)
    : "Bel Achat";
  const rawNumber = typeof sourceSettings.whatsappNumber === "string" ? sourceSettings.whatsappNumber : "";
  const whatsappNumber = /^\d{8,15}$/.test(rawNumber) ? rawNumber : "";
  return { products, settings: { shopName, whatsappNumber } };
}

function decodeFile(file: CatalogFile): CatalogData {
  const json = Buffer.from(file.content.replace(/\s/g, ""), "base64").toString("utf8");
  return parseCatalog(JSON.parse(json));
}

async function fetchFile(fresh: boolean): Promise<{ catalog: CatalogData; sha: string }> {
  const { owner, repo, branch, token } = repositoryConfig();
  const response = await fetch(contentsUrl(owner, repo, branch), {
    headers: githubHeaders(token),
    ...(fresh ? { cache: "no-store" as const } : { next: { revalidate: 30 } }),
  });
  if (!response.ok) {
    throw new Error(response.status === 404
      ? "Le fichier data/catalog.json manque dans la branche GitHub configurée."
      : `GitHub ne peut pas lire le catalogue (HTTP ${response.status}).`);
  }
  const file = await response.json() as Partial<CatalogFile>;
  if (typeof file.content !== "string" || typeof file.sha !== "string") {
    throw new Error("Le catalogue GitHub est illisible ou dépasse la limite de lecture.");
  }
  return { catalog: decodeFile(file as CatalogFile), sha: file.sha };
}

export async function readCatalog(options: { fresh?: boolean } = {}) {
  return fetchFile(Boolean(options.fresh));
}

export async function writeCatalog(catalog: CatalogData, message: string, expectedSha: string) {
  const { owner, repo, branch, token } = repositoryConfig();
  const content = `${JSON.stringify(parseCatalog(catalog), null, 2)}\n`;
  if (Buffer.byteLength(content, "utf8") > MAX_CATALOG_BYTES) {
    throw new Error("Le catalogue a dépassé sa taille autorisée. Réduis la description ou le nombre d’articles.");
  }
  const encodedPath = CONTENTS_PATH.split("/").map(encodeURIComponent).join("/");
  const response = await fetch(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/contents/${encodedPath}`, {
    method: "PUT",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({
      message,
      content: Buffer.from(content, "utf8").toString("base64"),
      sha: expectedSha,
      branch,
    }),
    cache: "no-store",
  });
  if (response.status === 409 || response.status === 422) {
    throw new Error("Le catalogue vient d’être modifié ailleurs. Recharge la page et réessaie.");
  }
  if (!response.ok) throw new Error(`GitHub n’a pas enregistré le catalogue (HTTP ${response.status}).`);
  return parseCatalog(catalog);
}
