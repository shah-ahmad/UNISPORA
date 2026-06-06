import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Consultant } from "@/data/consultants";
import { GlassCard } from "@/components/ui/GlassCard";

export function ConsultantCard({ consultant }: { consultant: Consultant }) {
  return (
    <GlassCard className="consultant-card">
      <div className="flex items-start gap-4">
        <div className="avatar">{consultant.avatar}</div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-xl font-semibold text-[#fff4df]">{consultant.name}</h3>
            <span className="badge">{consultant.badge}</span>
          </div>
          <p className="mt-1 flex items-center gap-1 text-sm text-[#ffd493]"><Star size={15} fill="currentColor" /> {consultant.rating} rating</p>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-[#d7ccbb]">{consultant.bio}</p>
      <Meta label="Languages" values={consultant.languages} />
      <Meta label="Specialties" values={consultant.specialties} />
      <Meta label="Country expertise" values={consultant.countryExpertise} />
      <div className="mt-5 flex items-center justify-between gap-3">
        <strong className="text-[#fff4df]">{consultant.price}</strong>
        <Link to="/consultants/$consultantId" params={{ consultantId: consultant.id }} className="panel-action primary w-auto">Book consultation</Link>
      </div>
    </GlassCard>
  );
}

function Meta({ label, values }: { label: string; values: string[] }) {
  return (
    <div className="mt-4">
      <span className="text-xs uppercase tracking-[0.18em] text-[#ae9f89]">{label}</span>
      <div className="mt-2 flex flex-wrap gap-2">
        {values.map((value) => <span key={value} className="mini-pill">{value}</span>)}
      </div>
    </div>
  );
}
