import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { title, content, category, isPrivate, tags } = body;

    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        category,
        isPrivate,
        tags,
        authorId: session.user.id,
      },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("[DISCUSSIONS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const isPrivate = searchParams.get("isPrivate") === "true";
    const isArchived = searchParams.get("isArchived") === "true";
    const isResolved = searchParams.get("isResolved") === "true";

    const where: Prisma.DiscussionWhereInput = {
      isPrivate,
      isArchived,
      isResolved,
      ...(search && {
        OR: [
          {
            title: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            content: {
              contains: search,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ] as Prisma.DiscussionWhereInput[],
      }),
      ...(category && { category }),
    };

    const discussions = await prisma.discussion.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        comments: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(discussions);
  } catch (error) {
    console.error("Error fetching discussions:", error);
    return NextResponse.json(
      { error: "Failed to fetch discussions" },
      { status: 500 }
    );
  }
} 