import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getUser(req: NextRequest) {
  const session = await getSession(req);
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, studyTracker: true } });
}

export async function GET(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(user.studyTracker || {});
}

export async function POST(request: NextRequest) {
  const user = await getUser(request);
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    await prisma.user.update({
      where: { id: user.id },
      data: { studyTracker: body },
    });
    return NextResponse.json({ message: "Saved" });
  } catch (err) {
    console.error("Failed to save study tracker:", err);
    return NextResponse.json({ message: "Failed to save" }, { status: 500 });
  }
}
