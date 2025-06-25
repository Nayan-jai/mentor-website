import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendSessionBookingConfirmationEmail } from '@/lib/email';
import { formatSessionTime } from '@/lib/utils';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const slotId = request.url.split('/sessions/')[1].split('/book')[0];
    const body = await request.json();
    const { date, time, duration } = body;

    if (!date || !time || !duration) {
      return NextResponse.json(
        { message: "Date, time, and duration are required" },
        { status: 400 }
      );
    }

    const mentorSlot = await prisma.mentorSlot.findUnique({
      where: {
        id: slotId,
      },
      include: {
        mentor: true,
      },
    });

    if (!mentorSlot) {
      return NextResponse.json(
        { message: "Session slot not found" },
        { status: 404 }
      );
    }

    // Prevent the same student from booking the same session multiple times
    const existingBooking = await prisma.booking.findFirst({
      where: {
        menteeId: session.user.id,
        slotId: slotId,
      },
    });
    if (existingBooking) {
      return NextResponse.json(
        { message: "You have already booked this session." },
        { status: 400 }
      );
    }

    // Create a new session for the booking
    const newSession = await prisma.session.create({
      data: {
        sessionToken: Math.random().toString(36).substring(7),
        userId: session.user.id,
        expires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
      },
    });

    // Create the booking
    const booking = await prisma.booking.create({
      data: {
        menteeId: session.user.id,
        slotId: slotId,
        sessionId: newSession.id,
        status: "CONFIRMED",
      },
      include: {
        mentee: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        slot: {
          include: {
            mentor: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Send booking confirmation email to the student
    if (booking.mentee?.email) {
      const sessionTime = formatSessionTime(new Date(mentorSlot.startTime));
      await sendSessionBookingConfirmationEmail(
        booking.mentee.email,
        mentorSlot.title,
        sessionTime,
        booking.slot.mentor.name || 'Mentor',
        booking.slot.meetingLink || undefined
      );
    }

    return NextResponse.json(booking);
  } catch (error) {
    console.error("[BOOK_SESSION_ERROR]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 