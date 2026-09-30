"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  BookOpen,
  Video,
  Calendar,
  Play,
  Plus,
  Trash2,
  Edit2,
  Search,
  Filter,
  X,
  ExternalLink,
  Sparkles,
  Clock,
  User as UserIcon,
  CheckCircle2,
  AlertCircle,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  Share2,
  Check,
} from "lucide-react";

interface Session {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  mentorName: string;
  mentorId?: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  booking: {
    menteeId?: string;
  } | null;
  meetingLink?: string;
  bookings?: {
    menteeId?: string;
  }[];
}

interface RecordedSession {
  id: string;
  title: string;
  description: string | null;
  youtubeUrl: string;
  videoId: string;
  category: string | null;
  mentorName: string | null;
  duration: string | null;
  uploadedById: string | null;
  uploadedBy?: {
    id: string;
    name: string | null;
    email: string;
    role: string;
  };
  createdAt: string;
}

const CATEGORIES = [
  "All",
  "GS Paper 1",
  "GS Paper 2",
  "GS Paper 3",
  "GS Paper 4 / Ethics",
  "Current Affairs",
  "Optional Subject",
  "Essay Writing",
  "CSAT",
  "Answer Writing & Strategy",
];

function extractYouTubeId(url: string): string | null {
  if (!url) return null;
  const regExp =
    /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

function SessionsContent() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<"live" | "recorded">(
    searchParams?.get("tab") === "recorded" ? "recorded" : "live"
  );

  // Live Sessions State
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<{ [key: string]: string }>({});

  // Recorded Sessions State
  const [recordedSessions, setRecordedSessions] = useState<RecordedSession[]>([]);
  const [loadingRecorded, setLoadingRecorded] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeModalVideo, setActiveModalVideo] = useState<RecordedSession | null>(null);
  const [focusMode, setFocusMode] = useState<"speaker" | "fit">("fit");
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Admin Modal Form State
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingSession, setEditingSession] = useState<RecordedSession | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    youtubeUrl: "",
    category: "GS Paper 1",
    mentorName: "",
    duration: "",
    description: "",
  });
  const [formSubmitting, setFormSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const isAdminOrMentor =
    session?.user?.role === "ADMIN" || session?.user?.role === "MENTOR";

  useEffect(() => {
    const lectureParam = searchParams?.get("lecture") || searchParams?.get("v");
    if (searchParams?.get("tab") === "recorded" || lectureParam) {
      setActiveTab("recorded");
    }
  }, [searchParams]);

  useEffect(() => {
    fetchSessions();
    fetchRecordedSessions();
  }, []);

  // Automatically open shared lecture if lecture ID is provided in the URL
  useEffect(() => {
    const lectureId = searchParams?.get("lecture") || searchParams?.get("v");
    if (lectureId && recordedSessions.length > 0) {
      const target = recordedSessions.find((s) => s.id === lectureId);
      if (target) {
        setFocusMode("fit");
        setActiveModalVideo(target);
      }
    }
  }, [searchParams, recordedSessions]);

  const videoModalRef = useRef<HTMLDivElement>(null);

  // Lock screen to landscape on small touch devices (mobile/tablet)
  // Chrome requires fullscreen BEFORE orientation.lock will work
  const handleOpenVideo = (video: RecordedSession) => {
    setFocusMode("fit");
    setActiveModalVideo(video);

    const isSmallTouch =
      typeof window !== "undefined" &&
      window.innerWidth <= 1024 &&
      navigator.maxTouchPoints > 0;

    if (!isSmallTouch) return;

    // Wait for React to render the modal, then go fullscreen + lock landscape
    setTimeout(() => {
      const el = videoModalRef.current ?? document.documentElement;
      const fsReq =
        el.requestFullscreen?.() ??
        (el as any).webkitRequestFullscreen?.() ??
        Promise.resolve();

      Promise.resolve(fsReq)
        .then(() => screen.orientation?.lock?.("landscape"))
        .catch(() => {/* denied or unsupported — fail silently */});
    }, 50);
  };

  const handleCloseVideo = () => {
    setActiveModalVideo(null);
    screen.orientation?.unlock?.();
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && activeModalVideo) {
        handleCloseVideo();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeModalVideo]);

  const handleShareLecture = (e: React.MouseEvent, video: RecordedSession) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/sessions/?tab=recorded&lecture=${video.id}`;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(shareUrl);
    } else {
      const textArea = document.createElement("textarea");
      textArea.value = shareUrl;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand("copy");
      } catch (err) {
        console.error("Fallback: unable to copy link", err);
      }
      document.body.removeChild(textArea);
    }
    setCopiedId(video.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      const sessionsArray = Array.isArray(data) ? data : data.sessions || [];
      const mappedSessions = sessionsArray.map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        date: s.startTime ? new Date(s.startTime).toLocaleDateString() : "",
        time:
          s.startTime && s.endTime
            ? `${new Date(s.startTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })} - ${new Date(s.endTime).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}`
            : "",
        mentorName: s.mentor?.name || "",
        mentorId: s.mentorId,
        startTime: s.startTime,
        endTime: s.endTime,
        isAvailable: s.isAvailable,
        booking: s.booking,
        meetingLink: s.meetingLink,
        bookings: s.bookings,
      }));
      setSessions(mappedSessions);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRecordedSessions = async () => {
    setLoadingRecorded(true);
    try {
      const res = await fetch("/api/recorded-sessions");
      if (res.ok) {
        const data = await res.json();
        setRecordedSessions(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error("Error fetching recorded sessions:", error);
    } finally {
      setLoadingRecorded(false);
    }
  };

  const handleBookSession = async (
    sessionId: string,
    startTime: string,
    endTime: string
  ) => {
    if (!session?.user) {
      alert("Please log in to book a session");
      return;
    }

    setBookingStatus((prev) => ({ ...prev, [sessionId]: "booking" }));

    try {
      const start = new Date(startTime);
      const end = new Date(endTime);
      const date = start.toISOString().split("T")[0];
      const time = start.toTimeString().slice(0, 5);
      const duration = Math.round((end.getTime() - start.getTime()) / 60000);

      const response = await fetch(`/api/sessions/${sessionId}/book`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time, duration }),
      });

      if (response.ok) {
        setBookingStatus((prev) => ({ ...prev, [sessionId]: "success" }));
        fetchSessions();
      } else {
        let data;
        try {
          data = await response.json();
        } catch (e) {
          setBookingStatus((prev) => ({ ...prev, [sessionId]: "error" }));
          return;
        }
        if (data && data.message === "You have already booked this session.") {
          setBookingStatus((prev) => ({
            ...prev,
            [sessionId]: "already-booked",
          }));
        } else {
          setBookingStatus((prev) => ({ ...prev, [sessionId]: "error" }));
        }
      }
    } catch (error) {
      console.error("Error booking session:", error);
      setBookingStatus((prev) => ({ ...prev, [sessionId]: "error" }));
    }
  };

  // Open create form
  const handleOpenCreateForm = () => {
    setEditingSession(null);
    setFormData({
      title: "",
      youtubeUrl: "",
      category: "GS Paper 1",
      mentorName: session?.user?.name || "Mentor",
      duration: "",
      description: "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Open edit form
  const handleOpenEditForm = (item: RecordedSession) => {
    setEditingSession(item);
    setFormData({
      title: item.title || "",
      youtubeUrl: item.youtubeUrl || "",
      category: item.category || "GS Paper 1",
      mentorName: item.mentorName || "",
      duration: item.duration || "",
      description: item.description || "",
    });
    setFormError(null);
    setIsFormOpen(true);
  };

  // Submit create or edit form
  const handleSaveRecordedSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      setFormError("Title is required");
      return;
    }
    if (!formData.youtubeUrl.trim()) {
      setFormError("YouTube URL is required");
      return;
    }
    const extractedId = extractYouTubeId(formData.youtubeUrl);
    if (!extractedId) {
      setFormError("Please enter a valid YouTube link (e.g., https://youtu.be/... or youtube.com/watch?v=...)");
      return;
    }

    setFormSubmitting(true);
    setFormError(null);

    try {
      if (editingSession) {
        // Edit existing
        const res = await fetch(`/api/recorded-sessions/${editingSession.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to update recorded session");
        }
      } else {
        // Create new
        const res = await fetch("/api/recorded-sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
        if (!res.ok) {
          const errData = await res.json();
          throw new Error(errData.message || "Failed to create recorded session");
        }
      }

      setIsFormOpen(false);
      fetchRecordedSessions();
    } catch (err: any) {
      setFormError(err.message || "An error occurred");
    } finally {
      setFormSubmitting(false);
    }
  };

  // Delete recorded session
  const handleDeleteRecordedSession = async (id: string) => {
    try {
      const res = await fetch(`/api/recorded-sessions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setRecordedSessions((prev) => prev.filter((item) => item.id !== id));
        setDeleteConfirmId(null);
      } else {
        const data = await res.json();
        alert(data.message || "Failed to delete session");
      }
    } catch (error) {
      console.error("Error deleting session:", error);
      alert("Error deleting session");
    }
  };

  // Filtered recorded sessions
  const filteredRecordedSessions = recordedSessions.filter((s) => {
    const matchesCat =
      selectedCategory === "All" ||
      s.category?.toLowerCase() === selectedCategory.toLowerCase();
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      s.title?.toLowerCase().includes(query) ||
      s.description?.toLowerCase().includes(query) ||
      s.mentorName?.toLowerCase().includes(query) ||
      s.category?.toLowerCase().includes(query);
    return matchesCat && matchesSearch;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">Loading Sessions Hub...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Mentorship &amp; Video Learning Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Mentorship Sessions &amp; Lectures
            </h1>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto flex-wrap">
            {session && (
              <Link
                href="/test"
                className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white px-4 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <BookOpen className="w-4 h-4" />
                <span>Test Series &amp; OMR</span>
              </Link>
            )}
            {activeTab === "live" && session?.user?.role === "MENTOR" && (
              <Link
                href="/sessions/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Create Live Session</span>
              </Link>
            )}
            {activeTab === "recorded" && isAdminOrMentor && (
              <button
                onClick={handleOpenCreateForm}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Recorded Lecture</span>
              </button>
            )}
          </div>
        </div>

        {/* Tab Navigation Buttons */}
        <div className="flex items-center gap-2 p-1.5 bg-slate-200/80 dark:bg-slate-900/90 rounded-2xl w-fit border border-slate-300/60 dark:border-slate-800 shadow-inner">
          <button
            onClick={() => setActiveTab("live")}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === "live"
                ? "bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm border border-slate-200 dark:border-slate-700/80"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Calendar className="w-4 h-4" />
            <span>Live &amp; Scheduled Sessions</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 font-bold">
              {sessions.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("recorded")}
            className={`flex items-center gap-2.5 px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 ${
              activeTab === "recorded"
                ? "bg-white dark:bg-slate-800 text-red-600 dark:text-red-400 shadow-sm border border-slate-200 dark:border-slate-700/80"
                : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
            }`}
          >
            <Video className="w-4 h-4" />
            <span>Recorded Lectures &amp; Sessions</span>
            <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300 font-bold">
              {recordedSessions.length}
            </span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: LIVE & SCHEDULED SESSIONS */}
        {/* ========================================================= */}
        {activeTab === "live" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.length === 0 ? (
              <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                No live or scheduled sessions available at the moment.
              </div>
            ) : (
              sessions.map((sessionItem) => {
                const isBooked = sessionItem.bookings?.some(
                  (b) => b.menteeId === session?.user?.id
                );
                const isMentor =
                  session?.user?.role === "MENTOR" &&
                  sessionItem.mentorId === session?.user?.id;
                const now = new Date();
                const sessionEnded = new Date(sessionItem.endTime) < now;
                const initials = (sessionItem.mentorName || "Mentor")
                  .slice(0, 2)
                  .toUpperCase();

                return (
                  <div
                    key={sessionItem.id}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-sm hover:shadow-xl hover:border-blue-500/40 dark:hover:border-blue-500/40 transition-all duration-300 flex flex-col justify-between border-l-4 border-l-blue-500 dark:border-l-blue-400 group"
                  >
                    <div>
                      {/* Header: Mentor Avatar & Title */}
                      <div className="flex items-start gap-3.5 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-base flex items-center justify-center shadow-md shrink-0">
                          {initials}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h2 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                            {sessionItem.title}
                          </h2>
                          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5 leading-relaxed">
                            {sessionItem.description}
                          </p>
                        </div>
                      </div>

                      {/* Information Pills */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-100 dark:border-blue-900/50 text-xs font-semibold">
                          📅 {sessionItem.date}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
                          ⏰ {sessionItem.time}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-900/50 text-xs font-semibold">
                          👨‍🏫 {sessionItem.mentorName}
                        </span>
                      </div>

                      {/* Status Badges */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {!isBooked ? (
                          <span className="bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            Available
                          </span>
                        ) : (
                          <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            Booked
                          </span>
                        )}
                        {sessionEnded && (
                          <span className="bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/30 px-2.5 py-0.5 rounded-full text-[11px] font-bold">
                            Completed
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Section */}
                    <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                      {session?.user?.role === "STUDENT" && (
                        <>
                          {!isBooked ? (
                            <button
                              onClick={() =>
                                handleBookSession(
                                  sessionItem.id,
                                  sessionItem.startTime,
                                  sessionItem.endTime
                                )
                              }
                              disabled={bookingStatus[sessionItem.id] === "booking"}
                              className={`w-full py-2.5 rounded-xl font-semibold text-xs transition-all ${
                                bookingStatus[sessionItem.id] === "success"
                                  ? "bg-emerald-600 text-white"
                                  : bookingStatus[sessionItem.id] === "error"
                                  ? "bg-red-600 text-white"
                                  : "bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg"
                              } disabled:opacity-50`}
                            >
                              {bookingStatus[sessionItem.id] === "booking"
                                ? "Booking..."
                                : bookingStatus[sessionItem.id] === "success"
                                ? "✓ Booked Successfully!"
                                : bookingStatus[sessionItem.id] === "already-booked"
                                ? "Already Booked"
                                : bookingStatus[sessionItem.id] === "error"
                                ? "Booking Failed"
                                : "Book Session"}
                            </button>
                          ) : (
                            <div className="w-full py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-center font-bold text-xs">
                              ✓ Session Booked
                            </div>
                          )}
                        </>
                      )}

                      {isMentor && (
                        <Link
                          href={`/sessions/${sessionItem.id}/edit`}
                          className="w-full inline-flex items-center justify-center py-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 font-semibold text-xs transition-all"
                        >
                          ✏️ Edit Session Details
                        </Link>
                      )}

                      {sessionItem.meetingLink && (isMentor || isBooked) && (
                        <a
                          href={sessionItem.meetingLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full inline-flex items-center justify-center py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all"
                        >
                          🚀 Join Virtual Meeting
                        </a>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: RECORDED LECTURES & SESSIONS */}
        {/* ========================================================= */}
        {activeTab === "recorded" && (
          <div className="space-y-6">
            {/* Search and Category Filters */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recorded lectures by title, topic, or mentor..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 transition-all placeholder:text-slate-400"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Admin Quick Add Button */}
                {isAdminOrMentor && (
                  <button
                    onClick={handleOpenCreateForm}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all shrink-0"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Embed YouTube Session</span>
                  </button>
                )}
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 scrollbar-thin">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                      selectedCategory === cat
                        ? "bg-red-600 text-white shadow-sm font-bold"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Video Cards Grid */}
            {loadingRecorded ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500">
                Loading recorded lectures...
              </div>
            ) : filteredRecordedSessions.length === 0 ? (
              <div className="text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 space-y-3">
                <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto text-2xl">
                  🎬
                </div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">
                  No recorded lectures found
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                  {searchQuery || selectedCategory !== "All"
                    ? "Try adjusting your search query or subject filters."
                    : "No recorded lectures uploaded yet. Mentors and Admins can add YouTube lecture links."}
                </p>
                {isAdminOrMentor && (
                  <button
                    onClick={handleOpenCreateForm}
                    className="mt-2 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add First Video</span>
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredRecordedSessions.map((video) => {
                  const canManage =
                    session?.user?.role === "ADMIN" ||
                    (session?.user?.role === "MENTOR" &&
                      video.uploadedById === session?.user?.id);

                  return (
                    <div
                      key={video.id}
                      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
                    >
                      {/* Top Media Container: Lecture Thumbnail with Play Overlay */}
                      <div
                        onClick={() => handleOpenVideo(video)}
                        className="relative aspect-video w-full bg-slate-950 overflow-hidden cursor-pointer group/thumb"
                      >
                        <img
                          src={`https://img.youtube.com/vi/${video.videoId}/hqdefault.jpg`}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform duration-500"
                          loading="lazy"
                        />
                        {/* Dark Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-center justify-center">
                          <div className="w-14 h-14 rounded-2xl bg-red-600/90 text-white flex items-center justify-center shadow-xl group-hover/thumb:scale-110 group-hover/thumb:bg-red-600 transition-all duration-300">
                            <Play className="w-6 h-6 fill-white ml-0.5" />
                          </div>
                        </div>

                        {/* Duration Pill */}
                        {video.duration && (
                          <div className="absolute bottom-2.5 right-2.5 bg-black/80 backdrop-blur-sm text-white px-2 py-0.5 rounded-md text-[11px] font-bold flex items-center gap-1 shadow">
                            <Clock className="w-3 h-3 text-red-400" />
                            <span>{video.duration}</span>
                          </div>
                        )}

                        {/* Category Badge */}
                        {video.category && (
                          <div className="absolute top-2.5 left-2.5 bg-red-600/90 backdrop-blur-sm text-white px-2.5 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wide shadow">
                            {video.category}
                          </div>
                        )}
                      </div>

                      {/* Content Info */}
                      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 font-medium">
                              <UserIcon className="w-3.5 h-3.5 text-blue-500" />
                              <span>{video.mentorName || "Mentor"}</span>
                            </span>
                            <span>
                              {new Date(video.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <h3
                            className="text-base font-bold text-slate-900 dark:text-white line-clamp-2 leading-snug group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors cursor-pointer"
                            onClick={() => setActiveModalVideo(video)}
                          >
                            {video.title}
                          </h3>

                          {video.description && (
                            <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 leading-relaxed">
                              {video.description}
                            </p>
                          )}
                        </div>

                        {/* Bottom Actions Bar */}
                        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setFocusMode("fit");
                                setActiveModalVideo(video);
                              }}
                              className="px-3.5 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-colors border border-red-200/60 dark:border-red-800/40"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              <span>Watch Lecture</span>
                            </button>

                            <button
                              type="button"
                              onClick={(e) => handleShareLecture(e, video)}
                              className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-xs font-medium flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-slate-700/80"
                              title="Share Lecture Link"
                            >
                              {copiedId === video.id ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-500" />
                                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Share2 className="w-3.5 h-3.5 text-slate-500" />
                                  <span>Share</span>
                                </>
                              )}
                            </button>
                          </div>

                          {/* Admin Controls */}
                          {canManage && (
                            <div className="flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditForm(video)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                                title="Edit Video Details"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(video.id)}
                                className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                                title="Delete Video"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>

      {/* ========================================================= */}
      {/* DIRECT FULLSCREEN VIDEO PLAYER POPUP */}
      {/* ========================================================= */}
      {activeModalVideo && (
        <div ref={videoModalRef} className="fixed inset-0 z-50 bg-black flex flex-col w-screen h-screen animate-in fade-in duration-200">
          {/* Top Fullscreen Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-neutral-800 text-white shrink-0 bg-neutral-950/95 backdrop-blur-md z-20">
            <div className="flex items-center gap-3 min-w-0 pr-4">
              <span className="px-2.5 py-0.5 rounded-md bg-red-600 text-white text-[11px] font-bold shrink-0 shadow-sm">
                {activeModalVideo.category || "Recorded Lecture"}
              </span>
              {activeModalVideo.mentorName && (
                <span className="text-xs text-neutral-400 font-medium truncate shrink-0">
                  • {activeModalVideo.mentorName}
                </span>
              )}
              <span className="text-xs text-neutral-200 font-semibold truncate hidden sm:inline">
                | {activeModalVideo.title}
              </span>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={(e) => handleShareLecture(e, activeModalVideo)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold border border-neutral-800 transition-all shadow-sm"
                title="Copy shareable link for this lecture"
              >
                {copiedId === activeModalVideo.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Link Copied!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-slate-300" />
                    <span className="hidden sm:inline">Share Link</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() =>
                  setFocusMode((prev) => (prev === "speaker" ? "fit" : "speaker"))
                }
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-neutral-200 hover:text-white text-xs font-semibold border border-neutral-800 transition-all shadow-sm"
                title={
                  focusMode === "speaker"
                    ? "Show full video with side participants"
                    : "Focus zoom on speaker (hides side participant tiles and bottom bar)"
                }
              >
                {focusMode === "speaker" ? (
                  <>
                    <ZoomOut className="w-3.5 h-3.5 text-blue-400" />
                    <span>Show Full View</span>
                  </>
                ) : (
                  <>
                    <ZoomIn className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Focus Speaker</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleCloseVideo}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md transition-all"
                title="Close Full Screen (Esc)"
              >
                <X className="w-4 h-4" />
                <span>Close</span>
              </button>
            </div>
          </div>

          {/* Full Screen YouTube Video Player (Fills 100% of the screen) */}
          <div className="flex-1 w-full h-full min-h-0 bg-black flex items-center justify-center relative overflow-hidden">
            <iframe
              src={`https://www.youtube-nocookie.com/embed/${activeModalVideo.videoId}?autoplay=1&rel=0&modestbranding=1&iv_load_policy=3&playsinline=1`}
              title={activeModalVideo.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; web-share; fullscreen"
              allowFullScreen
              className={`w-full h-full border-0 transition-transform duration-300 ${
                focusMode === "speaker"
                  ? "scale-[1.44] origin-[34%_47%]"
                  : "scale-100 origin-center"
              }`}
            />
            {/* Hide and disable top-left YouTube channel popup and title */}
            <div
              className="absolute top-0 left-0 w-44 sm:w-56 h-14 sm:h-16 bg-black z-30 pointer-events-auto select-none"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            />
            {/* Hide and disable bottom-left YouTube copy URL button */}
            <div
              className="absolute bottom-0 left-0 w-16 sm:w-20 h-10 sm:h-12 bg-black z-30 pointer-events-auto select-none"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            />
            {/* Hide and disable bottom-right YouTube logo and redirect click */}
            <div
              className="absolute bottom-0 right-0 w-52 sm:w-64 h-12 sm:h-14 bg-black z-30 pointer-events-auto select-none"
              onClick={(e) => {
                e.stopPropagation();
                e.preventDefault();
              }}
            />
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* ADMIN ADD / EDIT RECORDED LECTURE MODAL */}
      {/* ========================================================= */}
      {isFormOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl w-full max-w-lg max-h-[88vh] flex flex-col shadow-2xl overflow-hidden my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900 z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center shrink-0">
                  <Video className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white truncate">
                  {editingSession ? "Edit Recorded Lecture" : "Add YouTube Lecture"}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsFormOpen(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form with min-h-0 and internal overflow-y-auto */}
            <form onSubmit={handleSaveRecordedSession} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0 overscroll-contain">
                {formError && (
                  <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800/60 text-red-700 dark:text-red-300 text-xs flex items-center gap-2 shrink-0">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{formError}</span>
                  </div>
                )}

                {/* YouTube Link */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    YouTube Video Link <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.youtubeUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, youtubeUrl: e.target.value })
                    }
                    placeholder="https://www.youtube.com/watch?v=... or https://youtu.be/..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-400 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Live Preview of YouTube Thumbnail */}
                {extractYouTubeId(formData.youtubeUrl) && (
                  <div className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black shrink-0">
                    <img
                      src={`https://img.youtube.com/vi/${extractYouTubeId(formData.youtubeUrl)}/hqdefault.jpg`}
                      alt="YouTube Preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-emerald-600 text-white px-2 py-0.5 rounded text-[10px] font-bold flex items-center gap-1 shadow-md">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>Valid YouTube ID</span>
                    </div>
                  </div>
                )}

                {/* Lecture Title */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Lecture Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g. Modern Indian History - Freedom Movement"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-400 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Category & Duration Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Subject / Category
                    </label>
                    <select
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value })
                      }
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 text-slate-900 dark:text-white"
                    >
                      {CATEGORIES.filter((c) => c !== "All").map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Duration (approx)
                    </label>
                    <input
                      type="text"
                      value={formData.duration}
                      onChange={(e) =>
                        setFormData({ ...formData, duration: e.target.value })
                      }
                      placeholder="e.g. 1h 45m"
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-400 text-slate-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Mentor Name */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Mentor / Educator Name
                  </label>
                  <input
                    type="text"
                    value={formData.mentorName}
                    onChange={(e) =>
                      setFormData({ ...formData, mentorName: e.target.value })
                    }
                    placeholder="e.g. Dr. Aryan Sharma (IAS)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-400 text-slate-900 dark:text-white"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Description / Key Takeaways
                  </label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Topics covered, syllabus pointers, recommended readings..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 placeholder:text-slate-400 text-slate-900 dark:text-white resize-none"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex items-center justify-end gap-3 px-5 sm:px-6 py-3.5 sm:py-4 border-t border-slate-100 dark:border-slate-800 shrink-0 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-sm z-10">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {formSubmitting
                    ? "Saving..."
                    : editingSession
                    ? "Update Lecture"
                    : "Embed Lecture"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DELETE CONFIRMATION MODAL */}
      {/* ========================================================= */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-100 dark:bg-red-950/60 text-red-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Delete Recorded Lecture?
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                This will remove the embedded video from the recorded sessions library.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteRecordedSession(deleteConfirmId)}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow transition-all"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100">
          <div className="flex flex-col items-center gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-sm font-semibold text-slate-600 dark:text-slate-400">
              Loading Sessions...
            </div>
          </div>
        </div>
      }
    >
      <SessionsContent />
    </Suspense>
  );
}