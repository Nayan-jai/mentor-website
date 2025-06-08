import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { content } = body;

    // Check if discussion exists and is accessible
    const discussion = await prisma.discussion.findUnique({
      where: {
        id: params.id,
        ...(session.user.role !== "MENTOR" ? { isPrivate: false } : {}),
      },
    });

    if (!discussion) {
      return new NextResponse("Discussion not found", { status: 404 });
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
          },
        },
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[COMMENTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { commentId, isAnswer } = body;

    // Only mentors can mark comments as answers
    if (isAnswer && session.user.role !== "MENTOR") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const comment = await prisma.comment.update({
      where: {
        id: commentId,
        discussionId: params.id,
      },
      data: {
        isAnswer,
      },
    });

    return NextResponse.json(comment);
  } catch (error) {
    console.error("[COMMENTS_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 