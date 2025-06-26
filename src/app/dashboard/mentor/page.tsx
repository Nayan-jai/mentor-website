"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";

export default function MentorDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allStudents, setAllStudents] = useState<any[]>([]);

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
    } catch (err) {
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await fetch("/api/admin/users");
      const data = await res.json();
      setAllStudents((data.users || []).filter((u: any) => u.role === "STUDENT" && !u.deleted));
    } catch (err) {
      setAllStudents([]);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!session || session.user.role !== "MENTOR") {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Mentor Dashboard
            </h1>
            <p className="text-gray-600 mb-6">
              Welcome, {session.user.name}! This is your mentor dashboard.
            </p>
            <div className="mt-4">
              <p className="text-sm text-gray-500 mb-4">
                Your role: {session.user.role}
              </p>
              <h2 className="text-xl font-semibold mb-2">Your Sessions & Bookings</h2>
              {sessions.length === 0 ? (
                <div className="text-gray-500">No sessions found.</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {sessions.map((s) => (
                    <div key={s.id} className="w-full h-full p-4 sm:p-6 rounded-xl hover:shadow-xl transition-shadow duration-200 border-l-4 border-blue-400" style={{ background: '#F7DBF0' }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex flex-col gap-1 min-w-0">
                          <span className="text-lg sm:text-xl font-semibold text-gray-900 truncate">{s.title}</span>
                          <span className="text-gray-600 text-sm truncate">{s.description}</span>
                          <span className="text-gray-500 text-sm">
                            {new Date(s.startTime).toLocaleDateString()}<br />
                            {new Date(s.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(s.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <Badge className="bg-blue-100 text-blue-800 whitespace-nowrap ml-2">
                          {s.numberOfStudents} student{s.numberOfStudents === 1 ? '' : 's'} booked
                        </Badge>
                      </div>
                      {s.students && s.students.length > 0 && (
                        <div className="mt-2">
                          <p className="font-medium text-sm mb-1">Booked by:</p>
                          <ul className="list-disc list-inside text-sm text-gray-700">
                            {s.students.map((stu: any) => (
                              <li key={stu.id}>{stu.name} ({stu.email})</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {allStudents.length > 0 && (
              <div className="mt-10">
                <h2 className="text-xl font-semibold mb-2">All Students</h2>
                <div className="overflow-x-auto">
                  <table className="min-w-[300px] w-full border text-left text-sm">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="py-2 px-4 font-semibold">Name</th>
                        <th className="py-2 px-4 font-semibold">Email</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allStudents.map((stu: any) => (
                        <tr key={stu.id} className="border-t">
                          <td className="py-2 px-4">{stu.name}</td>
                          <td className="py-2 px-4">{stu.email}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 