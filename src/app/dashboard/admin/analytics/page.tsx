"use client";
import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

export default function AdminAnalyticsPage() {
  const [stats, setStats] = useState<any>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then(res => res.json())
      .then(data => {
        setStats(data);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8">Loading analytics...</div>;

  return (
    <div className="p-4 sm:p-8">
      <h1 className="text-2xl font-bold mb-6">Analytics</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 mb-8">
        <Card className="p-4 sm:p-6">
          <div className="text-base sm:text-lg font-semibold">Total Users</div>
          <div className="text-xl sm:text-2xl">{stats.totalUsers}</div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-base sm:text-lg font-semibold">Mentors</div>
          <div className="text-xl sm:text-2xl">{stats.mentors}</div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-base sm:text-lg font-semibold">Students</div>
          <div className="text-xl sm:text-2xl">{stats.students}</div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-base sm:text-lg font-semibold">Active Users (30d)</div>
          <div className="text-xl sm:text-2xl">{stats.activeUsers}</div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-base sm:text-lg font-semibold">Total Sessions</div>
          <div className="text-xl sm:text-2xl">{stats.totalSessions}</div>
        </Card>
        <Card className="p-4 sm:p-6">
          <div className="text-base sm:text-lg font-semibold">Total Bookings</div>
          <div className="text-xl sm:text-2xl">{stats.totalBookings}</div>
        </Card>
      </div>
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl font-bold mb-2">User Growth (Placeholder Chart)</h2>
        <div className="bg-gray-100 rounded-lg h-32 sm:h-40 flex items-center justify-center text-gray-400 text-xs sm:text-base">[User Growth Chart]</div>
      </div>
      <div>
        <h2 className="text-lg sm:text-xl font-bold mb-2">Session Activity (Placeholder Chart)</h2>
        <div className="bg-gray-100 rounded-lg h-32 sm:h-40 flex items-center justify-center text-gray-400 text-xs sm:text-base">[Session Activity Chart]</div>
      </div>
    </div>
  );
} 