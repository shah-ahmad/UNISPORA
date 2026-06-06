import { useEffect, useState } from "react";

export type AppTheme = "dark" | "light";

const themeKey = "unispora-theme";
const themeEvent = "unispora-theme-change";

function getStoredTheme(): AppTheme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(themeKey) === "light" ? "light" : "dark";
}

function applyTheme(theme: AppTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("light", theme === "light");
  document.documentElement.classList.toggle("dark", theme === "dark");
}

export function setAppTheme(theme: AppTheme) {
  window.localStorage.setItem(themeKey, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent<AppTheme>(themeEvent, { detail: theme }));
}

export function useAppTheme() {
  const [theme, setTheme] = useState<AppTheme>(getStoredTheme);

  useEffect(() => {
    applyTheme(theme);

    const onThemeChange = (event: Event) => {
      setTheme((event as CustomEvent<AppTheme>).detail);
    };

    window.addEventListener(themeEvent, onThemeChange);
    return () => window.removeEventListener(themeEvent, onThemeChange);
  }, [theme]);

  const toggleTheme = () => {
    setAppTheme(theme === "dark" ? "light" : "dark");
  };

  return { theme, toggleTheme };
}
