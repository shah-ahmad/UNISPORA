import { ArrowRight, GraduationCap, Globe2, Rocket, Star } from "lucide-react";
import { BrandLogo } from "./BrandLogo";
import { GlassLink } from "@/components/ui/GlassButton";
import { StatCard } from "@/components/ui/StatCard";

export function SidebarHero() {
  return (
    <aside className="home-sidebar">
      <BrandLogo />
      <div className="home-copy">
        <h1>Where Ambitions Go Global</h1>
        <span className="gold-rule" />
        <p>UniSpora helps students discover and choose the right university anywhere in the world. Through an immersive 3D globe experience, students can explore universities worldwide, compare programs, tuition fees, languages, and scholarships, and access reliable information to make informed study abroad decisions. By connecting students with mentors, educational institutions, and trusted partners, UniSpora aims to make international education more transparent, accessible, and student-centered.</p>
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
      <div className="stats-grid">
        <StatCard icon={<GraduationCap size={25} />} value="90" label="Universities" />
        <StatCard icon={<Globe2 size={25} />} value="30" label="Countries" />
        <StatCard icon={<Star size={25} />} value="20+" label="Languages" />
        <StatCard icon={<Rocket size={25} />} value="7" label="Scholarship Programs" />
      </div>
    </aside>
  );
}
