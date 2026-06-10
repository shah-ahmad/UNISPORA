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
  ShieldCheck,
} from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";
import { fetchAppwriteScholarshipBySlug } from "@/data/appwriteScholarships";
import { getScholarshipBySlug } from "@/data/scholarships";
import type { Scholarship } from "@/data/scholarships";

export function ScholarshipGuidePage({ slug }: { slug: string }) {
  const fallbackScholarship = getScholarshipBySlug(slug);
  const [scholarship, setScholarship] = useState<Scholarship | undefined>(fallbackScholarship);

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

  return (
    <AppShell>
      <section className="scholarship-page">
        <div className="scholarship-hero glass-card">
          <Link className="scholarship-back" to="/">
            <ArrowLeft size={18} /> Back to globe
          </Link>
          <p className="text-sm uppercase tracking-[0.24em] text-[#f6b75c]">Scholarship guide</p>
          <h1>{scholarship.title}</h1>
          <p>{scholarship.summary}</p>

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
            <Section icon={<Award size={20} />} title="What it covers">
              <Bullets items={scholarship.benefits} />
            </Section>

            <Section icon={<ShieldCheck size={20} />} title="Who can apply">
              <Bullets items={scholarship.eligibility} />
            </Section>

            <Section icon={<Languages size={20} />} title="English requirement">
              <p>{scholarship.languageNote}</p>
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
                  <li key={step}>{step}</li>
                ))}
              </ol>
            </Section>

            <Section icon={<CheckCircle2 size={20} />} title="Important notes">
              <Bullets items={scholarship.importantNotes} />
            </Section>

            <Section icon={<Award size={20} />} title="Eligible Sending Partners">
              <p>
                Eligibility depends on official agreements, partner organizations, and the
                current application cycle. Students should always confirm the latest rules
                on the official website.
              </p>
              <details className="scholarship-countries">
                <summary>View sending partners</summary>
                <TagList items={scholarship.sendingPartners} />
              </details>
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

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="scholarship-bullets">
      {items.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
}

function TagList({ items }: { items: string[] }) {
  return (
    <div className="scholarship-tags">
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
