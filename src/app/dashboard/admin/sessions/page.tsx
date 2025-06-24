"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Booking {
  id: string;
  mentee: { id: string; name: string | null; email: string };
}

interface Session {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime: string;
  mentor: { id: string; name: string | null; email: string };
  bookings: Booking[];
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/sessions");
    const data = await res.json();
    setSessions(data.sessions);
    setLoading(false);
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    await fetch(`/api/admin/sessions/${sessionId}`, { method: "DELETE" });
    fetchSessions();
  };

  const handleCancelBooking = async (bookingId: string) => {
    if (!window.confirm("Are you sure you want to cancel this booking?")) return;
    await fetch(`/api/admin/bookings/${bookingId}`, { method: "DELETE" });
    fetchSessions();
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Manage Sessions & Bookings</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border">
          <thead>
            <tr>
              <th className="border px-4 py-2">Title</th>
              <th className="border px-4 py-2">Mentor</th>
              <th className="border px-4 py-2">Time</th>
              <th className="border px-4 py-2">Bookings</th>
              <th className="border px-4 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sessions.map((session) => (
              <tr key={session.id}>
                <td className="border px-4 py-2 font-semibold">{session.title}</td>
                <td className="border px-4 py-2">{session.mentor?.name} <br /> <span className="text-xs text-gray-500">{session.mentor?.email}</span></td>
                <td className="border px-4 py-2">{new Date(session.startTime).toLocaleString()}<br />-<br />{new Date(session.endTime).toLocaleString()}</td>
                <td className="border px-4 py-2">{session.bookings.length}</td>
                <td className="border px-4 py-2 flex gap-2">
                  <Button size="sm" variant="destructive" onClick={() => handleDeleteSession(session.id)}>
                    Delete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <h2 className="text-xl font-bold mt-10 mb-4">Bookings</h2>
      {sessions.map((session) => (
        <Card key={session.id} className="mb-6 p-4">
          <div className="font-semibold mb-2">{session.title} ({session.bookings.length} bookings)</div>
          <ul>
            {session.bookings.map((booking) => (
              <li key={booking.id} className="flex justify-between items-center border-b py-2">
                <span>{booking.mentee.name} ({booking.mentee.email})</span>
                <Button size="sm" variant="destructive" onClick={() => handleCancelBooking(booking.id)}>
                  Cancel Booking
                </Button>
              </li>
            ))}
            {session.bookings.length === 0 && <li className="text-gray-500">No bookings</li>}
          </ul>
        </Card>
      ))}
    </div>
  );
} 