"use client";

import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

const VALID_TRACKER_THEMES = [
  "neonquest", "stopwatch", "cyberpunk", "luminous", "slate",
  "obsidian", "sapphire", "emerald", "amber", "purple", "light"
];

export function ThemeRouteManager({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useTheme();
  const initializedRef = useRef(false);

  // Restore user theme on mount without overwriting custom tracker theme
  useEffect(() => {
    if (initializedRef.current) return;
    initializedRef.current = true;

    try {
      const savedUserTheme = localStorage.getItem("app-user-theme");
      if (savedUserTheme) {
        if (savedUserTheme === "light" && theme !== "light") {
          setTheme("light");
        } else if (savedUserTheme !== "light" && theme !== "dark") {
          setTheme("dark");
        }
      }
    } catch (e) {}
  }, [theme, setTheme]);

  // Sync next-themes changes to localStorage without destroying specific tracker themes
  useEffect(() => {
    if (theme === "dark" || theme === "light") {
      try {
        localStorage.setItem("theme", theme);
        const currentTrackerTheme = localStorage.getItem("app-user-theme");
        if (!currentTrackerTheme || !VALID_TRACKER_THEMES.includes(currentTrackerTheme)) {
          localStorage.setItem("app-user-theme", theme === "light" ? "light" : "luminous");
        } else if (theme === "light" && currentTrackerTheme !== "light") {
          localStorage.setItem("app-user-theme", "light");
        } else if (theme === "dark" && currentTrackerTheme === "light") {
          localStorage.setItem("app-user-theme", "luminous");
        }
      } catch (e) {}
    }
  }, [theme]);

  return <>{children}</>;
}

