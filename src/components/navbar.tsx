"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  GraduationCap,
  Home,
  Calendar,
  MessageCircle,
  HelpCircle,
  Inbox,
  Lock,
  Users,
  CalendarCheck,
  LineChart,
  Gauge,
  BookOpen,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
} from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav className="w-full bg-gradient-to-br from-gray-900/80 to-indigo-900/80 text-white shadow-md border-b border-indigo-800 z-50 backdrop-blur-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-blue-500" />
            <span className="text-xl font-bold text-heading-color">UPSC Mentor</span>
          </Link>

          {/* Hamburger for mobile */}
          <button
            className="md:hidden p-2 focus:outline-none"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <span>{mobileMenuOpen ? <LogOut className="w-7 h-7" /> : <Menu className="w-7 h-7" />}</span>
          </button>

          {/* Navigation - Desktop */}
          <nav className="hidden md:flex items-center space-x-4 md:space-x-2 lg:space-x-8 overflow-x-auto max-w-full">
            <Link href="/" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
              <Home className="w-5 h-5" /> Home
            </Link>
            <Link href="/sessions" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
              <Calendar className="w-5 h-5" /> Sessions
            </Link>
            <Link href="/forum" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
              <MessageCircle className="w-5 h-5" /> Forum
            </Link>
            {session?.user?.role === "STUDENT" && (
              <>
                <Link href="/ask-mentor" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
                  <HelpCircle className="w-5 h-5" /> Ask Mentor
                </Link>
                <Link href="/my-queries" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
                  <Inbox className="w-5 h-5" /> My Queries
                </Link>
              </>
            )}
            {session?.user?.role === "MENTOR" && (
              <Link href="/mentor/private-queries" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
                <Lock className="w-5 h-5" /> Private Queries
              </Link>
            )}
            {session?.user?.role === "ADMIN" && (
              <>
                <Link href="/dashboard/admin/users" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
                  <Users className="w-5 h-5" /> Manage Users
                </Link>
                <Link href="/dashboard/admin/sessions" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
                  <CalendarCheck className="w-5 h-5" /> Manage Sessions & Bookings
                </Link>
                <Link href="/dashboard/admin/analytics" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
                  <LineChart className="w-5 h-5" /> View Analytics
                </Link>
              </>
            )}
            {session ? (
              <>
                {session.user?.role === "STUDENT" && (
                  <Link href="/dashboard/student" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
                    <Gauge className="w-5 h-5" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "MENTOR" && (
                  <Link href="/dashboard/mentor" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base">
                    <BookOpen className="w-5 h-5" /> Mentor Dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-get-started flex items-center gap-2 px-4 md:px-3 py-2 md:py-1 rounded-lg text-black bg-white hover:bg-blue-700 hover:text-white transition text-base md:text-sm lg:text-base"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base whitespace-nowrap" >
                  <LogIn className="w-5 h-5" /> Sign In
                </Link>
                <Link href="/auth/register" className="btn-get-started flex items-center gap-2 px-4 md:px-3 py-2 md:py-1 rounded-lg text-black bg-white hover:bg-blue-700 hover:text-white transition text-base md:text-sm lg:text-base whitespace-nowrap">
                  <UserPlus className="w-5 h-5" /> Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden flex flex-col bg-white text-black shadow-lg rounded-b-lg px-4 pt-2 pb-4 space-y-2 animate-fade-in">
            <Link href="/" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
              <Home className="w-5 h-5" /> Home
            </Link>
            <Link href="/sessions" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
              <Calendar className="w-5 h-5" /> Sessions
            </Link>
            <Link href="/forum" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
              <MessageCircle className="w-5 h-5" /> Forum
            </Link>
            {session?.user?.role === "STUDENT" && (
              <>
                <Link href="/ask-mentor" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
                  <HelpCircle className="w-5 h-5" /> Ask Mentor
                </Link>
                <Link href="/my-queries" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
                  <Inbox className="w-5 h-5" /> My Queries
                </Link>
              </>
            )}
            {session?.user?.role === "MENTOR" && (
              <Link href="/mentor/private-queries" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
                <Lock className="w-5 h-5" /> Private Queries
              </Link>
            )}
            {session?.user?.role === "ADMIN" && (
              <>
                <Link href="/dashboard/admin/users" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
                  <Users className="w-5 h-5" /> Manage Users
                </Link>
                <Link href="/dashboard/admin/sessions" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
                  <CalendarCheck className="w-5 h-5" /> Manage Sessions & Bookings
                </Link>
                <Link href="/dashboard/admin/analytics" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
                  <LineChart className="w-5 h-5" /> View Analytics
                </Link>
              </>
            )}
            {session ? (
              <>
                {session.user?.role === "STUDENT" && (
                  <Link href="/dashboard/student" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
                    <Gauge className="w-5 h-5" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "MENTOR" && (
                  <Link href="/dashboard/mentor" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base" onClick={() => setMobileMenuOpen(false)}>
                    <BookOpen className="w-5 h-5" /> Mentor Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="btn-get-started flex items-center gap-2 w-full text-left px-4 md:px-3 py-2 md:py-1 bg-white text-black rounded-lg hover:bg-blue-700 hover:text-white transition text-base md:text-sm lg:text-base"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="nav-link flex items-center gap-2 px-3 md:px-2 py-2 md:py-1 text-base md:text-sm lg:text-base whitespace-nowrap" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="w-5 h-5" /> Sign In
                </Link>
                <Link href="/auth/register" className="btn-get-started flex items-center gap-2 px-4 md:px-3 py-2 md:py-1 rounded-lg text-black bg-white hover:bg-blue-700 hover:text-white transition text-base md:text-sm lg:text-base whitespace-nowrap" onClick={() => setMobileMenuOpen(false)}>
                  <UserPlus className="w-5 h-5" /> Get Started
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </nav>
  );
} 