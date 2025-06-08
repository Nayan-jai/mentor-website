"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

export default function Navbar() {
  const { data: session } = useSession();

  return (
    <header className="fixed w-full top-0 left-0 z-50 bg-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <i className="fas fa-graduation-cap text-3xl text-accent-color mr-2"></i>
            <span className="text-2xl font-bold text-heading-color">UPSC Mentor</span>
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
            {session ? (
              <>
                <Link href="/dashboard" className="nav-link">
                  <i className="fas fa-tachometer-alt mr-1"></i> Dashboard
                </Link>
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
                <Link href="/auth/signup" className="btn-get-started">
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