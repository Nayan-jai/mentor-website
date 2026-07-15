import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: Fetch members' timers for the group the caller belongs to
export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const membership = await prisma.studyGroupMember.findFirst({
      where: { userId: session.user.id },
      select: { groupId: true },
    });

    if (!membership) {
      return NextResponse.json({ joined: false });
    }

    const members = await prisma.studyGroupMember.findMany({
      where: { groupId: membership.groupId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json({
      joined: true,
      members: members.map((m) => ({
        userId: m.userId,
        isSelf: m.userId === session.user.id,
        name: m.user.name || m.user.email.split("@")[0],
        timerBid: m.timerBid,
        timerStart: m.timerStart ? m.timerStart.toISOString() : null,
        timerBase: m.timerBase,
        subject: m.subject,
        topic: m.topic,
        updatedAt: m.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Failed to poll study group timers:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

// POST: Update caller's timer state and return group members' states
export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { timerBid, timerStart, timerBase, subject, topic } = body;

    // Check membership
    const membership = await prisma.studyGroupMember.findFirst({
      where: { userId: session.user.id },
    });

    if (!membership) {
      return NextResponse.json({ joined: false });
    }

    // Update member timer details
    await prisma.studyGroupMember.update({
      where: { id: membership.id },
      data: {
        timerBid: timerBid || null,
        timerStart: timerStart ? new Date(timerStart) : null,
        timerBase: timerBase !== undefined ? parseInt(timerBase) : null,
        subject: subject || null,
        topic: topic || null,
      },
    });

    // Fetch updated states for all members of the group
    const members = await prisma.studyGroupMember.findMany({
      where: { groupId: membership.groupId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      joined: true,
      members: members.map((m) => ({
        userId: m.userId,
        isSelf: m.userId === session.user.id,
        name: m.user.name || m.user.email.split("@")[0],
        timerBid: m.timerBid,
        timerStart: m.timerStart ? m.timerStart.toISOString() : null,
        timerBase: m.timerBase,
        subject: m.subject,
        topic: m.topic,
        updatedAt: m.updatedAt.toISOString(),
      })),
    });
  } catch (err) {
    console.error("Failed to update study group timer:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
