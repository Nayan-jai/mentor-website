import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Only students can book sessions" },
        { status: 403 }
      );
    }

    const mentorSlot = await prisma.mentorSlot.findUnique({
      where: { id: params.id },
    });

    if (!mentorSlot) {
      return NextResponse.json(
        { message: "Session not found" },
        { status: 404 }
      );
    }

    if (!mentorSlot.isAvailable) {
      return NextResponse.json(
        { message: "This session is no longer available" },
        { status: 400 }
      );
    }

    if (mentorSlot.startTime < new Date()) {
      return NextResponse.json(
        { message: "Cannot book a session that has already started" },
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
        slotId: params.id,
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

    // Update the mentor slot
    const updatedSlot = await prisma.mentorSlot.update({
      where: { id: params.id },
      data: {
        isAvailable: false,
      },
    });

    return NextResponse.json(booking);
  } catch (error) {
    console.error("[SESSION_BOOK]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 