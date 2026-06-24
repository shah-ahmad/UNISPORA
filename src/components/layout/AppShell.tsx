import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import { SidebarHero } from "./SidebarHero";
import { TopNav } from "./TopNav";
import { useAuth } from "@/hooks/useAuth";

export function AppShell({ children, showLogo = true }: { children: ReactNode; showLogo?: boolean }) {
  const { user } = useAuth();
  const userLabel = user?.name || user?.email?.split("@")[0];

  return (
    <main className="app-shell min-h-screen">
      <div className="app-shell-sidebar">
        <SidebarHero />
      </div>
      <section className="app-shell-main">
        <div className="app-shell-header">
          {showLogo ? <BrandLogo compact /> : <span />}
          <TopNav userLabel={userLabel} />
        </div>
        {children}
      </section>
    </main>
  );
}
