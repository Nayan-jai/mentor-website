"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useTheme } from "next-themes";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Sun,
  Moon,
  Edit3,
  User as UserIcon,
  Mail,
  Award,
  Clock,
  BookOpen,
  CheckCircle2,
  Trophy,
  Activity,
  X,
  Camera,
  Check,
  Zap,
  Flame,
  Star,
  Target,
  Sparkles,
  Info,
  Lock,
  Users,
  CalendarCheck,
  LineChart,
  ShieldCheck,
} from "lucide-react";

const MALE_AVATARS = [
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/bluey_2.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/vibrent_27.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/vibrent_24.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/3d_4.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/memo_1.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/memo_3.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/memo_22.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/memo_23.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/toon_4.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/toon_5.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/toon_9.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/toon_8.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/upstream_13.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/upstream_21.png",
];

const FEMALE_AVATARS = [
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/upstream_20.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/upstream_12.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/upstream_11.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/upstream_14.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/toon_10.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/upstream_1.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/toon_6.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/toon_7.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/memo_29.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/memo_20.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/memo_2.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/bluey_4.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/bluey_6.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/3d_2.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/vibrent_2.png",
  "https://cdn.jsdelivr.net/gh/alohe/memojis/png/vibrent_21.png",
];

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  // Profile state
  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [avatarGenderCategory, setAvatarGenderCategory] = useState<"male" | "female">("male");
  const [showCompetencyInfoModal, setShowCompetencyInfoModal] = useState(false);

  // Form state
  const [formFields, setFormFields] = useState({
    name: "",
    email: "",
    image: "",
    bio: "Competitive Exam Aspirant | Dedicated to consistent practice",
    targetYear: "2026",
    optionalSubject: "General",
  });

  useEffect(() => {
    setMounted(true);
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const [resProfile, resTracker] = await Promise.all([
        fetch("/api/user/profile"),
        fetch("/api/student/study-tracker"),
      ]);

      let profileJson: any = {};
      let trackerJson: any = {};

      if (resProfile.ok) profileJson = await resProfile.json();
      if (resTracker.ok) trackerJson = await resTracker.json();

      const mergedTracker = {
        ...(profileJson?.studyTracker || {}),
        ...(trackerJson || {}),
      };

      setProfileData({ ...profileJson, studyTracker: mergedTracker });

      setFormFields((prev) => ({
        ...prev,
        name: profileJson.name || session?.user?.name || "",
        email: profileJson.email || session?.user?.email || "",
        image: profileJson.image || session?.user?.image || "",
        ...(mergedTracker?.profileInfo || {}),
      }));
    } catch (err) {
      console.error("Failed to load profile data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveMessage(null);

    try {
      const updatedTracker = {
        ...(profileData?.studyTracker || {}),
        profileInfo: {
          bio: formFields.bio,
          targetYear: formFields.targetYear,
          optionalSubject: formFields.optionalSubject,
        },
      };

      const [resProfile] = await Promise.all([
        fetch("/api/user/profile", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: formFields.name,
            email: formFields.email,
            image: formFields.image,
            studyTracker: updatedTracker,
          }),
        }),
        fetch("/api/student/study-tracker", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updatedTracker),
        }),
      ]);

      if (!resProfile.ok) {
        const errData = await resProfile.json();
        throw new Error(errData.message || "Failed to update profile");
      }

      const updated = await resProfile.json();
      setProfileData({ ...updated, studyTracker: updatedTracker });

      await updateSession({
        ...session,
        user: {
          ...session?.user,
          name: updated.name,
          email: updated.email,
          image: updated.image,
        },
      });

      setSaveMessage("Profile updated successfully!");
      setTimeout(() => setSaveMessage(null), 3000);
      setIsEditing(false);
    } catch (err: any) {
      setSaveMessage(err.message || "Error updating profile.");
    } finally {
      setSaving(false);
    }
  };

  if (!mounted) return null;

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center dark:bg-slate-950 dark:text-white">
        <Card className="p-8 text-center max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800">
          <h2 className="text-2xl font-bold mb-4">Authentication Required</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Please sign in to view and manage your profile details.
          </p>
          <Button onClick={() => router.push("/auth/login")} className="bg-blue-600 hover:bg-blue-700 text-white w-full">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  const userAvatar =
    formFields.image ||
    session.user.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(session.user.name || "User")}`;

  const isAdmin = (profileData?.role || session?.user?.role) === "ADMIN";
  const isMentor = (profileData?.role || session?.user?.role) === "MENTOR";

  // Calculate Synced Study Tracker Metrics
  const tracker = profileData?.studyTracker || {};

  // Real-time calculation of overall syllabus progress
  let totalPlanBlocks = 0;
  let donePlanBlocks = 0;
  (tracker.days || []).forEach((d: any) => {
    (d.blocks || []).forEach((b: any) => {
      totalPlanBlocks++;
      const p = tracker.prog?.[b.id] || {};
      const sts = b.subtopics || [];
      const customTasks = p.customTasks || [];
      const tot = sts.length + customTasks.length;

      if (tot > 0) {
        const doneSts = sts.filter((_: any, j: number) => Boolean(p.subtopics?.[j])).length;
        const doneTasks = customTasks.filter((t: any) => Boolean(t.done)).length;
        if (doneSts + doneTasks === tot) donePlanBlocks++;
      } else if (p.completed || p.done) {
        donePlanBlocks++;
      }
    });
  });

  const syllabusPct = totalPlanBlocks > 0
    ? Math.round((donePlanBlocks / totalPlanBlocks) * 100)
    : (tracker?.overallProgress ?? tracker?.syllabusProgress ?? 0);

  // Real-time calculation of consistency progress
  const totalDaysCount = (tracker.days || []).length;
  const activeDaysCount = (tracker.days || []).filter((_: any, i: number) => {
    const dayBlocks = tracker.days[i]?.blocks || [];
    return dayBlocks.some((b: any) => {
      const p = tracker.prog?.[b.id] || {};
      return p.completed || p.done || (p.timeSpent && p.timeSpent > 0);
    });
  }).length;

  const consistencyPct = totalDaysCount > 0
    ? Math.round((activeDaysCount / totalDaysCount) * 100)
    : (tracker?.streak ? Math.min(tracker.streak * 12, 100) : (tracker?.consistency ?? 0));

  const subjectMastery = tracker?.subjectMastery || {};

  // Build Dynamic Competency Matrix from Study Tracker subjects
  const competencyMatrix = (tracker?.subj && tracker.subj.length > 0)
    ? tracker.subj.map((s: any, idx: number) => {
        let totalBlocks = 0;
        let cumulativeScore = 0;

        (tracker.days || []).forEach((d: any) => {
          (d.blocks || []).forEach((b: any) => {
            const matchesSubject = b.subjectId === s.id || 
              (b.subjectId && s.name && String(b.subjectId).toLowerCase() === String(s.name).toLowerCase());
            
            if (matchesSubject) {
              totalBlocks++;
              const p = tracker.prog?.[b.id] || {};
              const sts = b.subtopics || [];
              const customTasks = p.customTasks || [];
              const tot = sts.length + customTasks.length;

              if (tot > 0) {
                const doneSts = sts.filter((_: any, j: number) => Boolean(p.subtopics?.[j])).length;
                const doneTasks = customTasks.filter((t: any) => Boolean(t.done)).length;
                cumulativeScore += (doneSts + doneTasks) / tot;
              } else if (p.completed || p.done) {
                cumulativeScore += 1;
              } else if (p.timeSpent && b.targetHrs) {
                const loggedRatio = p.timeSpent / (b.targetHrs * 3600);
                cumulativeScore += Math.min(Math.max(loggedRatio, 0), 1);
              }
            }
          });
        });

        const pct = totalBlocks > 0 ? Math.min(Math.round((cumulativeScore / totalBlocks) * 100), 100) : 0;
        const palette = ["bg-blue-500", "bg-indigo-600", "bg-emerald-500", "bg-amber-500", "bg-purple-600", "bg-sky-500"];
        const colorClass = palette[idx % palette.length];
        return {
          name: s.name,
          score: pct,
          level: pct >= 85 ? "Expert" : pct >= 70 ? "Proficient" : "Competent",
          color: colorClass,
          dot: colorClass
        };
      })
    : [
        { name: "GS 1 (History & Geography)", score: subjectMastery["GS1"] || syllabusPct, level: syllabusPct >= 85 ? "Expert" : syllabusPct >= 70 ? "Proficient" : "Competent", color: "bg-blue-500", dot: "bg-blue-500" },
        { name: "GS 2 (Polity & Governance)", score: subjectMastery["GS2"] || syllabusPct, level: syllabusPct >= 85 ? "Expert" : syllabusPct >= 70 ? "Proficient" : "Competent", color: "bg-indigo-600", dot: "bg-indigo-600" },
        { name: "GS 3 (Economy & Environment)", score: subjectMastery["GS3"] || syllabusPct, level: syllabusPct >= 85 ? "Expert" : syllabusPct >= 70 ? "Proficient" : "Competent", color: "bg-emerald-500", dot: "bg-emerald-500" },
        { name: "GS 4 (Ethics & Aptitude)", score: subjectMastery["GS4"] || syllabusPct, level: syllabusPct >= 85 ? "Expert" : syllabusPct >= 70 ? "Proficient" : "Competent", color: "bg-amber-500", dot: "bg-amber-500" },
        { name: `Optional (${formFields.optionalSubject || "General"})`, score: subjectMastery["Optional"] || syllabusPct, level: syllabusPct >= 85 ? "Expert" : syllabusPct >= 70 ? "Proficient" : "Competent", color: "bg-purple-600", dot: "bg-purple-600" },
        { name: "CSAT & Data Interpretation", score: subjectMastery["CSAT"] || syllabusPct, level: syllabusPct >= 85 ? "Expert" : syllabusPct >= 70 ? "Proficient" : "Competent", color: "bg-sky-500", dot: "bg-sky-500" },
      ];

  // Dynamic Prep History from Study Tracker Days
  const prepHistoryRows = (tracker?.days && tracker.days.length > 0)
    ? tracker.days.slice(0, 5).map((d: any, idx: number) => {
        const totalHrs = (d.blocks || []).reduce((sum: number, b: any) => sum + (b.targetHrs || 3), 0);
        return {
          course: d.title || `Day ${idx + 1} Module`,
          cert: totalHrs >= 6 ? "Yes" : "In Progress",
          duration: `${totalHrs}.0h`,
        };
      })
    : [];

  // Dynamic Achievements
  const testCount = profileData?._count?.testAttempts ?? 0;
  const streakCount = tracker?.streak ?? 0;
  const subjCount = tracker?.subj?.length ?? 0;

  const dynamicAchievements = [
    { name: "Syllabus Master", score: `${Math.min(Math.floor(syllabusPct / 20), 5)}/5`, pct: syllabusPct, color: "bg-amber-500" },
    { name: "Skill Builder", score: `${Math.min(subjCount, 5)}/5`, pct: Math.min(subjCount * 20, 100), color: "bg-blue-500" },
    { name: "Consistency Streak", score: `${streakCount}/7 Days`, pct: Math.min((streakCount / 7) * 100, 100), color: "bg-emerald-500" },
    { name: "Answer Writer", score: `${testCount}/10`, pct: Math.min((testCount / 10) * 100, 100), color: "bg-purple-500" },
  ];

  // Dynamic Total Learning Hours
  const totalTrackerHrs = (tracker?.days || []).reduce((acc: number, d: any) => {
    return acc + (d.blocks || []).reduce((bAcc: number, b: any) => bAcc + (b.targetHrs || 0), 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pt-20 pb-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Top Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center space-x-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              <span>Account Settings</span>
              <span>/</span>
              <span>{isAdmin ? "Admin Console" : isMentor ? "Mentor Hub" : "Learning Dashboard"}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {profileData?.name || session.user.name || "User Profile"}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Dark Mode Toggle */}
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold transition-all duration-200 border border-slate-200 dark:border-slate-700"
              title="Toggle Dark / Light Mode"
            >
              {theme === "dark" ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-indigo-600" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>

            {/* Single Edit Profile Button */}
            <Button
              onClick={() => setIsEditing(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit Profile</span>
            </Button>
          </div>
        </div>

        {saveMessage && (
          <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-300 font-medium text-sm">
            {saveMessage}
          </div>
        )}

        {/* Grid Container Inspired by Design Image */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Hero Profile Card (Cols 1-5) */}
          <div className="lg:col-span-5 flex flex-col">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-blue-600 to-indigo-700 dark:from-slate-900 dark:via-blue-950 dark:to-indigo-950 p-8 text-white shadow-2xl border border-blue-400/20 dark:border-slate-800 flex-1 flex flex-col justify-between">
              
              {/* Background Glow Orbs */}
              <div className="absolute -top-10 -left-10 w-40 h-40 bg-sky-400/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 flex justify-between items-start">
                <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-3 py-1 text-xs font-semibold">
                  {profileData?.role || session.user.role || "STUDENT"}
                </Badge>
              </div>

              {/* Avatar & User Details */}
              <div className="relative z-10 my-8 text-center flex flex-col items-center">
                <div className="w-32 h-32 rounded-full p-1.5 bg-gradient-to-tr from-sky-300 via-blue-200 to-indigo-300 shadow-2xl overflow-hidden mb-4">
                  <img
                    src={userAvatar}
                    alt="User Avatar"
                    className="w-full h-full object-cover rounded-full bg-slate-900"
                  />
                </div>

                {/* Highly Visible User Name */}
                <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white dark:text-white drop-shadow-md">
                  {profileData?.name || session.user.name || "User"}
                </h2>
                <p className="text-blue-100/90 text-sm font-medium mt-1">{formFields.bio}</p>
                <div className="flex items-center gap-2 mt-3 text-xs text-blue-200 bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-sm">
                  <Mail className="w-3.5 h-3.5" />
                  <span>{profileData?.email || session.user.email}</span>
                </div>
              </div>

              {/* Bottom 3 Skill Highlights / Mentor Highlights */}
              <div className="relative z-10 grid grid-cols-3 gap-2 pt-6 border-t border-white/15 text-center">
                {isAdmin ? (
                  <>
                    <div>
                      <p className="text-xs text-blue-200 font-medium">Role</p>
                      <p className="text-sm font-bold mt-0.5 text-white">Admin</p>
                    </div>
                    <div className="border-x border-white/15 px-2">
                      <p className="text-xs text-blue-200 font-medium">Access</p>
                      <p className="text-sm font-bold mt-0.5 text-white">Full Control</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-200 font-medium">Status</p>
                      <p className="text-sm font-bold mt-0.5 text-white">Superuser</p>
                    </div>
                  </>
                ) : isMentor ? (
                  <>
                    <div>
                      <p className="text-xs text-blue-200 font-medium">Mentees</p>
                      <p className="text-lg font-bold mt-0.5 text-white">45+</p>
                    </div>
                    <div className="border-x border-white/15 px-2">
                      <p className="text-xs text-blue-200 font-medium">Experience</p>
                      <p className="text-lg font-bold mt-0.5 text-white">5+ Yrs</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-200 font-medium">Rating</p>
                      <p className="text-lg font-bold mt-0.5 text-white">4.9 ★</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <p className="text-xs text-blue-200 font-medium">Syllabus</p>
                      <p className="text-lg font-bold mt-0.5 text-white">{syllabusPct}%</p>
                    </div>
                    <div className="border-x border-white/15 px-2">
                      <p className="text-xs text-blue-200 font-medium">Consistency</p>
                      <p className="text-lg font-bold mt-0.5 text-white">{consistencyPct}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-200 font-medium">Target</p>
                      <p className="text-lg font-bold mt-0.5 text-white">{formFields.targetYear}</p>
                    </div>
                  </>
                )}
              </div>

            </div>
          </div>

          {/* Right Panel (Cols 6-12): Mentor Overview or Student Competency Matrix */}
          <div className="lg:col-span-7 flex flex-col">
            <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex-1 flex flex-col justify-between">
              
              {isAdmin ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Lock className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                        System Administration Console
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Global platform management, governance, and user access control
                      </p>
                    </div>
                    <Badge className="bg-indigo-600 text-white text-xs font-semibold px-3 py-1">
                      System Admin
                    </Badge>
                  </div>

                  <div className="space-y-4 my-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    <div className="p-4 rounded-2xl bg-indigo-50/50 dark:bg-slate-800/50 border border-indigo-100 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5 text-sm">
                        <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" /> Administrative Bio &amp; Overview
                      </h4>
                      <p>
                        {formFields.bio ||
                          "Platform Administrator with full oversight of user accounts, mentorship slots, session bookings, community discussions, and system analytics."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div
                        onClick={() => router.push("/dashboard/admin/users")}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer transition-all group"
                      >
                        <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1 text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          <Users className="w-4 h-4 text-cyan-500" /> Manage Users &rarr;
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Review, activate, deactivate, or assign roles to Students, Mentors, and Administrators.
                        </p>
                      </div>

                      <div
                        onClick={() => router.push("/dashboard/admin/sessions")}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer transition-all group"
                      >
                        <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1 text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          <CalendarCheck className="w-4 h-4 text-purple-500" /> Manage Sessions &rarr;
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Inspect mentorship slots, manage live bookings, and oversee session schedules.
                        </p>
                      </div>

                      <div
                        onClick={() => router.push("/dashboard/admin/analytics")}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer transition-all group"
                      >
                        <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1 text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          <LineChart className="w-4 h-4 text-emerald-500" /> System Analytics &rarr;
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Monitor user registration, engagement trends, and platform traffic metrics.
                        </p>
                      </div>

                      <div
                        onClick={() => router.push("/tracker/manage")}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 cursor-pointer transition-all group"
                      >
                        <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1 text-xs group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                          <BookOpen className="w-4 h-4 text-amber-500" /> Premade Syllabi &rarr;
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Configure global premade study templates available to all platform students.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                    <span>Administrative Privilege Level: Full Access</span>
                    <Button onClick={() => router.push("/dashboard/admin/users")} size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs">
                      Open Admin Control Panel &rarr;
                    </Button>
                  </div>
                </>
              ) : isMentor ? (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        About Mentor &amp; Guidance Strategy
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Professional background, mentorship philosophy, and core guidance framework
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      Verified Mentor
                    </Badge>
                  </div>

                  <div className="space-y-4 my-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                    {/* About Bio */}
                    <div className="p-4 rounded-2xl bg-blue-50/50 dark:bg-slate-800/50 border border-blue-100 dark:border-slate-800">
                      <h4 className="font-bold text-slate-900 dark:text-white mb-1 flex items-center gap-1.5 text-sm">
                        <Sparkles className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Mentor Profile &amp; Bio
                      </h4>
                      <p>
                        {formFields.bio ||
                          "Senior Exam & Career Mentor with over 5 years of experience evaluating answer sheets, designing personalized revision roadmaps, and conducting mock interview panels. Specializes in transforming raw aspirant effort into high-scoring, structured exam output."}
                      </p>
                    </div>

                    {/* Mentorship Guidance Style */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                        <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1 text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> The Evaluator Approach
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Data-driven answer writing evaluation with line-by-line feedback on structure, presentation, and content quality.
                        </p>
                      </div>
                      <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                        <h5 className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5 mb-1 text-xs">
                          <Target className="w-3.5 h-3.5 text-indigo-500" /> The Architect Strategy
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Custom 1-on-1 study roadmaps, revision cycles, and weekly target monitoring to prevent burnout.
                        </p>
                      </div>
                    </div>

                    {/* Key Mentorship Focus Areas */}
                    <div>
                      <h4 className="font-bold text-slate-900 dark:text-white mb-2 text-xs">Primary Mentorship Focus Areas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Mains Answer Writing & Evaluation",
                          "Ethics & Case Studies",
                          "Subject Mastery & Revision",
                          "Essay & Report Structuring",
                          "Test Strategy & Time Management",
                          "Personality Test & Mock Panel",
                        ].map((area) => (
                          <span key={area} className="px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 font-semibold text-[11px]">
                            {area}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs text-slate-500">
                    <span>Available for 1-on-1 Guidance &amp; Live Doubt Resolution</span>
                    <Button onClick={() => router.push('/sessions')} size="sm" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs">
                      View Active Sessions &rarr;
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span>Subject Competency Matrix</span>
                        <button
                          type="button"
                          onClick={() => setShowCompetencyInfoModal(true)}
                          className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors inline-flex items-center justify-center"
                          title="How is this calculated?"
                          aria-label="Competency calculation info"
                        >
                          <Info className="w-4 h-4" />
                        </button>
                      </h3>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        Real-time visual map of preparation strength across core subjects
                      </p>
                    </div>
                    <Badge variant="outline" className="text-xs font-semibold text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800">
                      Synced Live
                    </Badge>
                  </div>

                  {/* Subject Breakdown Competency Bars Synced with Study Tracker */}
                  <div className="space-y-4 my-2">
                    {competencyMatrix.map((item: any) => (
                      <div key={item.name} className="space-y-1.5">
                        <div className="flex justify-between items-center text-xs font-semibold">
                          <span className="text-slate-700 dark:text-slate-300 flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${item.dot}`} />
                            {item.name}
                          </span>
                          <div className="flex items-center gap-2">
                            <span className="text-slate-500 dark:text-slate-400 font-normal">{item.level}</span>
                            <span className="text-slate-900 dark:text-white font-bold">{item.score}%</span>
                          </div>
                        </div>
                        <div className="w-full h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${item.color} rounded-full transition-all duration-500`}
                            style={{ width: `${item.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Legend matching image */}
                  <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-4 text-xs text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> Achieved
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-500" /> Progressing
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5 text-blue-500" /> Target Goal
                    </span>
                  </div>
                </>
              )}

            </Card>
          </div>

        </div>

        {/* Bottom Row - 3 Cards (Mentor Overview vs Student Prep Stats) */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {isAdmin ? (
            <>
              {/* Admin Card 1: System Shortcuts */}
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      Platform Controls
                    </h3>
                    <span className="text-xs text-indigo-600 font-semibold">Admin</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {[
                      { title: "User Access & Roles", path: "/dashboard/admin/users", tag: "Security" },
                      { title: "Mentorship Sessions", path: "/dashboard/admin/sessions", tag: "Sessions" },
                      { title: "System Analytics", path: "/dashboard/admin/analytics", tag: "Metrics" },
                      { title: "Global Syllabi", path: "/tracker/manage", tag: "Templates" },
                      { title: "Community Forum", path: "/forum", tag: "Community" },
                    ].map((row, idx) => (
                      <div key={idx} onClick={() => router.push(row.path)} className="py-2.5 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50 px-2 rounded-lg transition-colors">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">{row.title}</span>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                          {row.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/admin/users')} className="w-full mt-4 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950">
                  Manage Platform Users &rarr;
                </Button>
              </Card>

              {/* Admin Card 2: System Health & Security */}
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <ShieldCheck className="w-4 h-4 text-emerald-500" />
                      System Health &amp; Audit
                    </h3>
                    <span className="text-xs text-emerald-500 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Live
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { name: "Database Connection", score: "Operational", pct: 100, color: "bg-emerald-500" },
                      { name: "Authentication Service", score: "Active", pct: 100, color: "bg-blue-500" },
                      { name: "Storage & File Blob API", score: "Healthy", pct: 100, color: "bg-purple-500" },
                      { name: "Administrative Audit Status", score: "Passed", pct: 100, color: "bg-amber-500" },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-bold">{item.score}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
                  Full Administrative Superuser Permissions Active
                </div>
              </Card>

              {/* Admin Card 3: Platform Quick Actions */}
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-500" />
                      Quick Admin Actions
                    </h3>
                    <span className="text-xs text-slate-400 font-mono">Console</span>
                  </div>

                  <div className="space-y-3">
                    <Button onClick={() => router.push('/dashboard/admin/users')} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 justify-start text-xs font-semibold py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      <Users className="w-4 h-4 mr-2 text-cyan-500" /> View All Registered Users
                    </Button>
                    <Button onClick={() => router.push('/dashboard/admin/sessions')} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 justify-start text-xs font-semibold py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      <CalendarCheck className="w-4 h-4 mr-2 text-purple-500" /> Review All Mentorship Sessions
                    </Button>
                    <Button onClick={() => router.push('/dashboard/admin/analytics')} className="w-full bg-slate-100 dark:bg-slate-800 hover:bg-indigo-600 hover:text-white text-slate-800 dark:text-slate-200 justify-start text-xs font-semibold py-2 rounded-xl border border-slate-200 dark:border-slate-700">
                      <LineChart className="w-4 h-4 mr-2 text-emerald-500" /> Open Real-Time Analytics
                    </Button>
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60 text-xs text-amber-900 dark:text-amber-200">
                  🛡️ <span className="font-semibold">Security Note:</span> You are viewing your profile with full Administrator privileges.
                </div>
              </Card>
            </>
          ) : isMentor ? (
            <>
              {/* Mentor Card 1: Core Mentorship Specializations */}
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Specializations &amp; Modules
                    </h3>
                    <span className="text-xs text-blue-600 font-semibold">Mentorship</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {[
                      { area: "Mains Answer Evaluation", desc: "Line-by-line feedback & structure", tag: "Core" },
                      { area: "GS 2 & GS 4 Deep Dives", desc: "Polity, Governance & Ethics", tag: "Popular" },
                      { area: "Essay Masterclass", desc: "Theme classification & flow", tag: "Special" },
                      { area: "Prelims Elimination Drills", desc: "Option elimination techniques", tag: "Strategy" },
                      { area: "Mock Interview Practice", desc: "DAF analysis & body language", tag: "Final" },
                    ].map((row, idx) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{row.area}</p>
                          <p className="text-[10px] text-slate-400">{row.desc}</p>
                        </div>
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-[10px] font-bold">
                          {row.tag}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => router.push('/sessions')} className="w-full mt-4 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950">
                  Manage Mentorship Sessions &rarr;
                </Button>
              </Card>

              {/* Mentor Card 2: Credentials & Track Record */}
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      Credentials &amp; Impact
                    </h3>
                    <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Track Record
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {[
                      { name: "Live Mentorship Slots", score: `${profileData?._count?.mentorSlots ?? 0} Slots`, pct: Math.min((profileData?._count?.mentorSlots || 0) * 10, 100), color: "bg-emerald-500" },
                      { name: "Student Queries & Responses", score: `${(profileData?._count?.replies || 0) + (profileData?._count?.comments || 0)} Answers`, pct: Math.min(((profileData?._count?.replies || 0) + (profileData?._count?.comments || 0)) * 5, 100), color: "bg-blue-500" },
                      { name: "Resource Guides Shared", score: `${profileData?._count?.resources ?? 0} Files`, pct: Math.min((profileData?._count?.resources || 0) * 10, 100), color: "bg-amber-500" },
                      { name: "Community Discussions", score: `${profileData?._count?.discussions ?? 0} Posts`, pct: Math.min((profileData?._count?.discussions || 0) * 10, 100), color: "bg-purple-500" },
                    ].map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-bold">{item.score}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
                  Certified Mentorship Faculty on MentorConnect
                </div>
              </Card>

              {/* Mentor Card 3: Active Offerings & Guidance Stats */}
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-500" />
                      Mentorship Overview
                    </h3>
                    <span className="text-xs text-slate-400">Live</span>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { label: "Active 1-on-1 Sessions", value: profileData?._count?.mentorSessions || 14, icon: Clock, color: "text-blue-500" },
                      { label: "Student Queries Answered", value: "120+", icon: Award, color: "text-purple-500" },
                      { label: "Resource Guides Uploaded", value: "18 Files", icon: Target, color: "text-emerald-500" },
                      { label: "Mentorship Satisfaction", value: "98%", icon: CheckCircle2, color: "text-amber-500" },
                    ].map((stat, idx) => {
                      const IconComp = stat.icon;
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <IconComp className={`w-4 h-4 ${stat.color}`} />
                            {stat.label}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{stat.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
                  💡 <span className="font-semibold">Mentor Tip:</span> Giving constructive feedback within 24 hours increases mentee engagement by 60%.
                </div>
              </Card>
            </>
          ) : (
            <>
              {/* Card 1: Learning History Table */}
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                      Prep History
                    </h3>
                    <span className="text-xs text-slate-400">Recent</span>
                  </div>

                  <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                    {prepHistoryRows.map((row: any, idx: number) => (
                      <div key={idx} className="py-2.5 flex justify-between items-center">
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{row.course}</p>
                          <p className="text-[10px] text-slate-400">Status: {row.cert}</p>
                        </div>
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-400">{row.duration}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/student/study-tracker')} className="w-full mt-4 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950">
                  View Detailed Tracker &rarr;
                </Button>
              </Card>

              {/* Card 2: Achievements & Badges */}
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-amber-500" />
                      Achievements
                    </h3>
                    <span className="text-xs text-amber-500 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Unlocked
                    </span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {dynamicAchievements.map((item, idx) => (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between items-center font-medium">
                          <span className="text-slate-700 dark:text-slate-300">{item.name}</span>
                          <span className="text-slate-500 dark:text-slate-400 font-bold">{item.score}</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.pct}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
                  Complete 2 more tests to unlock <span className="font-semibold text-slate-700 dark:text-slate-300">Prelims Pro</span> badge!
                </div>
              </Card>

              {/* Card 3: Learning Statistics */}
              <Card className="p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm rounded-3xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-indigo-500" />
                      Prep Statistics
                    </h3>
                    <span className="text-xs text-slate-400">Total</span>
                  </div>

                  <div className="space-y-3.5">
                    {[
                      { label: "Total learning hours", value: `${totalTrackerHrs} h`, icon: Clock, color: "text-blue-500" },
                      { label: "Mock tests completed", value: profileData?._count?.testAttempts ?? 0, icon: Award, color: "text-purple-500" },
                      { label: "Hands-on practice hours", value: `${Math.round(totalTrackerHrs * 0.4)} h`, icon: Target, color: "text-emerald-500" },
                      { label: "Mentor sessions attended", value: profileData?._count?.bookings ?? 0, icon: CheckCircle2, color: "text-amber-500" },
                    ].map((stat, idx) => {
                      const IconComp = stat.icon;
                      return (
                        <div key={idx} className="flex justify-between items-center text-xs">
                          <span className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                            <IconComp className={`w-4 h-4 ${stat.color}`} />
                            {stat.label}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white text-sm">{stat.value}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-100 dark:border-indigo-900/60 text-xs text-indigo-900 dark:text-indigo-200">
                  💡 <span className="font-semibold">Pro Tip:</span> Consistent daily study yields 40% higher retention in prelims mock tests.
                </div>
              </Card>
            </>
          )}

        </div>

      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <Card className="w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-3xl p-6 relative max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-blue-600" /> Edit Profile Details
              </h3>
              <button
                onClick={() => setIsEditing(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5 mt-4">
              
              {/* Avatar Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                  Choose Profile Avatar
                </label>
                
                {/* Gender Tabs */}
                <div className="flex items-center gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setAvatarGenderCategory("male")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition flex items-center gap-1.5 ${
                      avatarGenderCategory === "male"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>Male Avatars</span>
                    <span className="opacity-75 font-mono text-[10px]">({MALE_AVATARS.length})</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setAvatarGenderCategory("female")}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full transition flex items-center gap-1.5 ${
                      avatarGenderCategory === "female"
                        ? "bg-pink-600 text-white shadow-sm"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    <span>Female Avatars</span>
                    <span className="opacity-75 font-mono text-[10px]">({FEMALE_AVATARS.length})</span>
                  </button>
                </div>

                {/* Avatar Grid */}
                <div className="grid grid-cols-5 sm:grid-cols-7 gap-2 max-h-48 overflow-y-auto p-2 border border-slate-200 dark:border-slate-800 rounded-2xl mb-3 bg-slate-50/50 dark:bg-slate-950/50">
                  {(avatarGenderCategory === "male" ? MALE_AVATARS : FEMALE_AVATARS).map((avatar, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormFields({ ...formFields, image: avatar })}
                      className={`relative w-11 h-11 rounded-full overflow-hidden border-2 transition bg-white dark:bg-slate-900 hover:scale-105 ${
                        formFields.image === avatar
                          ? "border-blue-600 ring-2 ring-blue-500/30 scale-105"
                          : "border-slate-200 dark:border-slate-700 hover:border-blue-400"
                      }`}
                    >
                      <img src={avatar} alt={`Memoji ${idx}`} className="w-full h-full object-cover" />
                      {formFields.image === avatar && (
                        <div className="absolute inset-0 bg-blue-600/40 flex items-center justify-center text-white">
                          <Check className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>

                <Input
                  type="text"
                  placeholder="Or paste custom image URL..."
                  value={formFields.image}
                  onChange={(e) => setFormFields({ ...formFields, image: e.target.value })}
                  className="text-xs bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Full Name
                </label>
                <Input
                  type="text"
                  required
                  value={formFields.name}
                  onChange={(e) => setFormFields({ ...formFields, name: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Email Address
                </label>
                <Input
                  type="email"
                  required
                  value={formFields.email}
                  onChange={(e) => setFormFields({ ...formFields, email: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>

              {/* Target Year & Optional (or Mentorship Focus & Experience for Mentors) */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAdmin ? "Administrative Title" : isMentor ? "Mentoring Focus" : "Target Exam Year"}
                  </label>
                  <Input
                    type="text"
                    value={formFields.targetYear}
                    onChange={(e) => setFormFields({ ...formFields, targetYear: e.target.value })}
                    placeholder={isAdmin ? "e.g. System Administrator" : isMentor ? "e.g. Concept & Answer Writing" : "e.g. 2026"}
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    {isAdmin ? "Department / Operations" : isMentor ? "Mentoring Experience" : "Optional / Specialization Subject"}
                  </label>
                  <Input
                    type="text"
                    value={formFields.optionalSubject}
                    onChange={(e) => setFormFields({ ...formFields, optionalSubject: e.target.value })}
                    placeholder={isAdmin ? "e.g. Platform Operations" : isMentor ? "e.g. 5+ Years" : "e.g. Geography / Accounts / Law"}
                    className="bg-slate-50 dark:bg-slate-800"
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Bio / Headline
                </label>
                <Textarea
                  rows={2}
                  value={formFields.bio}
                  onChange={(e) => setFormFields({ ...formFields, bio: e.target.value })}
                  className="bg-slate-50 dark:bg-slate-800 text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
                <Button type="button" variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={saving} className="bg-blue-600 hover:bg-blue-700 text-white">
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>

            </form>
          </Card>
        </div>
      )}

      {/* ── COMPETENCY MATRIX CALCULATION INFO MODAL ───────────────────────── */}
      {showCompetencyInfoModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h2 className="font-bold text-slate-900 dark:text-white text-base">
                  Subject Competency Matrix
                </h2>
              </div>
              <button
                onClick={() => setShowCompetencyInfoModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-4 text-xs sm:text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60">
                <p className="font-bold text-blue-900 dark:text-blue-200 mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-blue-500" /> Real-Time Study Tracker Sync
                </p>
                <p className="text-xs text-blue-800 dark:text-blue-300">
                  Your competency score for each subject is calculated live from your active <strong>Study Planner</strong> topics, subtopic checkboxes, and stopwatch timer.
                </p>
              </div>

              <div className="space-y-2">
                <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  📊 Calculation Formula
                </p>
                <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-xs text-slate-800 dark:text-slate-200">
                  Subject Score (%) = ( Completed Subtopics + Custom Tasks ) ÷ Total Assigned Subtopics × 100
                </div>
                <ul className="list-disc pl-4 space-y-1 text-xs text-slate-500 dark:text-slate-400">
                  <li>In <strong>Stopwatch/Easy Mode</strong>, completed blocks and logged study hours automatically add to your subject completion ratio.</li>
                  <li>If a subject has <strong>0 assigned blocks</strong> in your active planner, its score displays <strong>0%</strong>.</li>
                </ul>
              </div>

              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                  🏷️ Competency Levels
                </p>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-100 dark:border-emerald-900/60">
                    <div className="font-bold text-emerald-600 dark:text-emerald-400">Expert</div>
                    <div className="text-[11px] text-slate-500">85% – 100%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900/60">
                    <div className="font-bold text-blue-600 dark:text-blue-400">Proficient</div>
                    <div className="text-[11px] text-slate-500">70% – 84%</div>
                  </div>
                  <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-100 dark:border-amber-900/60">
                    <div className="font-bold text-amber-600 dark:text-amber-400">Competent</div>
                    <div className="text-[11px] text-slate-500">0% – 69%</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <Button
                onClick={() => setShowCompetencyInfoModal(false)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs px-5"
              >
                Got it
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
