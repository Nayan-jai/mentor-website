import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSessionBookingEmails } from "@/lib/email";

function generateMeetLink() {
  // Generate a random string for the meeting ID
  const meetingId = Math.random().toString(36).substring(2, 15);
  return `https://meet.google.com/${meetingId}`;
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get the session slot
    const mentorSlot = await prisma.mentorSlot.findUnique({
      where: { id: params.id },
      include: {
        mentor: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!mentorSlot) {
      return NextResponse.json(
        { error: "Session slot not found" },
        { status: 404 }
      );
    }

    // Check if the slot is already booked
    const existingBooking = await prisma.booking.findFirst({
      where: {
        slotId: params.id,
        status: "CONFIRMED",
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "This slot is already booked" },
        { status: 400 }
      );
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        slotId: params.id,
        sessionId: mentorSlot.id,
        menteeId: session.user.id,
        status: "CONFIRMED",
      },
      include: {
        slot: {
          include: {
            mentor: true,
          },
        },
      },
    });

    // Update the session availability
    await prisma.mentorSlot.update({
      where: { id: params.id },
      data: { isAvailable: false },
    });

    // Generate Google Meet link
    const meetLink = generateMeetLink();

    // Send email notifications if mentor exists
    if (mentorSlot.mentor?.name && mentorSlot.mentor?.email && session.user.name && session.user.email) {
      await sendSessionBookingEmails({
        mentorName: mentorSlot.mentor.name,
        mentorEmail: mentorSlot.mentor.email,
        studentName: session.user.name,
        studentEmail: session.user.email,
        sessionTitle: mentorSlot.title || "Mentoring Session",
        startTime: mentorSlot.startTime,
        endTime: mentorSlot.endTime,
        meetLink: meetLink,
      });
    }

    return NextResponse.json({ success: true, booking, meetLink });
  } catch (error) {
    console.error("Error booking session:", error);
    return NextResponse.json(
      { error: "Failed to book session" },
      { status: 500 }
    );
  }
} 