import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export const dynamic = "force-dynamic";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Add admin authentication/authorization check
  try {
    const { name, email, password, role, studyTracker } = await request.json();

    if (!email?.trim()) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    const data: any = {
      name: name?.trim() || null,
      email: email.trim(),
      role,
    };

    if (studyTracker !== undefined) {
      data.studyTracker = studyTracker;
    }

    if (password) {
      if (password.length < 8) {
        return NextResponse.json(
          { message: "Password must be at least 8 characters" },
          { status: 400 }
        );
      }
      data.password = await hash(password, 12);
    }

    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        emailVerified: true,
        deleted: true,
      },
    });
    return NextResponse.json({ user });
  } catch (error: unknown) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "P2002"
    ) {
      return NextResponse.json({ message: "Email is already in use" }, { status: 409 });
    }
    console.error("Failed to update user:", error);
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Add admin authentication/authorization check
  try {
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { deleted: true },
      select: { id: true, email: true, deleted: true },
    });
    return NextResponse.json({ message: "User deactivated", user });
  } catch (error) {
    console.error("Failed to deactivate user:", error);
    return NextResponse.json({ message: "Failed to deactivate user" }, { status: 500 });
  }
} 