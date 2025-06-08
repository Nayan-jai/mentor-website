"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

interface Session {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  mentorName: string;
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
      setSessions(data);
    } catch (error) {
      console.error("Error fetching sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async (sessionId: string) => {
    if (!session?.user) {
      alert("Please log in to book a session");
      return;
    }

    setBookingStatus(prev => ({ ...prev, [sessionId]: "booking" }));

    try {
      const response = await fetch(`/api/sessions/${sessionId}/book`, {
        method: "POST",
      });

      if (response.ok) {
        setBookingStatus(prev => ({ ...prev, [sessionId]: "success" }));
        // Refresh sessions after booking
        fetchSessions();
      } else {
        setBookingStatus(prev => ({ ...prev, [sessionId]: "error" }));
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

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {sessions.length === 0 ? (
          <div className="col-span-full text-center py-8 text-gray-500">
            No sessions available
          </div>
        ) : (
          sessions.map((sessionItem) => (
            <div key={sessionItem.id} className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-xl font-semibold mb-2">{sessionItem.title}</h2>
              <p className="text-gray-600 mb-4">{sessionItem.description}</p>
              <div className="space-y-2 text-sm text-gray-500">
                <p>Date: {sessionItem.date}</p>
                <p>Time: {sessionItem.time}</p>
                <p>Mentor: {sessionItem.mentorName}</p>
              </div>
              {session?.user?.role === "STUDENT" && (
                <button
                  onClick={() => handleBookSession(sessionItem.id)}
                  disabled={bookingStatus[sessionItem.id] === "booking"}
                  className={`mt-4 w-full py-2 rounded ${
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
                    : bookingStatus[sessionItem.id] === "error"
                    ? "Booking Failed"
                    : "Book Session"}
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
} 