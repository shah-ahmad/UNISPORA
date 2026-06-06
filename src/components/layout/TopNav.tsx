import { Link, useRouterState } from "@tanstack/react-router";
import { Home, LogIn, Search, Sparkles, UserPlus, Compass } from "lucide-react";

const navItems = [
  { label: "Home", to: "/", icon: Home },
  { label: "Explore", to: "/explore", icon: Compass },
  { label: "Search", to: "/explore", icon: Search, action: "search" },
  { label: "AI Advisor", to: "/ai-advisor", icon: Sparkles },
  { label: "Login", to: "/login", icon: LogIn, action: "login" },
  { label: "Sign Up", to: "/signup", icon: UserPlus, action: "signup" },
];

export function TopNav({
  onSearchClick,
  onLoginClick,
  onSignupClick,
  activeAction,
}: {
  onSearchClick?: () => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  activeAction?: "login" | "signup";
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });

  return (
    <nav className={`top-nav ${activeAction ? "modal-action-active" : ""}`} aria-label="Primary navigation">
      {navItems.map((item) => {
        const Icon = item.icon;
        const routeActive = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
        const active = activeAction ? item.action === activeAction : routeActive;
        if (item.action === "search" && onSearchClick) {
          return (
            <button key={item.label} type="button" className="top-nav-link" onClick={onSearchClick}>
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        }
        if (item.action === "login" && onLoginClick) {
          return (
            <button key={item.label} type="button" className={`top-nav-link ${activeAction === "login" ? "active" : ""}`} onClick={onLoginClick}>
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        }
        if (item.action === "signup" && onSignupClick) {
          return (
            <button key={item.label} type="button" className={`top-nav-link ${activeAction === "signup" ? "active" : ""}`} onClick={onSignupClick}>
              <Icon size={17} />
              <span>{item.label}</span>
            </button>
          );
        }

        return (
          <Link key={item.label} to={item.to} className={`top-nav-link ${active ? "active" : ""}`}>
            <Icon size={17} />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
