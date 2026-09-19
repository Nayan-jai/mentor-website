"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

const VALID_TRACKER_THEMES = [
  "neonquest", "stopwatch", "cyberpunk", "luminous", "slate",
  "obsidian", "sapphire", "emerald", "amber", "purple", "light"
];

export default function StudyTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { setTheme } = useTheme();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "STUDENT") {
      router.replace("/auth/login");
    }
  }, [session, status, router]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === "NAVIGATE_BACK") {
        router.push("/dashboard/student");
      } else if (event.data?.type === "TOGGLE_THEME") {
        const nextTheme = event.data.theme;
        if (nextTheme && VALID_TRACKER_THEMES.includes(nextTheme)) {
          try {
            localStorage.setItem("app-user-theme", nextTheme);
          } catch (e) {}
          if (nextTheme === "light") {
            setTheme("light");
          } else {
            setTheme("dark");
          }
        }
      }
    };
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [router, setTheme]);

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
        src="/tracker/index.html"
        className="flex-1 w-full border-none"
        title="Study Planner"
      />
    </div>
  );
}
