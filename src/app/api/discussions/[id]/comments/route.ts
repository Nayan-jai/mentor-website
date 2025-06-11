import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
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

    const comments = await prisma.comment.findMany({
      where: {
        discussionId: params.id,
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
  } catch (error) {
    console.error("[COMMENTS_GET]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

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

    const body = await request.json();
    const { content } = body;

    if (!content) {
      return NextResponse.json(
        { message: "Content is required" },
        { status: 400 }
      );
    }

    // Check if discussion exists and is accessible
    const discussion = await prisma.discussion.findUnique({
      where: {
        id: params.id,
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
        discussionId: params.id,
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
  } catch (error) {
    console.error("[COMMENTS_POST]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    const body = await request.json();
    const { commentId, isAnswer } = body;

    if (!commentId) {
      return NextResponse.json(
        { message: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Only mentors can mark comments as answers
    if (isAnswer && session.user.role !== "MENTOR") {
      return NextResponse.json(
        { message: "Only mentors can mark comments as answers" },
        { status: 403 }
      );
    }

    const comment = await prisma.comment.update({
      where: {
        id: commentId,
        discussionId: params.id,
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
  } catch (error) {
    console.error("[COMMENTS_PATCH]", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
} 