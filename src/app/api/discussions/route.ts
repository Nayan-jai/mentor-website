import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export const POST = async (req: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, content, category, isPrivate, tags } = body;

    const discussion = await prisma.discussion.create({
      data: {
        title,
        content,
        category: category || "GENERAL",
        isPrivate: typeof isPrivate === "boolean" ? isPrivate : false,
        tags: Array.isArray(tags) ? tags : [],
        authorId: session.user.id,
      },
    });

    return NextResponse.json(discussion);
  } catch (error) {
    console.error("[DISCUSSIONS_POST]", error);
    return NextResponse.json({ message: "Internal Error" }, { status: 500 });
  }
};

export const GET = async (request: NextRequest) => {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category");
    const isPrivate = searchParams.get("isPrivate");
    const isArchived = searchParams.get("isArchived");
    const isResolved = searchParams.get("isResolved");
    const privateForMe = searchParams.get("privateForMe");
    const privateForMentor = searchParams.get("privateForMentor");

    let where: Prisma.DiscussionWhereInput = {
      ...(isPrivate !== null ? { isPrivate: isPrivate === "true" } : {}),
      ...(isArchived !== null ? { isArchived: isArchived === "true" } : {}),
      ...(isResolved !== null ? { isResolved: isResolved === "true" } : {}),
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

    // If student requests their private queries
    if (privateForMe && session?.user) {
      where = {
        ...where,
        isPrivate: true,
        authorId: session.user.id,
      };
    }
    // If mentor requests all private queries
    if (privateForMentor && session?.user?.role === "MENTOR") {
      where = {
        ...where,
        isPrivate: true,
      };
    }

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
      { message: "Failed to fetch discussions" },
      { status: 500 }
    );
  }
}; 