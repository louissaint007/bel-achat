import { requireAdminApi } from "../../../../lib/admin-auth";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type Row = Record<string, unknown>;
const projectId = process.env.VERCEL_ANALYTICS_PROJECT?.trim() || "bel-achat";
const teamSlug = process.env.VERCEL_ANALYTICS_TEAM_SLUG?.trim() || "louissaint007s-projects";

async function query(token: string, since: string, until: string, by: string) {
  const url = new URL("https://api.vercel.com/v1/query/web-analytics/visits/aggregate");
  url.searchParams.set("projectId", projectId);
  url.searchParams.set("slug", teamSlug);
  url.searchParams.set("since", since);
  url.searchParams.set("until", until);
  url.searchParams.set("by", by);
  url.searchParams.set("limit", "10");
  const response = await fetch(url, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store", signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`Vercel Analytics (${response.status})`);
  const result = await response.json() as { data?: Row[] };
  return Array.isArray(result.data) ? result.data : [];
}

export async function GET(request: Request) {
  const denied = await requireAdminApi(request);
  if (denied) return denied;
  const token = process.env.VERCEL_ANALYTICS_TOKEN?.trim();
  if (!token) return Response.json({ error: "Ajoute le secret VERCEL_ANALYTICS_TOKEN dans les variables Vercel, puis redéploie le site." }, { status: 503 });
  const range = new URL(request.url).searchParams.get("range") === "30d" ? 30 : 7;
  const end = new Date();
  const start = new Date(end);
  start.setUTCDate(start.getUTCDate() - (range - 1));
  const since = start.toISOString().slice(0, 10);
  const until = end.toISOString().slice(0, 10);
  try {
    const [daily, pages, referrers, countries, devices] = await Promise.all([
      query(token, since, until, "day"), query(token, since, until, "requestPath"),
      query(token, since, until, "referrerHostname"), query(token, since, until, "country"), query(token, since, until, "deviceType"),
    ]);
    const pageviews = daily.reduce((sum, row) => sum + (Number(row.pageviews) || 0), 0);
    const visitors = daily.reduce((sum, row) => sum + (Number(row.visitors) || 0), 0);
    return Response.json({ range, pageviews, visitors, visitorLabel: "visites de visiteurs par jour", daily, pages, referrers, countries, devices }, { headers: { "Cache-Control": "private, max-age=300" } });
  } catch (reason) {
    const message = reason instanceof Error ? reason.message : "Vercel Analytics indisponible.";
    const status = message.includes("401") || message.includes("403") ? 502 : 503;
    return Response.json({ error: status === 502 ? "Le jeton Analytics n’a pas accès aux statistiques du projet Bel Achat." : "Impossible de charger les statistiques pour le moment." }, { status });
  }
}
