import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const GET = async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const mentorSlot = await prisma.mentorSlot.findUnique({
      where: { id: context.params.id },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          select: {
            menteeId: true,
          },
        },
      },
    });

    if (!mentorSlot) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    // Only allow access to the session if the user is the mentor or has a booking
    const isMentor = session.user.role === "MENTOR" && mentorSlot.mentor.id === session.user.id;
    const isBooked = mentorSlot.bookings.some(b => b.menteeId === session.user.id);
    if (!isMentor && !isBooked) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    return NextResponse.json(mentorSlot);
  } catch (error) {
    console.error("[SESSION_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
};

export const PUT = async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { title, description, startTime, endTime, meetingLink } = body;

    if (!title || !description || !startTime || !endTime) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { message: "Invalid date format" },
        { status: 400 }
      );
    }

    if (start < now) {
      return NextResponse.json(
        { message: "Start time must be in the future" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { message: "End time must be after start time" },
        { status: 400 }
      );
    }

    const mentorSlot = await prisma.mentorSlot.findUnique({
      where: { id: context.params.id },
    });

    if (!mentorSlot) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    if (mentorSlot.mentorId !== session.user.id) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    // Check for overlapping sessions
    const overlappingSession = await prisma.mentorSlot.findFirst({
      where: {
        mentorId: session.user.id,
        id: { not: context.params.id },
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } },
            ],
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } },
            ],
          },
        ],
      },
    });

    if (overlappingSession) {
      return NextResponse.json(
        { message: "You have an overlapping session at this time" },
        { status: 400 }
      );
    }

    const updatedSession = await prisma.mentorSlot.update({
      where: { id: context.params.id },
      data: {
        title,
        description,
        startTime: start,
        endTime: end,
        meetingLink: meetingLink || null,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        bookings: {
          select: {
            menteeId: true,
          },
        },
      },
    });

    return NextResponse.json(updatedSession);
  } catch (error) {
    console.error("[SESSION_PUT]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
};

export const DELETE = async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  let session;
  try {
    session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    console.log(`[DELETE] Attempting to delete session ${context.params.id} for user ${session.user.id}`);

    // Check if the session exists and user has permission
    const mentorSlot = await prisma.mentorSlot.findUnique({
      where: { id: context.params.id },
    });

    if (!mentorSlot) {
      console.log(`[DELETE] Session ${context.params.id} not found`);
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    if (mentorSlot.mentorId !== session.user.id) {
      console.log(`[DELETE] Unauthorized: User ${session.user.id} trying to delete session owned by ${mentorSlot.mentorId}`);
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
      );
    }

    console.log(`[DELETE] Found mentor slot:`, mentorSlot);

    // Try to delete the mentor slot directly
    // If there are foreign key constraints, the database will handle them
    console.log(`[DELETE] Attempting to delete mentor slot ${context.params.id}`);
    
    const deletedSlot = await prisma.mentorSlot.delete({
      where: { id: context.params.id },
    });

    console.log(`[DELETE] Successfully deleted mentor slot:`, deletedSlot);
    
    return NextResponse.json(
      { message: "Session deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SESSION_DELETE] Error details:", {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      sessionId: context.params.id,
      userId: session?.user?.id,
      errorType: error?.constructor?.name
    });
    
    // Return specific error messages based on the error type
    if (error instanceof Error) {
      if (error.message.includes('foreign key constraint')) {
        return NextResponse.json(
          { message: "Cannot delete session because it has been booked by a student. Please cancel the booking first." },
          { status: 400 }
        );
      }
      if (error.message.includes('not found') || error.message.includes('Record to delete does not exist')) {
        return NextResponse.json(
          { message: "Session not found or already deleted" },
          { status: 404 }
        );
      }
      if (error.message.includes('Unique constraint failed')) {
        return NextResponse.json(
          { message: "Session has conflicting relationships" },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}; 