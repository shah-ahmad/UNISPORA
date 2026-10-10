import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminWorkspace } from "@/components/admin/AdminWorkspace";
import { useAuth } from "@/hooks/useAuth";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/admin")({ component: Admin });

function Admin() {
  const { user, loading } = useAuth();
  return <AppShell><div className="page-container admin-page">
    {loading ? <p>Checking access…</p> : !user ? <><h1>Admin sign in</h1><p>Log in with your administrator account to manage UniSpora.</p><Link to="/login" className="panel-action primary">Go to sign in</Link></> : !user.emailVerification || !user.labels.includes("admin") ? <><h1>Admin access required</h1><p>This account does not have permission to manage UniSpora.</p></> : <AdminWorkspace />}
  </div></AppShell>;
}
