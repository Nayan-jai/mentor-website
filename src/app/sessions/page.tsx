"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BookOpen } from "lucide-react";

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

export default function SessionsPage() {
  const { data: session } = useSession();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingStatus, setBookingStatus] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    try {
      const response = await fetch("/api/sessions");
      const data = await response.json();
      console.log("Fetched sessions data:", data);
      const sessionsArray = Array.isArray(data) ? data : data.sessions || [];
      // Map backend fields to frontend fields
      const mappedSessions = sessionsArray.map((s: any) => ({
        id: s.id,
        title: s.title,
        description: s.description,
        date: s.startTime ? new Date(s.startTime).toLocaleDateString() : '',
        time: s.startTime && s.endTime
          ? `${new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - ${new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : '',
        mentorName: s.mentor?.name || '',
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

  const handleBookSession = async (sessionId: string, startTime: string, endTime: string) => {
    if (!session?.user) {
      alert("Please log in to book a session");
      return;
    }

    setBookingStatus(prev => ({ ...prev, [sessionId]: "booking" }));

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
        setBookingStatus(prev => ({ ...prev, [sessionId]: "success" }));
        // Refresh sessions after booking
        fetchSessions();
      } else {
        let data;
        try {
          data = await response.json();
        } catch (e) {
          // If response is empty or not JSON
          console.error("Failed to parse error response as JSON", e);
          setBookingStatus(prev => ({ ...prev, [sessionId]: "error" }));
          return;
        }
        if (data && data.message === "You have already booked this session.") {
          setBookingStatus(prev => ({ ...prev, [sessionId]: "already-booked" }));
        } else {
          setBookingStatus(prev => ({ ...prev, [sessionId]: "error" }));
        }
      }
    } catch (error) {
      console.error("Error booking session:", error);
      setBookingStatus(prev => ({ ...prev, [sessionId]: "error" }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading sessions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300 pt-20 pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        
        {/* Top Header Card */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
              Mentorship Hub
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Live &amp; Scheduled Sessions
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
            {session?.user?.role === "MENTOR" && (
              <Link
                href="/sessions/create"
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 text-sm"
              >
                <span>+ Create Session</span>
              </Link>
            )}
          </div>
        </div>

        {/* Sessions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sessions.length === 0 ? (
            <div className="col-span-full text-center py-16 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              No sessions available at the moment.
            </div>
          ) : (
            sessions.map((sessionItem) => {
              const isBooked = sessionItem.bookings?.some(
                (b) => b.menteeId === session?.user?.id
              );
              const isMentor = session?.user?.role === "MENTOR" && sessionItem.mentorId === session?.user?.id;
              const now = new Date();
              const sessionEnded = new Date(sessionItem.endTime) < now;
              const initials = (sessionItem.mentorName || "Mentor").slice(0, 2).toUpperCase();

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
                            onClick={() => handleBookSession(sessionItem.id, sessionItem.startTime, sessionItem.endTime)}
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
      </div>
    </div>
  );
} 