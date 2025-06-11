import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    const discussion = await prisma.discussion.findUnique({
      where: {
        id: params.id,
        ...(session?.user?.role !== "MENTOR" ? { isPrivate: false } : {}),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
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
      return new NextResponse("Discussion not found", { status: 404 });
    }

    // Increment view count
    await prisma.discussion.update({
      where: { id: params.id },
      data: { views: { increment: 1 } },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("[DISCUSSION_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "MENTOR") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { isResolved, isArchived } = body;

    const discussion = await prisma.discussion.update({
      where: { id: params.id },
      data: {
        ...(isResolved !== undefined ? { isResolved } : {}),
        ...(isArchived !== undefined ? { isArchived } : {}),
      },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("[DISCUSSION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 