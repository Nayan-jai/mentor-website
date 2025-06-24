"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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
        const data = await response.json();
        if (data.message === "You have already booked this session.") {
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
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold">Available Sessions</h1>
        {session?.user?.role === "MENTOR" && (
          <Link
            href="/sessions/create"
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Create Session
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No sessions available
          </div>
        ) : (
          sessions.map((sessionItem) => {
            const isBooked = sessionItem.bookings?.some(
              (b) => b.menteeId === session?.user?.id
            );
            const isMentor = session?.user?.role === "MENTOR" && sessionItem.mentorId === session?.user?.id;
            const now = new Date();
            const sessionEnded = new Date(sessionItem.endTime) < now;
            return (
              <div key={sessionItem.id} className="w-full h-full p-4 sm:p-6 rounded-xl hover:shadow-xl transition-shadow duration-200 border-l-4 border-blue-400 bg-white flex flex-col">
                <div className="flex items-center gap-3 mb-2">
                  <Avatar className="w-10 h-10">
                    <AvatarFallback>{sessionItem.mentorName?.[0] || "M"}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <span className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{sessionItem.title}</span>
                    <div className="text-gray-600 text-sm truncate">{sessionItem.description}</div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-2 text-xs text-gray-500">
                  <Badge variant="secondary" className="bg-blue-100 text-blue-800 whitespace-nowrap">{sessionItem.date}</Badge>
                  <Badge variant="secondary" className="bg-gray-100 text-gray-700 whitespace-nowrap">{sessionItem.time}</Badge>
                  <Badge variant="secondary" className="bg-green-100 text-green-800 whitespace-nowrap">Mentor: {sessionItem.mentorName}</Badge>
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {!isBooked ? (
                    <Badge className="bg-blue-100 text-blue-800">Available</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700">Booked</Badge>
                  )}
                  {sessionEnded && (
                    <Badge className="bg-gray-300 text-gray-700">Completed</Badge>
                  )}
                </div>
                <>
                  {session?.user?.role === "STUDENT" && (
                    <>
                      {!isBooked ? (
                        <button
                          onClick={() => handleBookSession(sessionItem.id, sessionItem.startTime, sessionItem.endTime)}
                          disabled={bookingStatus[sessionItem.id] === "booking"}
                          className={`mt-2 w-full py-2 rounded ${
                            bookingStatus[sessionItem.id] === "success"
                              ? "bg-green-500 text-white"
                              : bookingStatus[sessionItem.id] === "error"
                              ? "bg-red-500 text-white"
                              : "bg-blue-500 text-white hover:bg-blue-600"
                          } disabled:opacity-50`}
                        >
                          {bookingStatus[sessionItem.id] === "booking"
                            ? "Booking..."
                            : bookingStatus[sessionItem.id] === "success"
                            ? "Booked Successfully!"
                            : bookingStatus[sessionItem.id] === "already-booked"
                            ? "You have already booked this session."
                            : bookingStatus[sessionItem.id] === "error"
                            ? "Booking Failed"
                            : "Book Session"}
                        </button>
                      ) : (
                        <div className="mt-2 w-full py-2 rounded bg-green-100 text-green-700 text-center font-semibold">
                          Booked
                        </div>
                      )}
                    </>
                  )}
                  {isMentor && (
                    <Link
                      href={`/sessions/${sessionItem.id}/edit`}
                      className="mt-2 w-full inline-block text-center py-2 rounded bg-yellow-500 text-white hover:bg-yellow-600"
                    >
                      Edit Session
                    </Link>
                  )}
                  {/* Show meeting link if present and user is mentor or student who booked */}
                  {sessionItem.meetingLink && (
                    (isMentor || isBooked)
                  ) && (
                    <a
                      href={sessionItem.meetingLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 w-full inline-block text-center py-2 rounded bg-green-500 text-white hover:bg-green-600 font-semibold"
                    >
                      Join Meeting
                    </a>
                  )}
                </>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
} 