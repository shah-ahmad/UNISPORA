import { createFileRoute, notFound } from "@tanstack/react-router";
import { Calendar, CheckCircle2 } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { GlassCard } from "@/components/ui/GlassCard";
import { consultants } from "@/data/consultants";

export const Route = createFileRoute("/consultants/$consultantId")({
  component: ConsultantProfile,
});

function ConsultantProfile() {
  const { consultantId } = Route.useParams();
  const consultant = consultants.find((item) => item.id === consultantId);
  if (!consultant) throw notFound();
  return (
    <AppShell>
      <div className="page-container">
        <GlassCard className="grid gap-8 p-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div>
            <div className="avatar large">{consultant.avatar}</div>
            <h1 className="mt-5 font-serif text-5xl text-[#fff4df]">{consultant.name}</h1>
            <p className="mt-2 text-[#ffd493]">{consultant.badge} · {consultant.rating} rating</p>
            <button className="panel-action primary mt-6 w-full"><Calendar size={18} /> Book consultation</button>
          </div>
          <div className="space-y-6">
            <p className="text-lg leading-8 text-[#d7ccbb]">{consultant.bio}</p>
            {[["Languages", consultant.languages], ["Specialties", consultant.specialties], ["Country expertise", consultant.countryExpertise]].map(([label, values]) => (
              <section key={label as string}>
                <h2 className="text-sm uppercase tracking-[0.2em] text-[#ae9f89]">{label as string}</h2>
                <div className="mt-3 flex flex-wrap gap-2">{(values as string[]).map((value) => <span className="mini-pill" key={value}><CheckCircle2 size={14} /> {value}</span>)}</div>
              </section>
            ))}
            <p className="text-2xl font-semibold text-[#fff4df]">{consultant.price}</p>
          </div>
        </GlassCard>
      </div>
    </AppShell>
  );
}
