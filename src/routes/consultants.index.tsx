import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { ConsultantCard } from "@/components/consultants/ConsultantCard";
import { consultants } from "@/data/consultants";

export const Route = createFileRoute("/consultants/")({
  component: Consultants,
});

function Consultants() {
  return (
    <AppShell>
      <div className="page-container">
        <header className="page-header">
          <p>Consultant marketplace</p>
          <h1>Meet verified mentors for every application step.</h1>
        </header>
        <div className="grid gap-5 lg:grid-cols-3">
          {consultants.map((consultant) => <ConsultantCard key={consultant.id} consultant={consultant} />)}
        </div>
      </div>
    </AppShell>
  );
}
