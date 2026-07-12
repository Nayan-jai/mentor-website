"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function StudyTrackerPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "STUDENT") {
      router.replace("/auth/login");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.role !== "STUDENT") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ height: "calc(100dvh - 64px)", overflow: "hidden", marginTop: "0" }}>
      {/* Slim breadcrumb bar — zero gap below site navbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm shrink-0">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/dashboard/student")}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 h-7 px-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div className="h-5 w-[1px] bg-gray-200" />
          <h1 className="text-sm font-semibold text-gray-800">UPSC Study Planner &amp; Tracker</h1>
        </div>
        <span className="text-xs text-gray-500 font-medium">
          {session.user.name}
        </span>
      </div>

      {/* Iframe fills all remaining height — no gap */}
      <iframe
        src="/tracker/index.html"
        className="flex-1 w-full border-none"
        title="Study Planner"
      />
    </div>
  );
}
