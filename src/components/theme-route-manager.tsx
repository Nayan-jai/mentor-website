"use client";

import { usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import { useEffect, useRef } from "react";

export function ThemeRouteManager({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const isMountedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
  }, []);

  // Handle route transitions between homepage (/) and other pages
  useEffect(() => {
    let savedUserTheme: string | null = null;
    try {
      savedUserTheme = localStorage.getItem("app-user-theme");
    } catch (e) {}

    if (pathname === "/") {
      // Force light mode on homepage without wiping saved user preference
      if (theme !== "light") {
        setTheme("light");
      }
    } else {
      // Restore user's preferred theme on non-homepage
      if (savedUserTheme === "dark" || savedUserTheme === "light") {
        if (theme !== savedUserTheme) {
          setTheme(savedUserTheme);
        }
      }
    }
  }, [pathname]);

  // Update saved user theme ONLY when user is on a non-homepage and theme changes
  useEffect(() => {
    if (!isMountedRef.current) return;
    if (pathname !== "/") {
      if (theme && (theme === "dark" || theme === "light")) {
        try {
          localStorage.setItem("app-user-theme", theme);
        } catch (e) {}
      }
    }
  }, [theme, pathname]);

  return <>{children}</>;
}
