import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

// Define the response type
type SessionsResponse = {
  message: string;
  sessions?: Array<{
    id: string;
    title: string;
    description: string;
    startTime: Date;
    endTime: Date;
    mentorId: string;
    mentor: {
      id: string;
      name: string | null;
      email: string;
    };
  }>;
};

export const GET = async (
  request: NextRequest
): Promise<NextResponse<SessionsResponse>> => {
  try {
    const sessions = await prisma.mentorSlot.findMany({
      where: {
        isAvailable: true,
        startTime: {
          gte: new Date(),
        },
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
      orderBy: {
        startTime: 'asc',
      },
    });

    return NextResponse.json(
      {
        message: "Sessions retrieved successfully",
        sessions,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { message: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
};

export const POST = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { message: "User ID not found" },
        { status: 401 }
      );
    }

    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { message: "Only mentors can create sessions" },
        { status: 403 }
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

    // Check for overlapping sessions
    const overlappingSession = await prisma.mentorSlot.findFirst({
      where: {
        mentorId: session.user.id,
        OR: [
          {
            AND: [
              { startTime: { lte: start } },
              { endTime: { gt: start } }
            ]
          },
          {
            AND: [
              { startTime: { lt: end } },
              { endTime: { gte: end } }
            ]
          }
        ]
      }
    });

    if (overlappingSession) {
      return NextResponse.json(
        { message: "You have an overlapping session at this time" },
        { status: 400 }
      );
    }

    const newSession = await prisma.mentorSlot.create({
      data: {
        title,
        description,
        startTime: start,
        endTime: end,
        mentorId: session.user.id,
        isAvailable: true
      },
      include: {
        mentor: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    return NextResponse.json(newSession);
  } catch (error) {
    console.error("Error creating session:", error);
    return NextResponse.json(
      { message: `Failed to create session: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}; 