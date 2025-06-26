"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function StudentDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session || session.user.role !== "STUDENT") {
      router.replace("/auth/login");
    }
  }, [session, status, router]);

  if (status === "loading" || !session || session.user.role !== "STUDENT") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow rounded-lg p-6 mt-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Student Dashboard</h1>
              <div className="flex items-center space-x-2">
                <span className="px-3 py-1 text-sm font-medium text-green-800 bg-green-100 rounded-full">
                  {session.user.role}
                </span>
                <span className="text-sm text-gray-600">
                  Welcome, {session.user.name}
                </span>
              </div>
            </div>
            
            {/* Add your student dashboard content here */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div
                className="bg-blue-50 p-6 rounded-lg cursor-pointer hover:shadow-lg transition"
                onClick={() => router.push('/ask-mentor')}
                tabIndex={0}
                role="button"
                aria-label="Go to Ask Mentor"
              >
                <h3 className="text-lg font-medium text-blue-900 mb-2">My Mentors</h3>
                <p className="text-blue-700">Connect with your mentors</p>
              </div>
              
              <div
                className="bg-green-50 p-6 rounded-lg cursor-pointer hover:shadow-lg transition"
                onClick={() => router.push('/sessions')}
                tabIndex={0}
                role="button"
                aria-label="Go to Sessions"
              >
                <h3 className="text-lg font-medium text-green-900 mb-2">Schedule</h3>
                <p className="text-green-700">View your upcoming sessions</p>
              </div>
              
              <div
                className="bg-purple-50 p-6 rounded-lg cursor-pointer hover:shadow-lg transition"
                onClick={() => router.push('/resources')}
                tabIndex={0}
                role="button"
                aria-label="Go to Resources"
              >
                <h3 className="text-lg font-medium text-purple-900 mb-2">Resources</h3>
                <p className="text-purple-700">Access learning materials</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 