import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const discussionId = searchParams.get("discussionId");

  if (!discussionId) {
    return NextResponse.json(
      { message: "Discussion ID is required" },
      { status: 400 }
    );
  }

  const comments = await prisma.comment.findMany({
    where: {
      discussionId,
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
    orderBy: {
      createdAt: "asc",
    },
  });

  return NextResponse.json(comments);
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { content, discussionId } = body;

  if (!content || !discussionId) {
    return NextResponse.json(
      { message: "Content and discussion ID are required" },
      { status: 400 }
    );
  }

  const discussion = await prisma.discussion.findUnique({
    where: { id: discussionId },
    include: { author: true },
  });

  if (!discussion) {
    return NextResponse.json(
      { message: "Discussion not found" },
      { status: 404 }
    );
  }

  // If private, only allow mentor or author to comment
  if (
    discussion.isPrivate &&
    (session.user.role !== "MENTOR" && session.user.id !== discussion.author.id)
  ) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 403 }
    );
  }

  const comment = await prisma.comment.create({
    data: {
      content,
      authorId: session.user.id,
      discussionId,
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

  return NextResponse.json(comment);
}

export async function PATCH(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { commentId, discussionId, isAnswer, content } = body;

  if (!commentId) {
    return NextResponse.json(
      { message: "Comment ID is required" },
      { status: 400 }
    );
  }

  // Only mentors can mark as answer
  if (isAnswer !== undefined && isAnswer !== null && session.user.role !== "MENTOR") {
    return NextResponse.json(
      { message: "Only mentors can mark comments as answers" },
      { status: 403 }
    );
  }

  // Only author or mentor can edit content
  if (content !== undefined) {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { author: true },
    });
    if (!comment) {
      return NextResponse.json(
        { message: "Comment not found" },
        { status: 404 }
      );
    }
    if (session.user.id !== comment.author.id && session.user.role !== "MENTOR") {
      return NextResponse.json(
        { message: "Only the author or a mentor can edit this comment" },
        { status: 403 }
      );
    }
  }

  // Update comment
  const updateData: any = {};
  if (isAnswer !== undefined) updateData.isAnswer = isAnswer;
  if (content !== undefined) updateData.content = content;

  const updated = await prisma.comment.update({
    where: {
      id: commentId,
      ...(discussionId ? { discussionId } : {}),
    },
    data: updateData,
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
}

export async function DELETE(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json(
      { message: "Unauthorized" },
      { status: 401 }
    );
  }
  const body = await request.json();
  const { commentId } = body;
  if (!commentId) {
    return NextResponse.json(
      { message: "Comment ID is required" },
      { status: 400 }
    );
  }
  const comment = await prisma.comment.findUnique({
    where: { id: commentId },
    include: { author: true },
  });
  if (!comment) {
    return NextResponse.json(
      { message: "Comment not found" },
      { status: 404 }
    );
  }
  if (session.user.id !== comment.author.id) {
    return NextResponse.json(
      { message: "Only the author can delete this comment" },
      { status: 403 }
    );
  }
  await prisma.comment.delete({ where: { id: commentId } });
  return NextResponse.json({ message: "Comment deleted" });
} 