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
    where: {
      id: discussionId,
      ...(session.user.role !== "MENTOR" ? { isPrivate: false } : {}),
    },
  });

  if (!discussion) {
    return NextResponse.json(
      { message: "Discussion not found" },
      { status: 404 }
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
  const { commentId, discussionId, isAnswer } = body;

  if (!commentId || !discussionId) {
    return NextResponse.json(
      { message: "Comment ID and discussion ID are required" },
      { status: 400 }
    );
  }

  if (isAnswer && session.user.role !== "MENTOR") {
    return NextResponse.json(
      { message: "Only mentors can mark comments as answers" },
      { status: 403 }
    );
  }

  const comment = await prisma.comment.update({
    where: {
      id: commentId,
      discussionId,
    },
    data: {
      isAnswer,
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