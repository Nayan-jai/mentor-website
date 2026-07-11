"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Clock, BookOpen, Target, TrendingUp, Users, Calendar, ChevronRight, Mail } from "lucide-react";

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

  const subjectStats: Record<string, { name: string; color: string; target: number; actual: number }> = {};
  tracker.subj.forEach((s: any) => {
    subjectStats[s.id] = { name: s.name, color: s.color, target: 0, actual: 0 };
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
    examName: conf.examName || "UPSC",
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

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

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

  if (!session || session.user.role !== "MENTOR") return null;

  const filteredStudents = allStudents.filter(s =>
    s.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const studentsWithTracker = filteredStudents.filter(s => getProgressStats(s));
  const studentsWithout = filteredStudents.filter(s => !getProgressStats(s));
  const sortedStudents = [...studentsWithTracker, ...studentsWithout];

  const stats = selectedStudent ? getProgressStats(selectedStudent) : null;

  return (
    <div className="min-h-screen bg-gray-50 pt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Mentor Dashboard</h1>
          <p className="text-gray-500 mt-1">Welcome back, <span className="font-semibold text-indigo-600">{session.user.name}</span></p>
        </div>

        {/* Summary Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Students", value: allStudents.length, icon: <Users className="w-5 h-5 text-indigo-500" />, bg: "bg-indigo-50 border-indigo-100" },
            { label: "Active Planners", value: allStudents.filter(s => getProgressStats(s)).length, icon: <BookOpen className="w-5 h-5 text-emerald-500" />, bg: "bg-emerald-50 border-emerald-100" },
            { label: "Your Sessions", value: sessions.length, icon: <Calendar className="w-5 h-5 text-violet-500" />, bg: "bg-violet-50 border-violet-100" },
            { label: "Total Bookings", value: sessions.reduce((s: number, x: any) => s + (x.numberOfStudents || 0), 0), icon: <TrendingUp className="w-5 h-5 text-amber-500" />, bg: "bg-amber-50 border-amber-100" },
          ].map(({ label, value, icon, bg }) => (
            <div key={label} className={`${bg} border rounded-xl p-4 flex items-center gap-3`}>
              <div className="shrink-0">{icon}</div>
              <div>
                <div className="text-2xl font-extrabold text-gray-900">{value}</div>
                <div className="text-xs text-gray-500 font-medium">{label}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">

          {/* ── LEFT: Students Panel ────────────────── */}
          <div className="xl:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" /> Enrolled Students
                <Badge className="bg-indigo-100 text-indigo-700 ml-1">{allStudents.length}</Badge>
              </h2>
            </div>

            {/* Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="Search by name or email…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-4 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {sortedStudents.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
                <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
                <p>No students found</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sortedStudents.map((stu: any) => {
                  const st = getProgressStats(stu);
                  const initials = (stu.name || stu.email || "?").slice(0, 2).toUpperCase();
                  return (
                    <button
                      key={stu.id}
                      className="w-full text-left bg-white border border-gray-100 rounded-2xl p-4 hover:border-indigo-200 hover:shadow-md transition-all duration-150 group"
                      onClick={() => setSelectedStudent(stu)}
                    >
                      <div className="flex items-start gap-4">
                        {/* Avatar */}
                        <div className="shrink-0 w-11 h-11 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm">
                          {initials}
                        </div>

                        <div className="flex-1 min-w-0">
                          {/* Name + email row */}
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="font-semibold text-gray-900 truncate">{stu.name || "—"}</div>
                              <div className="text-xs text-gray-400 flex items-center gap-1 truncate">
                                <Mail className="w-3 h-3 shrink-0" />{stu.email}
                              </div>
                            </div>
                            <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-400 shrink-0 transition-colors" />
                          </div>

                          {st ? (
                            <div className="mt-3 space-y-2">
                              {/* KPI chips */}
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-full">
                                  <Clock className="w-3 h-3" />{st.totalHrs.toFixed(1)}h logged
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-purple-50 text-purple-700 border border-purple-100 px-2.5 py-1 rounded-full">
                                  <BookOpen className="w-3 h-3" />{st.syllabusPercentage}% syllabus
                                </span>
                                <span className="inline-flex items-center gap-1 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100 px-2.5 py-1 rounded-full">
                                  <Target className="w-3 h-3" />{st.examName}
                                </span>
                                {st.targetDate && (
                                  <span className="inline-flex items-center gap-1 text-xs font-medium bg-amber-50 text-amber-700 border border-amber-100 px-2.5 py-1 rounded-full">
                                    <Calendar className="w-3 h-3" />{new Date(st.targetDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "2-digit" })}
                                  </span>
                                )}
                              </div>

                              {/* Mini subject bars */}
                              <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1.5 mt-1">
                                {st.subjects.slice(0, 6).map((sub: any) => {
                                  const pct = sub.target > 0 ? Math.min(Math.round((sub.actual / sub.target) * 100), 100) : 0;
                                  return (
                                    <div key={sub.name}>
                                      <div className="flex justify-between text-[10px] text-gray-500 mb-0.5">
                                        <span className="font-medium truncate">{sub.name}</span>
                                        <span>{pct}%</span>
                                      </div>
                                      <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                        <div
                                          className="h-full rounded-full"
                                          style={{ width: `${pct}%`, backgroundColor: resolveColor(sub.color) }}
                                        />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>

                              {/* Overall progress bar */}
                              <div>
                                <div className="flex justify-between text-[10px] text-gray-400 mb-0.5">
                                  <span>Overall Syllabus</span>
                                  <span>{st.syllabusPercentage}%</span>
                                </div>
                                <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                                  <div
                                    className="h-full rounded-full bg-gradient-to-r from-indigo-400 to-violet-500 transition-all"
                                    style={{ width: `${st.syllabusPercentage}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="mt-2">
                              <span className="text-xs text-gray-400 italic">No active study planner yet</span>
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
            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-violet-500" /> Your Sessions
              <Badge className="bg-violet-100 text-violet-700 ml-1">{sessions.length}</Badge>
            </h2>

            {sessions.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-400">
                <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No sessions found.</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[70vh] overflow-y-auto pr-1">
                {sessions.map((s: any) => (
                  <div key={s.id} className="bg-white border border-gray-100 rounded-2xl p-4 border-l-4 border-l-violet-400">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <div className="font-semibold text-gray-900 truncate">{s.title}</div>
                        {s.description && <div className="text-xs text-gray-500 truncate mt-0.5">{s.description}</div>}
                      </div>
                      <Badge className="bg-violet-100 text-violet-700 shrink-0 text-[10px]">
                        {s.numberOfStudents} booked
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-gray-500">
                      <Calendar className="w-3 h-3" />
                      {new Date(s.startTime).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}{" "}
                      {new Date(s.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      {" – "}
                      {new Date(s.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                    {s.students?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-gray-50">
                        <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">Booked by</div>
                        <div className="flex flex-wrap gap-1">
                          {s.students.map((stu: any) => (
                            <span key={stu.id} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
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
      {selectedStudent && stats && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setSelectedStudent(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-y-auto max-h-[90vh] text-slate-800" onClick={e => e.stopPropagation()}>

            <div className="flex justify-between items-start mb-5 border-b pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold">
                  {(selectedStudent.name || "?").slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedStudent.name}&apos;s Progress</h3>
                  <p className="text-sm text-gray-500">{selectedStudent.email}</p>
                </div>
              </div>
              <button className="text-gray-400 hover:text-gray-600 text-2xl leading-none" onClick={() => setSelectedStudent(null)}>×</button>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
                <div className="text-[10px] font-bold text-blue-700 uppercase tracking-wide">Target Exam</div>
                <div className="text-base font-extrabold text-blue-900 mt-0.5">{stats.examName}</div>
                {stats.targetDate && <div className="text-[10px] text-blue-600 mt-0.5">{new Date(stats.targetDate).toLocaleDateString()}</div>}
              </div>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-100">
                <div className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide">Study Time</div>
                <div className="text-base font-extrabold text-emerald-900 mt-0.5">{stats.totalHrs.toFixed(1)} hrs</div>
                <div className="text-[10px] text-emerald-600">Target: {stats.totalTargetHrs} hrs</div>
              </div>
              <div className="bg-purple-50 p-3 rounded-xl border border-purple-100">
                <div className="text-[10px] font-bold text-purple-700 uppercase tracking-wide">Syllabus Done</div>
                <div className="text-base font-extrabold text-purple-900 mt-0.5">{stats.syllabusPercentage}%</div>
                <div className="text-[10px] text-purple-600">{stats.completedSubtopics}/{stats.totalSubtopics} topics</div>
              </div>
            </div>

            {/* Overall bar */}
            <div className="mb-5">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span className="font-semibold">Overall Syllabus Progress</span>
                <span>{stats.syllabusPercentage}%</span>
              </div>
              <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-500 to-violet-500 h-full rounded-full transition-all" style={{ width: `${stats.syllabusPercentage}%` }} />
              </div>
            </div>

            {/* Subject breakdown */}
            <div>
              <div className="text-xs font-bold text-gray-700 uppercase tracking-wide mb-3">Subject Breakdown</div>
              <div className="space-y-3">
                {stats.subjects.map((sub: any) => {
                  const pct = sub.target > 0 ? Math.min(Math.round((sub.actual / sub.target) * 100), 100) : 0;
                  return (
                    <div key={sub.name}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-semibold text-gray-700">{sub.name}</span>
                        <span className="text-xs text-gray-500">{sub.actual.toFixed(1)}h / {sub.target.toFixed(1)}h ({pct}%)</span>
                      </div>
                      <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: resolveColor(sub.color) }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold px-5 py-2 rounded-xl text-sm transition-colors" onClick={() => setSelectedStudent(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}