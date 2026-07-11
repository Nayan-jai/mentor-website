import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function getUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;
  // Use email as the reliable lookup key since id might be undefined on some token shapes
  return prisma.user.findUnique({ where: { email: session.user.email }, select: { id: true, studyTracker: true } });
}

export async function GET() {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(user.studyTracker || {});
}

export async function POST(request: NextRequest) {
  const user = await getUser();
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
