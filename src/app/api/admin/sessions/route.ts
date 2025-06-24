import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const sessions = await prisma.mentorSlot.findMany({
    include: {
      mentor: { select: { id: true, name: true, email: true } },
      bookings: {
        include: {
          mentee: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { startTime: "desc" },
  });
  return NextResponse.json({ sessions });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ message: "Session ID required" }, { status: 400 });
  await prisma.mentorSlot.delete({ where: { id } });
  return NextResponse.json({ message: "Session deleted" });
} 