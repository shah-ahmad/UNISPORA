import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { AccountCard, Auth } from "@/components/auth/AuthPanel";
import { useAuth } from "@/hooks/useAuth";
import { BrandLogo } from "./BrandLogo";
import { SidebarHero } from "./SidebarHero";
import { TopNav } from "./TopNav";

type AuthMode = "login" | "signup" | "account";

export function AppShell({ children, showLogo = true }: { children: ReactNode; showLogo?: boolean }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const userLabel = user?.name || user?.email?.split("@")[0];
  const [authMode, setAuthMode] = useState<AuthMode>();

  return (
    <main className="app-shell min-h-screen">
      <div className="app-shell-sidebar">
        <SidebarHero />
      </div>
      <section className="app-shell-main">
        <div className="app-shell-globe-backdrop" aria-hidden="true" />
        <div className="app-shell-header">
          {showLogo ? <BrandLogo compact /> : <span />}
          <TopNav
            userLabel={userLabel}
            onSearchClick={() => {
              setAuthMode(undefined);
              void navigate({ to: "/explore" });
            }}
            onLoginClick={() => setAuthMode(user ? "account" : "login")}
            onSignupClick={() => setAuthMode("signup")}
            onAccountClick={() => setAuthMode("account")}
            activeAction={authMode === "account" ? undefined : authMode}
          />
        </div>
        <div className={`app-shell-content ${authMode ? "is-blurred" : ""}`}>
          {children}
        </div>
        {authMode ? (
          <div className="auth-modal-layer shell-auth-modal-layer" role="dialog" aria-modal="true" aria-label={authMode === "account" ? "Account" : authMode === "login" ? "Login" : "Sign up"} onPointerDown={() => setAuthMode(undefined)}>
            <div className="auth-modal" onPointerDown={(event) => event.stopPropagation()}>
              <button className="details-close" type="button" aria-label="Close auth modal" onClick={() => setAuthMode(undefined)}>
                <X size={18} />
              </button>
              {authMode === "account" && user ? (
                <AccountCard
                  name={userLabel ?? "UniSpora user"}
                  email={user.email}
                  onSignedOut={() => setAuthMode(undefined)}
                />
              ) : (
                <Auth
                  title={authMode === "login" ? "Welcome back to UniSpora." : "Create your UniSpora account."}
                  action={authMode === "login" ? "Login" : "Sign Up"}
                  signup={authMode === "signup"}
                  onSuccess={() => setAuthMode(undefined)}
                />
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}
