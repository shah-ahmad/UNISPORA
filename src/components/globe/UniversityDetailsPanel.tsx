import { openAdvisor } from "@/components/ai/AdvisorChat";
import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { readTuitionBreakdown, TuitionDetails } from "./TuitionDetails";
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
  const [showTuition, setShowTuition] = useState(false);
  const breakdown = readTuitionBreakdown(university?.tuitionDetails);
  useEffect(() => { setShowTuition(false); }, [university?.id]);
  function backToUniversity() {
    setShowTuition(false);
    requestAnimationFrame(() => panelRef.current?.querySelector<HTMLButtonElement>('.tuition-details-link')?.focus());
  }
  useEffect(() => {
    if (!showTuition) return;
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') { event.preventDefault(); backToUniversity(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [showTuition]);

  useEffect(() => {
    if (!onClose) return;
    const close = onClose;

    function closeOnOutsidePointer(event: PointerEvent) {
      const panel = panelRef.current;
      if (!panel || panel.contains(event.target as Node) || (event.target as Element).closest?.(".advisor-chat")) return;
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
    <GlassCard ref={panelRef} className={`details-panel ${showTuition && breakdown ? 'tuition-expanded' : ''}`}>
      {onClose ? (
        <button className="details-close" type="button" onClick={onClose} aria-label="Close university details">
          <X size={18} />
        </button>
      ) : null}
      <div className="details-scroll" key={showTuition && breakdown ? 'tuition' : 'overview'}>
        {showTuition && breakdown ? <TuitionDetails name={university.name} breakdown={breakdown} onBack={backToUniversity} /> : <>
        <p className="text-sm uppercase tracking-[0.24em] text-[#f6b75c]">Selected university</p>
        <h2 className="university-title-3d mt-3 font-serif text-3xl text-[#fff4df]">{university.name}</h2>
        <p className="mt-2 flex items-center gap-2 text-[#d7ccbb]"><MapPin size={17} /> {university.city}, {university.country}</p>
        <p className="mt-4 text-sm leading-6 text-[#ded2bd]">{university.description}</p>
        <Info icon={<GraduationCap size={18} />} label="Programs" value={university.programs.join(", ")} tone="violet" />
        <TuitionApplicationFeeRows university={university} onOpenTuition={() => setShowTuition(true)} />
        <Info icon={<Languages size={18} />} label="Languages" value={university.languages.join(", ")} tone="teal" />
        <Info icon={<Languages size={18} />} label="Language requirements" value={<LanguageRequirements university={university} />} tone="teal" />
        <Info icon={<Award size={18} />} label="Scholarships" value={<ScholarshipList university={university} />} tone="gold" />
        <div className="details-actions">
          <button type="button" onClick={() => openAdvisor(university)} className="panel-action primary"><MessageSquareText size={17} /> Ask AI</button>
          <Link to="/consultants" className="panel-action"><Users size={17} /> Consultant</Link>
          <a className="panel-action map-action" href={university.locationUrl} target="_blank" rel="noreferrer"><MapPinned size={17} /> View on Map</a>
          <a className="panel-action" href={university.website} target="_blank" rel="noreferrer"><Globe2 size={17} /> Official Website</a>
        </div>
        </>}
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

function TuitionApplicationFeeRows({ university, onOpenTuition }: { university: University; onOpenTuition: () => void }) {
  const breakdown = readTuitionBreakdown(university.tuitionDetails);
  const structuredCosts = parseStructuredCosts(university.tuitionDetails);
  const tuition = structuredCosts?.tuition ?? getFallbackTuitionSection(university);
  const applicationFee = structuredCosts?.applicationFee ?? getFallbackApplicationFeeSection(university);

  return (
    <>
      <Info icon={<CircleDollarSign size={18} />} label="Tuition" value={breakdown ? <><span>{breakdown.year} · {breakdown.unit}</span><button type="button" className="tuition-details-link" onClick={onOpenTuition}>View fees by category →</button></> : <CostColumn section={tuition} />} tone="blue" />
      <Info icon={<CreditCard size={18} />} label="Application fee" value={<CostColumn section={applicationFee} />} tone="gold" />
    </>
  );
}

function CostColumn({
  section,
}: {
  section?: CostSection;
}) {
  return (
    <div className="cost-column">
      <CostProgramGroup title="Medical programs" group={section?.medicalPrograms} />
      <CostProgramGroup title="Non-medical programs" group={section?.nonMedicalPrograms} />
      <CostMeta section={section} />
    </div>
  );
}

function CostMeta({ section }: { section?: CostSection }) {
  if (!section?.source && !section?.lastUpdated) return null;

  return (
    <span className="cost-meta">
      {section.source ? (
        <a className="cost-source-link" href={section.source} target="_blank" rel="noreferrer">
          Official source <Globe2 size={14} />
        </a>
      ) : null}
      {section.lastUpdated ? <span className="cost-updated">Updated {formatFeeDate(section.lastUpdated)}</span> : null}
    </span>
  );
}

function CostProgramGroup({ title, group }: { title: string; group?: CostGroup }) {
  return (
    <div className="cost-program-group">
      <span className="cost-program-title">{title}</span>
      <CostItem degree="Bachelor's" value={group?.bachelors} />
      <CostItem degree="Master's" value={group?.masters} />
    </div>
  );
}

function CostItem({ degree, value }: { degree: string; value?: string }) {
  return (
    <div className="cost-item">
      <span className="cost-degree"><span className="cost-bullet" aria-hidden="true" />{degree}</span>
      <span className="cost-leader" aria-hidden="true" />
      <span className="cost-amount">{value ?? "Not listed"}</span>
    </div>
  );
}

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

function getFallbackTuitionSection(university: University): CostSection {
  const value = university.tuition || "Information not publicly available";
  return {
    nonMedicalPrograms: {
      bachelors: value,
      masters: value,
    },
  };
}

function getFallbackApplicationFeeSection(university: University): CostSection | undefined {
  const nonMedicalFee = university.applicationFeeNonMedical;
  const medicalFee = university.applicationFeeMedical;
  const hasNonMedicalFee = typeof nonMedicalFee === "number";
  const hasMedicalFee = typeof medicalFee === "number";

  if (!hasNonMedicalFee && !hasMedicalFee) {
    return {
      medicalPrograms: {
        bachelors: "Information not publicly available",
        masters: "Information not publicly available",
      },
      nonMedicalPrograms: {
        bachelors: "Information not publicly available",
        masters: "Information not publicly available",
      },
    };
  }

  const nonMedical = hasNonMedicalFee ? formatApplicationFee(nonMedicalFee, university.applicationFeeCurrency) : "Not listed";
  const medical = hasMedicalFee ? formatApplicationFee(medicalFee, university.applicationFeeCurrency) : "Not listed";

  return {
    medicalPrograms: {
      bachelors: medical,
      masters: medical,
    },
    nonMedicalPrograms: {
      bachelors: nonMedical,
      masters: nonMedical,
    },
    source: university.applicationFeeSource,
    lastUpdated: university.applicationFeeLastUpdated,
  };
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

function LanguageRequirements({ university }: { university: University }) {
  const requirements = buildLanguageRequirements(university);

  return (
    <span className="language-requirements">
      {requirements.map((item) => (
        <span key={item.label} className="language-requirement-item">
          <span className="language-requirement-label">{item.label}</span>
          <span>{item.value}</span>
        </span>
      ))}
    </span>
  );
}

function buildLanguageRequirements(university: University) {
  const english = university.englishRequirements || getDefaultEnglishRequirement(university);
  const local = university.localLanguageRequirements || getDefaultLocalLanguageRequirement(university);
  const general = university.languageRequirements;

  return [
    { label: "English", value: english },
    ...(local ? [{ label: getLocalLanguageLabel(university), value: local }] : []),
    ...(general ? [{ label: "Program note", value: general }] : []),
  ];
}

function getDefaultEnglishRequirement(university: University) {
  const country = university.country.toLowerCase();
  const hasEnglish = university.languages.some((language) => language.toLowerCase() === "english");

  if (!hasEnglish) {
    return "Check the selected program page. English-taught programs may ask for IELTS, TOEFL, Cambridge, Duolingo, or an English proficiency / medium of instruction certificate.";
  }

  if (country === "hungary") {
    return "Usually IELTS, TOEFL, Cambridge, Duolingo, or an English proficiency / medium of instruction certificate may work, depending on the program.";
  }

  if (country === "germany" || country === "austria") {
    return "English-taught programs usually ask for IELTS, TOEFL, Cambridge, or equivalent proof. Some programs may also accept an English proficiency / medium of instruction certificate.";
  }

  if (country === "united kingdom" || country === "ireland") {
    return "Usually IELTS, TOEFL, Pearson PTE, Cambridge, or approved equivalent proof. Some programs may accept school English or previous English-medium study.";
  }

  return "Usually IELTS, TOEFL, Cambridge, Duolingo, Pearson PTE, or an English proficiency / medium of instruction certificate may work. Always check the selected program.";
}

function getDefaultLocalLanguageRequirement(university: University) {
  const country = university.country.toLowerCase();
  const languages = university.languages.map((language) => language.toLowerCase());

  if ((country === "germany" || country === "austria") && languages.includes("german")) {
    return "German-taught programs normally require German proof, often TestDaF, DSH, Goethe, telc, or an accepted equivalent.";
  }

  if (country === "france" && languages.includes("french")) {
    return "French-taught programs normally require French proof such as DELF, DALF, TCF, or an accepted equivalent.";
  }

  if (country === "italy" && languages.includes("italian")) {
    return "Italian-taught programs normally require Italian proof, often CILS, CELI, PLIDA, or an accepted equivalent.";
  }

  if (country === "spain" && languages.includes("spanish")) {
    return "Spanish-taught programs normally require Spanish proof such as DELE, SIELE, or an accepted equivalent.";
  }

  if (country === "hungary" && languages.includes("hungarian")) {
    return "Hungarian-taught programs may require Hungarian proficiency. English-taught programs usually do not.";
  }

  return undefined;
}

function getLocalLanguageLabel(university: University) {
  const country = university.country.toLowerCase();
  if (country === "germany" || country === "austria") return "German";
  if (country === "france") return "French";
  if (country === "italy") return "Italian";
  if (country === "spain") return "Spanish";
  if (country === "hungary") return "Hungarian";
  return "Local language";
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
