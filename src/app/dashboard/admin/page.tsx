"use client";
import Link from "next/link";

export default function AdminHome() {
  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin Panel</h1>
      <div className="flex flex-col gap-6">
        <Link href="/dashboard/admin/users" className="block p-6 rounded-lg shadow bg-white hover:bg-blue-50 border border-blue-200 text-xl font-semibold">
          Manage Users
        </Link>
        <Link href="/dashboard/admin/sessions" className="block p-6 rounded-lg shadow bg-white hover:bg-blue-50 border border-blue-200 text-xl font-semibold">
          Manage Sessions & Bookings
        </Link>
        <Link href="/dashboard/admin/analytics" className="block p-6 rounded-lg shadow bg-white hover:bg-blue-50 border border-blue-200 text-xl font-semibold">
          View Analytics
        </Link>
      </div>
    </div>
  );
} 