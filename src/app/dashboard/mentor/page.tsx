"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Target, TrendingUp, Users, Calendar, ChevronRight, Mail, Zap, Flame, CheckCircle2, Sparkles, Check } from "lucide-react";

function parseDateLocal(strOrDate: any): Date {
  if (!strOrDate) return new Date();
  if (strOrDate instanceof Date) return new Date(strOrDate);
  const parts = String(strOrDate).split("T")[0].split("-");
  if (parts.length === 3) {
    return new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  }
  return new Date(strOrDate);
}

function isSameDay(d1: Date, d2: Date) {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

function resolveColor(color: string) {
  const map: Record<string, string> = {
    "var(--blue)": "#3b7dd8",
    "var(--red)": "#d94f3d",
    "var(--green)": "#2e9e5b",
    "var(--orange)": "#e07a2a",
    "var(--purple)": "#7c5cbf",
    "var(--teal)": "#1e9b8a",
    "var(--gold)": "#c89520",
  };
  return map[color] || color;
}

function getProgressStats(student: any) {
  const tracker = student?.studyTracker;
  if (!tracker || !tracker.days || !tracker.subj) return null;

  const { days = [], prog = {}, conf = {} } = tracker;
  const totalSecs = Object.values(prog).reduce((sum: number, p: any) => sum + (p.timeSpent || 0), 0);
  const totalHrs = totalSecs / 3600;
  const totalTargetHrs = days.reduce((sum: number, day: any) => sum + (day.targetHrs || 0), 0);

  let completedSubtopics = 0, totalSubtopics = 0;
  days.forEach((day: any) => {
    day.blocks?.forEach((block: any) => {
      block.subtopics?.forEach((_: any, j: number) => {
        totalSubtopics++;
        if (prog[block.id]?.subtopics?.[j]) completedSubtopics++;
      });
    });
  });

  const subjectStats: Record<string, { name: string; color: string; icon: string; target: number; actual: number }> = {};
  tracker.subj.forEach((s: any) => {
    subjectStats[s.id] = { name: s.name, color: s.color, icon: s.icon || "📚", target: 0, actual: 0 };
  });
  days.forEach((day: any) => {
    day.blocks?.forEach((block: any) => {
      const sId = block.subjectId;
      if (subjectStats[sId]) {
        subjectStats[sId].target += block.targetHrs || 0;
        subjectStats[sId].actual += (prog[block.id]?.timeSpent || 0) / 3600;
      }
    });
  });

  const daysActive = days.filter((_: any, i: number) => {
    return Object.keys(prog).some(bid =>
      days[i]?.blocks?.some((b: any) => b.id === bid && prog[bid]?.timeSpent > 0)
    );
  }).length;

  return {
    examName: conf.examName || "Exam",
    targetDate: conf.targetDate,
    totalHrs,
    totalTargetHrs,
    completedSubtopics,
    totalSubtopics,
    syllabusPercentage: totalSubtopics > 0 ? Math.round((completedSubtopics / totalSubtopics) * 100) : 0,
    subjects: Object.values(subjectStats),
    daysActive,
    totalDays: days.length,
  };
}

function getStudentTodayData(student: any) {
  const tracker = student?.studyTracker;
  if (!tracker || !tracker.days || !tracker.subj) return null;

  const { days = [], prog = {}, subj = [], conf = {} } = tracker;
  const today = new Date();
  const startDate = conf.startDate ? parseDateLocal(conf.startDate) : new Date();

  const subjectMap: Record<string, { name: string; color: string; icon: string }> = {};
  subj.forEach((s: any) => {
    subjectMap[s.id] = { name: s.name, color: s.color, icon: s.icon || "📚" };
  });

  let todayDayObj: any = null;
  let todayDayNumber = -1;

  for (let i = 0; i < days.length; i++) {
    const d = days[i];
    const dDate = (d.dateOverride || d.date)
      ? parseDateLocal(d.dateOverride || d.date)
      : new Date(startDate.getTime() + i * 86400000);

    if (isSameDay(dDate, today)) {
      todayDayObj = d;
      todayDayNumber = i + 1;
      break;
    }
  }

  if (!todayDayObj) {
    return {
      hasPlanToday: false,
      dayNumber: null,
      targetHrs: 0,
      actualHrs: 0,
      completionPct: 0,
      blocks: [],
      subjectBreakdown: [],
      completedSubtopics: 0,
      totalSubtopics: 0,
    };
  }

  let todaySecs = 0;
  let completedSubtopics = 0;
  let totalSubtopics = 0;
  const subjectMapHrs: Record<string, { name: string; color: string; icon: string; actual: number; target: number }> = {};

  const blocks = (todayDayObj.blocks || []).map((b: any) => {
    const p = prog[b.id] || {};
    const timeSpent = p.timeSpent || 0;
    todaySecs += timeSpent;

    const subCount = (b.subtopics || []).length;
    totalSubtopics += subCount;
    let doneSubCount = 0;
    if (p.subtopics) {
      if (Array.isArray(p.subtopics)) {
        p.subtopics.forEach((done: boolean) => { if (done) doneSubCount++; });
      } else if (typeof p.subtopics === "object") {
        Object.values(p.subtopics).forEach((done: any) => { if (done) doneSubCount++; });
      }
    }
    completedSubtopics += doneSubCount;

    const s = subjectMap[b.subjectId] || { name: "Subject", color: "var(--blue)", icon: "📚" };
    if (!subjectMapHrs[b.subjectId]) {
      subjectMapHrs[b.subjectId] = { name: s.name, color: s.color, icon: s.icon, actual: 0, target: 0 };
    }
    subjectMapHrs[b.subjectId].actual += timeSpent / 3600;
    subjectMapHrs[b.subjectId].target += b.targetHrs || 0;

    return {
      id: b.id,
      topic: b.topic || "Study Session",
      subjectName: s.name,
      subjectColor: resolveColor(s.color),
      subjectIcon: s.icon,
      targetHrs: b.targetHrs || 0,
      actualHrs: timeSpent / 3600,
      completedSubtopics: doneSubCount,
      totalSubtopics: subCount,
      subtopics: b.subtopics || [],
      subtopicsStatus: p.subtopics || {},
      isDone: p.done || p.completed,
    };
  });

  const targetHrs = todayDayObj.targetHrs || blocks.reduce((sum: number, b: any) => sum + (b.targetHrs || 0), 0);
  const actualHrs = todaySecs / 3600;
  const completionPct = targetHrs > 0 ? Math.min(100, Math.round((actualHrs / targetHrs) * 100)) : (actualHrs > 0 ? 100 : 0);

  return {
    hasPlanToday: true,
    dayNumber: todayDayNumber,
    targetHrs,
    actualHrs,
    completionPct,
    blocks,
    subjectBreakdown: Object.values(subjectMapHrs),
    completedSubtopics,
    totalSubtopics,
  };
}

function getDailyLogs(student: any) {
  const tracker = student?.studyTracker;
  if (!tracker || !tracker.days) return [];

  const { days = [], prog = {}, subj = [] } = tracker;
  const subjectMap: Record<string, { name: string; color: string; icon: string }> = {};
  subj.forEach((s: any) => {
    subjectMap[s.id] = { name: s.name, color: s.color, icon: s.icon || "📚" };
  });

  return days.map((day: any, index: number) => {
    let dayTotalSeconds = 0;
    const blocks = (day.blocks || []).map((block: any) => {
      const blockProg = prog[block.id] || {};
      const timeSpent = blockProg.timeSpent || 0;
      dayTotalSeconds += timeSpent;

      const subtopicsCount = block.subtopics?.length || 0;
      let completedSubtopics = 0;
      if (blockProg.subtopics) {
        if (Array.isArray(blockProg.subtopics)) {
          blockProg.subtopics.forEach((done: boolean) => {
            if (done) completedSubtopics++;
          });
        } else if (typeof blockProg.subtopics === "object") {
          Object.values(blockProg.subtopics).forEach((done: any) => {
            if (done) completedSubtopics++;
          });
        }
      }

      const subject = subjectMap[block.subjectId] || { name: "Unknown Subject", color: "var(--indigo)", icon: "📚" };

      return {
        id: block.id,
        topic: block.topic || "Untitled Topic",
        subjectName: subject.name,
        subjectColor: resolveColor(subject.color),
        subjectIcon: subject.icon,
        targetHrs: block.targetHrs || 0,
        actualHrs: timeSpent / 3600,
        completedSubtopics,
        totalSubtopics: subtopicsCount,
      };
    });

    return {
      dayNumber: index + 1,
      date: day.dateOverride || day.date,
      totalHoursLogged: dayTotalSeconds / 3600,
      blocks,
    };
  }).reverse(); // Latest days first
}

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTabFilter, setActiveTabFilter] = useState<"all" | "today" | "planners">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/auth/login");
    } else if (status === "authenticated" && session?.user?.role !== "MENTOR") {
      router.replace("/auth/login");
    } else if (status === "authenticated") {
      fetchMentorSessions();
      fetchAllStudents();
    }
  }, [status, session, router]);

  const fetchMentorSessions = async () => {
    try {
      const res = await fetch("/api/mentor/bookings");
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await fetch("/api/mentor/students");
      const data = await res.json();
      setAllStudents(data.students || []);
    } catch {
      setAllStudents([]);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <div className="h-8 w-56 bg-gray-200 dark:bg-slate-700 rounded animate-pulse mb-2" />
              <div className="h-4 w-40 bg-gray-100 dark:bg-slate-800 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-4 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 animate-pulse flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-slate-700 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="h-4 w-28 bg-gray-200 dark:bg-slate-700 rounded mb-1" />
                    <div className="h-3 w-36 bg-gray-100 dark:bg-slate-800 rounded" />
                  </div>
                </div>
              ))}
            </div>
            <div className="lg:col-span-2 space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-6 rounded-xl border bg-white dark:bg-slate-900 dark:border-slate-800 animate-pulse">
                  <div className="h-5 w-1/2 bg-gray-200 dark:bg-slate-700 rounded mb-4" />
                  <div className="h-3 w-full bg-gray-100 dark:bg-slate-800 rounded mb-2" />
                  <div className="h-3 w-3/4 bg-gray-100 dark:bg-slate-800 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session || session.user.role !== "MENTOR") return null;

  // Compute aggregate numbers
  const studentsStudiedToday = allStudents.filter(s => (getStudentTodayData(s)?.actualHrs || 0) > 0);
  const totalTodayHours = allStudents.reduce((sum, s) => sum + (getStudentTodayData(s)?.actualHrs || 0), 0);
  const studentsWithPlanners = allStudents.filter(s => getProgressStats(s));

  // Filter students based on search and active tab
  let filteredStudents = allStudents.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (activeTabFilter === "today") {
    filteredStudents = filteredStudents.filter(s => (getStudentTodayData(s)?.actualHrs || 0) > 0);
  } else if (activeTabFilter === "planners") {
    filteredStudents = filteredStudents.filter(s => getProgressStats(s));
  }

  // Sort: students who studied today first, then active planners, then others
  const sortedStudents = [...filteredStudents].sort((a, b) => {
    const aToday = getStudentTodayData(a)?.actualHrs || 0;
    const bToday = getStudentTodayData(b)?.actualHrs || 0;
    if (bToday !== aToday) return bToday - aToday;

    const aPlan = getProgressStats(a)?.totalHrs || 0;
    const bPlan = getProgressStats(b)?.totalHrs || 0;
    return bPlan - aPlan;
  });

  const selectedStats = selectedStudent ? getProgressStats(selectedStudent) : null;
  const selectedToday = selectedStudent ? getStudentTodayData(selectedStudent) : null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">Mentor Dashboard</h1>
            <p className="text-gray-500 dark:text-slate-400 mt-1">Welcome back, <span className="font-semibold text-indigo-600 dark:text-indigo-400">{session.user.name}</span></p>
          </div>
          <button
            onClick={() => router.push('/resources')}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-semibold shadow-sm transition-all hover:scale-[1.02] active:scale-[0.98] self-start"
          >
            <BookOpen className="w-4 h-4" />
            Manage Resources
          </button>
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            {
              label: "Studying Today",
              value: `${studentsStudiedToday.length} Students`,
              subText: `${totalTodayHours.toFixed(1)} hrs logged today`,
              icon: <Flame className="w-5 h-5 text-amber-500 animate-pulse" />,
              bg: "bg-amber-50/80 dark:bg-slate-900 border-amber-200 dark:border-amber-900/40"
            },
            {
              label: "Active Planners",
              value: studentsWithPlanners.length,
              subText: `${Math.round((studentsWithPlanners.length / Math.max(1, allStudents.length)) * 100)}% of enrolled`,
              icon: <BookOpen className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />,
              bg: "bg-emerald-50/80 dark:bg-slate-900 border-emerald-200 dark:border-emerald-900/40"
            },
            {
              label: "Total Enrolled",
              value: allStudents.length,
              subText: "Registered students",
              icon: <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />,
              bg: "bg-indigo-50/80 dark:bg-slate-900 border-indigo-200 dark:border-indigo-900/40"
            },
            {
              label: "Mentor Sessions",
              value: sessions.length,
              subText: `${sessions.reduce((s: number, x: any) => s + (x.numberOfStudents || 0), 0)} total bookings`,
              icon: <Calendar className="w-5 h-5 text-violet-500 dark:text-violet-400" />,
              bg: "bg-violet-50/80 dark:bg-slate-900 border-violet-200 dark:border-violet-900/40"
            },
          ].map(({ label, value, subText, icon, bg }) => (
            <div key={label} className={`${bg} border rounded-xl p-4 flex items-center gap-3 shadow-sm`}>
              <div className="shrink-0">{icon}</div>
              <div className="min-w-0">
                <div className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white truncate">{value}</div>
                <div className="text-xs text-gray-500 dark:text-slate-400 font-medium">{label}</div>
                <div className="text-[10px] text-gray-400 dark:text-slate-500 truncate">{subText}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* ── LEFT: Students Panel ────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500 dark:text-indigo-400" /> Enrolled Students
                <Badge className="bg-indigo-100 dark:bg-indigo-950/80 text-indigo-700 dark:text-indigo-300 border dark:border-indigo-800 ml-1">{allStudents.length}</Badge>
              </h2>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1.5 p-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-xs">
                <button
                  onClick={() => setActiveTabFilter("all")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    activeTabFilter === "all"
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  All ({allStudents.length})
                </button>
                <button
                  onClick={() => setActiveTabFilter("today")}
                  className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1 transition-colors ${
                    activeTabFilter === "today"
                      ? "bg-emerald-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  <Flame className="w-3.5 h-3.5 text-amber-300" />
                  Studied Today ({studentsStudiedToday.length})
                </button>
                <button
                  onClick={() => setActiveTabFilter("planners")}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                    activeTabFilter === "planners"
                      ? "bg-purple-600 text-white shadow-sm"
                      : "text-gray-600 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  Planners ({studentsWithPlanners.length})
                </button>
              </div>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 border border-gray-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 text-sm text-gray-800 dark:text-slate-100 placeholder:text-gray-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 shadow-sm"
              />
            </div>

            {sortedStudents.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-10 text-center text-gray-400 dark:text-slate-500">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No students match your filter</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStudents.map((stu: any) => {
                  const st = getProgressStats(stu);
                  const todayInfo = getStudentTodayData(stu);
                  const initials = (stu.name || stu.email || "?").slice(0, 2).toUpperCase();
                  const studiedToday = (todayInfo?.actualHrs || 0) > 0;

                  return (
                    <button
                      key={stu.id}
                      className={`w-full text-left bg-white dark:bg-slate-900 border rounded-2xl p-4 hover:border-indigo-400 dark:hover:border-indigo-600 hover:shadow-md transition-all duration-150 group ${
                        studiedToday
                          ? "border-emerald-200 dark:border-emerald-900/50 shadow-sm"
                          : "border-gray-100 dark:border-slate-800"
                      }`}
                      onClick={() => setSelectedStudent(stu)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="relative shrink-0">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm ${
                            studiedToday
                              ? "bg-gradient-to-br from-emerald-500 to-teal-600 ring-2 ring-emerald-400/40"
                              : "bg-gradient-to-br from-indigo-500 to-violet-600"
                          }`}>
                            {initials}
                          </div>
                          {studiedToday && (
                            <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[10px] text-white ring-2 ring-white dark:ring-slate-900" title="Active today!">
                              🔥
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Name + email row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 dark:text-white truncate flex items-center gap-2">
                                <span>{stu.name || "—"}</span>
                                {studiedToday && (
                                  <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Active Today
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-gray-400 dark:text-slate-400 flex items-center gap-1 truncate mt-0.5">
                                <Mail className="w-3 h-3 shrink-0" />{stu.email}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 dark:text-slate-600 group-hover:text-indigo-400 shrink-0 transition-colors" />
                          </div>

                          {/* ── TODAY'S STUDY HIGHLIGHT CARD ── */}
                          {todayInfo && todayInfo.hasPlanToday ? (
                            <div className="mt-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/70 border border-slate-200/80 dark:border-slate-800">
                              <div className="flex items-center justify-between gap-2 text-xs mb-1.5 flex-wrap">
                                <div className="font-bold flex items-center gap-1.5 text-gray-800 dark:text-slate-200">
                                  <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                                  <span>Today (Day {todayInfo.dayNumber}):</span>
                                  <span className={todayInfo.actualHrs > 0 ? "text-emerald-600 dark:text-emerald-400 font-extrabold" : "text-gray-500"}>
                                    {todayInfo.actualHrs.toFixed(1)}h / {todayInfo.targetHrs.toFixed(1)}h
                                  </span>
                                </div>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                  todayInfo.actualHrs >= todayInfo.targetHrs && todayInfo.targetHrs > 0
                                    ? "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300"
                                    : todayInfo.actualHrs > 0
                                    ? "bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300"
                                    : "bg-gray-200 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                                }`}>
                                  {todayInfo.actualHrs >= todayInfo.targetHrs && todayInfo.targetHrs > 0
                                    ? "🎯 Target Achieved"
                                    : todayInfo.actualHrs > 0
                                    ? `In Progress (${todayInfo.completionPct}%)`
                                    : "Not started"}
                                </span>
                              </div>

                              {/* Progress bar for today */}
                              <div className="w-full h-1.5 bg-gray-200 dark:bg-slate-800 rounded-full overflow-hidden mb-2">
                                <div
                                  className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                                  style={{ width: `${Math.min(100, todayInfo.completionPct)}%` }}
                                />
                              </div>

                              {/* Today's Subjects pills */}
                              {todayInfo.blocks.length > 0 && (
                                <div className="flex flex-wrap gap-1.5">
                                  {todayInfo.blocks.slice(0, 4).map((b: any) => (
                                    <span
                                      key={b.id}
                                      className="text-[10px] font-medium px-2 py-0.5 rounded-md flex items-center gap-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300"
                                    >
                                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: b.subjectColor }} />
                                      <span className="font-semibold">{b.subjectName}:</span>
                                      <span className={b.actualHrs > 0 ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-gray-400"}>
                                        {b.actualHrs.toFixed(1)}h/{b.targetHrs}h
                                      </span>
                                    </span>
                                  ))}
                                  {todayInfo.blocks.length > 4 && (
                                    <span className="text-[10px] text-gray-400 px-1 py-0.5">+{todayInfo.blocks.length - 4} more</span>
                                  )}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="mt-2.5 text-[11px] text-gray-400 dark:text-slate-500 flex items-center gap-1.5">
                              <span>📅</span>
                              <span>No study plan scheduled for today</span>
                            </div>
                          )}

                          {/* Overall Syllabus KPI chips */}
                          {st && (
                            <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-gray-100 dark:border-slate-800/80">
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-slate-400">
                                <Clock className="w-3 h-3 text-indigo-400" />
                                <strong>{st.totalHrs.toFixed(1)}h</strong> total logged
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-slate-400">
                                <BookOpen className="w-3 h-3 text-purple-400" />
                                <strong>{st.syllabusPercentage}%</strong> syllabus
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-slate-400">
                                <Target className="w-3 h-3 text-blue-400" />
                                {st.examName}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── RIGHT: Sessions Panel ────────────────── */}
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-500 dark:text-violet-400" /> Your Sessions
              <Badge className="bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 border dark:border-violet-800 ml-1">{sessions.length}</Badge>
            </h2>

            {sessions.length === 0 ? (
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800 p-8 text-center text-gray-400 dark:text-slate-500">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sessions found.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {sessions.map((s: any) => (
                  <div key={s.id} className="bg-white dark:bg-slate-900 border border-gray-100 dark:border-slate-800 rounded-2xl p-4 border-l-4 border-l-violet-400 dark:border-l-violet-500 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 dark:text-white truncate">{s.title}</div>
                        {s.description && <div className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{s.description}</div>}
                      </div>
                      <Badge className="bg-violet-100 dark:bg-violet-950/80 text-violet-700 dark:text-violet-300 shrink-0 text-[10px]">
                        {s.numberOfStudents} booked
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.startTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                      {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {s.students?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-50 dark:border-slate-800">
                        <div className="text-[10px] font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wide mb-1">Booked by</div>
                        <div className="flex flex-wrap gap-1">
                          {s.students.map((stu: any) => (
                            <span key={stu.id} className="text-[10px] bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-300 px-2 py-0.5 rounded-full border dark:border-slate-700">
                              {stu.name || stu.email}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── DETAIL MODAL ────────────────── */}
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white dark:bg-slate-900 border dark:border-slate-800 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-800 dark:text-slate-100" onClick={e => e.stopPropagation()}>

            {/* Modal Header */}
            <div className="flex justify-between items-start mb-5 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                  {(selectedStudent.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <span>{selectedStudent.name}</span>
                    {selectedToday && selectedToday.actualHrs > 0 && (
                      <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                        ⚡ Active Today
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-slate-400">{selectedStudent.email}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 text-2xl leading-none" onClick={() => setSelectedStudent(null)}>×</button>
            </div>

            {/* ═════════════════════════════════════════════════
                SECTION 1: TODAY'S STUDY ACTIVITY & SESSIONS
               ═════════════════════════════════════════════════ */}
            <div className="mb-6 bg-gradient-to-br from-emerald-50/60 to-teal-50/40 dark:from-emerald-950/30 dark:to-slate-900 border border-emerald-200/80 dark:border-emerald-900/50 rounded-2xl p-4 sm:p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔥</span>
                  <div>
                    <h4 className="text-sm font-extrabold text-emerald-950 dark:text-emerald-200">
                      Today&apos;s Study Activity
                    </h4>
                    <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                      {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "short", year: "numeric" })}
                      {selectedToday?.dayNumber ? ` • Day ${selectedToday.dayNumber}` : ""}
                    </p>
                  </div>
                </div>

                {selectedToday?.hasPlanToday && (
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    selectedToday.actualHrs >= selectedToday.targetHrs && selectedToday.targetHrs > 0
                      ? "bg-emerald-600 text-white shadow-sm"
                      : selectedToday.actualHrs > 0
                      ? "bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300 dark:border-emerald-800"
                      : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-slate-400"
                  }`}>
                    {selectedToday.actualHrs >= selectedToday.targetHrs && selectedToday.targetHrs > 0
                      ? "🎯 Target Completed!"
                      : selectedToday.actualHrs > 0
                      ? `In Progress (${selectedToday.completionPct}%)`
                      : "Pending Today"}
                  </span>
                )}
              </div>

              {selectedToday && selectedToday.hasPlanToday ? (
                <div className="space-y-4">
                  {/* Today KPI metrics */}
                  <div className="grid grid-cols-3 gap-2.5">
                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-center">
                      <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Studied Today</div>
                      <div className="text-lg font-extrabold text-emerald-700 dark:text-emerald-300 mt-0.5">
                        {selectedToday.actualHrs.toFixed(1)} hrs
                      </div>
                      <div className="text-[10px] text-gray-400">Target: {selectedToday.targetHrs.toFixed(1)}h</div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-center">
                      <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Today&apos;s Target</div>
                      <div className="text-lg font-extrabold text-gray-900 dark:text-white mt-0.5">
                        {selectedToday.completionPct}%
                      </div>
                      <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                        {selectedToday.actualHrs >= selectedToday.targetHrs ? "Achieved" : "On track"}
                      </div>
                    </div>

                    <div className="bg-white/80 dark:bg-slate-900/80 p-3 rounded-xl border border-emerald-100 dark:border-emerald-900/40 text-center">
                      <div className="text-[10px] font-bold text-gray-500 dark:text-slate-400 uppercase">Subtopics Done</div>
                      <div className="text-lg font-extrabold text-indigo-600 dark:text-indigo-400 mt-0.5">
                        {selectedToday.completedSubtopics}/{selectedToday.totalSubtopics}
                      </div>
                      <div className="text-[10px] text-gray-400">Scheduled topics</div>
                    </div>
                  </div>

                  {/* Today's Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs text-emerald-900 dark:text-emerald-300 font-semibold mb-1">
                      <span>Today&apos;s Goal Progress</span>
                      <span>{selectedToday.actualHrs.toFixed(1)}h of {selectedToday.targetHrs.toFixed(1)}h ({selectedToday.completionPct}%)</span>
                    </div>
                    <div className="w-full bg-emerald-200/60 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all"
                        style={{ width: `${Math.min(100, selectedToday.completionPct)}%` }}
                      />
                    </div>
                  </div>

                  {/* Today's Subjects & Topics list */}
                  <div>
                    <div className="text-xs font-bold text-emerald-950 dark:text-emerald-300 uppercase tracking-wide mb-2">
                      Today&apos;s Scheduled Subject Blocks
                    </div>
                    <div className="space-y-2">
                      {selectedToday.blocks.map((block: any) => {
                        const blockPct = block.targetHrs > 0
                          ? Math.min(100, Math.round((block.actualHrs / block.targetHrs) * 100))
                          : 0;

                        return (
                          <div key={block.id} className="bg-white dark:bg-slate-900 p-3 rounded-xl border border-emerald-100 dark:border-slate-800 shadow-xs">
                            <div className="flex justify-between items-start gap-2 mb-1.5 flex-wrap">
                              <div className="min-w-0 flex-1">
                                <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm flex items-center gap-1.5">
                                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: block.subjectColor }} />
                                  <span>{block.subjectIcon} {block.subjectName}:</span>
                                  <span className="font-normal text-gray-700 dark:text-slate-300 truncate">{block.topic}</span>
                                </div>
                              </div>
                              <div className="text-xs font-semibold text-right shrink-0">
                                <span className={block.actualHrs > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-500"}>
                                  {block.actualHrs.toFixed(1)}h
                                </span>
                                <span className="text-gray-400 font-normal"> / {block.targetHrs}h</span>
                              </div>
                            </div>

                            {/* Block progress bar */}
                            {block.targetHrs > 0 && (
                              <div className="w-full bg-gray-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1 mb-1.5">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{ width: `${blockPct}%`, backgroundColor: block.subjectColor }}
                                />
                              </div>
                            )}

                            {/* Subtopics checklist summary */}
                            {block.subtopics && block.subtopics.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {block.subtopics.map((st: string, idx: number) => {
                                  const isDone = Boolean(block.subtopicsStatus?.[idx]);
                                  return (
                                    <span
                                      key={idx}
                                      className={`text-[10px] px-2 py-0.5 rounded-md flex items-center gap-1 font-medium ${
                                        isDone
                                          ? "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800"
                                          : "bg-gray-50 dark:bg-slate-800 text-gray-500 dark:text-slate-400 border border-gray-200 dark:border-slate-700"
                                      }`}
                                    >
                                      {isDone ? "✓" : "○"} {st}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-white/70 dark:bg-slate-900/70 rounded-xl border border-emerald-100 dark:border-emerald-900/30 text-center text-xs text-gray-500 dark:text-slate-400">
                  📅 No study plan or syllabus scheduled for today.
                </div>
              )}
            </div>

            {/* ═════════════════════════════════════════════════
                SECTION 2: OVERALL SYLLABUS & EXAM PROGRESS
               ═════════════════════════════════════════════════ */}
            {selectedStats && (
              <div className="space-y-5">
                <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-indigo-500" /> Overall Exam & Syllabus Progress
                  </h4>
                  <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{selectedStats.examName}</span>
                </div>

                {/* Overall KPI cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-100 dark:border-blue-900/50">
                    <div className="text-[10px] font-bold text-blue-700 dark:text-blue-300 uppercase tracking-wide">Total Logged</div>
                    <div className="text-base font-extrabold text-blue-900 dark:text-blue-100 mt-0.5">{selectedStats.totalHrs.toFixed(1)} hrs</div>
                    <div className="text-[10px] text-blue-600 dark:text-blue-300">Target: {selectedStats.totalTargetHrs} hrs</div>
                  </div>
                  <div className="bg-purple-50 dark:bg-purple-950/40 p-3 rounded-xl border border-purple-100 dark:border-purple-900/50">
                    <div className="text-[10px] font-bold text-purple-700 dark:text-purple-300 uppercase tracking-wide">Syllabus Done</div>
                    <div className="text-base font-extrabold text-purple-900 dark:text-purple-100 mt-0.5">{selectedStats.syllabusPercentage}%</div>
                    <div className="text-[10px] text-purple-600 dark:text-purple-300">{selectedStats.completedSubtopics}/{selectedStats.totalSubtopics} topics</div>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-950/40 p-3 rounded-xl border border-amber-100 dark:border-amber-900/50">
                    <div className="text-[10px] font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wide">Target Date</div>
                    <div className="text-base font-extrabold text-amber-900 dark:text-amber-100 mt-0.5">
                      {selectedStats.targetDate ? new Date(selectedStats.targetDate).toLocaleDateString() : "Not set"}
                    </div>
                    <div className="text-[10px] text-amber-600 dark:text-amber-300">{selectedStats.daysActive} days active</div>
                  </div>
                </div>

                {/* Overall syllabus bar */}
                <div>
                  <div className="flex justify-between text-xs text-gray-500 dark:text-slate-400 mb-1">
                    <span className="font-semibold text-gray-700 dark:text-slate-300">Overall Syllabus Completion</span>
                    <span>{selectedStats.syllabusPercentage}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all" style={{ width: `${selectedStats.syllabusPercentage}%` }} />
                  </div>
                </div>

                {/* Subject breakdown */}
                <div>
                  <div className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-3">All Subjects Breakdown</div>
                  <div className="space-y-2.5">
                    {selectedStats.subjects.map((sub: any) => {
                      const pct = sub.target > 0 ? Math.min(Math.round((sub.actual / sub.target) * 100), 100) : 0;
                      return (
                        <div key={sub.name}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="font-semibold text-gray-700 dark:text-slate-300 flex items-center gap-1.5">
                              <span>{sub.icon}</span>
                              <span>{sub.name}</span>
                            </span>
                            <span className="text-gray-500 dark:text-slate-400">{sub.actual.toFixed(1)}h / {sub.target.toFixed(1)}h ({pct}%)</span>
                          </div>
                          <div className="w-full bg-gray-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: resolveColor(sub.color) }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Daily Activity & Study Logs */}
                <div className="border-t border-slate-100 dark:border-slate-800 pt-5">
                  <h4 className="text-xs font-bold text-gray-700 dark:text-slate-300 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-indigo-500 dark:text-indigo-400" /> Historical Daily Planner & Logs
                  </h4>
                  
                  {(() => {
                    const logs = getDailyLogs(selectedStudent);
                    if (logs.length === 0) {
                      return (
                        <p className="text-xs text-gray-400 dark:text-slate-500 italic">No study logs recorded yet.</p>
                      );
                    }

                    return (
                      <div className="space-y-3 max-h-[30vh] overflow-y-auto pr-1">
                        {logs.map((log: any) => (
                          <div key={log.dayNumber} className="bg-gray-50 dark:bg-slate-950/60 border border-gray-100 dark:border-slate-800 rounded-xl p-3">
                            <div className="flex justify-between items-center mb-2">
                              <span className="text-xs font-bold text-gray-800 dark:text-slate-200">
                                Day {log.dayNumber} {log.date ? `(${log.date})` : ""}
                              </span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                log.totalHoursLogged > 0 
                                  ? "bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300" 
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-500 dark:text-slate-400"
                              }`}>
                                {log.totalHoursLogged > 0 
                                  ? `✓ Studied: ${log.totalHoursLogged.toFixed(1)}h` 
                                  : "No study time logged"}
                              </span>
                            </div>

                            {log.blocks.length > 0 && (
                              <div className="space-y-1.5">
                                {log.blocks.map((block: any) => (
                                  <div key={block.id} className="bg-white dark:bg-slate-900 p-2 rounded-lg border border-gray-100 dark:border-slate-800 text-xs flex justify-between items-center">
                                    <div className="min-w-0 flex-1 truncate">
                                      <span className="font-semibold text-gray-800 dark:text-slate-200">{block.topic}</span>
                                      <span className="text-[10px] text-gray-400 ml-2">({block.subjectName})</span>
                                    </div>
                                    <div className="text-[10px] text-gray-500 shrink-0 font-medium">
                                      {block.actualHrs.toFixed(1)}h / {block.targetHrs}h
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button className="bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 font-semibold px-5 py-2 rounded-xl text-sm transition-colors" onClick={() => setSelectedStudent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}