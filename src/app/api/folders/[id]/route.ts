import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { deleteFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, role: true },
  });
}

// PATCH: Rename a folder
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "STUDENT" && user.role !== "MENTOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const { name } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 });
    }

    const folder = await prisma.folder.findUnique({ where: { id } });
    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    const updatedFolder = await prisma.folder.update({
      where: { id },
      data: { name: name.trim() },
    });

    return NextResponse.json(updatedFolder);
  } catch (error) {
    console.error("Failed to rename folder:", error);
    return NextResponse.json({ error: "Failed to rename folder" }, { status: 500 });
  }
}

// DELETE: Delete a folder and all resources in it
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (user.role !== "STUDENT" && user.role !== "MENTOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    const folder = await prisma.folder.findUnique({
      where: { id },
      include: { resources: true },
    });

    if (!folder) {
      return NextResponse.json({ error: "Folder not found" }, { status: 404 });
    }

    // Delete all files in physical storage first to prevent leaks
    for (const resource of folder.resources) {
      try {
        await deleteFile(resource.url);
      } catch (err) {
        console.error("Failed to delete physical file:", resource.url, err);
      }
    }

    // Delete folder from database (resources will be deleted automatically via cascade)
    await prisma.folder.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Folder deleted successfully" });
  } catch (error) {
    console.error("Failed to delete folder:", error);
    return NextResponse.json({ error: "Failed to delete folder" }, { status: 500 });
  }
}
