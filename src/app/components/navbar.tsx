"use client";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function Navbar() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return null;
  }

  return (
    <nav style={{ background: "#eee", padding: 20 }}>
      <span>Navbar: </span>
      <Link href="/">Home</Link>
      {" | "}
      {session?.user?.role === "ADMIN" && (
        <>
          <Link href="/dashboard/admin">Admin Home</Link>
          {" | "}
          <Link href="/dashboard/admin/users">Users</Link>
          {" | "}
          <Link href="/dashboard/admin/sessions">Sessions</Link>
          {" | "}
          <Link href="/dashboard/admin/analytics">Analytics</Link>
          {" | "}
        </>
      )}
      <span>Role: {session?.user?.role}</span>
    </nav>
  );
} 