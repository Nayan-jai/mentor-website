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
              include: {
                user: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const ownedGroups = await prisma.studyGroup.findMany({
      where: { ownerId: session.user.id },
      select: {
        id: true,
        name: true,
        code: true,
      },
    });

    if (!membership) {
      return NextResponse.json({ joined: false, ownedGroups });
    }

    const group = membership.group;
    return NextResponse.json({
      joined: true,
      ownedGroups,
      group: {
        id: group.id,
        code: group.code,
        name: group.name,
        ownerId: group.ownerId,
        members: group.members.map((m) => ({
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

    // 4. DELETE GROUP (Only owner can delete)
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

    return NextResponse.json({ message: "Invalid action" }, { status: 400 });
  } catch (err) {
    console.error("Failed to perform study group action:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
