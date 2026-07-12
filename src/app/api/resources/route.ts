import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { uploadFile } from "@/lib/storage";

export const dynamic = "force-dynamic";

async function getAuthenticatedUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  return prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true, role: true },
  });
}

// GET: Retrieve all resources
export async function GET() {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const resources = await prisma.resource.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        uploadedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.error("Failed to fetch resources:", error);
    return NextResponse.json({ error: "Failed to fetch resources" }, { status: 500 });
  }
}

// POST: Upload a resource
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only students, mentors, and admins can upload
    if (user.role !== "STUDENT" && user.role !== "MENTOR" && user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const title = formData.get("title") as string | null;

    if (!file || !title) {
      return NextResponse.json({ error: "Missing file or title" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Check overall storage limit (1GB cap)
    const totalSizeData = await prisma.resource.aggregate({
      _sum: {
        fileSize: true,
      },
    });
    const currentTotal = totalSizeData._sum.fileSize || 0;
    const limitBytes = 1 * 1024 * 1024 * 1024; // 1 GB in bytes

    if (currentTotal + file.size > limitBytes) {
      return NextResponse.json(
        { error: "Upload limit exceeded. Total storage of PDF files is capped at 1GB." },
        { status: 400 }
      );
    }

    // Call storage helper to upload
    const fileUrl = await uploadFile(file, file.name);

    // Save metadata to database
    const resource = await prisma.resource.create({
      data: {
        title,
        url: fileUrl,
        fileSize: file.size,
        uploadedById: user.id,
        uploaderRole: user.role,
      },
    });

    return NextResponse.json(resource, { status: 201 });
  } catch (error) {
    console.error("Failed to upload resource:", error);
    return NextResponse.json({ error: "Failed to upload resource" }, { status: 500 });
  }
}
