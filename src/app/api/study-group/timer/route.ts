import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getMemberAllocatedSec(m: any): number {
  const MAX_CAP_SEC = 16 * 3600; // 16-hour daily maximum limit
  if (!m || !m.user?.studyTracker) return MAX_CAP_SEC;
  const tracker = m.user.studyTracker;
  if (m.timerBid && tracker.days) {
    for (const d of tracker.days) {
      const b = (d.blocks || []).find((bk: any) => bk.id === m.timerBid);
      if (b && b.targetHrs > 0) {
        return Math.min(Math.round(b.targetHrs * 3600), MAX_CAP_SEC);
      }
    }
  }
  if (m.subject && tracker.subj) {
    const s = tracker.subj.find((sj: any) => sj.name === m.subject);
    if (s && s.defaultHrs > 0) {
      return Math.min(Math.round(s.defaultHrs * 3600), MAX_CAP_SEC);
    }
  }
  return MAX_CAP_SEC;
}

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
            image: true,
            studyTracker: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    // Check for expired timers exceeding allocated time and auto-stop them
    const expiredIds: string[] = [];
    const formattedMembers = members.map((m) => {
      let isExpired = false;
      let finalTimerBid = m.timerBid;
      let finalTimerStart = m.timerStart ? m.timerStart.toISOString() : null;
      let finalTimerBase = m.timerBase;

      if (m.timerBid && m.timerStart) {
        const startMs = new Date(m.timerStart).getTime();
        const elapsedSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        const totalSec = (m.timerBase || 0) + elapsedSec;
        const allocatedSec = getMemberAllocatedSec(m);

        if (totalSec >= allocatedSec) {
          isExpired = true;
          expiredIds.push(m.id);
          finalTimerBid = null;
          finalTimerStart = null;
          finalTimerBase = allocatedSec;
        }
      }

      return {
        userId: m.userId,
        isSelf: m.userId === session.user.id,
        name: m.user.name || m.user.email.split("@")[0],
        image: m.user.image,
        timerBid: finalTimerBid,
        timerStart: finalTimerStart,
        timerBase: finalTimerBase,
        subject: m.subject,
        topic: m.topic,
        updatedAt: m.updatedAt.toISOString(),
        studyTracker: m.user.studyTracker,
      };
    });

    if (expiredIds.length > 0) {
      await prisma.studyGroupMember.updateMany({
        where: { id: { in: expiredIds } },
        data: {
          timerBid: null,
          timerStart: null,
        },
      }).catch(() => {});
    }

    return NextResponse.json({
      joined: true,
      members: formattedMembers,
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
            image: true,
            studyTracker: true,
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
        image: m.user.image,
        timerBid: m.timerBid,
        timerStart: m.timerStart ? m.timerStart.toISOString() : null,
        timerBase: m.timerBase,
        subject: m.subject,
        topic: m.topic,
        updatedAt: m.updatedAt.toISOString(),
        studyTracker: m.user.studyTracker,
      })),
    });
  } catch (err) {
    console.error("Failed to update study group timer:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
