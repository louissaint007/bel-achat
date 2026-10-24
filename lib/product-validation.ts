export type ProductInput = {
  name: string;
  category: "electronique" | "beaute";
  type: "telephone" | "parfum" | "soin";
  description: string;
  priceHTG: number;
  image: string;
  available: boolean;
};

const validTypes: Record<ProductInput["category"], ProductInput["type"][]> = {
  electronique: ["telephone"],
  beaute: ["parfum", "soin"],
};

export function parseProductInput(value: unknown): ProductInput | null {
  if (!value || typeof value !== "object") return null;
  const input = value as Record<string, unknown>;
  const name = typeof input.name === "string" ? input.name.trim() : "";
  const category = input.category;
  const type = input.type;
  const description = typeof input.description === "string" ? input.description.trim() : "";
  const priceHTG = Number(input.priceHTG);
  const image = typeof input.image === "string" ? input.image.trim() : "";
  const available = input.available !== false;

  if (!name || name.length > 120 || description.length > 1200) return null;
  if (category !== "electronique" && category !== "beaute") return null;
  if (type !== "telephone" && type !== "parfum" && type !== "soin") return null;
  if (!validTypes[category].includes(type)) return null;
  if (!Number.isSafeInteger(priceHTG) || priceHTG < 0 || priceHTG > 100_000_000) return null;
  if (available && priceHTG < 1) return null;
  if (image.length > 1000) return null;
  if (image && !(image.startsWith("/") && !image.startsWith("//")) && !isHttpsUrl(image)) return null;

  return { name, category, type, description, priceHTG, image, available };
}

function isHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}
