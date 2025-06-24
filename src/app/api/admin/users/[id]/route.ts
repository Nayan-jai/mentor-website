import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  // TODO: Add admin authentication/authorization check
  const { name, email, password, role } = await request.json();
  const data: any = { name, email, role };
  if (password && password.length >= 8) {
    data.password = await hash(password, 12);
  }
  try {
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
      },
    });
    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json({ message: "Failed to update user" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  await prisma.user.update({ where: { id: params.id }, data: { deleted: true } });
  return NextResponse.json({ message: "User deactivated" });
} 