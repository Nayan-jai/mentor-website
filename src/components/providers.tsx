"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";
import { ThemeRouteManager } from "@/components/theme-route-manager";
import { OfflineDetector } from "@/components/offline-detector";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        <ThemeRouteManager>
          <OfflineDetector />
          {children}
        </ThemeRouteManager>
      </ThemeProvider>
    </SessionProvider>
  );
}