import AdminDashboard from "./admin-dashboard";
import AdminLogin from "./admin-login";
import { hasAdminConfiguration, isAdminSessionValid } from "../../lib/admin-auth";
import styles from "./admin.module.css";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!hasAdminConfiguration()) {
    return <main className={styles.deniedPage}><div className={styles.deniedCard}><span className={styles.mark}>B</span><p className={styles.eyebrow}>BEL ACHAT · ADMINISTRATION</p><h1>Configuration nécessaire</h1><p>Dans Vercel, configure BEL_ACHAT_ADMIN_PASSWORD (20 caractères minimum) et BEL_ACHAT_SESSION_SECRET (32 caractères minimum).</p></div></main>;
  }
  if (!(await isAdminSessionValid())) return <AdminLogin />;
  return <AdminDashboard adminEmail="Administrateur" />;
}
