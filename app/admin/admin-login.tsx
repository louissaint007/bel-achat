"use client";

import { useState, type FormEvent } from "react";
import styles from "./admin.module.css";

export default function AdminLogin() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }) });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || "Connexion impossible.");
      window.location.reload();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Connexion impossible.");
      setBusy(false);
    }
  }

  return <main className={styles.deniedPage}><form className={styles.loginCard} onSubmit={submit}><span className={styles.mark}>B</span><p className={styles.eyebrow}>BEL ACHAT · ADMINISTRATION</p><h1>Connexion à la boutique</h1><p>Entre le mot de passe administrateur pour gérer les produits et les paramètres.</p>{error && <div className={styles.alert} role="alert">{error}</div>}<label>Mot de passe<input autoComplete="current-password" type="password" required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className={styles.primary} type="submit" disabled={busy}>{busy ? "Connexion…" : "Accéder à l’administration"}</button><a href="/boutique.html">Retour à la boutique</a></form></main>;
}
