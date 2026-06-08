import { createFileRoute, Link } from "@tanstack/react-router";
import { Bookmark, LockKeyhole } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/bookmarks")({
  component: Bookmarks,
});

function Bookmarks() {
  const { user, loading } = useAuth();

  return (
    <AppShell>
      <section className="bookmarks-page">
        <div className="glass-card bookmarks-panel">
          {loading ? (
            <>
              <Bookmark size={24} />
              <h1>Bookmarks</h1>
              <p>Loading your account...</p>
            </>
          ) : user ? (
            <>
              <Bookmark size={24} />
              <h1>Bookmarks</h1>
              <p>Saved universities will appear here.</p>
            </>
          ) : (
            <>
              <LockKeyhole size={26} />
              <h1>Login required.</h1>
              <p>Sign in to view and manage your bookmarked universities.</p>
              <div className="bookmarks-actions">
                <Link className="panel-action primary justify-center" to="/login">
                  Login
                </Link>
                <Link className="panel-action justify-center" to="/signup">
                  Create account
                </Link>
              </div>
            </>
          )}
        </div>
      </section>
    </AppShell>
  );
}
