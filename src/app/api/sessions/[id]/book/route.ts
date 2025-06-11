import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const POST = async (
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

    if (session.user.role !== "STUDENT") {
      return NextResponse.json(
        { message: "Only students can book sessions" },
        { status: 403 }
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

    const updatedSession = await prisma.mentorSlot.update({
      where: { id: context.params.id },
      data: {
        isAvailable: false,
        studentId: session.user.id,
      },
      include: {
        mentor: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        student: {
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
    console.error("[SESSION_BOOK]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}; 