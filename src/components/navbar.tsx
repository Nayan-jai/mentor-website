"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import {
  GraduationCap,
  Home,
  Calendar,
  MessageCircle,
  BookOpen,
  HelpCircle,
  Lock,
  Users,
  CalendarCheck,
  LineChart,
  Gauge,
  LogOut,
  LogIn,
  UserPlus,
  Menu,
  User,
  Clock,
  ShieldCheck,
  MessageSquarePlus,
} from "lucide-react";

import BrandLogo from "@/components/brand-logo";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeToggle from "@/components/theme-toggle";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [dbAvatar, setDbAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user) {
      fetch("/api/user/profile")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data?.image) setDbAvatar(data.image);
        })
        .catch(() => {});
    }
  }, [session]);

  const userAvatar =
    dbAvatar ||
    session?.user?.image ||
    `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(session?.user?.name || "User")}`;

  return (
    <nav suppressHydrationWarning className="w-full bg-gradient-to-br from-gray-900/90 to-indigo-950/90 text-white shadow-lg border-b border-indigo-950 z-50 backdrop-blur-md sticky top-0">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={session ? "/dashboard" : "/"}>
            <BrandLogo variant="navbar" />
          </Link>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-2 lg:hidden">
            <LanguageSwitcher />
            <ThemeToggle />
            
            {/* Hamburger for mobile */}
            <button
              className={`sw-nav-container ${mobileMenuOpen ? "sw-pushed" : ""}`}
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              <div className="sw-toggle-icon">
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
              </div>
            </button>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2.5">
            {!session && (
              <Link href="/" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
                <Home className="w-4 h-4 text-sky-400 transition-transform duration-200 group-hover:scale-110" /> Home
              </Link>
            )}
            <Link href="/sessions" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
              <Calendar className="w-4 h-4 text-violet-400 transition-transform duration-200 group-hover:scale-110" /> Sessions
            </Link>
            <Link href="/forum" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
              <MessageCircle className="w-4 h-4 text-emerald-400 transition-transform duration-200 group-hover:scale-110" /> Forum
            </Link>
            {session?.user?.role === "STUDENT" && (
              <Link href="/my-queries?ask=true" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
                <HelpCircle className="w-4 h-4 text-rose-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Ask Mentor
              </Link>
            )}
            {session && (
              <Link href="/resources" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
                <BookOpen className="w-4 h-4 text-purple-400 transition-transform duration-200 group-hover:scale-110" /> Resources
              </Link>
            )}
            {session?.user?.role === "STUDENT" && (
              <Link href="/dashboard/student/study-tracker" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
                <Clock className="w-4 h-4 text-amber-400 transition-transform duration-200 group-hover:scale-110" /> Tracker
              </Link>
            )}
            {session?.user?.role === "MENTOR" && (
              <Link href="/mentor/private-queries" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
                <Lock className="w-4 h-4 text-rose-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Private Queries
              </Link>
            )}

            {session ? (
              <div className="flex items-center gap-2 xl:gap-3 pl-2 border-l border-indigo-900/60 ml-1 xl:ml-2">
                {session.user?.role === "STUDENT" && (
                  <Link href="/dashboard/student" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
                    <Gauge className="w-4 h-4 text-sky-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "MENTOR" && (
                  <Link href="/dashboard/mentor" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
                    <BookOpen className="w-4 h-4 text-emerald-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "ADMIN" && (
                  <Link href="/profile" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap">
                    <ShieldCheck className="w-4 h-4 text-indigo-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Admin Console
                  </Link>
                )}

                {/* Profile Avatar after Dashboard */}
                <Link
                  href="/profile"
                  className="group relative flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-400 transition-all duration-200 shrink-0"
                  title="View Profile"
                >
                  <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full overflow-hidden border border-slate-700 bg-slate-900 shadow-sm group-hover:scale-105 transition-transform duration-200">
                    <img
                      src={userAvatar}
                      alt={session.user?.name || "Profile"}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </Link>

                <LanguageSwitcher />
                <ThemeToggle />

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 py-1.5 rounded-lg text-white bg-indigo-900/40 hover:bg-rose-600 border border-indigo-800/80 hover:border-rose-500 transition-all duration-300 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap shadow-sm shrink-0"
                >
                  <LogOut className="w-4 h-4 text-rose-400 group-hover:text-white transition-colors duration-200 shrink-0" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-indigo-900/60 ml-2">
                <LanguageSwitcher />
                <ThemeToggle />

                <Link href="/auth/login" className="group nav-link flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap" >
                  <LogIn className="w-4 h-4 text-sky-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Sign In
                </Link>
                <Link href="/auth/register" className="group flex items-center gap-1.5 xl:gap-2 px-3.5 xl:px-4 py-1.5 rounded-full text-black bg-white hover:bg-blue-600 hover:text-white transition-all duration-300 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap shadow-sm border border-transparent shrink-0">
                  <UserPlus className="w-4 h-4 text-blue-600 group-hover:text-white transition-transform duration-200 shrink-0" /> Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden flex flex-col bg-slate-950/95 text-white border-t border-slate-900/80 backdrop-blur-md shadow-2xl rounded-b-xl px-4 pt-3 pb-6 space-y-1.5 absolute left-0 right-0 top-16 z-50 overflow-hidden">
            {(() => {
              let delayIndex = 0;
              const items = [
                ...(!session ? [{ key: "home", href: "/", label: "Home", icon: Home, color: "text-sky-400" }] : []),
                { key: "sessions", href: "/sessions", label: "Sessions", icon: Calendar, color: "text-violet-400" },
                { key: "forum", href: "/forum", label: "Forum", icon: MessageCircle, color: "text-emerald-400" },
                ...(session?.user?.role === "STUDENT"
                  ? [{ key: "ask", href: "/my-queries?ask=true", label: "Ask Mentor", icon: HelpCircle, color: "text-rose-400" }]
                  : []),
                ...(session ? [{ key: "resources", href: "/resources", label: "Resources", icon: BookOpen, color: "text-purple-400" }] : []),
                ...(session?.user?.role === "STUDENT" ? [{ key: "tracker", href: "/dashboard/student/study-tracker", label: "Tracker", icon: Clock, color: "text-amber-400" }] : []),
                ...(session?.user?.role === "MENTOR"
                  ? [{ key: "private", href: "/mentor/private-queries", label: "Private Queries", icon: Lock, color: "text-rose-400" }]
                  : []),
                ...(session?.user?.role === "ADMIN"
                  ? [
                      { key: "users", href: "/dashboard/admin/users", label: "Manage Users", icon: Users, color: "text-cyan-400" },
                      { key: "admin-sessions", href: "/dashboard/admin/sessions", label: "Manage Sessions", icon: CalendarCheck, color: "text-purple-400" },
                      { key: "analytics", href: "/dashboard/admin/analytics", label: "Analytics", icon: LineChart, color: "text-emerald-400" },
                    ]
                  : []),
              ];

              return (
                <>
                  <div className="flex items-center justify-between px-4 py-2 bg-slate-900/80 border border-slate-800/80 rounded-xl my-1.5">
                    <span className="text-xs font-semibold text-slate-300">Language & Theme</span>
                    <div className="flex items-center gap-2">
                      <LanguageSwitcher />
                      <ThemeToggle />
                    </div>
                  </div>

                  {items.map((item) => {
                    const Icon = item.icon;
                    const delay = delayIndex++ * 65;
                    return (
                      <Link
                        key={item.key}
                        href={item.href}
                        style={{ animationDelay: `${delay}ms` }}
                        className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/60 rounded-xl transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className={`w-5 h-5 ${item.color} transition-transform duration-200 group-hover:scale-110`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {session ? (
                    <div className="pt-2 flex flex-col gap-2 border-t border-slate-900/80 mt-1">
                      {session.user?.role === "STUDENT" && (
                        <Link
                          href="/dashboard/student"
                          style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                          className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/60 rounded-xl transition-all duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Gauge className="w-5 h-5 text-sky-400 transition-transform duration-200 group-hover:scale-110" />
                          <span>Dashboard</span>
                        </Link>
                      )}
                      {session.user?.role === "MENTOR" && (
                        <Link
                          href="/dashboard/mentor"
                          style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                          className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/60 rounded-xl transition-all duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <BookOpen className="w-5 h-5 text-emerald-400 transition-transform duration-200 group-hover:scale-110" />
                          <span>Dashboard</span>
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                        className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/60 rounded-xl transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-700 bg-slate-900 shrink-0">
                          <img src={userAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                        </div>
                        <span>Profile</span>
                      </Link>
                      <button
                        style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                        onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="animate-menu-item-reveal group flex items-center gap-3 w-full text-left px-4 py-3 bg-rose-600/10 text-rose-400 rounded-xl hover:bg-rose-600 hover:text-white transition-all duration-200 text-base font-semibold mt-1"
                      >
                        <LogOut className="w-5 h-5 text-rose-400 group-hover:text-white transition-colors duration-200" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-2 flex flex-col gap-2 border-t border-slate-900/80 mt-1">
                      <Link
                        href="/auth/login"
                        style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                        className="animate-menu-item-reveal group flex items-center justify-center gap-2 px-4 py-2.5 text-base font-semibold text-slate-200 hover:text-white hover:bg-indigo-950/60 rounded-xl transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="w-5 h-5 text-sky-400 transition-transform duration-200 group-hover:scale-110" />
                        <span>Sign In</span>
                      </Link>
                      <Link
                        href="/auth/register"
                        style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                        className="animate-menu-item-reveal group flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-black bg-white hover:bg-blue-600 hover:text-white transition-all duration-200 text-base font-semibold shadow-md"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserPlus className="w-5 h-5 text-blue-600 group-hover:text-white transition-all duration-200" />
                        <span>Get Started</span>
                      </Link>
                    </div>
                  )}
                </>
              );
            })()}
          </nav>
        )}
      </div>
    </nav>
  );
} 