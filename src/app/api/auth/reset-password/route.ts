import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";
import { Prisma } from "@prisma/client";

type ResetPasswordData = {
  token: string;
  password: string;
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, password } = body as ResetPasswordData;

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      );
    }

    // Find user with the reset token
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(), // Token hasn't expired
        },
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Hash the new password
    const hashedPassword = await hash(password, 12);

    try {
      // Update the user's password and clear the reset token
      await prisma.user.update({
        where: { id: user.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });

      return NextResponse.json(
        { message: "Password has been reset successfully" },
        { status: 200 }
      );
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        console.error("Database error:", error);
        return NextResponse.json(
          { error: "Failed to update password" },
          { status: 500 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { error: "Failed to reset password" },
      { status: 500 }
    );
  }
} 