import { ChevronDown, Moon, Sun } from "lucide-react";
import { useAppTheme } from "./theme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useAppTheme();
  const isDark = theme === "dark";
  const Icon = isDark ? Moon : Sun;

  return (
    <button className="control-pill" type="button" onClick={toggleTheme} aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}>
      <Icon size={17} fill="currentColor" />
      {isDark ? "Dark" : "Light"}
      <ChevronDown size={15} />
    </button>
  );
}
