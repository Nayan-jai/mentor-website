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
    const discussion = await prisma.discussion.findUnique({
      where: {
        id: context.params.id,
        ...(session?.user?.role !== "MENTOR" ? { isPrivate: false } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    if (!discussion) {
      return NextResponse.json(
        { message: "Discussion not found" },
        { status: 404 }
      );
    }

    // Increment view count
    await prisma.discussion.update({
      where: { id: context.params.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("[DISCUSSION_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
};

export const PATCH = async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "MENTOR") {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isResolved, isArchived } = body;

    const discussion = await prisma.discussion.update({
      where: { id: context.params.id },
      data: {
        ...(isResolved !== undefined ? { isResolved } : {}),
        ...(isArchived !== undefined ? { isArchived } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("[DISCUSSION_PATCH]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}; 