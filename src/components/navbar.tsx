"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="fixed w-full top-0 left-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-14">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <i className="fas fa-graduation-cap text-2xl text-accent-color mr-2"></i>
            <span className="text-xl font-bold text-heading-color">UPSC Mentor</span>
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="nav-link">
              <i className="fas fa-home mr-1"></i> Home
            </Link>
            <Link href="/sessions" className="nav-link">
              <i className="fas fa-calendar-alt mr-1"></i> Sessions
            </Link>
            <Link href="/forum" className="nav-link">
              <i className="fas fa-comments mr-1"></i> Forum
            </Link>
            {session?.user?.role === "STUDENT" && (
              <>
                <Link href="/ask-mentor" className="nav-link">
                  <i className="fas fa-question-circle mr-1"></i> Ask Mentor
                </Link>
                <Link href="/my-queries" className="nav-link">
                  <i className="fas fa-inbox mr-1"></i> My Queries
                </Link>
              </>
            )}
            {session?.user?.role === "MENTOR" && (
              <Link href="/mentor/private-queries" className="nav-link">
                <i className="fas fa-user-secret mr-1"></i> Private Queries
              </Link>
            )}
            {session ? (
              <>
                {session.user?.role === "STUDENT" && (
                  <Link href="/dashboard/student" className="nav-link">
                    <i className="fas fa-tachometer-alt mr-1"></i> Dashboard
                  </Link>
                )}
                {session.user?.role === "MENTOR" && (
                  <Link href="/dashboard/mentor" className="nav-link">
                    <i className="fas fa-chalkboard-teacher mr-1"></i> Mentor Dashboard
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="btn-get-started"
                >
                  <i className="fas fa-sign-out-alt mr-1"></i> Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/auth/login" className="nav-link">
                  <i className="fas fa-sign-in-alt mr-1"></i> Sign In
                </Link>
                <Link href="/auth/register" className="btn-get-started">
                  <i className="fas fa-user-plus mr-1"></i> Get Started
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
} 