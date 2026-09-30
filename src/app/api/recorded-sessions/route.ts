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

export async function GET(request: NextRequest) {
  try {
    const recordedSessions = await prisma.recordedSession.findMany({
      orderBy: { createdAt: "desc" },
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

    return NextResponse.json(recordedSessions);
  } catch (error) {
    console.error("Error fetching recorded sessions:", error);
    return NextResponse.json(
      { message: "Failed to fetch recorded sessions" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { title, description, youtubeUrl, category, mentorName, duration } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ message: "Title is required" }, { status: 400 });
    }

    if (!youtubeUrl || !youtubeUrl.trim()) {
      return NextResponse.json(
        { message: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const videoId = extractYouTubeVideoId(youtubeUrl.trim());
    if (!videoId) {
      return NextResponse.json(
        { message: "Invalid YouTube URL. Please provide a valid YouTube video or live link." },
        { status: 400 }
      );
    }

    const newRecordedSession = await prisma.recordedSession.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        youtubeUrl: youtubeUrl.trim(),
        videoId,
        category: category?.trim() || "General",
        mentorName: mentorName?.trim() || session.user.name || "Mentor",
        duration: duration?.trim() || null,
        uploadedById: session.user.id,
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

    return NextResponse.json(newRecordedSession, { status: 201 });
  } catch (error) {
    console.error("Error creating recorded session:", error);
    return NextResponse.json(
      { message: "Failed to create recorded session" },
      { status: 500 }
    );
  }
}
