import { createFileRoute } from "@tanstack/react-router";
import { Bookmark } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/bookmarks")({
  component: Bookmarks,
});

function Bookmarks() {
  return (
    <AppShell>
      <section className="bookmarks-page">
        <div className="glass-card bookmarks-panel">
          <Bookmark size={24} />
          <h1>Bookmarks</h1>
          <p>Saved universities will appear here.</p>
        </div>
      </section>
    </AppShell>
  );
}
