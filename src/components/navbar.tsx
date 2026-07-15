"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import {
  GraduationCap,
  Home,
  Calendar,
  MessageCircle,
  BookOpen,
  HelpCircle,
  Inbox,
  Lock,
  Users,
  CalendarCheck,
  LineChart,
  Gauge,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
} from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <nav suppressHydrationWarning className="w-full bg-gradient-to-br from-gray-900/90 to-indigo-950/90 text-white shadow-lg border-b border-indigo-950 z-50 backdrop-blur-md sticky top-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <GraduationCap className="w-8 h-8 text-blue-400 transition-transform duration-300 group-hover:rotate-12" />
            <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-white via-slate-100 to-indigo-200 bg-clip-text text-transparent">Mentor</span>
          </Link>

          {/* Hamburger for mobile */}
          <button
            className="lg:hidden p-2 text-slate-300 hover:text-white focus:outline-none transition-colors"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label="Toggle menu"
          >
            <span>{mobileMenuOpen ? <LogOut className="w-6 h-6 text-rose-400" /> : <Menu className="w-6 h-6" />}</span>
          </button>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-3">
            {!session && (
              <Link href="/" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                <Home className="w-4 h-4 text-sky-400 transition-transform duration-200 group-hover:scale-110" /> Home
              </Link>
            )}
            <Link href="/sessions" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
              <Calendar className="w-4 h-4 text-violet-400 transition-transform duration-200 group-hover:scale-110" /> Sessions
            </Link>
            <Link href="/forum" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
              <MessageCircle className="w-4 h-4 text-emerald-400 transition-transform duration-200 group-hover:scale-110" /> Forum
            </Link>
            <Link href="/test" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
              <BookOpen className="w-4 h-4 text-amber-400 transition-transform duration-200 group-hover:scale-110" /> Test
            </Link>
            {session && (
              <Link href="/resources" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                <BookOpen className="w-4 h-4 text-purple-400 transition-transform duration-200 group-hover:scale-110" /> Resources
              </Link>
            )}
            {session?.user?.role === "STUDENT" && (
              <>
                <Link href="/ask-mentor" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                  <HelpCircle className="w-4 h-4 text-rose-400 transition-transform duration-200 group-hover:scale-110" /> Ask Mentor
                </Link>
                <Link href="/my-queries" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                  <Inbox className="w-4 h-4 text-indigo-400 transition-transform duration-200 group-hover:scale-110" /> My Queries
                </Link>
              </>
            )}
            {session?.user?.role === "MENTOR" && (
              <Link href="/mentor/private-queries" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                <Lock className="w-4 h-4 text-rose-400 transition-transform duration-200 group-hover:scale-110" /> Private Queries
              </Link>
            )}
            {session?.user?.role === "ADMIN" && (
              <>
                <Link href="/dashboard/admin/users" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                  <Users className="w-4 h-4 text-cyan-400 transition-transform duration-200 group-hover:scale-110" /> Manage Users
                </Link>
                <Link href="/dashboard/admin/sessions" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                  <CalendarCheck className="w-4 h-4 text-purple-400 transition-transform duration-200 group-hover:scale-110" /> Manage Sessions
                </Link>
                <Link href="/dashboard/admin/analytics" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                  <LineChart className="w-4 h-4 text-emerald-400 transition-transform duration-200 group-hover:scale-110" /> Analytics
                </Link>
              </>
            )}
            {session ? (
              <div className="flex items-center gap-3 pl-2 border-l border-indigo-900/60 ml-2">
                {session.user?.role === "STUDENT" && (
                  <Link href="/dashboard/student" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                    <Gauge className="w-4 h-4 text-sky-400 transition-transform duration-200 group-hover:scale-110" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "MENTOR" && (
                  <Link href="/dashboard/mentor" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide">
                    <BookOpen className="w-4 h-4 text-emerald-400 transition-transform duration-200 group-hover:scale-110" /> Dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="group flex items-center gap-2 px-3 py-1.5 rounded-lg text-white bg-indigo-900/40 hover:bg-rose-600 border border-indigo-800/80 hover:border-rose-500 transition-all duration-300 text-sm lg:text-base font-semibold tracking-wide shadow-sm"
                >
                  <LogOut className="w-4 h-4 text-rose-400 group-hover:text-white transition-colors duration-200" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-indigo-900/60 ml-2">
                <Link href="/auth/login" className="group nav-link flex items-center gap-2 px-3 py-1.5 text-sm lg:text-base font-semibold tracking-wide whitespace-nowrap" >
                  <LogIn className="w-4 h-4 text-sky-400 transition-transform duration-200 group-hover:scale-110" /> Sign In
                </Link>
                <Link href="/auth/register" className="group flex items-center gap-2 px-4 py-1.5 rounded-full text-black bg-white hover:bg-blue-600 hover:text-white transition-all duration-300 text-sm lg:text-base font-semibold tracking-wide whitespace-nowrap shadow-sm border border-transparent">
                  <UserPlus className="w-4 h-4 text-blue-600 group-hover:text-white transition-transform duration-200" /> Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden flex flex-col bg-slate-950/95 text-white border-t border-slate-900/80 backdrop-blur-md shadow-2xl rounded-b-xl px-4 pt-2 pb-6 space-y-1.5 animate-fade-in absolute left-0 right-0 top-16 z-50">
            {!session && (
              <Link href="/" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                <Home className="w-5 h-5 text-sky-400 transition-transform duration-200 group-hover:scale-110" /> Home
              </Link>
            )}
            <Link href="/sessions" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
              <Calendar className="w-5 h-5 text-violet-400 transition-transform duration-200 group-hover:scale-110" /> Sessions
            </Link>
            <Link href="/forum" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
              <MessageCircle className="w-5 h-5 text-emerald-400 transition-transform duration-200 group-hover:scale-110" /> Forum
            </Link>
            <Link href="/test" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
              <BookOpen className="w-5 h-5 text-amber-400 transition-transform duration-200 group-hover:scale-110" /> Test
            </Link>
            {session && (
              <Link href="/resources" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                <BookOpen className="w-5 h-5 text-purple-400 transition-transform duration-200 group-hover:scale-110" /> Resources
              </Link>
            )}
            {session?.user?.role === "STUDENT" && (
              <>
                <Link href="/ask-mentor" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                  <HelpCircle className="w-5 h-5 text-rose-400 transition-transform duration-200 group-hover:scale-110" /> Ask Mentor
                </Link>
                <Link href="/my-queries" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                  <Inbox className="w-5 h-5 text-indigo-400 transition-transform duration-200 group-hover:scale-110" /> My Queries
                </Link>
              </>
            )}
            {session?.user?.role === "MENTOR" && (
              <Link href="/mentor/private-queries" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                <Lock className="w-5 h-5 text-rose-400 transition-transform duration-200 group-hover:scale-110" /> Private Queries
              </Link>
            )}
            {session?.user?.role === "ADMIN" && (
              <>
                <Link href="/dashboard/admin/users" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                  <Users className="w-5 h-5 text-cyan-400 transition-transform duration-200 group-hover:scale-110" /> Manage Users
                </Link>
                <Link href="/dashboard/admin/sessions" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                  <CalendarCheck className="w-5 h-5 text-purple-400 transition-transform duration-200 group-hover:scale-110" /> Manage Sessions
                </Link>
                <Link href="/dashboard/admin/analytics" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                  <LineChart className="w-5 h-5 text-emerald-400 transition-transform duration-200 group-hover:scale-110" /> Analytics
                </Link>
              </>
            )}
            {session ? (
              <div className="pt-2 flex flex-col gap-2">
                {session.user?.role === "STUDENT" && (
                  <Link href="/dashboard/student" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                    <Gauge className="w-5 h-5 text-sky-400 transition-transform duration-200 group-hover:scale-110" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "MENTOR" && (
                  <Link href="/dashboard/mentor" className="group flex items-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                    <BookOpen className="w-5 h-5 text-emerald-400 transition-transform duration-200 group-hover:scale-110" /> Dashboard
                  </Link>
                )}
                <button
                  onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                  className="group flex items-center gap-2 w-full text-left px-4 py-3 bg-rose-600/10 text-rose-400 rounded-lg hover:bg-rose-600 hover:text-white transition-all duration-200 text-base font-semibold"
                >
                  <LogOut className="w-5 h-5 text-rose-400 group-hover:text-white transition-colors duration-200" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="pt-2 flex flex-col gap-2">
                <Link href="/auth/login" className="group flex items-center justify-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/50 rounded-lg transition-all duration-200" onClick={() => setMobileMenuOpen(false)}>
                  <LogIn className="w-5 h-5 text-sky-400 transition-transform duration-200 group-hover:scale-110" /> Sign In
                </Link>
                <Link href="/auth/register" className="group flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-black bg-white hover:bg-blue-600 hover:text-white transition-all duration-200 text-base font-semibold shadow-md" onClick={() => setMobileMenuOpen(false)}>
                  <UserPlus className="w-5 h-5 text-blue-600 group-hover:text-white transition-all duration-200" /> Get Started
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </nav>
  );
} 