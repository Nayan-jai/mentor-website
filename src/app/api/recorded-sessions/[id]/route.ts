import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function extractYouTubeVideoId(url: string): string | null {
  if (!url) return null;
  const regExp = /(?:https?:\/\/)?(?:www\.)?(?:youtube\.com\/(?:[^\/\n\s]+\/\S+\/|(?:v|e(?:mbed)?|shorts|live)\/|\S*?[?&]v=)|youtu\.be\/)([a-zA-Z0-9_-]{11})/;
  const match = url.match(regExp);
  return match && match[1] ? match[1] : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const sessionItem = await prisma.recordedSession.findUnique({
      where: { id },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    if (!sessionItem) {
      return NextResponse.json(
        { message: "Recorded session not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(sessionItem);
  } catch (error) {
    console.error("Error fetching recorded session:", error);
    return NextResponse.json(
      { message: "Failed to fetch recorded session" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized =
      session.user.role === "ADMIN" || session.user.role === "MENTOR";
    if (!isAuthorized) {
      return NextResponse.json(
        { message: "Forbidden: Admin or Mentor role required" },
        { status: 403 }
      );
    }

    const { id } = params;
    const existing = await prisma.recordedSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Recorded session not found" },
        { status: 404 }
      );
    }

    // Admins can edit any session; Mentors can edit their own
    if (session.user.role !== "ADMIN" && existing.uploadedById !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden: You cannot edit this session" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { title, description, youtubeUrl, category, mentorName, duration } = body;

    let videoId = existing.videoId;
    if (youtubeUrl && youtubeUrl.trim() !== existing.youtubeUrl) {
      const extracted = extractYouTubeVideoId(youtubeUrl.trim());
      if (!extracted) {
        return NextResponse.json(
          { message: "Invalid YouTube URL" },
          { status: 400 }
        );
      }
      videoId = extracted;
    }

    const updated = await prisma.recordedSession.update({
      where: { id },
      data: {
        title: title !== undefined ? title.trim() : existing.title,
        description: description !== undefined ? description?.trim() : existing.description,
        youtubeUrl: youtubeUrl !== undefined ? youtubeUrl.trim() : existing.youtubeUrl,
        videoId,
        category: category !== undefined ? category?.trim() : existing.category,
        mentorName: mentorName !== undefined ? mentorName?.trim() : existing.mentorName,
        duration: duration !== undefined ? duration?.trim() : existing.duration,
      },
      include: {
        uploadedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Error updating recorded session:", error);
    return NextResponse.json(
      { message: "Failed to update recorded session" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getSession(request);
    if (!session?.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const isAuthorized =
      session.user.role === "ADMIN" || session.user.role === "MENTOR";
    if (!isAuthorized) {
      return NextResponse.json(
        { message: "Forbidden: Admin or Mentor role required" },
        { status: 403 }
      );
    }

    const { id } = params;
    const existing = await prisma.recordedSession.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Recorded session not found" },
        { status: 404 }
      );
    }

    // Admins can delete any session; Mentors can delete their own
    if (session.user.role !== "ADMIN" && existing.uploadedById !== session.user.id) {
      return NextResponse.json(
        { message: "Forbidden: You cannot delete this session" },
        { status: 403 }
      );
    }

    await prisma.recordedSession.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Recorded session deleted successfully" });
  } catch (error) {
    console.error("Error deleting recorded session:", error);
    return NextResponse.json(
      { message: "Failed to delete recorded session" },
      { status: 500 }
    );
  }
}
