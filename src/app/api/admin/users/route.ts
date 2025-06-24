import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  // TODO: Add admin authentication/authorization check
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
      // lastLogin: true, // If you have a lastLogin field
    },
    orderBy: { createdAt: "desc" },
  });
  const usersWithCounts = users.map(u => ({
    ...u,
    bookingsCount: u.bookings.length,
    // lastLogin: u.lastLogin,
  }));
  return NextResponse.json({ users: usersWithCounts });
} 