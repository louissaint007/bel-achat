"use client";

import { useEffect, useState } from "react";
import styles from "./analytics-panel.module.css";

type Row = Record<string, string | number | undefined>;
type Report = { range: number; pageviews: number; visitors: number; daily: Row[]; pages: Row[]; referrers: Row[]; countries: Row[]; devices: Row[] };

export default function AnalyticsPanel() {
  const [range, setRange] = useState(7);
  const [report, setReport] = useState<Report | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    setLoading(true); setError("");
    fetch(`/api/admin/analytics?range=${range}d`, { cache: "no-store" }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Impossible de lire les statistiques.");
      return data as Report;
    }).then((data) => { if (active) setReport(data); }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Impossible de lire les statistiques.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [range]);

  const list = (title: string, rows: Row[], key: string) => <div className={styles.list}><h3>{title}</h3>{rows.length ? rows.slice(0, 6).map((row, i) => <div className={styles.item} key={`${String(row[key] || "inconnu")}-${i}`}><span>{String(row[key] || "Direct / inconnu")}</span><b>{Number(row.pageviews || row.visitors || 0).toLocaleString("fr-FR")}</b></div>) : <p className={styles.muted}>Pas encore de données</p>}</div>;

  return <section className={styles.panel} aria-label="Statistiques du site">
    <div className={styles.head}><div><p className={styles.eyebrow}>FRÉQUENTATION</p><h2>Statistiques de la boutique</h2><p>Pages consultées, provenances et appareils sur le site.</p></div><select aria-label="Période des statistiques" value={range} onChange={(event) => setRange(Number(event.target.value))}><option value={7}>7 derniers jours</option><option value={30}>30 derniers jours</option></select></div>
    {loading ? <p className={styles.state}>Chargement des statistiques…</p> : error ? <div className={styles.state} role="status">{error}</div> : report ? <>
      <div className={styles.kpis}><div><span>Pages vues</span><b>{report.pageviews.toLocaleString("fr-FR")}</b></div><div><span>Visites de visiteurs par jour*</span><b>{report.visitors.toLocaleString("fr-FR")}</b></div></div>
      <div className={styles.trend}><h3>Pages vues par jour</h3><div className={styles.bars}>{report.daily.map((row, i) => { const max = Math.max(1, ...report.daily.map((item) => Number(item.pageviews) || 0)); const value = Number(row.pageviews) || 0; return <div className={styles.barCell} key={String(row.timestamp || i)} title={`${String(row.timestamp || "").slice(0, 10)} : ${value} pages vues`}><div className={styles.bar} style={{ height: `${Math.max(3, value / max * 100)}%` }} /><small>{String(row.timestamp || "").slice(8, 10)}</small></div>; })}</div></div>
      <div className={styles.columns}>{list("Pages les plus vues", report.pages, "requestPath")}{list("Sites référents", report.referrers, "referrerHostname")}{list("Pays", report.countries, "country")}{list("Appareils", report.devices, "deviceType")}</div>
      <p className={styles.note}>* Total des visiteurs uniques estimés par jour : une même personne peut compter plusieurs jours. Les statistiques sont agrégées; elles ne donnent pas l’identité des visiteurs. Les clics précis (panier, WhatsApp) ne sont pas comptés avec l’offre actuelle.</p>
    </> : <p className={styles.state}>Aucune statistique disponible pour le moment.</p>}
  </section>;
}
