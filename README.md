# Bel Achat

Boutique en français pour vendre des téléphones portables, des parfums et des soins de beauté. Le dépôt est configuré pour être importé comme application Next.js sur Vercel.

## Mise en ligne sur Vercel

1. Ouvre Vercel, choisis **Add New → Project**, puis importe `louissaint007/bel-achat` depuis GitHub.
2. Garde le framework **Next.js** et les réglages de construction proposés.
3. Depuis l’onglet **Storage** de ce projet Vercel, crée un stockage **Blob** en accès public. Vercel ajoute `BLOB_READ_WRITE_TOKEN` au projet.
4. Ajoute une base PostgreSQL depuis une intégration Vercel Marketplace (par exemple Neon), puis copie son URL de connexion dans la variable `DATABASE_URL`.
5. Dans la base, exécute le contenu de [`db/schema.sql`](db/schema.sql).
6. Dans **Settings → Environment Variables**, ajoute :

   - `BEL_ACHAT_ADMIN_PASSWORD` : un mot de passe long et unique réservé à l’administration;
   - `BEL_ACHAT_SESSION_SECRET` : une chaîne aléatoire d’au moins 32 caractères;
   - `DATABASE_URL` et `BLOB_READ_WRITE_TOKEN` si l’intégration ne les a pas déjà ajoutées.

7. Redéploie le projet. La boutique sera accessible à la racine et la gestion à `/admin`.

Ne mets jamais ces secrets dans GitHub. Le fichier `.env.example` ne contient que les noms des variables.

## Gestion de la boutique

Dans `/admin`, connecte-toi avec `BEL_ACHAT_ADMIN_PASSWORD`. Tu peux ajouter, modifier, masquer ou supprimer un téléphone, un parfum ou un soin de beauté; ajouter sa photo (JPG, PNG ou WebP, 4 Mo maximum); modifier les prix en HTG; et régler le nom et le WhatsApp de la boutique. Les photos vont dans Vercel Blob et le catalogue reste dans PostgreSQL.

Les commandes sont préparées dans WhatsApp. Aucun paiement par carte n’est configuré.

## Développement local

Copie `.env.example` vers `.env.local`, renseigne les variables, exécute le SQL de `db/schema.sql` dans ta base, puis lance `npm install` et `npm run dev`.
