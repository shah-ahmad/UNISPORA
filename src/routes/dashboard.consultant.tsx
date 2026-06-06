import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";

export const Route = createFileRoute("/dashboard/consultant")({
  component: ConsultantDashboard,
});

function ConsultantDashboard() {
  return (
    <AppShell>
      <div className="page-container">
        <header className="page-header"><p>Consultant dashboard</p><h1>Manage profile, bookings, inquiries, ratings, and earnings.</h1></header>
        <div className="dashboard-grid">
          {[
            ["Profile completion", "82% complete · add two country case studies"],
            ["Upcoming bookings", "3 sessions this week"],
            ["Student inquiries", "7 unanswered messages"],
            ["Ratings", "4.9 average from 42 students"],
            ["Earnings placeholder", "EUR 1,240 projected this month"],
            ["Badge status", "Verified Expert · Gold Mentor review pending"],
          ].map(([title, body]) => <GlassCard key={title} className="p-5"><h2>{title}</h2><p>{body}</p></GlassCard>)}
        </div>
      </div>
    </AppShell>
  );
}
