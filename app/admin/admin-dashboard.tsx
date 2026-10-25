"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import styles from "./admin.module.css";

type Product = {
  id: string;
  name: string;
  category: "electronique" | "beaute";
  type: "telephone" | "parfum" | "soin";
  description: string;
  priceHTG: number;
  image: string;
  available: boolean;
};

type ProductForm = Omit<Product, "id">;
const blankProduct: ProductForm = {
  name: "", category: "electronique", type: "telephone", description: "", priceHTG: 0, image: "", available: true,
};

async function readResponse<T>(response: Response): Promise<T> {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Une erreur est survenue.");
  return data as T;
}

export default function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductForm>(blankProduct);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [shopName, setShopName] = useState("Bel Achat");
  const [whatsappNumber, setWhatsappNumber] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [settingsMessage, setSettingsMessage] = useState("");
  const [settingsError, setSettingsError] = useState("");

  const availableCount = useMemo(() => products.filter((product) => product.available).length, [products]);

  async function signOut() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.assign("/boutique.html");
  }

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch("/api/admin/products", { cache: "no-store" }).then(readResponse<{ products: Product[] }>),
      fetch("/api/admin/settings", { cache: "no-store" }).then(readResponse<{ shopName: string; whatsappNumber: string }>),
    ]).then(([productData, settingsData]) => {
      if (!active) return;
      setProducts(productData.products);
      setShopName(settingsData.shopName || "Bel Achat");
      setWhatsappNumber(settingsData.whatsappNumber || "");
    }).catch((reason: unknown) => {
      if (active) setError(reason instanceof Error ? reason.message : "Impossible de charger l’administration.");
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  function resetForm() {
    setForm(blankProduct);
    setEditingId(null);
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true); setError(""); setMessage("");
    try {
      const response = await fetch(editingId ? `/api/admin/products/${encodeURIComponent(editingId)}` : "/api/admin/products", {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const result = await readResponse<{ product: Product }>(response);
      setProducts((current) => editingId ? current.map((item) => item.id === editingId ? result.product : item) : [result.product, ...current]);
      setMessage(editingId ? "Produit modifié et sauvegardé dans le catalogue." : "Produit ajouté et sauvegardé dans le catalogue.");
      resetForm();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible d’enregistrer le produit.");
    } finally { setSaving(false); }
  }

  function editProduct(product: Product) {
    setEditingId(product.id);
    setForm({ name: product.name, category: product.category, type: product.type, description: product.description, priceHTG: product.priceHTG, image: product.image, available: product.available });
    document.getElementById("product-form")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Supprimer « ${product.name} » de la boutique ?`)) return;
    setError(""); setMessage("");
    try {
      await readResponse(await fetch(`/api/admin/products/${encodeURIComponent(product.id)}`, { method: "DELETE" }));
      setProducts((current) => current.filter((item) => item.id !== product.id));
      setMessage("Produit supprimé.");
      if (editingId === product.id) resetForm();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de supprimer le produit.");
    }
  }

  async function saveSettings(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setError(""); setMessage(""); setSettingsMessage(""); setSettingsError("");
    try {
      const response = await fetch("/api/admin/settings", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, whatsappNumber }),
      });
      const saved = await readResponse<{ shopName: string; whatsappNumber: string }>(response);
      const verification = await readResponse<{ shopName: string; whatsappNumber: string }>(await fetch("/api/admin/settings", { cache: "no-store" }));
      if (verification.shopName !== saved.shopName || verification.whatsappNumber !== saved.whatsappNumber) {
        throw new Error("La sauvegarde n’a pas été confirmée. Vérifie la configuration GitHub puis réessaie.");
      }
      setShopName(verification.shopName);
      setWhatsappNumber(verification.whatsappNumber);
      setSettingsMessage("Paramètres enregistrés et vérifiés.");
    } catch (reason) {
      setSettingsError(reason instanceof Error ? reason.message : "Impossible d’enregistrer les paramètres.");
    } finally { setSaving(false); }
  }

  async function uploadPhoto(file?: File) {
    if (!file) return;
    setUploadingPhoto(true); setError(""); setMessage("");
    try {
      const body = new FormData();
      body.append("file", file);
      const response = await fetch("/api/admin/uploads", { method: "POST", body });
      const saved = await readResponse<{ image: string }>(response);
      setForm((current) => ({ ...current, image: saved.image }));
      setMessage("Photo ajoutée au produit.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible d’envoyer la photo.");
    } finally { setUploadingPhoto(false); }
  }

  return (
    <main className={styles.page}>
      <header className={styles.topbar}>
        <Link className={styles.brand} href="/"><span className={styles.mark}>B</span><span>bel <b>achat</b><small>ADMINISTRATION</small></span></Link>
        <div className={styles.account}><span>{adminEmail}</span><button className={styles.accountButton} type="button" onClick={() => void signOut()}>Se déconnecter</button></div>
      </header>
      <div className={styles.content}>
        <div className={styles.heading}><div><p className={styles.eyebrow}>ESPACE ADMINISTRATEUR</p><h1>Contrôle de la boutique</h1><p>Ajoute les téléphones, parfums et soins de beauté de Bel Achat.</p></div><Link className={styles.viewShop} href="/boutique.html" target="_blank">Voir la boutique ↗</Link></div>
        {error && <div className={styles.alert} role="alert">{error}</div>}
        {message && <div className={styles.notice} role="status">{message}</div>}
        <section className={styles.stats} aria-label="Résumé de la boutique">
          <div><span>Articles au catalogue</span><strong>{loading ? "—" : products.length}</strong></div>
          <div><span>Visibles aux clients</span><strong>{loading ? "—" : availableCount}</strong></div>
          <div><span>Rayons</span><strong>2</strong></div>
        </section>

        <div className={styles.columns}>
          <section className={styles.panel} id="product-form">
            <div className={styles.panelHeading}><div><p className={styles.eyebrow}>{editingId ? "MODIFIER" : "NOUVEL ARTICLE"}</p><h2>{editingId ? "Modifier un produit" : "Ajouter un produit"}</h2></div>{editingId && <button className={styles.textButton} type="button" onClick={resetForm}>Annuler</button>}</div>
            <form className={styles.form} onSubmit={saveProduct}>
              <label>Nom de l’article<input required maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Ex. Smartphone, parfum…" /></label>
              <div className={styles.formRow}>
                <label>Rayon<select value={form.category} onChange={(e) => { const category = e.target.value as ProductForm["category"]; setForm({ ...form, category, type: category === "electronique" ? "telephone" : "parfum" }); }}><option value="electronique">Électronique · téléphones</option><option value="beaute">Beauté · parfums et soins</option></select></label>
                <label>Type<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as ProductForm["type"] })}>{form.category === "electronique" ? <option value="telephone">Téléphone portable</option> : <><option value="parfum">Parfum</option><option value="soin">Soin de beauté</option></>}</select></label>
              </div>
              <label>Description<textarea rows={3} maxLength={1200} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Modèle, format, caractéristiques ou détails utiles" /></label>
              <label>Prix de vente (HTG)<input required type="number" min="1" step="1" value={form.priceHTG} onChange={(e) => setForm({ ...form, priceHTG: Number(e.target.value) })} /><small>Indique un prix supérieur à 0 pour mettre l’article en vente.</small></label>
              <label>Photo du produit<input type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => void uploadPhoto(e.target.files?.[0])} /><small>{uploadingPhoto ? "Envoi de la photo…" : "JPG, PNG ou WebP · 4 Mo maximum"}</small></label>
              {form.image && <div style={{ display: "flex", alignItems: "center", gap: 12 }}><img src={form.image} alt="Aperçu du produit" style={{ width: 68, height: 68, objectFit: "cover", background: "#e9ece2", border: "1px solid #deded3" }} /><button type="button" className={styles.textButton} onClick={() => setForm({ ...form, image: "" })}>Retirer la photo</button></div>}
              <label>Ou adresse de photo existante<input type="url" value={form.image.startsWith("http") ? form.image : ""} onChange={(e) => setForm({ ...form, image: e.target.value })} placeholder="https://…" /><small>Tu peux aussi coller une adresse HTTPS.</small></label>
              <label className={styles.checkbox}><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /><span>Afficher cet article dans la boutique</span></label>
              <button className={styles.primary} type="submit" disabled={saving}>{saving ? "Enregistrement…" : editingId ? "Enregistrer les changements" : "Ajouter à la boutique"}</button>
            </form>
          </section>

          <section className={styles.panel}>
            <div className={styles.panelHeading}><div><p className={styles.eyebrow}>CONTACT CLIENT</p><h2>Paramètres de la boutique</h2></div></div>
            <form className={styles.form} onSubmit={saveSettings}>
              <p className={styles.tip}>Ces paramètres servent au nom de la boutique et au contact WhatsApp. Pour publier un article, utilise le formulaire « Ajouter un produit ».</p>
              <label>Nom de la boutique<input required maxLength={80} value={shopName} onChange={(e) => setShopName(e.target.value)} /></label>
              <label>Numéro WhatsApp<input inputMode="numeric" value={whatsappNumber} onChange={(e) => setWhatsappNumber(e.target.value)} placeholder="509XXXXXXXX" /><small>Indicatif du pays inclus, sans signe + ni espaces.</small></label>
              <button className={styles.secondary} type="submit" disabled={saving}>{saving ? "Enregistrement…" : "Enregistrer les paramètres"}</button>
              {settingsMessage && <div className={styles.notice} role="status">{settingsMessage}</div>}
              {settingsError && <div className={styles.alert} role="alert">{settingsError}</div>}
            </form>
            <div className={styles.tip}><strong>À savoir</strong><p>Un produit masqué reste dans ton espace admin et peut être remis en vente à tout moment.</p></div>
          </section>
        </div>

        <section className={styles.panel + " " + styles.inventory}>
          <div className={styles.panelHeading}><div><p className={styles.eyebrow}>INVENTAIRE</p><h2>Produits de la boutique</h2></div><span className={styles.count}>{products.length} article{products.length === 1 ? "" : "s"}</span></div>
          {loading ? <p className={styles.empty}>Chargement du catalogue…</p> : products.length === 0 ? <div className={styles.empty}><strong>Aucun article pour l’instant</strong><span>Ajoute ton premier téléphone, parfum ou soin avec le formulaire.</span></div> : <div className={styles.productList}>{products.map((product) => <article className={styles.productRow} key={product.id}>
            <div className={styles.thumb}>{product.image ? <img src={product.image} alt="" /> : <span>{product.category === "beaute" ? "✳" : "▣"}</span>}</div>
            <div className={styles.productDetails}><strong>{product.name}</strong><span>{product.category === "beaute" ? product.type === "parfum" ? "Beauté · parfum" : "Beauté · soin" : "Électronique · téléphone"}</span></div>
            <strong className={styles.price}>{product.priceHTG > 0 ? `${new Intl.NumberFormat("fr-FR").format(product.priceHTG)} HTG` : "Prix à ajouter"}</strong>
            <span className={product.available ? styles.statusOn : styles.statusOff}>{product.available ? "En vente" : "Masqué"}</span>
            <div className={styles.rowActions}><button type="button" onClick={() => editProduct(product)}>Modifier</button><button type="button" onClick={() => void deleteProduct(product)}>Supprimer</button></div>
          </article>)}</div>}
        </section>
        <footer className={styles.footer}>Les changements du catalogue sont enregistrés pour tous les visiteurs de Bel Achat.</footer>
      </div>
    </main>
  );
}

