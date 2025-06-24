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
      where: { id: context.params.id },
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

    // If private, only allow mentor or author to view
    if (
      discussion.isPrivate &&
      (!session || (session.user.role !== "MENTOR" && session.user.id !== discussion.author.id))
    ) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 403 }
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
    if (!session?.user) {
      return NextResponse.json(
        { message: "Unauthorized" },
        { status: 401 }
      );
    }

    const discussion = await prisma.discussion.findUnique({
      where: { id: context.params.id },
      select: { authorId: true, isPrivate: true },
    });
    if (!discussion) {
      return NextResponse.json(
        { message: "Discussion not found" },
        { status: 404 }
      );
    }

    const body = await request.json();
    const { title, content, category, tags, isResolved, isArchived } = body;

    // Only mentors can update isResolved and isArchived
    // Only the author can update title, content, category, tags
    if (
      (isResolved !== undefined || isArchived !== undefined) &&
      session.user.role !== "MENTOR"
    ) {
      return NextResponse.json(
        { message: "Only mentors can update resolved/archived status" },
        { status: 403 }
      );
    }
    if (
      (title !== undefined || content !== undefined || category !== undefined || tags !== undefined) &&
      session.user.id !== discussion.authorId
    ) {
      return NextResponse.json(
        { message: "Only the author can edit their query" },
        { status: 403 }
      );
    }

    const updated = await prisma.discussion.update({
      where: { id: context.params.id },
      data: {
        ...(title !== undefined ? { title } : {}),
        ...(content !== undefined ? { content } : {}),
        ...(category !== undefined ? { category } : {}),
        ...(tags !== undefined ? { tags } : {}),
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

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[DISCUSSION_PATCH]", error);
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
    const discussion = await prisma.discussion.findUnique({
      where: { id: context.params.id },
      select: { authorId: true },
    });
    if (!discussion) {
      return NextResponse.json(
        { message: "Discussion not found" },
        { status: 404 }
      );
    }
    if (session.user.id !== discussion.authorId) {
      return NextResponse.json(
        { message: "Only the author can delete this query" },
        { status: 403 }
      );
    }
    await prisma.discussion.delete({
      where: { id: context.params.id },
    });
    return NextResponse.json({ message: "Deleted" });
  } catch (error) {
    console.error("[DISCUSSION_DELETE]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}; 