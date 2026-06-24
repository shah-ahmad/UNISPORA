import { Link, useRouterState } from "@tanstack/react-router";
import { Bookmark, Home, LogIn, Search, Sparkles, User, UserPlus } from "lucide-react";

const navItems = [
  { label: "Home", to: "/", icon: Home },
  { label: "Bookmarks", to: "/bookmarks", icon: Bookmark },
  { label: "Search", to: "/", icon: Search, action: "search" },
  { label: "AI Advisor", to: "/ai-advisor", icon: Sparkles },
  { label: "Login", to: "/login", icon: LogIn, action: "login" },
  { label: "Sign Up", to: "/signup", icon: UserPlus, action: "signup" },
];

export function TopNav({
  onSearchClick,
  onLoginClick,
  onSignupClick,
  userLabel,
  onAccountClick,
  activeAction,
  mobile = false,
}: {
  onSearchClick?: () => void;
  onLoginClick?: () => void;
  onSignupClick?: () => void;
  userLabel?: string;
  onAccountClick?: () => void;
  activeAction?: "login" | "signup";
  mobile?: boolean;
}) {
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const visibleItems = mobile
    ? navItems.filter((item) => ["Home", "Bookmarks", "Search", "Login", "Sign Up"].includes(item.label))
    : navItems;

  return (
    <nav className={`top-nav ${mobile ? "top-nav-mobile" : ""} ${activeAction ? "modal-action-active" : ""}`} aria-label="Primary navigation">
      {visibleItems.map((item) => {
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
        if (item.action === "login" && userLabel) {
          return (
            <button key={item.label} type="button" className="top-nav-link session-nav-link" onClick={onAccountClick}>
              <User size={17} />
              <span>{userLabel}</span>
            </button>
          );
        }
        if (item.action === "signup" && userLabel) {
          return null;
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
