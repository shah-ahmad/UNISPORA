import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ConsultantCard } from "@/components/consultants/ConsultantCard";
import { useConsultants } from "@/hooks/useConsultants";

export const Route = createFileRoute("/consultants/")({
  component: Consultants,
});

function Consultants() {
  const { consultants, loading, error } = useConsultants();
  return (
    <AppShell>
      <div className="page-container">
        <header className="page-header">
          <p>Consultant marketplace</p>
          <h1>Meet verified mentors for every application step.</h1>
        </header>
        {loading ? <p role="status">Loading consultants…</p> : error ? <p role="alert">{error}</p> : consultants.length === 0 ? <p>No consultants are listed yet.</p> : null}
        <div className="grid gap-5 lg:grid-cols-3">
          {consultants.map((consultant) => <ConsultantCard key={consultant.id} consultant={consultant} />)}
        </div>
      </div>
    </AppShell>
  );
}
