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
        booking: {
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

    // Only allow access to the session if the user is the mentor or the student
    if (
      session.user.role !== "MENTOR" &&
      mentorSlot.booking?.menteeId !== session.user.id
    ) {
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
    const { title, description, startTime, endTime } = body;

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
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
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

    await prisma.mentorSlot.delete({
      where: { id: context.params.id },
    });

    return NextResponse.json(
      { message: "Session deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("[SESSION_DELETE]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}; 