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
  const { theme, resolvedTheme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const applyThemeToIframe = () => {
    if (!iframeRef.current?.contentDocument) return;
    const doc = iframeRef.current.contentDocument;
    
    let savedTheme: string | null = null;
    try {
      savedTheme = localStorage.getItem("app-user-theme");
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

  if (status === "loading" || !session || session.user.role !== "STUDENT") {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">
        <div className="text-gray-600 dark:text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col dark:bg-slate-950 transition-colors duration-300" style={{ height: "calc(100dvh - 64px)", overflow: "hidden", marginTop: "0" }}>
      {/* Slim breadcrumb bar — zero gap below site navbar */}
      <div className="bg-white dark:bg-slate-900 border-b border-gray-200 dark:border-slate-800 px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/student")}
            className="flex items-center gap-2 text-gray-600 dark:text-slate-300 hover:text-gray-900 dark:hover:text-white h-7 px-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="h-5 w-[1px] bg-gray-200 dark:bg-slate-800" />
          <h1 className="text-sm font-semibold text-gray-800 dark:text-white">Study Planner &amp; Tracker</h1>
        </div>
        <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
          {session.user.name}
        </span>
      </div>

      {/* Iframe fills all remaining height — no gap */}
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
