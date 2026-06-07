import type { ReactNode } from "react";
import { BrandLogo } from "./BrandLogo";
import { TopNav } from "./TopNav";
import { ThemeToggle } from "./ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

export function AppShell({ children, showLogo = true }: { children: ReactNode; showLogo?: boolean }) {
  const { user, logout } = useAuth();
  const userLabel = user?.name || user?.email?.split("@")[0];

  return (
    <main className="app-shell min-h-screen">
      <div className="relative z-40 mx-auto flex w-full max-w-[1660px] items-center justify-between px-5 py-5 lg:px-10">
        {showLogo ? <BrandLogo compact /> : <span />}
        <TopNav userLabel={userLabel} onSignOut={() => void logout()} />
        <div className="app-shell-actions">
          <ThemeToggle />
        </div>
      </div>
      {children}
    </main>
  );
}
