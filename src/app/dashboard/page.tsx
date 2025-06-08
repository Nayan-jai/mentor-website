"use client";

import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold">Dashboard</h1>
      <p className="mt-4">Welcome, {session?.user?.name || "User"}!</p>
      <p>Your role: {session?.user?.role || "Not logged in"}</p>
    </div>
  );
} 