"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ThemeRouteManager } from "@/components/theme-route-manager";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeRouteManager>{children}</ThemeRouteManager>
      </ThemeProvider>
    </SessionProvider>
  );
}