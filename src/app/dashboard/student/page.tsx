"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import dynamic from "next/dynamic";

const Lightfall = dynamic(() => import("@/components/Lightfall"), { ssr: false });

export default function StudentDashboard() {
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
        <div className="flex justify-center items-center">
          <div aria-label="Orange and tan hamster running in a metal wheel" role="img" className="wheel-and-hamster">
            <div className="wheel"></div>
            <div className="hamster">
              <div className="hamster__body">
                <div className="hamster__head">
                  <div className="hamster__ear"></div>
                  <div className="hamster__eye"></div>
                  <div className="hamster__nose"></div>
                </div>
                <div className="hamster__limb hamster__limb--fr"></div>
                <div className="hamster__limb hamster__limb--fl"></div>
                <div className="hamster__limb hamster__limb--br"></div>
                <div className="hamster__limb hamster__limb--bl"></div>
                <div className="hamster__tail"></div>
              </div>
            </div>
            <div className="spoke"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 transition-colors duration-300">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Lightfall Banner */}
          <div className="relative w-full h-[280px] md:h-[320px] rounded-2xl overflow-hidden shadow-2xl mb-8 border border-slate-800/20">
            <Lightfall
              colors={['#A6C8FF', '#5227FF', '#FF9FFC']}
              backgroundColor="#0A0E1A"
              speed={1}
              streakCount={8}
              streakWidth={1}
              streakLength={1}
              glow={1}
              density={1}
              twinkle={1}
              zoom={2}
              backgroundGlow={0}
              opacity={1}
              mouseInteraction={false}
              mouseStrength={0}
              mouseRadius={0.6}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/80 via-slate-900/40 to-transparent flex flex-col justify-center p-8 text-white pointer-events-none">
              <div className="flex items-center space-x-3 mb-3">
                <span className="px-3 py-1 text-xs font-semibold tracking-wide uppercase text-blue-300 bg-blue-900/60 backdrop-blur-md rounded-full border border-blue-500/30">
                  {session.user.role}
                </span>
              </div>
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white">
                Welcome back, {session.user.name || "Student"}
              </h1>
              <p className="mt-2 text-slate-300 text-sm md:text-base max-w-xl">
                Ready to continue your prep? Connect with mentors, schedule your next session, and track your daily study goals.
              </p>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 shadow rounded-2xl p-6 border border-slate-200/60 dark:border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Student Navigation</h2>
              <span className="text-sm text-gray-500 dark:text-slate-400">Quick Access</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                className="bg-amber-50 dark:bg-amber-950/40 border border-amber-100 dark:border-amber-900/50 p-6 rounded-xl cursor-pointer hover:shadow-lg transition"
                onClick={() => router.push('/dashboard/student/study-tracker')}
                tabIndex={0}
                role="button"
                aria-label="Go to Study Tracker"
              >
                <h3 className="text-lg font-medium text-amber-900 dark:text-amber-300 mb-2">Study Tracker</h3>
                <p className="text-amber-700 dark:text-amber-400/80">Plan and track your daily study hours & syllabus</p>
              </div>

              <div
                className="bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/50 p-6 rounded-xl cursor-pointer hover:shadow-lg transition"
                onClick={() => router.push('/my-queries?ask=true')}
                tabIndex={0}
                role="button"
                aria-label="Ask a Mentor"
              >
                <h3 className="text-lg font-medium text-blue-900 dark:text-blue-300 mb-2">My Mentors</h3>
                <p className="text-blue-700 dark:text-blue-400/80">Connect with your mentors</p>
              </div>

              <div
                className="bg-green-50 dark:bg-emerald-950/40 border border-green-100 dark:border-emerald-900/50 p-6 rounded-xl cursor-pointer hover:shadow-lg transition"
                onClick={() => router.push('/sessions')}
                tabIndex={0}
                role="button"
                aria-label="Go to Sessions"
              >
                <h3 className="text-lg font-medium text-green-900 dark:text-emerald-300 mb-2">Schedule</h3>
                <p className="text-green-700 dark:text-emerald-400/80">View your upcoming sessions</p>
              </div>

              <div
                className="bg-purple-50 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/50 p-6 rounded-xl cursor-pointer hover:shadow-lg transition"
                onClick={() => router.push('/resources')}
                tabIndex={0}
                role="button"
                aria-label="Go to Resources"
              >
                <h3 className="text-lg font-medium text-purple-900 dark:text-purple-300 mb-2">Resources</h3>
                <p className="text-purple-700 dark:text-purple-400/80">Access learning materials</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
