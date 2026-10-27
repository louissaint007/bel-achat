# Bel Achat

Boutique Next.js pour vendre des téléphones portables, parfums et soins de beauté, avec espace administrateur à `/admin`. Le projet ne dépend ni de Supabase ni d’une base de données : le catalogue est conservé dans `data/catalog.json` sur la branche GitHub configurée.

## Importer dans Vercel

1. Dans Vercel, importe `louissaint007/bel-achat` comme projet Next.js.
2. Crée un jeton GitHub à accès limité au dépôt `louissaint007/bel-achat`, avec uniquement la permission de dépôt **Contents: Read and write**. Le serveur l’utilise pour enregistrer le catalogue et les photos des produits.
3. Dans **Settings → Environment Variables**, ajoute les variables ci-dessous. Mets les mots de passe et jetons en type **Secret**.
4. Redéploie le projet.

| Variable | Valeur |
| --- | --- |
| `BEL_ACHAT_ADMIN_PASSWORD` | Un mot de passe unique d’au moins 20 caractères |
| `BEL_ACHAT_SESSION_SECRET` | Une chaîne aléatoire d’au moins 32 caractères |
| `GITHUB_TOKEN` | Le jeton à accès limité créé à l’étape 3 |
| `GITHUB_OWNER` | `louissaint007` |
| `GITHUB_REPO` | `bel-achat` |
| `GITHUB_BRANCH` | `main` |
| `VERCEL_ANALYTICS_TOKEN` | Jeton Vercel pour lire les statistiques du projet (secret, utilisé uniquement par le serveur) |

Les valeurs `GITHUB_OWNER`, `GITHUB_REPO` et `GITHUB_BRANCH` ont déjà ces valeurs par défaut dans le code. Les autres doivent être ajoutées dans Vercel; aucun secret ne doit être enregistré dans GitHub.

La permission GitHub `Contents: Read and write` porte sur le dépôt entier, même si l’application ne modifie que le catalogue et les photos dans `public/products/`. Garde `GITHUB_TOKEN` comme secret dans Vercel et limite l’accès aux paramètres du projet aux personnes de confiance.

## Administration

Ouvre `https://ton-site.vercel.app/admin`, entre le mot de passe choisi dans Vercel, puis ajoute, modifie, masque ou supprime les articles. Tu peux gérer les téléphones, parfums et soins, leurs prix HTG et photos, ainsi que le nom, le numéro et le lien WhatsApp (compte, groupe ou chaîne). Le numéro et le bouton de lien WhatsApp sont affichés aux visiteurs.

Le panneau « Statistiques de la boutique » présente les pages vues, le trafic quotidien, les pages, sites référents, pays et appareils sur 7 ou 30 jours. Il utilise Vercel Web Analytics; active Web Analytics dans les réglages du projet et ajoute `VERCEL_ANALYTICS_TOKEN` dans les variables d’environnement Vercel, puis redéploie. Le jeton doit rester secret et disposer de l’accès de lecture nécessaire au projet `bel-achat`. Vercel fournit des statistiques agrégées, sans identité individuelle. Les parcours dans les formulaires ou les clics panier/WhatsApp ne sont pas enregistrés comme événements personnalisés avec l’offre actuelle. La boutique étant une page HTML avec des ancres, les sections comme `#catalogue` ne constituent pas des pages distinctes dans les statistiques.

La connexion crée un cookie HttpOnly signé, limité au site et valable 7 jours. Les API vérifient la session côté serveur. Le jeton GitHub reste côté serveur et n’est jamais envoyé au navigateur. Chaque changement au catalogue crée un commit sur la branche configurée; si cette branche est la branche de production Vercel, cela peut aussi lancer un redéploiement.

Pour ralentir les tentatives répétées de mot de passe, ajoute dans **Vercel → Firewall** une règle de limitation de débit sur `/api/admin/login`; la disponibilité et le prix de la limite dépendent du forfait Vercel. [Guide Vercel](https://vercel.com/kb/guide/limit-abuse-with-rate-limiting)

L’adresse `/admin` n’est pas un secret et n’a pas besoin de l’être : la protection vient du mot de passe et de la vérification côté serveur. Utilise un mot de passe unique et long. En cas de tentative d’intrusion, une personne autorisée à entrer pourrait changer les produits ou les coordonnées affichées. Le site ne traite pas de paiement par carte.

Les photos téléversées sont enregistrées dans `public/products/` sur le dépôt GitHub et sont publiques, comme le catalogue du dépôt public. Ne téléverse que des images destinées aux clients. Tu peux également coller l’adresse HTTPS d’une image existante.

## Développement local

Copie `.env.example` vers `.env.local`, complète les secrets, puis lance `npm install` et `npm run dev`. Sans configuration GitHub, le catalogue distant et l’administration affichent une erreur de configuration plutôt que de stocker les changements uniquement dans le navigateur.
