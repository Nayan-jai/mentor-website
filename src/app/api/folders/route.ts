import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
}

// GET: List all folders with their resource count
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const folders = await prisma.folder.findMany({
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: { resources: true },
        },
      },
    });

    return NextResponse.json(folders);
  } catch (error) {
    console.error("Failed to fetch folders:", error);
    return NextResponse.json({ error: "Failed to fetch folders" }, { status: 500 });
  }
}

// POST: Create a folder
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students, mentors, and admins can create folders
    if (user.role !== "STUDENT" && user.role !== "MENTOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const folder = await prisma.folder.create({
      data: {
        name: name.trim(),
      },
    });

    return NextResponse.json(folder, { status: 201 });
  } catch (error) {
    console.error("Failed to create folder:", error);
    return NextResponse.json({ error: "Failed to create folder" }, { status: 500 });
  }
}
