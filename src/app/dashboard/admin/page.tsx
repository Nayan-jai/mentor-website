"use client";
import Link from "next/link";
import { Users, Calendar, BarChart3, BookOpen } from "lucide-react";

export default function AdminHome() {
  return (
    <div className="min-h-screen bg-gray-50 pt-20 sm:pt-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-sm sm:text-base text-gray-600">Manage your platform from one central dashboard</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <Link 
            href="/dashboard/admin/users" 
            className="group block p-6 sm:p-8 rounded-lg shadow-md bg-white hover:bg-blue-50 hover:shadow-lg border border-blue-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <Users className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 group-hover:scale-110 transition-transform" />
              <div className="h-2 w-2 bg-blue-600 rounded-full group-hover:scale-150 transition-transform"></div>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Manage Users</h2>
            <p className="text-sm text-gray-600">View and manage all platform users</p>
          </Link>
          
          <Link 
            href="/dashboard/admin/sessions" 
            className="group block p-6 sm:p-8 rounded-lg shadow-md bg-white hover:bg-blue-50 hover:shadow-lg border border-blue-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 group-hover:scale-110 transition-transform" />
              <div className="h-2 w-2 bg-blue-600 rounded-full group-hover:scale-150 transition-transform"></div>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Manage Sessions</h2>
            <p className="text-sm text-gray-600">Monitor sessions and bookings</p>
          </Link>
          
          <Link 
            href="/dashboard/admin/analytics" 
            className="group block p-6 sm:p-8 rounded-lg shadow-md bg-white hover:bg-blue-50 hover:shadow-lg border border-blue-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <BarChart3 className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 group-hover:scale-110 transition-transform" />
              <div className="h-2 w-2 bg-blue-600 rounded-full group-hover:scale-150 transition-transform"></div>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">View Analytics</h2>
            <p className="text-sm text-gray-600">Access platform insights and metrics</p>
          </Link>

          <Link 
            href="/dashboard/admin/syllabus" 
            className="group block p-6 sm:p-8 rounded-lg shadow-md bg-white hover:bg-blue-50 hover:shadow-lg border border-blue-200 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <BookOpen className="h-8 w-8 sm:h-10 sm:w-10 text-blue-600 group-hover:scale-110 transition-transform" />
              <div className="h-2 w-2 bg-blue-600 rounded-full group-hover:scale-150 transition-transform"></div>
            </div>
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">Manage Syllabi</h2>
            <p className="text-sm text-gray-600">Add, edit, or delete exam syllabus templates</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
