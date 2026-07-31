import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma as defaultPrisma } from "@/lib/prisma";
import { PrismaClient } from "@prisma/client";

export const dynamic = "force-dynamic";

const getPrisma = () => {
  if ((defaultPrisma as any)?.developerQuery) return defaultPrisma;
  return new PrismaClient();
};

export async function POST(request: NextRequest) {
  try {
    const session = await getSession(request);
    if (!session || !session.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const prisma = getPrisma();

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const body = await request.json();
    const { type, subject, description, screenshotUrl } = body;

    if (!subject || !description) {
      return NextResponse.json(
        { message: "Subject and description are required." },
        { status: 400 }
      );
    }

    const newQuery = await (prisma as any).developerQuery.create({
      data: {
        userId: user.id,
        type: type || "BUG",
        subject: subject.trim(),
        description: description.trim(),
        screenshotUrl: screenshotUrl || null,
        status: "PENDING",
      },
    });

    return NextResponse.json(newQuery, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create developer query:", error);
    return NextResponse.json(
      { message: error?.message || "Failed to submit query. Please try again." },
      { status: 500 }
    );
  }
}

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

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userQueries = await (prisma as any).developerQuery.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(userQueries);
  } catch (error) {
    console.error("Failed to fetch user queries:", error);
    return NextResponse.json(
      { message: "Failed to fetch queries" },
      { status: 500 }
    );
  }
}
