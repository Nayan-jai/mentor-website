import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        deleted: true,
        bookings: { select: { id: true } },
        studyTracker: true,
      },
      orderBy: { createdAt: "desc" },
    });
    const usersWithCounts = users.map(u => ({
      ...u,
      bookingsCount: u.bookings.length,
    }));
    return NextResponse.json({ users: usersWithCounts });
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return NextResponse.json({ message: "Failed to fetch users" }, { status: 500 });
  }
} 