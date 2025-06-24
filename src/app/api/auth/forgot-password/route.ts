import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { addMinutes } from "date-fns";

export const POST = async (request: NextRequest) => {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ message: "Email is required" }, { status: 400 });
    }

    // Find user by email
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return a generic message for security
    if (!user) {
      return NextResponse.json({ message: "If an account exists with this email, you will receive a password reset link.", resetToken: null }, { status: 200 });
    }

    // Generate reset token and expiry
    const resetToken = randomBytes(32).toString("hex");
    const resetTokenExpiry = addMinutes(new Date(), 30); // 30 minutes expiry

    // Save token to user
    await prisma.user.update({
      where: { email },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // TODO: Send email with reset link (not implemented here)

    return NextResponse.json({ message: "Password reset link has been generated.", resetToken }, { status: 200 });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json({ message: "Failed to process request" }, { status: 500 });
  }
}; 