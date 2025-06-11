import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

    return NextResponse.json(booking);
  } catch (error) {
    console.error("Error booking session:", error);
    return NextResponse.json(
      { error: "Failed to book session" },
      { status: 500 }
    );
  }
} 