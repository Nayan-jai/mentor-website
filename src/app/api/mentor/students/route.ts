import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "MENTOR" && session.user.role !== "ADMIN") {
    return NextResponse.json({ message: "Forbidden" }, { status: 403 });
  }

  const students = await prisma.user.findMany({
    where: { role: "STUDENT", deleted: false },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      studyTracker: true,
      bookings: { select: { id: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ students });
}
