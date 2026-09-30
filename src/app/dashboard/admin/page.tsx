"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  Users,
  Calendar,
  Video,
  BookOpen,
  LineChart,
  Code2,
  ListTodo,
  Plus,
  ArrowRight,
  ExternalLink,
  Sparkles,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";

interface AdminStats {
  totalUsers: number;
  totalSessions: number;
  totalRecorded: number;
  totalResources: number;
  pendingQueries: number;
}

export default function AdminDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    totalSessions: 0,
    totalRecorded: 0,
    totalResources: 0,
    pendingQueries: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
      return;
    }
    if (status === "authenticated" && session?.user?.role !== "ADMIN") {
      if (session.user.role === "MENTOR") {
        router.replace("/dashboard/mentor");
      } else {
        router.replace("/dashboard/student");
      }
      return;
    }

    if (status === "authenticated" && session?.user?.role === "ADMIN") {
      fetchAdminOverview();
    }
  }, [status, session, router]);

  const fetchAdminOverview = async () => {
    setLoading(true);
    try {
      // Parallel fetch overview counts
      const [usersRes, sessionsRes, recordedRes, resourcesRes, queriesRes] =
        await Promise.allSettled([
          fetch("/api/admin/users").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/admin/sessions").then((r) => (r.ok ? r.json() : {})),
          fetch("/api/recorded-sessions").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/resources").then((r) => (r.ok ? r.json() : [])),
          fetch("/api/developer-query").then((r) => (r.ok ? r.json() : [])),
        ]);

      const usersVal = usersRes.status === "fulfilled" ? (usersRes.value as any) : null;
      const usersCount = Array.isArray(usersVal)
        ? usersVal.length
        : usersVal?.users && Array.isArray(usersVal.users)
        ? usersVal.users.length
        : 0;

      const sessionsVal = sessionsRes.status === "fulfilled" ? (sessionsRes.value as any) : null;
      const sessionsCount = sessionsVal?.sessions && Array.isArray(sessionsVal.sessions)
        ? sessionsVal.sessions.length
        : Array.isArray(sessionsVal)
        ? sessionsVal.length
        : 0;

      const recordedVal = recordedRes.status === "fulfilled" ? (recordedRes.value as any) : null;
      const recordedCount = Array.isArray(recordedVal) ? recordedVal.length : 0;

      const resourcesVal = resourcesRes.status === "fulfilled" ? (resourcesRes.value as any) : null;
      const resourcesCount = Array.isArray(resourcesVal) ? resourcesVal.length : 0;

      const queriesVal = queriesRes.status === "fulfilled" ? (queriesRes.value as any) : null;
      const queriesCount = Array.isArray(queriesVal)
        ? queriesVal.filter((q: any) => q.status === "PENDING").length
        : 0;

      setStats({
        totalUsers: usersCount,
        totalSessions: sessionsCount,
        totalRecorded: recordedCount,
        totalResources: resourcesCount,
        pendingQueries: queriesCount,
      });
    } catch (err) {
      console.error("Error fetching admin stats:", err);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
            Loading Admin Console...
          </div>
        </div>
      </div>
    );
  }

  const managementOptions = [
    {
      title: "Recorded Lectures & YouTube Videos",
      description: "Embed YouTube lectures, manage recordings, and organize video sessions by subject/paper.",
      href: "/sessions/?tab=recorded",
      icon: Video,
      color: "from-red-500 to-rose-600",
      bgColor: "bg-red-50 dark:bg-red-950/40",
      borderColor: "border-red-200 dark:border-red-900/50",
      badgeText: `${stats.totalRecorded} Videos`,
      badgeColor: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
      actionText: "Manage YouTube Lectures",
    },
    {
      title: "Live & Scheduled Sessions",
      description: "Monitor live mentoring sessions, bookings, virtual meeting links, and student attendance.",
      href: "/dashboard/admin/sessions",
      icon: Calendar,
      color: "from-blue-500 to-indigo-600",
      bgColor: "bg-blue-50 dark:bg-blue-950/40",
      borderColor: "border-blue-200 dark:border-blue-900/50",
      badgeText: `${stats.totalSessions} Sessions`,
      badgeColor: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
      actionText: "Manage Live Sessions",
    },
    {
      title: "Resource & Notes Library",
      description: "Upload and organize study PDFs, previous year papers, mind maps, and subject folders.",
      href: "/resources",
      icon: BookOpen,
      color: "from-purple-500 to-violet-600",
      bgColor: "bg-purple-50 dark:bg-purple-950/40",
      borderColor: "border-purple-200 dark:border-purple-900/50",
      badgeText: `${stats.totalResources} Resources`,
      badgeColor: "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300",
      actionText: "Open Resource Hub",
    },
    {
      title: "User Management",
      description: "Manage student and mentor accounts, verify credentials, update roles, and review profiles.",
      href: "/dashboard/admin/users",
      icon: Users,
      color: "from-cyan-500 to-blue-600",
      bgColor: "bg-cyan-50 dark:bg-cyan-950/40",
      borderColor: "border-cyan-200 dark:border-cyan-900/50",
      badgeText: `${stats.totalUsers} Users`,
      badgeColor: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
      actionText: "Manage Users",
    },
    {
      title: "Analytics & Usage Metrics",
      description: "View platform engagement, active study tracker statistics, session attendance, and trends.",
      href: "/dashboard/admin/analytics",
      icon: LineChart,
      color: "from-emerald-500 to-teal-600",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/40",
      borderColor: "border-emerald-200 dark:border-emerald-900/50",
      badgeText: "Real-time",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
      actionText: "View Analytics",
    },
    {
      title: "Developer & Bug Queries",
      description: "Review bug reports, user feedback, screenshot submissions, and platform feature requests.",
      href: "/dashboard/admin/developer-queries",
      icon: Code2,
      color: "from-amber-500 to-orange-600",
      bgColor: "bg-amber-50 dark:bg-amber-950/40",
      borderColor: "border-amber-200 dark:border-amber-900/50",
      badgeText: `${stats.pendingQueries} Pending`,
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
      actionText: "Review Queries",
    },
    {
      title: "Syllabus & Curriculum Templates",
      description: "Configure study tracker premade syllabi, subject breakdowns, topic targets, and test templates.",
      href: "/dashboard/admin/syllabus",
      icon: ListTodo,
      color: "from-pink-500 to-rose-600",
      bgColor: "bg-pink-50 dark:bg-pink-950/40",
      borderColor: "border-pink-200 dark:border-pink-900/50",
      badgeText: "Tracker Sync",
      badgeColor: "bg-pink-100 text-pink-700 dark:bg-pink-950 dark:text-pink-300",
      actionText: "Edit Syllabi",
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="w-4 h-4" />
              <span>Administrative Console</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Platform Administration &amp; Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400">
              Welcome back, {session?.user?.name || "Administrator"}. Manage all platform content, live sessions, YouTube lectures, resources, and users.
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link
              href="/sessions/?tab=recorded"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all"
            >
              <Video className="w-4 h-4" />
              <span>+ Embed YouTube Lecture</span>
            </Link>
            <Link
              href="/sessions/create"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>+ Create Live Session</span>
            </Link>
            <Link
              href="/resources"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold text-xs shadow-md hover:shadow-lg transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>+ Upload Resource</span>
            </Link>
          </div>
        </div>

        {/* Top Metric Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Total Users</span>
              <Users className="w-4 h-4 text-cyan-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {stats.totalUsers}
            </div>
            <Link href="/dashboard/admin/users" className="text-[11px] font-bold text-cyan-600 dark:text-cyan-400 hover:underline mt-2 inline-flex items-center gap-1">
              <span>View all</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Live Sessions</span>
              <Calendar className="w-4 h-4 text-blue-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {stats.totalSessions}
            </div>
            <Link href="/dashboard/admin/sessions" className="text-[11px] font-bold text-blue-600 dark:text-blue-400 hover:underline mt-2 inline-flex items-center gap-1">
              <span>Manage</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Recorded Lectures</span>
              <Video className="w-4 h-4 text-red-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {stats.totalRecorded}
            </div>
            <Link href="/sessions/?tab=recorded" className="text-[11px] font-bold text-red-600 dark:text-red-400 hover:underline mt-2 inline-flex items-center gap-1">
              <span>Watch &amp; Embed</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Study Resources</span>
              <BookOpen className="w-4 h-4 text-purple-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {stats.totalResources}
            </div>
            <Link href="/resources" className="text-[11px] font-bold text-purple-600 dark:text-purple-400 hover:underline mt-2 inline-flex items-center gap-1">
              <span>Open Library</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
              <span className="text-xs font-semibold">Pending Bug Queries</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 dark:text-white mt-2">
              {stats.pendingQueries}
            </div>
            <Link href="/dashboard/admin/developer-queries" className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline mt-2 inline-flex items-center gap-1">
              <span>Review list</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
        </div>

        {/* Management Grid */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Administrative Management Options
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {managementOptions.map((opt) => {
              const Icon = opt.icon;
              return (
                <Link
                  key={opt.title}
                  href={opt.href}
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-indigo-500/40 dark:hover:border-indigo-500/40 transition-all duration-300 flex flex-col justify-between group space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${opt.color} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                        <Icon className="w-6 h-6" />
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${opt.badgeColor}`}>
                        {opt.badgeText}
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                        {opt.title}
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                        {opt.description}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400 group-hover:translate-x-1 transition-transform">
                    <span>{opt.actionText}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
