"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function ThemeRouteManager({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const initializedRef = useRef(false);

  // Restore user theme strictly without any automatic route/system overrides
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const savedUserTheme = localStorage.getItem("app-user-theme") || localStorage.getItem("theme");
      if (savedUserTheme === "dark" || savedUserTheme === "light") {
        if (theme !== savedUserTheme) {
          setTheme(savedUserTheme);
        }
      }
    } catch (e) {}
  }, [theme, setTheme]);

  // Persist user theme whenever theme changes
  useEffect(() => {
    if (theme === "dark" || theme === "light") {
      try {
        localStorage.setItem("app-user-theme", theme);
        localStorage.setItem("theme", theme);
      } catch (e) {}
    }
  }, [theme]);

  return <>{children}</>;
}
