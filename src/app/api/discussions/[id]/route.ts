import { NextRequest, NextResponse } from "next/server";
import { authOptions, getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const GET = async (
  request: NextRequest,
  context: { params: { id: string } }
) => {
  try {
    const session = await getSession(request);
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
    const session = await getSession(request);
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

    // Only mentors or admins can update isResolved and isArchived
    // Only the author, a mentor, or an admin can update title, content, category, tags
    if (
      (isResolved !== undefined || isArchived !== undefined) &&
      session.user.role !== "MENTOR" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { message: "Only mentors or admins can update resolved/archived status" },
        { status: 403 }
      );
    }
    if (
      (title !== undefined || content !== undefined || category !== undefined || tags !== undefined) &&
      session.user.id !== discussion.authorId &&
      session.user.role !== "MENTOR" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { message: "Only the author, a mentor, or an admin can edit this query" },
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
    const session = await getSession(request);
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
    if (
      session.user.id !== discussion.authorId &&
      session.user.role !== "MENTOR" &&
      session.user.role !== "ADMIN"
    ) {
      return NextResponse.json(
        { message: "Only the author, a mentor, or an admin can delete this query" },
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