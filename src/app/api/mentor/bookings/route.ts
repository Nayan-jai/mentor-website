import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "MENTOR") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Get all slots for this mentor, including bookings and mentee info
    const slots = await prisma.mentorSlot.findMany({
      where: { mentorId: session.user.id },
      include: {
        bookings: {
          include: {
            mentee: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { startTime: "asc" },
    });

    // Map to include number of students and mentee details
    const result = slots.map(slot => ({
      id: slot.id,
      title: slot.title,
      description: slot.description,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isAvailable: slot.isAvailable,
      bookings: slot.bookings,
      numberOfStudents: slot.bookings.length,
      students: slot.bookings.map(b => b.mentee),
    }));

    return NextResponse.json({ sessions: result });
  } catch (error) {
    console.error("[MENTOR_BOOKINGS_GET]", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}; 