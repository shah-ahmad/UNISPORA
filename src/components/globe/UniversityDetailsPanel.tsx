import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Award,
  CircleDollarSign,
  Globe2,
  GraduationCap,
  Languages,
  MapPinned,
  MapPin,
  MessageSquareText,
  Users,
  X,
} from "lucide-react";
import type { University } from "@/types/university";
import { GlassCard } from "@/components/ui/GlassCard";

export function UniversityDetailsPanel({
  university,
  onClose,
}: {
  university?: University;
  onClose?: () => void;
}) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!onClose) return;
    const close = onClose;

    function closeOnOutsidePointer(event: PointerEvent) {
      const panel = panelRef.current;
      if (!panel || panel.contains(event.target as Node)) return;
      close();
    }

    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, [onClose]);

  if (!university) {
    return (
      <GlassCard ref={panelRef} className="details-panel">
        {onClose ? (
          <button className="details-close" type="button" onClick={onClose} aria-label="Close university details">
            <X size={18} />
          </button>
        ) : null}
        <div className="details-scroll">
          <p className="text-sm uppercase tracking-[0.24em] text-[#f6b75c]">University details</p>
          <h2 className="mt-3 font-serif text-3xl text-[#fff4df]">Select a globe pin.</h2>
          <p className="mt-3 text-sm leading-6 text-[#d7ccbb]">Choose a university from the globe or sidebar to compare programs, tuition, languages, scholarships, and next steps.</p>
        </div>
      </GlassCard>
    );
  }

  return (
    <GlassCard ref={panelRef} className="details-panel">
      {onClose ? (
        <button className="details-close" type="button" onClick={onClose} aria-label="Close university details">
          <X size={18} />
        </button>
      ) : null}
      <div className="details-scroll">
        <p className="text-sm uppercase tracking-[0.24em] text-[#f6b75c]">Selected university</p>
        <h2 className="university-title-3d mt-3 font-serif text-3xl text-[#fff4df]">{university.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-[#d7ccbb]"><MapPin size={17} /> {university.city}, {university.country}</p>
        <p className="mt-4 text-sm leading-6 text-[#ded2bd]">{university.description}</p>
        <Info icon={<GraduationCap size={18} />} label="Programs" value={university.programs.join(", ")} tone="violet" />
        <Info icon={<CircleDollarSign size={18} />} label="Tuition" value={university.tuition} tone="blue" />
        <Info icon={<Languages size={18} />} label="Languages" value={university.languages.join(", ")} tone="teal" />
        <Info icon={<Award size={18} />} label="Scholarships" value={university.scholarships.join(", ")} tone="gold" />
        <div className="details-actions">
          <Link to="/ai-advisor" search={{ university: university.id }} className="panel-action primary"><MessageSquareText size={17} /> Ask AI</Link>
          <Link to="/consultants" className="panel-action"><Users size={17} /> Consultant</Link>
          <a className="panel-action map-action" href={university.locationUrl} target="_blank" rel="noreferrer"><MapPinned size={17} /> View on Map</a>
          <a className="panel-action" href={university.website} target="_blank" rel="noreferrer"><Globe2 size={17} /> Official Website</a>
        </div>
      </div>
    </GlassCard>
  );
}

function Info({
  icon,
  label,
  value,
  tone,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone: "violet" | "blue" | "teal" | "gold";
}) {
  return (
    <div className="details-info-row">
      <span className={`details-info-icon ${tone}`}>{icon}</span>
      <span>
        <span className="details-info-label">{label}</span>
        <strong className="details-info-value">{value}</strong>
      </span>
    </div>
  );
}
