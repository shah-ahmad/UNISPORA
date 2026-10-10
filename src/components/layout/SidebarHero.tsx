import { useWebsiteContent } from "@/hooks/useWebsiteContent";
import { ArrowRight, GraduationCap, Globe2, Rocket, Star } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { GlassLink } from "@/components/ui/GlassButton";
import { StatCard } from "@/components/ui/StatCard";

export function SidebarHero() {
  const sections = useWebsiteContent("site_content");
  const announcements = useWebsiteContent("announcements");
  const hero = sections.find(row => row.$id === "main-hero") || sections.find(row => row.placement === "hero");
  return (
    <aside className="home-sidebar">
      <BrandLogo />
      <div className="home-copy">
        <h1>{String(hero?.title || "Where Ambitions Go Global")}</h1>
        <span className="gold-rule" />
        <p>{String(hero?.body || "UniSpora helps students discover and choose the right university anywhere in the world. Through an immersive 3D globe experience, students can explore universities worldwide, compare programs, tuition fees, languages, and scholarships, and access reliable information to make informed study abroad decisions. By connecting students with mentors, educational institutions, and trusted partners, UniSpora aims to make international education more transparent, accessible, and student-centered.")}</p>
      </div>
      <div className="grid gap-3">
        <GlassLink href="/">
          Start Exploring
          <ArrowRight size={17} />
        </GlassLink>
        <GlassLink href="/consultants">
          Join as Consultant
          <span className="inline-flex h-5 w-5 items-center justify-center"><Rocket size={16} /></span>
        </GlassLink>
      </div>
      {[...announcements, ...sections.filter(row => row.placement !== 'hero')].map(row => <section className="website-content-card" key={row.$id}><h2>{String(row.title)}</h2><p>{String(row.body || '')}</p>{typeof row.buttonUrl === 'string' && /^https?:\/\//i.test(row.buttonUrl) && row.buttonLabel ? <a href={row.buttonUrl} rel="noreferrer">{String(row.buttonLabel)}</a> : null}</section>)}
      {hero?.buttonUrl && /^https?:\/\//i.test(String(hero.buttonUrl)) && hero.buttonLabel ? <a className="panel-action" href={String(hero.buttonUrl)}>{String(hero.buttonLabel)}</a> : null}
      <div className="stats-grid">
        <StatCard icon={<GraduationCap size={25} />} value="90" label="Universities" />
        <StatCard icon={<Globe2 size={25} />} value="30" label="Countries" />
        <StatCard icon={<Star size={25} />} value="20+" label="Languages" />
        <StatCard icon={<Rocket size={25} />} value="7" label="Scholarship Programs" />
      </div>
    </aside>
  );
}
