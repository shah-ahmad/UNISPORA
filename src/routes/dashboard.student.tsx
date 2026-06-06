import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { useUniversities } from "@/hooks/useUniversities";

export const Route = createFileRoute("/dashboard/student")({
  component: StudentDashboard,
});

function StudentDashboard() {
  const { universities } = useUniversities();

  return (
    <AppShell>
      <Dashboard title="Student dashboard" subtitle="Your saved universities, AI chats, bookings, and application progress.">
        <GlassCard className="p-5"><h2>Saved universities</h2>{universities.slice(0, 3).map((u) => <p key={u.id}>{u.name}</p>)}</GlassCard>
        <GlassCard className="p-5"><h2>Recent AI chats</h2><p>Scholarship fit for TUM</p><p>English-taught programs in Singapore</p></GlassCard>
        <GlassCard className="p-5"><h2>Consultant bookings</h2><p>Maya Kovacs · SOP review · Friday</p></GlassCard>
        <GlassCard className="p-5"><h2>Application checklist</h2><p>Passport, transcript, SOP, recommendation letters, fee proof</p></GlassCard>
        <GlassCard className="p-5 lg:col-span-2"><h2>Recommended universities</h2><p>{universities.slice(3, 7).map((u) => u.name).join(" · ")}</p></GlassCard>
      </Dashboard>
    </AppShell>
  );
}

function Dashboard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return <div className="page-container"><header className="page-header"><p>{title}</p><h1>{subtitle}</h1></header><div className="dashboard-grid">{children}</div></div>;
}
