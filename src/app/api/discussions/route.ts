import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(req.url);
    
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const filter = searchParams.get("filter");

    const where = {
      ...(category && category !== "all" ? { category } : {}),
      ...(search ? {
        OR: [
          { title: { contains: search, mode: "insensitive" } },
          { content: { contains: search, mode: "insensitive" } },
        ],
      } : {}),
      ...(filter === "resolved" ? { isResolved: true } : {}),
      ...(filter === "unresolved" ? { isResolved: false } : {}),
      ...(filter === "archived" ? { isArchived: true } : {}),
      ...(filter !== "archived" ? { isArchived: false } : {}),
      ...(session?.user?.role !== "MENTOR" ? { isPrivate: false } : {}),
    };

    const discussions = await prisma.discussion.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            name: true,
          },
        },
        _count: {
          select: {
            comments: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(discussions);
  } catch (error) {
    console.error("[DISCUSSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
} 