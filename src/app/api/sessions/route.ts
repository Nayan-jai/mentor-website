import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const sessions = await prisma.mentorSlot.findMany({
      where: {
        isAvailable: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        startTime: true,
        endTime: true,
        mentor: {
          select: {
            name: true,
          },
        },
      },
    });

    // Transform the data to match our simplified interface
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      title: session.title || "Untitled Session",
      description: session.description || "No description available",
      date: new Date(session.startTime).toLocaleDateString(),
      time: `${new Date(session.startTime).toLocaleTimeString()} - ${new Date(session.endTime).toLocaleTimeString()}`,
      mentorName: session.mentor?.name || "Anonymous Mentor",
    }));

    return NextResponse.json(formattedSessions);
  } catch (error) {
    console.error("Error fetching sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "User ID not found" },
        { status: 401 }
      );
    }

    if (session.user.role !== "MENTOR") {
      return NextResponse.json(
        { error: "Only mentors can create sessions" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, startTime, endTime } = body;

    if (!title || !description || !startTime || !endTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Validate dates
    const start = new Date(startTime);
    const end = new Date(endTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json(
        { error: "Invalid date format" },
        { status: 400 }
      );
    }

    if (start < now) {
      return NextResponse.json(
        { error: "Start time must be in the future" },
        { status: 400 }
      );
    }

    if (end <= start) {
      return NextResponse.json(
        { error: "End time must be after start time" },
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
        { error: "You have an overlapping session at this time" },
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
      { error: `Failed to create session: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
} 