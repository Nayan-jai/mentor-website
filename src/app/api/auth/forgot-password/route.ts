import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";
import { hash } from "bcryptjs";

// Define the request body type
type ForgotPasswordRequest = {
  email: string;
};

// Define the response type
type ForgotPasswordResponse = {
  message: string;
  resetToken?: string;
};

export const POST = async (
  request: NextRequest
): Promise<NextResponse<ForgotPasswordResponse>> => {
  try {
    const body = await request.json();
    const { email } = body as ForgotPasswordRequest;

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    // Find the user
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
      },
    });

    if (!user) {
      // Return success even if user doesn't exist for security
      return NextResponse.json(
        { message: "If an account exists with this email, you will receive a password reset link." },
        { status: 200 }
      );
    }

    // Generate reset token
    const resetToken = randomBytes(32).toString("hex");
    const hashedToken = await hash(resetToken, 12);

    // Store the token in the database
    await prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
      },
    });

    // For development, return the token
    // In production, you would send an email with the token
    return NextResponse.json(
      { 
        message: "Password reset link has been generated.",
        // In production, remove this and send the token via email
        resetToken: resetToken,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { message: "Failed to process request" },
      { status: 500 }
    );
  }
}; 