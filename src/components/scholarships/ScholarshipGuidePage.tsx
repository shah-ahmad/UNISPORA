import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowLeft,
  Award,
  BookOpenCheck,
  CalendarDays,
  CheckCircle2,
  ExternalLink,
  FileText,
  GraduationCap,
  Languages,
  Search,
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchAppwriteScholarshipBySlug } from "@/data/appwriteScholarships";
import { getScholarshipBySlug } from "@/data/scholarships";
import type { Scholarship } from "@/data/scholarships";

export function ScholarshipGuidePage({ slug }: { slug: string }) {
  const fallbackScholarship = getScholarshipBySlug(slug);
  const [scholarship, setScholarship] = useState<Scholarship | undefined>(fallbackScholarship);
  const [countrySearch, setCountrySearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    fetchAppwriteScholarshipBySlug(slug)
      .then((appwriteScholarship) => {
        if (isMounted && appwriteScholarship) setScholarship(appwriteScholarship);
      })
      .catch((error) => {
        console.warn("Could not load scholarship from Appwrite.", error);
      });

    return () => {
      isMounted = false;
    };
  }, [slug]);

  if (!scholarship) {
    return (
      <AppShell>
        <section className="scholarship-page">
          <div className="scholarship-hero glass-card">
            <Link className="scholarship-back" to="/">
              <ArrowLeft size={18} /> Back to globe
            </Link>
            <p className="text-sm uppercase tracking-[0.24em] text-[#f6b75c]">Scholarship guide</p>
            <h1>Scholarship not found.</h1>
            <p>This guide is not available yet.</p>
          </div>
        </section>
      </AppShell>
    );
  }

  const heroTitle = getHeroTitle(scholarship);
  const heroBullets = getHeroBullets(scholarship);
  const coverageItems = getCoverageItems(scholarship);
  const searchedCountryName = countrySearch.trim();
  const filteredCountries = scholarship.sendingPartners.filter((country) =>
    country.toLowerCase().includes(searchedCountryName.toLowerCase()),
  );
  const hasCountrySearch = searchedCountryName.length > 0;

  return (
    <AppShell>
      <section className="scholarship-page">
        <div className="scholarship-hero glass-card">
          <Link className="scholarship-back" to="/">
            <ArrowLeft size={18} /> Back to globe
          </Link>
          <p className="text-sm uppercase tracking-[0.24em] text-[#f6b75c]">Scholarship guide</p>
          <h1>{heroTitle}</h1>
          <ul className="scholarship-hero-points">
            {heroBullets.map((point) => (
              <li key={point}>{point}</li>
            ))}
          </ul>

          <div className="scholarship-quick-grid">
            {scholarship.quickFacts.map((fact) => (
              <div key={fact.label} className="scholarship-fact">
                <span>{fact.label}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>
        </div>

        <div className="scholarship-content">
          <article className="glass-card scholarship-article">
            <Section icon={<Award size={20} />} title="Eligible countries">
              <p className="scholarship-short-note">
                Check whether your country is currently listed before choosing programs.
              </p>
              <form
                className="country-search"
                onSubmit={(event) => {
                  event.preventDefault();
                  setCountrySearch(searchedCountryName);
                }}
              >
                <button type="submit" aria-label="Search eligible countries">
                  <Search size={17} />
                </button>
                <input
                  value={countrySearch}
                  onChange={(event) => setCountrySearch(event.target.value)}
                  placeholder="Search eligible country"
                  type="search"
                  autoComplete="off"
                />
              </form>
              {filteredCountries.length > 0 ? (
                <>
                  <div className="country-count">
                    {hasCountrySearch
                      ? `${filteredCountries.length} matching ${filteredCountries.length === 1 ? "country" : "countries"}`
                      : `${filteredCountries.length} of ${scholarship.sendingPartners.length} countries`}
                  </div>
                  <TagList items={filteredCountries} className="eligible-country-list" />
                </>
              ) : (
                <p className="country-empty">
                  {searchedCountryName} is not currently on this eligible countries list.
                </p>
              )}
            </Section>

            <Section icon={<Award size={20} />} title="What it covers">
              <CoverageGrid items={coverageItems} />
            </Section>

            <Section icon={<ShieldCheck size={20} />} title="Who can apply">
              <Bullets items={scholarship.eligibility} />
            </Section>

            <Section icon={<Languages size={20} />} title="English requirement">
              <p>{formatScholarshipText(scholarship.languageNote)}</p>
            </Section>

            <Section icon={<GraduationCap size={20} />} title="Study levels">
              <TagList items={scholarship.studyLevels} />
            </Section>

            <Section icon={<BookOpenCheck size={20} />} title="Common fields">
              <TagList items={scholarship.fields} />
            </Section>

            <Section icon={<FileText size={20} />} title="Basic documents">
              <Bullets items={scholarship.documents} />
            </Section>

            <Section icon={<CalendarDays size={20} />} title="Application process">
              <ol className="scholarship-steps">
                {scholarship.process.map((step) => (
                  <li key={step}>{formatScholarshipText(step)}</li>
                ))}
              </ol>
            </Section>

            <Section icon={<CheckCircle2 size={20} />} title="Important notes">
              <Bullets items={scholarship.importantNotes} />
            </Section>

            {scholarship.officialUrl ? (
              <a className="panel-action primary scholarship-official-link" href={scholarship.officialUrl} target="_blank" rel="noreferrer">
                Official scholarship website <ExternalLink size={17} />
              </a>
            ) : null}
          </article>
        </div>
      </section>
    </AppShell>
  );
}

function getHeroTitle(scholarship: Scholarship) {
  return scholarship.slug === "stipendium-hungaricum"
    ? "Stipendium Hungaricum"
    : scholarship.title.replace(/\s+Scholarship$/i, "");
}

function getHeroBullets(scholarship: Scholarship) {
  if (scholarship.slug === "stipendium-hungaricum") {
    return [
      "Hungarian Government scholarship for international students.",
      "Covers tuition, monthly stipend, accommodation support, and medical insurance.",
      "Available for eligible countries through the official application system.",
    ];
  }

  return scholarship.summary
    .split(/(?<=\.)\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);
}

function getCoverageItems(scholarship: Scholarship) {
  if (scholarship.slug === "stipendium-hungaricum") {
    return [
      { label: "Tuition", value: "Full tuition", detail: "Awarded program tuition is covered." },
      { label: "Accommodation", value: "40,000 HUF", detail: "Monthly housing contribution if dormitory is not available." },
      { label: "Stipend", value: "43,700 HUF", detail: "Monthly stipend for bachelor, master, one-tier, and non-degree studies." },
      { label: "Insurance", value: "Included", detail: "Hungarian health care services plus supplementary medical insurance." },
    ];
  }

  return scholarship.benefits.map((benefit) => {
    const [value, ...rest] = benefit.split(".");
    return {
      label: "Benefit",
      value: value.trim(),
      detail: rest.join(".").trim(),
    };
  });
}

function CoverageGrid({ items }: { items: { label: string; value: string; detail?: string }[] }) {
  return (
    <div className="coverage-grid">
      {items.map((item) => (
        <div className="coverage-card" key={`${item.label}-${item.value}`}>
          <span>{item.label}</span>
          <strong>{item.value}</strong>
          {item.detail ? <p>{item.detail}</p> : null}
        </div>
      ))}
    </div>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="scholarship-bullets">
      {items.map((item) => (
        <li key={item}>{formatScholarshipText(item)}</li>
      ))}
    </ul>
  );
}

function formatScholarshipText(text: string) {
  return text
    .replace(/\bSending Partners\b/g, "eligible-country authorities")
    .replace(/\bSending Partner\b/g, "eligible-country authority");
}

function TagList({ items, className = "" }: { items: string[]; className?: string }) {
  return (
    <div className={`scholarship-tags ${className}`}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="scholarship-section">
      <div className="scholarship-section-title">
        <span>{icon}</span>
        <h2>{title}</h2>
      </div>
      {children}
    </section>
  );
}
