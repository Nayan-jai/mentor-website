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
    <header className="fixed w-full top-0 left-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <GraduationCap className="w-7 h-7 text-green-500" />
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
          <nav className="hidden md:flex items-center space-x-6 lg:space-x-8">
            <Link href="/" className="nav-link flex items-center gap-2">
              <Home className="w-5 h-5" /> Home
            </Link>
            <Link href="/sessions" className="nav-link flex items-center gap-2">
              <Calendar className="w-5 h-5" /> Sessions
            </Link>
            <Link href="/forum" className="nav-link flex items-center gap-2">
              <MessageCircle className="w-5 h-5" /> Forum
            </Link>
            {session?.user?.role === "STUDENT" && (
              <>
                <Link href="/ask-mentor" className="nav-link flex items-center gap-2">
                  <HelpCircle className="w-5 h-5" /> Ask Mentor
                </Link>
                <Link href="/my-queries" className="nav-link flex items-center gap-2">
                  <Inbox className="w-5 h-5" /> My Queries
                </Link>
              </>
            )}
            {session?.user?.role === "MENTOR" && (
              <Link href="/mentor/private-queries" className="nav-link flex items-center gap-2">
                <Lock className="w-5 h-5" /> Private Queries
              </Link>
            )}
            {session?.user?.role === "ADMIN" && (
              <>
                <Link href="/dashboard/admin/users" className="nav-link flex items-center gap-2">
                  <Users className="w-5 h-5" /> Manage Users
                </Link>
                <Link href="/dashboard/admin/sessions" className="nav-link flex items-center gap-2">
                  <CalendarCheck className="w-5 h-5" /> Manage Sessions & Bookings
                </Link>
                <Link href="/dashboard/admin/analytics" className="nav-link flex items-center gap-2">
                  <LineChart className="w-5 h-5" /> View Analytics
                </Link>
              </>
            )}
            {session ? (
              <>
                {session.user?.role === "STUDENT" && (
                  <Link href="/dashboard/student" className="nav-link flex items-center gap-2">
                    <Gauge className="w-5 h-5" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "MENTOR" && (
                  <Link href="/dashboard/mentor" className="nav-link flex items-center gap-2">
                    <BookOpen className="w-5 h-5" /> Mentor Dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-get-started flex items-center gap-2"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="nav-link flex items-center gap-2">
                  <LogIn className="w-5 h-5" /> Sign In
                </Link>
                <Link href="/auth/register" className="btn-get-started flex items-center gap-2">
                  <UserPlus className="w-5 h-5" /> Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="md:hidden flex flex-col bg-white shadow-lg rounded-b-lg px-4 pt-2 pb-4 space-y-2 animate-fade-in">
            <Link href="/" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Home className="w-5 h-5" /> Home
            </Link>
            <Link href="/sessions" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <Calendar className="w-5 h-5" /> Sessions
            </Link>
            <Link href="/forum" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
              <MessageCircle className="w-5 h-5" /> Forum
            </Link>
            {session?.user?.role === "STUDENT" && (
              <>
                <Link href="/ask-mentor" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <HelpCircle className="w-5 h-5" /> Ask Mentor
                </Link>
                <Link href="/my-queries" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Inbox className="w-5 h-5" /> My Queries
                </Link>
              </>
            )}
            {session?.user?.role === "MENTOR" && (
              <Link href="/mentor/private-queries" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                <Lock className="w-5 h-5" /> Private Queries
              </Link>
            )}
            {session?.user?.role === "ADMIN" && (
              <>
                <Link href="/dashboard/admin/users" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <Users className="w-5 h-5" /> Manage Users
                </Link>
                <Link href="/dashboard/admin/sessions" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <CalendarCheck className="w-5 h-5" /> Manage Sessions & Bookings
                </Link>
                <Link href="/dashboard/admin/analytics" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <LineChart className="w-5 h-5" /> View Analytics
                </Link>
              </>
            )}
            {session ? (
              <>
                {session.user?.role === "STUDENT" && (
                  <Link href="/dashboard/student" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <Gauge className="w-5 h-5" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "MENTOR" && (
                  <Link href="/dashboard/mentor" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                    <BookOpen className="w-5 h-5" /> Mentor Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="btn-get-started flex items-center gap-2 w-full text-left"
                >
                  <LogOut className="w-5 h-5" /> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="nav-link flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="w-5 h-5" /> Sign In
                </Link>
                <Link href="/auth/register" className="btn-get-started flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <UserPlus className="w-5 h-5" /> Get Started
                </Link>
              </>
            )}
          </nav>
        )}
      </div>
    </header>
  );
} 