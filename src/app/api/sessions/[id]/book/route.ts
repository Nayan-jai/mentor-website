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

    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if the session exists and is available
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
        { error: "Session not found" },
        { status: 404 }
      );
    }

    if (!mentorSlot.isAvailable) {
      return NextResponse.json(
        { error: "Session is no longer available" },
        { status: 400 }
      );
    }

    // Check if user already has a booking for this slot
    const existingBooking = await prisma.booking.findFirst({
      where: {
        slotId: params.id,
        menteeId: session.user.id,
      },
    });

    if (existingBooking) {
      return NextResponse.json(
        { error: "You have already booked this session" },
        { status: 400 }
      );
    }

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        slotId: params.id,
        menteeId: session.user.id,
        status: "CONFIRMED",
      },
    });

    // Update the session availability
    await prisma.mentorSlot.update({
      where: { id: params.id },
      data: { isAvailable: false },
    });

    // Generate Google Meet link
    const meetLink = generateMeetLink();

    // Send email notifications
    if (mentorSlot.mentor) {
      await sendSessionBookingEmails({
        mentorName: mentorSlot.mentor.name,
        mentorEmail: mentorSlot.mentor.email,
        studentName: session.user.name,
        studentEmail: session.user.email,
        sessionTitle: mentorSlot.title,
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