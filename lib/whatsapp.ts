const whatsappHosts = new Set([
  "wa.me",
  "chat.whatsapp.com",
  "whatsapp.com",
  "www.whatsapp.com",
  "api.whatsapp.com",
]);

export function normalizeWhatsAppLink(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const input = value.trim();
  if (!input) return "";
  if (input.length > 500) return null;

  try {
    const url = new URL(input);
    if (url.protocol !== "https:" || !whatsappHosts.has(url.hostname.toLowerCase()) || url.username || url.password || url.port) {
      return null;
    }
    return url.href;
  } catch {
    return null;
  }
}
