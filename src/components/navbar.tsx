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
  X,
  User,
  Clock,
  ShieldCheck,
  MessageSquarePlus,
  Sparkles,
} from "lucide-react";

import BrandLogo from "@/components/brand-logo";
import LanguageSwitcher from "@/components/language-switcher";
import ThemeToggle from "@/components/theme-toggle";
import OnboardingTour from "@/components/onboarding-tour";

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
    <nav suppressHydrationWarning className="w-full bg-white/90 dark:bg-slate-950/90 text-slate-900 dark:text-white shadow-sm dark:shadow-lg border-b border-slate-200 dark:border-indigo-950/80 z-50 backdrop-blur-md sticky top-0 transition-colors duration-300">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href={session ? "/dashboard" : "/"}>
            <BrandLogo variant="navbar" />
          </Link>

          {/* Mobile Right Controls */}
          <div className="flex items-center gap-1.5 sm:gap-2 lg:hidden">
            <LanguageSwitcher />
            <ThemeToggle />

            {/* Hamburger for mobile */}
            <button
              className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors shadow-sm shrink-0 flex items-center justify-center"
              onClick={() => setMobileMenuOpen((open) => !open)}
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5 text-slate-800 dark:text-white" />
              ) : (
                <Menu className="w-5 h-5 text-slate-800 dark:text-white" />
              )}
            </button>
          </div>

          {/* Navigation - Desktop */}
          <nav className="hidden lg:flex items-center space-x-1 xl:space-x-2.5">
            {!session && (
              <Link href="/" className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
                <Home className="w-4 h-4 text-blue-500 dark:text-sky-400 transition-transform duration-200 group-hover:scale-110" /> Home
              </Link>
            )}
            <Link href="/sessions" className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
              <Calendar className="w-4 h-4 text-violet-600 dark:text-violet-400 transition-transform duration-200 group-hover:scale-110" /> Sessions
            </Link>
            <Link href="/forum" className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
              <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-110" /> Forum
            </Link>
            {session?.user?.role === "STUDENT" && (
              <Link href="/my-queries?ask=true" className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
                <HelpCircle className="w-4 h-4 text-rose-500 dark:text-rose-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Ask Mentor
              </Link>
            )}
            {session && (
              <Link href="/resources" className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
                <BookOpen className="w-4 h-4 text-purple-600 dark:text-purple-400 transition-transform duration-200 group-hover:scale-110" /> Resources
              </Link>
            )}
            {session?.user?.role === "STUDENT" && (
              <Link href="/dashboard/student/study-tracker" className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
                <Clock className="w-4 h-4 text-amber-500 dark:text-amber-400 transition-transform duration-200 group-hover:scale-110" /> Tracker
              </Link>
            )}
            {session?.user?.role === "MENTOR" && (
              <Link href="/mentor/private-queries" className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
                <Lock className="w-4 h-4 text-rose-500 dark:text-rose-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Private Queries
              </Link>
            )}

            {/* Android APK download */}
            <a
              href="/app-release-signed.apk"
              download
              className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 rounded-lg bg-emerald-50 dark:bg-green-600/10 hover:bg-emerald-100 dark:hover:bg-green-600 border border-emerald-300 dark:border-green-700/40 hover:border-emerald-400 dark:hover:border-green-500 text-emerald-700 dark:text-green-400 hover:text-emerald-800 dark:hover:text-white transition-all duration-200 text-xs xl:text-sm font-bold whitespace-nowrap shrink-0 shadow-sm"
              title="Download Android App"
            >
              {/* Android robot SVG */}
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current shrink-0" aria-hidden>
                <path d="M17.523 15.341a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm-11.046 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM3.548 9h16.904A1.55 1.55 0 0 1 22 10.548v5.904A1.55 1.55 0 0 1 20.452 18H3.548A1.55 1.55 0 0 1 2 16.452v-5.904A1.55 1.55 0 0 1 3.548 9zm.857-1.464C5.028 5.638 7.392 4 12 4s6.972 1.638 7.595 3.536H4.405zM8.5 3.5l-1.25-2M15.5 3.5l1.25-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
                <circle cx="8.5" cy="7" r=".6" fill="currentColor"/>
                <circle cx="15.5" cy="7" r=".6" fill="currentColor"/>
              </svg>
              <span>Get App</span>
            </a>

            {session ? (
              <div className="flex items-center gap-2 xl:gap-3 pl-2 border-l border-slate-200 dark:border-indigo-900/60 ml-1 xl:ml-2">
                {session.user?.role === "STUDENT" && (
                  <Link href="/dashboard/student" className="group flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
                    <Gauge className="w-4 h-4 text-blue-500 dark:text-sky-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "MENTOR" && (
                  <Link href="/dashboard/mentor" className="group flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
                    <BookOpen className="w-4 h-4 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Dashboard
                  </Link>
                )}
                {session.user?.role === "ADMIN" && (
                  <Link href="/dashboard/admin" className="group flex items-center gap-1.5 xl:gap-2 px-2 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-sky-300 transition-colors">
                    <ShieldCheck className="w-4 h-4 text-indigo-600 dark:text-indigo-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Admin Console
                  </Link>
                )}

                {/* Profile Avatar after Dashboard */}
                <Link
                  href="/profile"
                  className="group relative flex items-center justify-center p-0.5 rounded-full hover:ring-2 hover:ring-blue-400 transition-all duration-200 shrink-0"
                  title="View Profile"
                >
                  <div className="w-7 h-7 xl:w-8 xl:h-8 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shadow-sm group-hover:scale-105 transition-transform duration-200">
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
                  className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3.5 py-1.5 rounded-lg text-white bg-rose-600 hover:bg-rose-700 dark:bg-indigo-900/40 dark:hover:bg-rose-600 border border-rose-600 dark:border-indigo-800/80 transition-all duration-300 text-xs xl:text-sm 2xl:text-base font-semibold tracking-wide whitespace-nowrap shadow-sm shrink-0"
                >
                  <LogOut className="w-4 h-4 text-white dark:text-rose-400 transition-colors duration-200 shrink-0" /> Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-indigo-900/60 ml-2">
                <LanguageSwitcher />
                <ThemeToggle />

                <Link href="/auth/login" className="group flex items-center gap-1.5 xl:gap-2 px-2.5 xl:px-3 py-1.5 text-xs xl:text-sm 2xl:text-base font-bold tracking-wide whitespace-nowrap text-blue-600 dark:text-sky-400 hover:text-blue-700 dark:hover:text-sky-300 transition-colors" >
                  <LogIn className="w-4 h-4 text-blue-600 dark:text-sky-400 transition-transform duration-200 group-hover:scale-110 shrink-0" /> Sign In
                </Link>
                <Link href="/auth/register" className="group flex items-center gap-1.5 xl:gap-2 px-3.5 xl:px-4 py-1.5 rounded-full text-white bg-blue-600 hover:bg-blue-700 transition-all duration-300 text-xs xl:text-sm 2xl:text-base font-bold tracking-wide whitespace-nowrap shadow-sm shadow-blue-500/20 shrink-0">
                  <UserPlus className="w-4 h-4 text-white transition-transform duration-200 shrink-0" /> Get Started
                </Link>
              </div>
            )}
          </nav>
        </div>

        {/* Mobile Backdrop Dimmer Overlay */}
        {mobileMenuOpen && (
          <div
            className="fixed inset-0 top-16 bg-slate-950/60 dark:bg-black/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <nav className="lg:hidden flex flex-col bg-white dark:bg-[#070b14] text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 shadow-2xl rounded-b-2xl px-4 pt-3 pb-6 space-y-2 absolute left-0 right-0 top-16 z-50 max-h-[calc(100vh-4.5rem)] overflow-y-auto">
            {(() => {
              let delayIndex = 0;
              const items = [
                ...(!session ? [{ key: "home", href: "/", label: "Home", icon: Home, color: "text-blue-500 dark:text-sky-400" }] : []),
                { key: "sessions", href: "/sessions", label: "Sessions", icon: Calendar, color: "text-violet-600 dark:text-violet-400" },
                { key: "forum", href: "/forum", label: "Forum", icon: MessageCircle, color: "text-emerald-600 dark:text-emerald-400" },
                ...(session?.user?.role === "STUDENT"
                  ? [{ key: "ask", href: "/my-queries?ask=true", label: "Ask Mentor", icon: HelpCircle, color: "text-rose-500 dark:text-rose-400" }]
                  : []),
                ...(session ? [{ key: "resources", href: "/resources", label: "Resources", icon: BookOpen, color: "text-purple-600 dark:text-purple-400" }] : []),
                ...(session?.user?.role === "STUDENT" ? [{ key: "tracker", href: "/dashboard/student/study-tracker", label: "Tracker", icon: Clock, color: "text-amber-500 dark:text-amber-400" }] : []),
                ...(session?.user?.role === "MENTOR"
                  ? [{ key: "private", href: "/mentor/private-queries", label: "Private Queries", icon: Lock, color: "text-rose-500 dark:text-rose-400" }]
                  : []),
                ...(session?.user?.role === "ADMIN"
                  ? [
                      { key: "admin-console", href: "/dashboard/admin", label: "Admin Console", icon: ShieldCheck, color: "text-indigo-600 dark:text-indigo-400" },
                      { key: "users", href: "/dashboard/admin/users", label: "Manage Users", icon: Users, color: "text-cyan-600 dark:text-cyan-400" },
                      { key: "admin-sessions", href: "/dashboard/admin/sessions", label: "Manage Sessions", icon: CalendarCheck, color: "text-purple-600 dark:text-purple-400" },
                      { key: "analytics", href: "/dashboard/admin/analytics", label: "Analytics", icon: LineChart, color: "text-emerald-600 dark:text-emerald-400" },
                    ]
                  : []),
              ];

              return (
                <>
                  <div className="flex items-center justify-between px-4 py-2.5 bg-slate-100 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl my-1">
                    <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Language &amp; Theme</span>
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
                        className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <Icon className={`w-5 h-5 ${item.color} transition-transform duration-200 group-hover:scale-110`} />
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* Android APK download */}
                  <a
                    href="/app-release-signed.apk"
                    download
                    style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                    className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-50 dark:bg-green-600/10 text-emerald-700 dark:text-green-400 border border-emerald-200 dark:border-green-800/40 hover:bg-emerald-100 dark:hover:bg-green-600 hover:text-emerald-900 dark:hover:text-white transition-all duration-200 text-base font-semibold"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <svg viewBox="0 0 24 24" className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" aria-hidden>
                      <path d="M17.523 15.341a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zm-11.046 0a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z" fill="currentColor" stroke="none"/>
                      <path d="M4.405 7.536C5.028 5.638 7.392 4 12 4s6.972 1.638 7.595 3.536H4.405zM3.548 9h16.904A1.55 1.55 0 0 1 22 10.548v5.904A1.55 1.55 0 0 1 20.452 18H3.548A1.55 1.55 0 0 1 2 16.452v-5.904A1.55 1.55 0 0 1 3.548 9z"/>
                      <path d="M8.5 3.5l-1.25-2M15.5 3.5l1.25-2"/>
                      <circle cx="8.5" cy="7" r=".6" fill="currentColor" stroke="none"/>
                      <circle cx="15.5" cy="7" r=".6" fill="currentColor" stroke="none"/>
                    </svg>
                    <span>Download Android App</span>
                  </a>

                  {session ? (
                    <div className="pt-2 flex flex-col gap-2 border-t border-slate-200 dark:border-slate-800 mt-1">
                      {session.user?.role === "STUDENT" && (
                        <Link
                          href="/dashboard/student"
                          style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                          className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <Gauge className="w-5 h-5 text-blue-500 dark:text-sky-400 transition-transform duration-200 group-hover:scale-110" />
                          <span>Dashboard</span>
                        </Link>
                      )}
                      {session.user?.role === "MENTOR" && (
                        <Link
                          href="/dashboard/mentor"
                          style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                          className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400 transition-transform duration-200 group-hover:scale-110" />
                          <span>Dashboard</span>
                        </Link>
                      )}
                      {session.user?.role === "ADMIN" && (
                        <Link
                          href="/dashboard/admin"
                          style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                          className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all duration-200"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <ShieldCheck className="w-5 h-5 text-indigo-600 dark:text-indigo-400 transition-transform duration-200 group-hover:scale-110" />
                          <span>Admin Console</span>
                        </Link>
                      )}
                      <Link
                        href="/profile"
                        style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                        className="animate-menu-item-reveal group flex items-center gap-3 px-4 py-2.5 text-base font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-900 rounded-xl transition-all duration-200"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <div className="w-7 h-7 rounded-full overflow-hidden border border-slate-300 dark:border-slate-700 bg-slate-100 dark:bg-slate-900 shrink-0">
                          <img src={userAvatar} alt="Profile Avatar" className="w-full h-full object-cover" />
                        </div>
                        <span>Profile</span>
                      </Link>
                      <button
                        style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                        onClick={() => { setMobileMenuOpen(false); signOut({ callbackUrl: "/" }); }}
                        className="animate-menu-item-reveal group flex items-center gap-3 w-full text-left px-4 py-3 bg-rose-50 dark:bg-rose-600/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40 rounded-xl hover:bg-rose-600 hover:text-white transition-all duration-200 text-base font-semibold mt-1"
                      >
                        <LogOut className="w-5 h-5 text-rose-500 group-hover:text-white transition-colors duration-200" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="pt-3 flex flex-col gap-2.5 border-t border-slate-200 dark:border-slate-800 mt-2">
                      <Link
                        href="/auth/login"
                        style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                        className="animate-menu-item-reveal group flex items-center justify-center gap-2 px-4 py-3 text-base font-bold text-slate-800 dark:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl transition-all duration-200 shadow-sm"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <LogIn className="w-5 h-5 text-blue-600 dark:text-sky-400 transition-transform duration-200 group-hover:scale-110" />
                        <span>Sign In</span>
                      </Link>
                      <Link
                        href="/auth/register"
                        style={{ animationDelay: `${delayIndex++ * 65}ms` }}
                        className="animate-menu-item-reveal group flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 transition-all duration-200 text-base font-bold shadow-md shadow-blue-500/25"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        <UserPlus className="w-5 h-5 text-white transition-transform duration-200 group-hover:scale-110" />
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