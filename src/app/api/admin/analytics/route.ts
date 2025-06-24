import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const [totalUsers, mentors, students, activeUsers, totalSessions, totalBookings] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "MENTOR" } }),
    prisma.user.count({ where: { role: "STUDENT" } }),
    prisma.user.count({ where: { updatedAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }),
    prisma.mentorSlot.count(),
    prisma.booking.count(),
  ]);
  return NextResponse.json({
    totalUsers,
    mentors,
    students,
    activeUsers,
    totalSessions,
    totalBookings,
  });
} 