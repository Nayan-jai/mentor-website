import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Helper to generate a 6-character random uppercase alphanumeric invite code
function generateGroupCode() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getMemberAllocatedSec(m: any): number {
  const MAX_CAP_SEC = 16 * 3600;
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

export async function GET(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find if the user is in any group
    const membership = await prisma.studyGroupMember.findFirst({
      where: { userId: session.user.id },
      include: {
        group: {
          include: {
            members: {
              orderBy: { createdAt: "asc" },
              include: {
                user: {
                  select: {
                    id: true,
                    name: true,
                    email: true,
                    image: true,
                    studyTracker: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const ownedGroupsRaw = await prisma.studyGroup.findMany({
      where: { ownerId: session.user.id },
      include: {
        members: {
          orderBy: { createdAt: "asc" },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                image: true,
                studyTracker: true,
              },
            },
          },
        },
      },
    });

    const expiredIds: string[] = [];
    const nudgeToClearIds: string[] = [];

    const mapMember = (m: any) => {
      let finalTimerBid = m.timerBid;
      let finalTimerStart = m.timerStart ? m.timerStart.toISOString() : null;
      let finalTimerBase = m.timerBase;

      if (m.timerBid && m.timerStart) {
        const startMs = new Date(m.timerStart).getTime();
        const elapsedSec = Math.max(0, Math.floor((Date.now() - startMs) / 1000));
        const totalSec = (m.timerBase || 0) + elapsedSec;
        const allocatedSec = getMemberAllocatedSec(m);

        if (totalSec >= allocatedSec) {
          expiredIds.push(m.id);
          finalTimerBid = null;
          finalTimerStart = null;
          finalTimerBase = allocatedSec;
        }
      }

      // Deliver pending nudge only to self, then mark for clearing
      let pendingNudge: string | null = null;
      if (m.userId === session.user.id && m.pendingNudge) {
        pendingNudge = m.pendingNudge;
        nudgeToClearIds.push(m.id);
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
        pendingNudge,
      };
    };

    const ownedGroups = ownedGroupsRaw.map((og) => ({
      id: og.id,
      name: og.name,
      code: og.code,
      ownerId: og.ownerId,
      members: og.members.map(mapMember),
    }));

    const clearPromises: Promise<any>[] = [];
    if (expiredIds.length > 0) {
      clearPromises.push(
        prisma.studyGroupMember.updateMany({
          where: { id: { in: expiredIds } },
          data: {
            timerBid: null,
            timerStart: null,
          },
        }).catch(() => {})
      );
    }
    if (nudgeToClearIds.length > 0) {
      clearPromises.push(
        prisma.studyGroupMember.updateMany({
          where: { id: { in: nudgeToClearIds } },
          data: {
            pendingNudge: null,
          },
        }).catch(() => {})
      );
    }
    if (clearPromises.length > 0) {
      await Promise.all(clearPromises);
    }

    if (!membership) {
      return NextResponse.json({ joined: false, ownedGroups });
    }

    const group = membership.group;
    const mappedMembers = group.members.map(mapMember);
    const userPendingNudge = mappedMembers.find((m: any) => m.isSelf)?.pendingNudge || null;

    return NextResponse.json({
      joined: true,
      pendingNudge: userPendingNudge,
      ownedGroups,
      group: {
        id: group.id,
        code: group.code,
        name: group.name,
        ownerId: group.ownerId,
        members: mappedMembers,
      },
    });
  } catch (err) {
    console.error("Failed to fetch study group:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const session = await getSession(request);
  if (!session?.user?.id) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { action } = body;

    // 1. CREATE GROUP
    if (action === "create") {
      const { name } = body;
      if (!name || !name.trim()) {
        return NextResponse.json({ message: "Group name is required" }, { status: 400 });
      }

      // Check if user is already in a group, and leave it
      await prisma.studyGroupMember.deleteMany({
        where: { userId: session.user.id },
      });

      // Generate a unique 6-char code
      let code = generateGroupCode();
      let exists = await prisma.studyGroup.findUnique({ where: { code } });
      while (exists) {
        code = generateGroupCode();
        exists = await prisma.studyGroup.findUnique({ where: { code } });
      }

      // Create group and join as member
      const group = await prisma.studyGroup.create({
        data: {
          code,
          name: name.trim(),
          ownerId: session.user.id,
          members: {
            create: {
              userId: session.user.id,
            },
          },
        },
      });

      return NextResponse.json({ message: "Group created", code });
    }

    // 2. JOIN GROUP
    if (action === "join") {
      const { code } = body;
      if (!code || typeof code !== "string") {
        return NextResponse.json({ message: "Invite code is required" }, { status: 400 });
      }

      const cleanCode = code.trim().toUpperCase();
      const group = await prisma.studyGroup.findUnique({
        where: { code: cleanCode },
      });

      if (!group) {
        return NextResponse.json({ message: "Group not found. Please check the code." }, { status: 404 });
      }

      // Leave any existing groups first
      await prisma.studyGroupMember.deleteMany({
        where: { userId: session.user.id },
      });

      // Join new group
      await prisma.studyGroupMember.create({
        data: {
          groupId: group.id,
          userId: session.user.id,
        },
      });

      return NextResponse.json({ message: "Joined group successfully", groupName: group.name });
    }

    // 3. LEAVE GROUP
    if (action === "leave") {
      await prisma.studyGroupMember.deleteMany({
        where: { userId: session.user.id },
      });
      return NextResponse.json({ message: "Left group" });
    }

    // 4. UPDATE GROUP (Only owner can edit name)
    if (action === "update_group") {
      const { groupId, name } = body;
      if (!groupId || !name || !name.trim()) {
        return NextResponse.json({ message: "Group ID and new name are required" }, { status: 400 });
      }

      const group = await prisma.studyGroup.findUnique({ where: { id: groupId } });
      if (!group) {
        return NextResponse.json({ message: "Group not found" }, { status: 404 });
      }
      if (group.ownerId !== session.user.id) {
        return NextResponse.json({ message: "Only the admin can update group settings" }, { status: 403 });
      }

      await prisma.studyGroup.update({
        where: { id: groupId },
        data: { name: name.trim() },
      });

      return NextResponse.json({ message: "Group updated successfully" });
    }

    // 5. REMOVE MEMBER (Only owner can kick users)
    if (action === "remove_member") {
      const { groupId, targetUserId } = body;
      if (!groupId || !targetUserId) {
        return NextResponse.json({ message: "Group ID and target user ID are required" }, { status: 400 });
      }

      const group = await prisma.studyGroup.findUnique({ where: { id: groupId } });
      if (!group) {
        return NextResponse.json({ message: "Group not found" }, { status: 404 });
      }
      if (group.ownerId !== session.user.id) {
        return NextResponse.json({ message: "Only the admin can remove members" }, { status: 403 });
      }

      if (targetUserId === session.user.id) {
        return NextResponse.json({ message: "Admin cannot remove themselves. Delete group or leave instead." }, { status: 400 });
      }

      await prisma.studyGroupMember.deleteMany({
        where: { groupId, userId: targetUserId },
      });

      return NextResponse.json({ message: "Member removed from group" });
    }

    // 6. DELETE GROUP (Only owner can delete)
    if (action === "delete") {
      const { groupId } = body;
      if (!groupId) {
        return NextResponse.json({ message: "Group ID is required" }, { status: 400 });
      }

      const group = await prisma.studyGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return NextResponse.json({ message: "Group not found" }, { status: 404 });
      }

      if (group.ownerId !== session.user.id) {
        return NextResponse.json({ message: "Only the owner can delete the group" }, { status: 403 });
      }

      // Delete group (cascade will handle members delete)
      await prisma.studyGroup.delete({
        where: { id: groupId },
      });

      return NextResponse.json({ message: "Group deleted successfully" });
    }

    // 7. UPDATE TIMER STATUS (Live status update for member)
    if (action === "update_timer") {
      const { timerBid, timerStart, timerBase, subject, topic } = body;
      await prisma.studyGroupMember.updateMany({
        where: { userId: session.user.id },
        data: {
          timerBid: timerBid || null,
          timerStart: timerStart ? new Date(timerStart) : null,
          timerBase: typeof timerBase === "number" ? timerBase : 0,
          subject: subject || null,
          topic: topic || null,
        },
      });
      return NextResponse.json({ message: "Timer updated" });
    }

    // 8. NUDGE a member (sets pendingNudge on the target member)
    if (action === "nudge") {
      const { targetUserId, groupId } = body;
      if (!targetUserId || !groupId) {
        return NextResponse.json({ message: "targetUserId and groupId required" }, { status: 400 });
      }

      // Verify sender is in the same group
      const senderMembership = await prisma.studyGroupMember.findFirst({
        where: { userId: session.user.id, groupId },
      });
      if (!senderMembership) {
        return NextResponse.json({ message: "You are not in this group" }, { status: 403 });
      }

      const sender = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { name: true, email: true },
      });

      const senderName = sender?.name || session.user.name || (sender?.email ? sender.email.split("@")[0] : null) || (session.user.email ? session.user.email.split("@")[0] : null) || "A group member";

      await prisma.studyGroupMember.updateMany({
        where: { userId: targetUserId, groupId },
        data: { pendingNudge: senderName },
      });

      return NextResponse.json({ message: "Nudge sent" });
    }

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Failed to perform study group action:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

