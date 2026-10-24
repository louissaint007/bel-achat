import AdminDashboard from "./admin-dashboard";
import AdminLogin from "./admin-login";
import { hasAdminConfiguration, isAdminSessionValid } from "../../lib/admin-auth";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasAdminConfiguration()) {
    return <main className={styles.deniedPage}><div className={styles.deniedCard}><span className={styles.mark}>B</span><p className={styles.eyebrow}>BEL ACHAT · ADMINISTRATION</p><h1>Configuration nécessaire</h1><p>Ajoute BEL_ACHAT_ADMIN_PASSWORD et BEL_ACHAT_SESSION_SECRET dans les variables d’environnement du projet Vercel.</p></div></main>;
  }
  if (!(await isAdminSessionValid())) return <AdminLogin />;
  return <AdminDashboard adminEmail="Administrateur" />;
}
