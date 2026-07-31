import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const getPrisma = () => {
  if ((defaultPrisma as any)?.developerQuery) return defaultPrisma;
  return new PrismaClient();
};

export async function GET(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const queries = await (prisma as any).developerQuery.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(queries);
  } catch (error) {
    console.error("Failed to fetch admin developer queries:", error);
    return NextResponse.json(
      { message: "Failed to fetch queries" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user || user.role !== "ADMIN") {
      return NextResponse.json({ message: "Forbidden: Admin access required" }, { status: 403 });
    }

    const body = await request.json();
    const { id, status, adminNotes } = body;

    if (!id) {
      return NextResponse.json({ message: "Query ID is required" }, { status: 400 });
    }

    const updatedQuery = await (prisma as any).developerQuery.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(adminNotes !== undefined && { adminNotes }),
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
    });

    return NextResponse.json(updatedQuery);
  } catch (error) {
    console.error("Failed to update developer query:", error);
    return NextResponse.json(
      { message: "Failed to update query" },
      { status: 500 }
    );
  }
}
