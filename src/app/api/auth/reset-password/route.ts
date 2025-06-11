import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash, compare } from "bcryptjs";
import { Prisma } from "@prisma/client";

// Define the request body type
type ResetPasswordRequest = {
  token: string;
  password: string;
};

// Define the response type
type ResetPasswordResponse = {
  message: string;
};

export async function POST(
  request: NextRequest
): Promise<NextResponse<ResetPasswordResponse>> {
  try {
    const body = await request.json();
    const { token, password } = body as ResetPasswordRequest;

    if (!token || !password) {
      return NextResponse.json(
        { message: "Token and password are required" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters long" },
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
      select: {
        id: true,
        password: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Invalid or expired reset token" },
        { status: 400 }
      );
    }

    // Check if the new password is the same as the old one
    const isSamePassword = await compare(password, user.password);
    if (isSamePassword) {
      return NextResponse.json(
        { message: "New password must be different from the old password" },
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
          { message: "Failed to update password" },
          { status: 500 }
        );
      }
      throw error;
    }
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json(
      { message: "Failed to reset password" },
      { status: 500 }
    );
  }
} 