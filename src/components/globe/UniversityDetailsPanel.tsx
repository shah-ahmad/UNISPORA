import { Link } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import {
  Award,
  CircleDollarSign,
  CreditCard,
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
        <Info icon={<CircleDollarSign size={18} />} label="Tuition" value={<CostBreakdown university={university} kind="tuition" />} tone="blue" />
        <Info icon={<CreditCard size={18} />} label="Application fee" value={<CostBreakdown university={university} kind="applicationFee" />} tone="gold" />
        <Info icon={<Languages size={18} />} label="Languages" value={university.languages.join(", ")} tone="teal" />
        <Info icon={<Award size={18} />} label="Scholarships" value={<ScholarshipList university={university} />} tone="gold" />
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
  value: ReactNode;
  tone: "violet" | "blue" | "teal" | "gold";
}) {
  return (
    <div className="details-info-row">
      <span className={`details-info-icon ${tone}`}>{icon}</span>
      <span>
        <span className="details-info-label">{label}</span>
        <span className="details-info-value">{value}</span>
      </span>
    </div>
  );
}

type CostGroup = {
  bachelors?: string;
  masters?: string;
};

type CostSection = {
  currency?: string;
  medicalPrograms?: CostGroup;
  nonMedicalPrograms?: CostGroup;
  source?: string;
  lastUpdated?: string;
};

type StructuredCosts = {
  tuition?: CostSection;
  applicationFee?: CostSection;
};

function CostBreakdown({ university, kind }: { university: University; kind: "tuition" | "applicationFee" }) {
  const structuredCosts = parseStructuredCosts(university.tuitionDetails);
  const section = structuredCosts?.[kind];

  if (section) {
    return <StructuredCostSection section={section} />;
  }

  if (kind === "tuition") {
    return <span>{university.tuition || "Information not publicly available"}</span>;
  }

  const nonMedicalFee = university.applicationFeeNonMedical;
  const medicalFee = university.applicationFeeMedical;
  const hasNonMedicalFee = typeof nonMedicalFee === "number";
  const hasMedicalFee = typeof medicalFee === "number";

  if (!hasNonMedicalFee && !hasMedicalFee) {
    return <span>Information not publicly available</span>;
  }

  return (
    <span className="cost-breakdown">
      {hasNonMedicalFee ? (
        <span>
          <span className="cost-level">Bachelor's</span>
          {formatApplicationFee(nonMedicalFee, university.applicationFeeCurrency)}
        </span>
      ) : null}
      {hasMedicalFee ? (
        <span>
          <span className="cost-level">Medicine / Dentistry / Health</span>
          {formatApplicationFee(medicalFee, university.applicationFeeCurrency)}
        </span>
      ) : null}
      {university.applicationFeeSource ? (
        <a className="cost-source-link" href={university.applicationFeeSource} target="_blank" rel="noreferrer">
          Official source
        </a>
      ) : null}
      {university.applicationFeeLastUpdated ? (
        <span className="cost-updated">Updated {formatFeeDate(university.applicationFeeLastUpdated)}</span>
      ) : null}
    </span>
  );
}

function StructuredCostSection({ section }: { section: CostSection }) {
  return (
    <span className="cost-breakdown">
      <span className="cost-group">
        <span className="cost-group-title">Medical programs</span>
        <span>
          <span className="cost-level">Bachelor's</span>
          {section.medicalPrograms?.bachelors ?? "Not offered / not listed"}
        </span>
        <span>
          <span className="cost-level">Master's</span>
          {section.medicalPrograms?.masters ?? "Not offered / not listed"}
        </span>
      </span>
      <span className="cost-group">
        <span className="cost-group-title">Non-medical programs</span>
        <span>
          <span className="cost-level">Bachelor's</span>
          {section.nonMedicalPrograms?.bachelors ?? "Not listed"}
        </span>
        <span>
          <span className="cost-level">Master's</span>
          {section.nonMedicalPrograms?.masters ?? "Not listed"}
        </span>
      </span>
      {section.source ? (
        <a className="cost-source-link" href={section.source} target="_blank" rel="noreferrer">
          Official source
        </a>
      ) : null}
      {section.lastUpdated ? <span className="cost-updated">Updated {formatFeeDate(section.lastUpdated)}</span> : null}
    </span>
  );
}

function parseStructuredCosts(value?: string): StructuredCosts | undefined {
  if (!value) return undefined;
  try {
    return JSON.parse(value) as StructuredCosts;
  } catch {
    return undefined;
  }
}

function formatApplicationFee(amount: number, currency?: string) {
  if (amount === 0) return "No application fee";
  return `${amount.toLocaleString()}${currency ? ` ${currency}` : ""}`;
}

function formatFeeDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function ScholarshipList({ university }: { university: University }) {
  const isHungarianUniversity = university.country.toLowerCase() === "hungary";
  const scholarshipRoutes: Record<string, "/scholarships/stipendium-hungaricum" | "/scholarships/hungarian-diaspora-scholarship"> = {
    "stipendium hungaricum scholarship": "/scholarships/stipendium-hungaricum",
    "hungarian diaspora scholarship": "/scholarships/hungarian-diaspora-scholarship",
  };

  return (
    <span className="scholarship-list">
      {university.scholarships.map((scholarship, index) => {
        const route = scholarshipRoutes[scholarship.toLowerCase()];
        const isClickable = isHungarianUniversity && route;

        if (!isClickable) return <span key={`${scholarship}-${index}`}>{scholarship}</span>;

        return (
          <span key={`${scholarship}-${index}`}>
            <Link className="scholarship-link" to={route}>
              {scholarship}
            </Link>
          </span>
        );
      })}
    </span>
  );
}
