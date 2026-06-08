import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Award, CalendarDays, FileText, GraduationCap } from "lucide-react";
import { AppShell } from "@/components/layout/AppShell";

export const Route = createFileRoute("/scholarships/stipendium-hungaricum")({
  component: StipendiumHungaricum,
});

function StipendiumHungaricum() {
  return (
    <AppShell>
      <section className="scholarship-page">
        <div className="scholarship-hero glass-card">
          <Link className="scholarship-back" to="/">
            <ArrowLeft size={18} /> Back to globe
          </Link>
          <p className="text-sm uppercase tracking-[0.24em] text-[#f6b75c]">Scholarship guide</p>
          <h1>Stipendium Hungaricum Scholarship</h1>
          <p>
            A dedicated UniSpora page for the Hungarian government scholarship. Add the full
            eligibility, application steps, required documents, deadlines, and practical notes here.
          </p>
        </div>

        <div className="scholarship-content">
          <article className="glass-card scholarship-article">
            <Section icon={<GraduationCap size={20} />} title="Overview">
              <p>
                Paste your main scholarship introduction here. This section can explain who the
                scholarship is for, what it covers, which study levels are supported, and why it is
                relevant for students applying to universities in Hungary.
              </p>
            </Section>

            <Section icon={<Award size={20} />} title="Benefits">
              <p>
                Add details about tuition coverage, monthly stipend, accommodation contribution,
                medical insurance, and any country-specific conditions you want students to know.
              </p>
            </Section>

            <Section icon={<FileText size={20} />} title="Required Documents">
              <p>
                Add the document checklist here: passport, transcripts, motivation letter, language
                certificate, medical certificate, portfolio, recommendation letters, and anything
                else required for the programs you want to cover.
              </p>
            </Section>

            <Section icon={<CalendarDays size={20} />} title="Timeline And Application Steps">
              <p>
                Add the application timeline, nomination process, university ranking choices,
                entrance exam notes, interview steps, and final acceptance process here.
              </p>
            </Section>
          </article>
        </div>
      </section>
    </AppShell>
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
