"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudyTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const applyThemeToIframe = () => {
    if (!iframeRef.current?.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    
    let savedTheme: string | null = null;
    try {
      savedTheme = localStorage.getItem("app-user-theme") || localStorage.getItem("theme");
    } catch (e) {}

    const activeTheme = savedTheme || resolvedTheme || theme;
    const isDark = activeTheme === "dark" || document.documentElement.classList.contains("dark");
    
    if (doc.body) {
      doc.body.classList.toggle("dark", isDark);
    }
    if (doc.documentElement) {
      doc.documentElement.classList.toggle("dark", isDark);
    }
  };

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "STUDENT") {
      router.replace("/auth/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    applyThemeToIframe();

    // Ensure iframe maintains dark mode when tracker script renders DOM
    const interval = setInterval(applyThemeToIframe, 300);
    return () => clearInterval(interval);
  }, [theme, resolvedTheme]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE_BACK") {
        router.push("/dashboard/student");
      } else if (event.data?.type === "TOGGLE_THEME") {
        const nextTheme = event.data.theme || (theme === "dark" ? "light" : "dark");
        setTheme(nextTheme);
        try {
          localStorage.setItem("app-user-theme", nextTheme);
          localStorage.setItem("theme", nextTheme);
        } catch (e) {}
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, setTheme, theme]);

  if (status === "loading" || !session || session.user.role !== "STUDENT") {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">
        <div className="text-gray-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col dark:bg-slate-950 transition-colors duration-300 w-full" style={{ height: "calc(100dvh - 64px)", overflow: "hidden" }}>
      {/* Iframe fills all height — unified single header inside tracker */}
      <iframe
        ref={iframeRef}
        onLoad={applyThemeToIframe}
        src="/tracker/index.html"
        className="flex-1 w-full border-none"
        title="Study Planner"
      />
    </div>
  );
}
